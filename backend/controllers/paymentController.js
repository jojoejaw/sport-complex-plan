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
  const { booking_id } = req.body;
  const user_id = req.user.id;

  // --- ขั้นที่ 1: ตรวจสอบพารามิเตอร์และรูปภาพที่อัปโหลด ---
  if (!req.file) {
    return res.status(400).json({ message: 'กรุณาอัปโหลดรูปภาพสลิปโอนเงิน' });
  }

  if (!booking_id) {
    if (fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
    return res.status(400).json({ message: 'กรุณากรอกข้อมูล booking_id' });
  }

  try {
    // --- ขั้นที่ 2: ดึงรายละเอียดการจองเพื่อนำมาตรวจสอบสิทธิ์และสถานะ ---
    const [bookings] = await db.query(
      'SELECT status, created_at, updated_at, user_id, total_price FROM bookings WHERE id = ?',
      [booking_id]
    );

    if (bookings.length === 0) {
      if (fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
      return res.status(404).json({ message: 'ไม่พบรายการจองนี้ในระบบ' });
    }

    const booking = bookings[0];

    // --- ขั้นที่ 3: ตรวจสอบสิทธิ์ (ต้องเป็นเจ้าของที่ล็อกอินเข้ามาเท่านั้น) ---
    if (booking.user_id !== user_id) {
      if (fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
      return res.status(403).json({ message: 'คุณไม่มีสิทธิ์ทำรายการในใบจองนี้' });
    }

    // --- ขั้นที่ 4: ตรวจสอบสถานะการจอง (ต้องอยู่ในสถานะค้างชำระเงิน หรือ ถูกปฏิเสธสลิปเก่า) ---
    if (booking.status !== 'pending_payment' && booking.status !== 'rejected') {
      if (fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
      return res.status(400).json({ message: 'รายการจองนี้ได้รับการชำระเงินหรืออนุมัติไปแล้ว' });
    }

    // --- ขั้นที่ 5: ตรวจสอบเวลาหมดอายุ 15 นาที ---
    const baseTime = booking.status === 'rejected' ? booking.updated_at : booking.created_at;
    const timeDiff = (new Date() - new Date(baseTime)) / 1000 / 60;

    if (timeDiff > 15) {
      if (fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
      await db.query("UPDATE bookings SET status = 'cancelled' WHERE id = ?", [booking_id]);
      return res.status(400).json({ message: 'เกินเวลากำหนดชำระเงิน 15 นาทีแล้ว รายการนี้ถูกยกเลิกโดยอัตโนมัติ' });
    }

    // --- ขั้นที่ 6: เรียกใช้งาน Thunder API v2 เพื่อทำการสแกนตรวจสอบสลิป ---
    const formData = new FormData();
    formData.append('image', fs.createReadStream(req.file.path));
    formData.append('matchAccount', 'true');

    let apiResult;
    try {
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
      apiResult = thunderResponse.data;
    } catch (apiError) {
      console.error('Thunder API Call Fail:', apiError.message);
      if (fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);

      // กรณี Thunder API ส่งข้อมูลข้อผิดพลาดกลับมา
      if (apiError.response && apiError.response.data && apiError.response.data.success === false) {
        const rawMessage = apiError.response.data.error.message || '';
        const apiErrorMessage = rawMessage.includes("Please provide")
          ? "รูปภาพไม่ถูกต้อง หรือไม่พบข้อมูล QR Code ในสลิปโอนเงิน"
          : (rawMessage || "สลิปโอนเงินไม่ถูกต้อง หรือไม่สามารถสแกนบาร์โค้ดได้");
        return res.status(apiError.response.status).json({ message: apiErrorMessage });
      }
      return res.status(500).json({ message: 'เกิดข้อผิดพลาดในการตรวจสอบสลิปผ่านเซิร์ฟเวอร์ภายนอก' });
    }

    if (!apiResult || !apiResult.success || !apiResult.data) {
      if (fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
      return res.status(400).json({ message: 'สลิปโอนเงินไม่ถูกต้อง' });
    }

    // ข้อมูลดิบที่ผ่านการสแกนและตรวจสอบของสลิปจะอยู่ในอ็อบเจกต์ rawSlip ของ v2
    const slipData = apiResult.data.rawSlip;
    if (!slipData) {
      if (fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
      return res.status(400).json({ message: 'สลิปโอนเงินไม่ถูกต้อง (ไม่พบข้อมูลในระบบ)' });
    }

    // --- ขั้นที่ 7: ตรวจสอบความถูกต้องของข้อมูลสลิป (Data Consistency Checks) ---

    // 7.1 ตรวจสอบยอดเงินโอน (ปลอดภัยกับทั้งประเภท Object หรือตัวเลขตรงตัว)
    const expectedAmount = parseFloat(booking.total_price);
    const transferredAmount = typeof slipData.amount === 'object' && slipData.amount !== null
      ? parseFloat(slipData.amount.amount)
      : parseFloat(slipData.amount);

    if (isNaN(transferredAmount) || transferredAmount !== expectedAmount) {
      if (fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
      return res.status(400).json({ message: 'ยอดเงินไม่ตรง' });
    }

    // 7.2 ตรวจสอบบัญชีผู้รับเงินผ่านการจับคู่บัญชีของ Thunder API (matchAccount) และต้องเป็นพร้อมเพย์เท่านั้น
    if (!apiResult.data.matchedAccount || apiResult.data.matchedAccount.bank.code !== 'PROMPTPAY') {
      console.log('Slip receiver account does not match registered PromptPay account.');
      if (fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
      return res.status(400).json({ message: 'บัญชีผู้รับเงินไม่ถูกต้อง (ต้องโอนผ่านพร้อมเพย์เท่านั้น)' });
    }

    // 7.3 ตรวจสอบเวลาโอนเงินในสลิป (ป้องกันการเอาสลิปโอนก่อนการสร้างการจองมาใช้)
    if (!slipData.date) {
      if (fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
      return res.status(400).json({ message: 'สลิปโอนเงินไม่ถูกต้อง (ไม่พบวันที่ทำรายการ)' });
    }

    const bookingCreatedAt = new Date(booking.created_at);
    const actualTransferTime = new Date(slipData.date);

    if (actualTransferTime < bookingCreatedAt) {
      if (fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
      return res.status(400).json({ message: 'เวลาโอนเงินในสลิปไม่ถูกต้อง (สลิปนี้ทำรายการโอนก่อนการกดจองสนาม)' });
    }

    // 7.4 ตรวจสอบความซ้ำซ้อนของเลขธุรกรรมเพื่อป้องกันการส่งสลิปซ้ำ (Duplicate Prevention)
    const transactionRef = slipData.transRef;
    if (!transactionRef) {
      if (fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
      return res.status(400).json({ message: 'สลิปโอนเงินไม่ถูกต้อง (ไม่พบเลขธุรกรรมอ้างอิง)' });
    }

    const [duplicateSlip] = await db.query(
      'SELECT id FROM payments WHERE transaction_ref = ?',
      [transactionRef]
    );

    if (duplicateSlip.length > 0) {
      if (fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
      return res.status(400).json({ message: 'สลิปนี้ถูกใช้งานไปแล้ว' });
    }

    // --- ขั้นที่ 8: บันทึกข้อมูลและอัปเดตสถานะในฐานข้อมูล ---
    const formattedTransferTime = slipData.date.replace('T', ' ').substring(0, 19);
    const normalizedPath = req.file.path.replace(/\\/g, '/');

    // บันทึกหลักฐานสลิป
    await db.query(
      `INSERT INTO payments (booking_id, slip_image_path, transfer_time, transaction_ref) 
       VALUES (?, ?, ?, ?) 
       ON DUPLICATE KEY UPDATE 
          slip_image_path = VALUES(slip_image_path), 
          transfer_time = VALUES(transfer_time),
          transaction_ref = VALUES(transaction_ref)`,
      [booking_id, normalizedPath, formattedTransferTime, transactionRef]
    );

    // อัปเดตสถานะการจองเป็น approved
    await db.query(
      `UPDATE bookings SET status = 'approved', reject_reason = NULL WHERE id = ?`,
      [booking_id]
    );

    res.json({ message: 'ชำระเงินสำเร็จเรียบร้อยแล้ว! ระบบอนุมัติการจองของท่านอัตโนมัติ' });
  } catch (error) {
    console.error('SubmitPayment Unexpected Error:', error);
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    res.status(500).json({ message: 'เกิดข้อผิดพลาดในการประมวลผลการชำระเงิน' });
  }
};

// =============================================================================
// 9. getPaymentConfig — ดึงการตั้งค่าหมายเลขพร้อมเพย์สำหรับแสดงผลฝั่ง Front (GET /api/payments/config)
// =============================================================================
exports.getPaymentConfig = (req, res) => {
  res.json({
    promptpayId: process.env.PROMPTPAY_ID || '0891234567',
    promptpayName: process.env.PROMPTPAY_NAME || 'บจก. สปอร์ตคอมเพล็กซ์ บุ๊คกิ้ง (Sport Complex Co., Ltd.)'
  });
};