// =============================================================================
// 1. โหลด Dependencies
// =============================================================================
const db = require('../config/db');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

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
      'SELECT status, created_at, updated_at, user_id FROM bookings WHERE id = ?',
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

    // --- ขั้นที่ 8: บันทึกหลักฐานสลิปลงตาราง payments ---
    await db.query(
      `INSERT INTO payments (booking_id, slip_image_path, transfer_time) 
       VALUES (?, ?, ?) 
       ON DUPLICATE KEY UPDATE slip_image_path = VALUES(slip_image_path), transfer_time = VALUES(transfer_time)`,
      [booking_id, req.file.path, transfer_time]
    );

    // --- ขั้นที่ 9: อัปเดตสถานะการจองเป็น pending_approval ---
    await db.query(
      `UPDATE bookings SET status = 'pending_approval', reject_reason = NULL WHERE id = ?`,
      [booking_id]
    );

    // --- ขั้นที่ 10: ตอบกลับสำเร็จ ---
    res.json({ message: 'อัปโหลดสลิปและส่งหลักฐานชำระเงินเรียบร้อยแล้ว รอแอดมินตรวจสอบ' });
  } catch (error) {
    console.error('SubmitPayment Error:', error);
    if (req.file) fs.unlinkSync(req.file.path);
    res.status(500).json({ message: 'เกิดข้อผิดพลาดในการประมวลผลการชำระเงิน' });
  }
};
