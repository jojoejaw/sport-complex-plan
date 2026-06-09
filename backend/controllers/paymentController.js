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
//    Flow: รับไฟล์+ข้อมูล → ตรวจครบ → ตรวจสิทธิ์ใบจอง → ตรวจ 15 นาที → ตรวจสลิปเรียลไทม์ → บันทึก payments → อัปเดต approved
// =============================================================================
exports.submitPayment = async (req, res) => {
  const { booking_id } = req.body; // <-- ลูกค้าส่งแค่ booking_id มา ไม่ต้องกรอกเวลาแล้ว
  const user_id = req.user.id;

  // --- ขั้นที่ 1: ตรวจสอบว่ามีไฟล์สลิป ---
  if (!req.file) {
    return res.status(400).json({ message: 'กรุณาอัปโหลดรูปภาพสลิปโอนเงิน' });
  }

  // --- ขั้นที่ 2: ตรวจสอบความครบถ้วนของข้อมูลการจอง ---
  if (!booking_id) {
    fs.unlinkSync(req.file.path);
    return res.status(400).json({ message: 'กรุณากรอกข้อมูล booking_id' });
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

    // --- ขั้นที่ 7: ตรวจสอบความถูกต้องของสลิปโอนเงินผ่าน API ---
    const expectedAmount = parseFloat(booking.total_price);

    const formData = new FormData();
    formData.append('image', fs.createReadStream(req.file.path));

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
    if (!apiResult || !apiResult.success || !apiResult.data) {
      fs.unlinkSync(req.file.path);
      return res.status(400).json({ message: 'สลิปโอนเงินไม่ถูกต้อง' });
    }

    const slipData = apiResult.data;

    // 1. ตรวจสอบยอดเงินโอน
    const transferredAmount = typeof slipData.amount === 'object' && slipData.amount !== null
      ? parseFloat(slipData.amount.amount)
      : parseFloat(slipData.amount);

    if (transferredAmount !== expectedAmount) {
      fs.unlinkSync(req.file.path);
      return res.status(400).json({ message: 'ยอดเงินไม่ตรง' });
    }

    // 2. ตรวจสอบบัญชีผู้รับเงินและชื่อบัญชี
    const myBankAccount = "4120702495";
    const myAccountName = "ณรงฤทธิ์ โจทจันทร์";

    const receiverName = (slipData.receiver && slipData.receiver.account && slipData.receiver.account.name)
      ? (slipData.receiver.account.name.th || slipData.receiver.account.name.en || '')
      : ((slipData.receiver && slipData.receiver.displayName) || '');

    const receiverAccount = (slipData.receiver && slipData.receiver.account)
      ? (
          (slipData.receiver.account.bank && slipData.receiver.account.bank.account) ||
          (slipData.receiver.account.proxy && slipData.receiver.account.proxy.account) ||
          slipData.receiver.account.value ||
          ''
        )
      : '';

    if (receiverAccount !== myBankAccount || !receiverName.includes(myAccountName)) {
      fs.unlinkSync(req.file.path);
      return res.status(400).json({ message: 'บัญชีผู้รับเงินไม่ถูกต้อง' });
    }

    // 3. ตรวจสอบเวลาโอนเงินในสลิป
    if (!slipData.date) {
      fs.unlinkSync(req.file.path);
      return res.status(400).json({ message: 'สลิปโอนเงินไม่ถูกต้อง' });
    }

    const bookingCreatedAt = new Date(booking.created_at);
    const actualTransferTime = new Date(slipData.date);

    if (actualTransferTime < bookingCreatedAt) {
      fs.unlinkSync(req.file.path);
      return res.status(400).json({ message: 'เวลาโอนเงินในสลิปไม่ถูกต้อง' });
    }

    // 4. ตรวจสอบป้องกันการส่งสลิปโอนเงินซ้ำ
    const transactionRef = slipData.transRef;
    if (!transactionRef) {
      fs.unlinkSync(req.file.path);
      return res.status(400).json({ message: 'สลิปโอนเงินไม่ถูกต้อง' });
    }

    const [duplicateSlip] = await db.query(
      'SELECT id FROM payments WHERE transaction_ref = ?',
      [transactionRef]
    );

    if (duplicateSlip.length > 0) {
      fs.unlinkSync(req.file.path);
      return res.status(400).json({ message: 'สลิปนี้ถูกใช้งานไปแล้ว' });
    }

    const formattedTransferTime = slipData.date.replace('T', ' ').substring(0, 19);

    // --- ขั้นที่ 12: บันทึกหลักฐานสลิปลงตาราง payments (และล้างสแลช \ สากล) ---
    const normalizedPath = req.file.path.replace(/\\/g, '/');
    await db.query(
      `INSERT INTO payments (booking_id, slip_image_path, transfer_time, transaction_ref) 
       VALUES (?, ?, ?, ?) 
       ON DUPLICATE KEY UPDATE 
          slip_image_path = VALUES(slip_image_path), 
          transfer_time = VALUES(transfer_time),
          transaction_ref = VALUES(transaction_ref)`,
      [booking_id, normalizedPath, formattedTransferTime, transactionRef]
    );

    // --- ขั้นที่ 13: อัปเดตสถานะการจองเป็นอนุมัติ (approved) ทันทีแบบเรียลไทม์ ---
    await db.query(
      `UPDATE bookings SET status = 'approved', reject_reason = NULL WHERE id = ?`,
      [booking_id]
    );

    // --- ขั้นที่ 14: ส่งข้อมูลตอบกลับชำระเงินสำเร็จ ---
    res.json({ message: 'ชำระเงินสำเร็จเรียบร้อยแล้ว! ระบบอนุมัติการจองของท่านอัตโนมัติ' });
  } catch (error) {
    console.error('SubmitPayment Error:', error);
    if (req.file) fs.unlinkSync(req.file.path);

    // ดักจับและนำข้อผิดพลาดของ Thunder API (เช่น การสแกนสลิปปลอม) ไปแสดงให้ลูกค้าเห็นอย่างชัดเจนในหน้าจอ
    if (error.response && error.response.data && error.response.data.success === false) {
      const apiErrorMessage = error.response.data.error.message || 'สลิปโอนเงินไม่ถูกต้อง หรือไม่สามารถสแกนบาร์โค้ดได้';
      return res.status(error.response.status).json({ message: apiErrorMessage });
    }

    res.status(500).json({ message: 'เกิดข้อผิดพลาดในการประมวลผลการชำระเงิน' });
  }
};