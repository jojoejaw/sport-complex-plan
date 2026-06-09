// =============================================================================
// 1. โหลด Dependencies
// =============================================================================
const db = require('../config/db');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const axios = require('axios');
const FormData = require('form-data');

// =============================================================================
// 2. ตั้งค่า Multer — ที่เก็บไฟล์และตั้งชื่อไฟล์สลิป
// =============================================================================
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = './uploads/slips';
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    cb(null, `slip-${Date.now()}${path.extname(file.originalname)}`);
  }
});

// =============================================================================
// 3. ตั้งค่า File Filter — อนุญาตเฉพาะไฟล์รูปภาพ (jpg, jpeg, png)
// =============================================================================
const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);

  if (extname && mimetype) {
    return cb(null, true);
  } else {
    cb(new Error('กรุณาอัปโหลดเฉพาะไฟล์รูปภาพ (jpg, jpeg, png) เท่านั้น'));
  }
};

// =============================================================================
// 4. Export Multer Upload — ใช้ใน route ก่อนเข้า submitPayment (จำกัด 5MB)
// =============================================================================
exports.upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: fileFilter
});

// =============================================================================
// 5. submitPayment — บันทึกหลักฐานการชำระเงิน (POST /api/payments/upload)
//    Flow: รับไฟล์+ข้อมูล → ตรวจครบ → ตรวจสิทธิ์ใบจอง → ตรวจ 15 นาที → ตรวจเวลาโอน → บันทึก payments → อัปเดต pending_approval
// =============================================================================
exports.submitPayment = async (req, res) => {
  const { booking_id, transfer_time } = req.body;
  const user_id = req.user.id;

  // --- ขั้นที่ 1: ตรวจสอบว่ามีไฟล์สลิป ---
  if (!req.file) {
    return res.status(400).json({ message: 'กรุณาอัปโหลดรูปภาพสลิปโอนเงิน' });
  }

  // --- ขั้นที่ 2: ตรวจสอบความครบถ้วนของข้อมูล ---
  if (!booking_id || !transfer_time) {
    fs.unlinkSync(req.file.path);
    return res.status(400).json({ message: 'กรุณากรอกข้อมูล booking_id และวันเวลาที่โอนเงิน' });
  }

  try {
    // --- ขั้นที่ 3: ดึงข้อมูลการจองมาตรวจสอบ ---
    const [bookings] = await db.query(
      'SELECT status, created_at, updated_at, user_id, total_price FROM bookings WHERE id = ?',
      [booking_id]
    );

    if (bookings.length === 0) {
      fs.unlinkSync(req.file.path);
      return res.status(404).json({ message: 'ไม่พบรายการจองนี้ในระบบ' });
    }

    const booking = bookings[0];

    // --- ขั้นที่ 4: ตรวจสอบสิทธิ์ — ต้องเป็นเจ้าของการจอง ---
    if (booking.user_id !== user_id) {
      fs.unlinkSync(req.file.path);
      return res.status(403).json({ message: 'คุณไม่มีสิทธิ์ทำรายการในใบจองนี้' });
    }

    // --- ขั้นที่ 5: ตรวจสอบสถานะ — ต้องเป็น pending_payment หรือ rejected ---
    if (booking.status !== 'pending_payment' && booking.status !== 'rejected') {
      fs.unlinkSync(req.file.path);
      return res.status(400).json({ message: 'รายการจองนี้ได้รับการชำระเงินหรืออนุมัติไปแล้ว' });
    }

    // --- ขั้นที่ 6: ตรวจสอบเวลาหมดเขต 15 นาที ---
    const baseTime = booking.status === 'rejected' ? booking.updated_at : booking.created_at;
    const timeDiff = (new Date() - new Date(baseTime)) / 1000 / 60;

    if (timeDiff > 15) {
      fs.unlinkSync(req.file.path);
      await db.query("UPDATE bookings SET status = 'cancelled' WHERE id = ?", [booking_id]);
      return res.status(400).json({ message: 'เกินเวลากำหนดชำระเงิน 15 นาทีแล้ว รายการนี้ถูกยกเลิกโดยอัตโนมัติ' });
    }

    // --- ขั้นที่ 7: ตรวจสอบเวลาโอน — ต้องโอนหลังเวลากดจอง ---
    const bookingCreatedAt = new Date(booking.created_at);
    const actualTransferTime = new Date(transfer_time);

    if (actualTransferTime < bookingCreatedAt) {
      fs.unlinkSync(req.file.path);
      return res.status(400).json({
        message: 'วันเวลาที่โอนเงินในสลิปผิดพลาด (สลิปโอนเงินต้องทำรายการหลังจากการกดจองสนามในระบบเท่านั้น)'
      });
    }

    // --- ขั้นที่ 8: ยิงตรวจสอบสลิปโอนเงินผ่าน API ของ Thunder Solution ---
    const expectedAmount = parseFloat(booking.total_price); // ยอดรวมที่ต้องจ่ายจริง

    const formData = new FormData();
    formData.append('image', fs.createReadStream(req.file.path)); // 1. เปลี่ยนคีย์จาก 'file' เป็น 'image'

    // 2. เปลี่ยน URL ปลายทางเป็น URL จริงของทาง Thunder Solution
    const thunderResponse = await axios.post(
      'https://api.thunder.in.th/v2/verify/bank',
      formData,
      {
        headers: {
          ...formData.getHeaders(),
          'Authorization': `Bearer ${process.env.THUNDER_API_KEY}`
        }
      }
    );

    const apiResult = thunderResponse.data;

    // ตรวจสอบความถูกต้องเบื้องต้นจากผลลัพธ์ของ API
    if (!apiResult.success) {
      fs.unlinkSync(req.file.path); // ลบไฟล์สลิปทิ้งทันทีหากตรวจสอบไม่ผ่าน
      return res.status(400).json({ message: 'สลิปโอนเงินไม่ถูกต้อง หรือไม่สามารถสแกนบาร์โค้ดได้' });
    }

    const slipData = apiResult.data;
    const transferredAmount = parseFloat(slipData.amount); // ยอดโอนเงินจริง
    const transactionRef = slipData.transRef;              // รหัสอ้างอิงธุรกรรมธนาคาร

    // ตรวจสอบความถูกต้องของจำนวนเงินโอน
    if (transferredAmount !== expectedAmount) {
      fs.unlinkSync(req.file.path);
      return res.status(400).json({
        message: `ยอดเงินโอนไม่ถูกต้อง ยอดโอนตามสลิปคือ ${transferredAmount} บาท แต่ยอดที่ต้องการชำระจริงคือ ${expectedAmount} บาท`
      });
    }

    // ตรวจสอบเลขบัญชีและชื่อผู้รับโอนคู่กันเพื่อความปลอดภัยสูงสุด
    const myBankAccount = "4120702495";
    const myAccountName = "ณรงฤทธิ์ โจทจันทร์";
    const receiverName = slipData.receiver.displayName;
    if (slipData.receiver.account.value !== myBankAccount || !receiverName.includes(myAccountName)) {
      fs.unlinkSync(req.file.path);
      return res.status(400).json({ message: 'บัญชีผู้รับเงินในสลิปไม่ตรงกับบัญชีของสนามกีฬา' });
    }

    // ตรวจสอบป้องกันการส่งสลิปโอนเงินใบเก่ามาวนใช้ซ้ำ (เช็คจาก Unique Key ที่เราเพิ่มใน MySQL)
    const [duplicateSlip] = await db.query(
      'SELECT id FROM payments WHERE transaction_ref = ?',
      [transactionRef]
    );

    if (duplicateSlip.length > 0) {
      fs.unlinkSync(req.file.path);
      return res.status(400).json({ message: 'สลิปโอนเงินนี้เคยถูกใช้งานชำระเงินในระบบไปแล้ว' });
    }

    // --- ขั้นที่ 9: บันทึกหลักฐานสลิปลงตาราง payments (และล้างสแลช \ สากล) ---
    const normalizedPath = req.file.path.replace(/\\/g, '/');
    await db.query(
      `INSERT INTO payments (booking_id, slip_image_path, transfer_time, transaction_ref) 
           VALUES (?, ?, ?, ?) 
           ON DUPLICATE KEY UPDATE 
              slip_image_path = VALUES(slip_image_path), 
              transfer_time = VALUES(transfer_time),
              transaction_ref = VALUES(transaction_ref)`,
      [booking_id, normalizedPath, transfer_time, transactionRef]
    );

    // --- ขั้นที่ 10: อัปเดตสถานะการจองเป็นอนุมัติ (approved) ทันทีแบบเรียลไทม์ ---
    await db.query(
      `UPDATE bookings SET status = 'approved', reject_reason = NULL WHERE id = ?`,
      [booking_id]
    );

    // --- ขั้นที่ 11: ส่งข้อมูลตอบกลับชำระเงินสำเร็จ ---
    res.json({ message: 'ชำระเงินสำเร็จเรียบร้อยแล้ว! ระบบอนุมัติการจองของท่านอัตโนมัติ' });
  } catch (error) {
    console.error('SubmitPayment Error:', error);
    if (req.file) fs.unlinkSync(req.file.path);
    // ดักจับกรณีที่เซิร์ฟเวอร์ Thunder API ตีกลับข้อมูลข้อผิดพลาดมา (เช่น รหัส 400 สลิปปลอม)
    if (error.response && error.response.data && error.response.data.success === false) {
      // ส่งข้อความแจ้งเตือนที่ได้จากระบบตรวจสลิปกลับไปหาหน้าจอของลูกค้าตรงๆ
      const apiErrorMessage = error.response.data.error.message || 'สลิปโอนเงินไม่ถูกต้อง หรือไม่สามารถสแกนบาร์โค้ดได้';
      return res.status(error.response.status).json({ message: apiErrorMessage });
    }
    res.status(500).json({ message: 'เกิดข้อผิดพลาดในการประมวลผลการชำระเงิน' });
  }
};
