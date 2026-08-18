// =============================================================================
// 1. โหลด Dependencies
// =============================================================================
const db = require('../config/db');
const logger = require('../utils/logger');
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
  let connection;
  let transactionStarted = false;

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

    // --- ขั้นที่ 4: Flow อัตโนมัติรับชำระเฉพาะรายการที่กำลังรอชำระเงิน ---
    if (booking.status !== 'pending_payment') {
      if (fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
      return res.status(400).json({ message: 'รายการจองนี้ได้รับการชำระเงินหรืออนุมัติไปแล้ว' });
    }

    // --- ขั้นที่ 5: ตรวจสอบเวลาหมดอายุ 15 นาที ---
    const timeDiff = (new Date() - new Date(booking.created_at)) / 1000 / 60;

    if (timeDiff > 15) {
      if (fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
      await db.query(
        "UPDATE bookings SET status = 'cancelled' WHERE id = ? AND status = 'pending_payment'",
        [booking_id]
      );
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
      logger.error('Thunder API Call Fail: ' + (apiError.stack || apiError.message || apiError));

      // หากสแกนไม่สำเร็จ ลบไฟล์ภาพสลิปชั่วคราวทิ้งทันที ไม่บันทึกลงระบบ
      if (fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);

      if (apiError.response && apiError.response.data && apiError.response.data.success === false) {
        const rawMessage = apiError.response.data.error?.message || '';
        const apiErrorMessage = rawMessage.includes("Please provide")
          ? "รูปภาพสลิปไม่ถูกต้อง หรือไม่พบข้อมูล QR Code ในสลิปโอนเงิน หากท่านโอนเงินแล้ว กรุณาติดต่อแอดมินเพื่อขอความช่วยเหลือ"
          : (rawMessage || "สลิปโอนเงินไม่ถูกต้อง หรือไม่สามารถสแกนบาร์โค้ดได้ กรุณาติดต่อแอดมินเพื่อขอความช่วยเหลือ");
        return res.status(400).json({ message: apiErrorMessage });
      }

      return res.status(503).json({
        message: 'ระบบตรวจสอบสลิปอัตโนมัติขัดข้องชั่วคราว กรุณาลองใหม่อีกครั้ง หรือติดต่อแอดมินเพื่อขอความช่วยเหลือ'
      });
    }

    if (!apiResult || !apiResult.success || !apiResult.data) {
      if (fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
      return res.status(400).json({ message: 'สลิปโอนเงินไม่ถูกต้อง หากท่านโอนเงินแล้ว กรุณาติดต่อแอดมินเพื่อขอความช่วยเหลือ' });
    }

    const slipData = apiResult.data.rawSlip;
    if (!slipData) {
      if (fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
      return res.status(400).json({ message: 'สลิปโอนเงินไม่ถูกต้อง (ไม่พบข้อมูลในระบบ) กรุณาติดต่อแอดมินเพื่อขอความช่วยเหลือ' });
    }

    // --- ขั้นที่ 7: ตรวจสอบความถูกต้องของข้อมูลสลิป (Data Consistency Checks) ---

    // 7.1 ตรวจสอบยอดเงินโอน
    const expectedAmount = parseFloat(booking.total_price);
    const transferredAmount = typeof slipData.amount === 'object' && slipData.amount !== null
      ? parseFloat(slipData.amount.amount)
      : parseFloat(slipData.amount);

    if (isNaN(transferredAmount) || transferredAmount !== expectedAmount) {
      if (fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
      return res.status(400).json({ message: 'ยอดเงินในสลิปไม่ตรงกับยอดจอง หากท่านโอนเงินแล้ว กรุณาติดต่อแอดมินเพื่อขอความช่วยเหลือ' });
    }

    // 7.2 ตรวจสอบบัญชีผู้รับเงินผ่าน matchAccount และต้องเป็นพร้อมเพย์เท่านั้น (ใช้อย่างปลอดภัยด้วย optional chaining ?.)
    const bankCode = apiResult.data.matchedAccount?.bank?.code;
    if (!apiResult.data.matchedAccount || bankCode !== 'PROMPTPAY') {
      logger.warn('Slip receiver account does not match registered PromptPay account.');
      if (fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
      return res.status(400).json({ message: 'บัญชีผู้รับเงินไม่ถูกต้อง (ต้องโอนผ่านพร้อมเพย์เท่านั้น) กรุณาติดต่อแอดมินเพื่อขอความช่วยเหลือ' });
    }

    // 7.3 ตรวจสอบเวลาโอนเงินในสลิป (พร้อมระยะผ่อนปรน Clock Skew Buffer 2 นาที)
    if (!slipData.date) {
      if (fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
      return res.status(400).json({ message: 'สลิปโอนเงินไม่ถูกต้อง (ไม่พบวันที่ทำรายการ) กรุณาติดต่อแอดมินเพื่อขอความช่วยเหลือ' });
    }

    const bookingCreatedAt = new Date(booking.created_at);
    const actualTransferTime = new Date(slipData.date);
    const allowedEarliestTime = new Date(bookingCreatedAt.getTime() - 2 * 60 * 1000); // ผ่อนปรน 2 นาที

    if (actualTransferTime < allowedEarliestTime) {
      if (fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
      return res.status(400).json({ message: 'เวลาโอนเงินในสลิปไม่ถูกต้อง กรุณาติดต่อเพื่อขอความช่วยเหลือ' });
    }

    // 7.4 ตรวจสอบความซ้ำซ้อนของเลขธุรกรรม
    const transactionRef = slipData.transRef;
    if (!transactionRef) {
      if (fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
      return res.status(400).json({ message: 'สลิปโอนเงินไม่ถูกต้อง (ไม่พบเลขธุรกรรมอ้างอิง) กรุณาติดต่อแอดมินเพื่อขอความช่วยเหลือ' });
    }

    // --- ขั้นที่ 8: ล็อกข้อมูลและตรวจสถานะล่าสุดก่อนบันทึกผล ---
    const formattedTransferTime = slipData.date.replace('T', ' ').substring(0, 19);
    const normalizedPath = req.file.path.replace(/\\/g, '/');

    connection = await db.getConnection();
    await connection.beginTransaction();
    transactionStarted = true;

    // Thunder API อาจใช้เวลาตอบกลับ จึงต้องอ่านและล็อก Booking ซ้ำก่อนบันทึกผลจริง
    const [lockedBookings] = await connection.query(
      `SELECT status, created_at, updated_at, user_id, total_price
       FROM bookings
       WHERE id = ?
       FOR UPDATE`,
      [booking_id]
    );

    if (lockedBookings.length === 0) {
      const stateError = new Error('ไม่พบรายการจองนี้ในระบบ');
      stateError.status = 404;
      throw stateError;
    }

    const lockedBooking = lockedBookings[0];
    if (lockedBooking.user_id !== user_id) {
      const stateError = new Error('คุณไม่มีสิทธิ์ทำรายการในใบจองนี้');
      stateError.status = 403;
      throw stateError;
    }

    if (lockedBooking.status !== 'pending_payment') {
      const stateError = new Error('สถานะรายการจองเปลี่ยนไปแล้ว ไม่สามารถยืนยันการชำระเงินได้');
      stateError.status = 409;
      throw stateError;
    }

    const lockedTimeDiff = (new Date() - new Date(lockedBooking.created_at)) / 1000 / 60;

    if (lockedTimeDiff > 15) {
      await connection.query(
        "UPDATE bookings SET status = 'cancelled' WHERE id = ? AND status = 'pending_payment'",
        [booking_id]
      );
      await connection.commit();
      transactionStarted = false;
      if (fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
      return res.status(409).json({ message: 'เกินเวลากำหนดชำระเงิน 15 นาทีแล้ว รายการนี้ถูกยกเลิกโดยอัตโนมัติ' });
    }

    if (transferredAmount !== parseFloat(lockedBooking.total_price)) {
      const stateError = new Error('ยอดจองมีการเปลี่ยนแปลง กรุณาตรวจสอบรายการใหม่');
      stateError.status = 409;
      throw stateError;
    }

    const [existingPayments] = await connection.query(
      `SELECT id FROM payments
       WHERE booking_id = ? OR transaction_ref = ?
       FOR UPDATE`,
      [booking_id, transactionRef]
    );

    if (existingPayments.length > 0) {
      const duplicateError = new Error('รายการจองหรือสลิปนี้ถูกดำเนินการไปแล้ว');
      duplicateError.status = 409;
      throw duplicateError;
    }

    // บันทึก Payment และอนุมัติ Booking ใน Transaction เดียวกัน
    await connection.query(
      `INSERT INTO payments
         (booking_id, payment_method, amount, slip_image_path, transfer_time, paid_at, transaction_ref)
       VALUES (?, 'promptpay', ?, ?, ?, ?, ?)`,
      [booking_id, lockedBooking.total_price, normalizedPath, formattedTransferTime, formattedTransferTime, transactionRef]
    );

    const [updateResult] = await connection.query(
      `UPDATE bookings
       SET status = 'approved', reject_reason = NULL
       WHERE id = ? AND status = 'pending_payment'`,
      [booking_id]
    );

    if (updateResult.affectedRows !== 1) {
      const stateError = new Error('สถานะรายการจองเปลี่ยนไประหว่างดำเนินการ กรุณาตรวจสอบอีกครั้ง');
      stateError.status = 409;
      throw stateError;
    }

    await connection.commit();
    transactionStarted = false;

    res.json({ message: 'ชำระเงินสำเร็จเรียบร้อยแล้ว! ระบบอนุมัติการจองของท่านอัตโนมัติ' });
  } catch (error) {
    if (connection && transactionStarted) {
      await connection.rollback();
      transactionStarted = false;
    }
    logger.error('SubmitPayment Unexpected Error: ' + (error.stack || error));
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ message: 'รายการจองหรือสลิปนี้ถูกดำเนินการไปแล้ว' });
    }
    res.status(error.status || 500).json({
      message: error.status
        ? error.message
        : 'เกิดข้อผิดพลาดในการประมวลผลการชำระเงิน กรุณาติดต่อแอดมินเพื่อขอความช่วยเหลือ'
    });
  } finally {
    if (connection) connection.release();
  }
};

// =============================================================================
// 9. getPaymentConfig — ดึงการตั้งค่าหมายเลขพร้อมเพย์สำหรับแสดงผลฝั่ง Front (GET /api/payments/config)
// =============================================================================
exports.getPaymentConfig = (req, res) => {
  res.json({
    promptpayId: process.env.PROMPTPAY_ID || '0902214698',
    promptpayName: process.env.PROMPTPAY_NAME || 'ณรงฤทธิ์ โจทจันทร์'
  });
};
