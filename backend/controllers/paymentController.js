const db = require('../config/db');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// ตั้งค่าที่เก็บรูปภาพสลิปที่ลูกค้าอัปโหลดเข้ามา
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = './uploads/slips';
    // หากยังไม่มีโฟลเดอร์สำหรับเก็บภาพ ให้สร้างขึ้นมาโดยอัตโนมัติ
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    // ตั้งชื่อไฟล์ใหม่เพื่อไม่ให้ซ้ำกัน: slip-เวลาปัจจุบัน.นามสกุลเดิม
    cb(null, `slip-${Date.now()}${path.extname(file.originalname)}`);
  }
});

// ตรวจสอบชนิดไฟล์ (ต้องเป็นภาพเท่านั้น)
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

exports.upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // จำกัดขนาดรูปสูงสุด 5MB
  fileFilter: fileFilter
});

// ฟังก์ชันบันทึกหลักฐานการชำระเงิน
exports.submitPayment = async (req, res) => {
  const { booking_id, transfer_time } = req.body;
  const user_id = req.user.id;

  if (!req.file) {
    return res.status(400).json({ message: 'กรุณาอัปโหลดรูปภาพสลิปโอนเงิน' });
  }

  if (!booking_id || !transfer_time) {
    // หากส่งข้อมูลไม่ครบ ให้ลบรูปที่เพิ่งอัปโหลดเข้ามาเพื่อประหยัดพื้นที่เซิร์ฟเวอร์
    fs.unlinkSync(req.file.path);
    return res.status(400).json({ message: 'กรุณากรอกข้อมูล booking_id และวันเวลาที่โอนเงิน' });
  }

  try {
    // 1. ดึงข้อมูลการจองมาตรวจสอบสิทธิ์
    const [bookings] = await db.query(
      'SELECT status, created_at, updated_at, user_id FROM bookings WHERE id = ?',
      [booking_id]
    );

    if (bookings.length === 0) {
      fs.unlinkSync(req.file.path);
      return res.status(404).json({ message: 'ไม่พบรายการจองนี้ในระบบ' });
    }

    const booking = bookings[0];

    // ป้องกันการแฮก: คนอัปโหลดต้องเป็นเจ้าของการจองนี้เท่านั้น
    if (booking.user_id !== user_id) {
      fs.unlinkSync(req.file.path);
      return res.status(403).json({ message: 'คุณไม่มีสิทธิ์ทำรายการในใบจองนี้' });
    }

    // ตรวจสอบว่าต้องเป็นสถานะ 'pending_payment' หรือ 'rejected' เท่านั้นถึงจะแนบสลิปได้
    if (booking.status !== 'pending_payment' && booking.status !== 'rejected') {
      fs.unlinkSync(req.file.path);
      return res.status(400).json({ message: 'รายการจองนี้ได้รับการชำระเงินหรืออนุมัติไปแล้ว' });
    }

    // 2. เช็คเวลาหมดเขต (ล็อก 15 นาที)
    const baseTime = booking.status === 'rejected' ? booking.updated_at : booking.created_at;
    const timeDiff = (new Date() - new Date(baseTime)) / 1000 / 60; // นาทีที่ผ่านไป

    if (timeDiff > 15) {
      fs.unlinkSync(req.file.path);
      // หากเกิน 15 นาทีแล้ว ให้ปรับสถานะในระบบเป็น Cancelled
      await db.query("UPDATE bookings SET status = 'cancelled' WHERE id = ?", [booking_id]);
      return res.status(400).json({ message: 'เกินเวลากำหนดชำระเงิน 15 นาทีแล้ว รายการนี้ถูกยกเลิกโดยอัตโนมัติ' });
    }

    // 3. กฎเหล็ก: เวลาที่โอนเงินในสลิป (transfer_time) จะต้องโอนหลังเวลากดจองสนาม (created_at) เท่านั้น
    const bookingCreatedAt = new Date(booking.created_at);
    const actualTransferTime = new Date(transfer_time);

    if (actualTransferTime < bookingCreatedAt) {
      fs.unlinkSync(req.file.path);
      return res.status(400).json({ 
        message: 'วันเวลาที่โอนเงินในสลิปผิดพลาด (สลิปโอนเงินต้องทำรายการหลังจากการกดจองสนามในระบบเท่านั้น)' 
      });
    }

    // 4. บันทึกหลักฐานสลิปลงตาราง payments
    // หากเคยแนบสลิปผิดและถูกปฏิเสธมาก่อน ให้ลบข้อมูลสลิปเก่าออกและแทนที่ด้วยตัวใหม่
    await db.query(
      `INSERT INTO payments (booking_id, slip_image_path, transfer_time) 
       VALUES (?, ?, ?) 
       ON DUPLICATE KEY UPDATE slip_image_path = VALUES(slip_image_path), transfer_time = VALUES(transfer_time)`,
      [booking_id, req.file.path, transfer_time]
    );

    // 5. ปรับสถานะการจองเป็น 'pending_approval' เพื่อรอแอดมินตรวจ
    await db.query(
      `UPDATE bookings SET status = 'pending_approval', reject_reason = NULL WHERE id = ?`,
      [booking_id]
    );

    res.json({ message: 'อัปโหลดสลิปและส่งหลักฐานชำระเงินเรียบร้อยแล้ว รอแอดมินตรวจสอบ' });
  } catch (error) {
    console.error('SubmitPayment Error:', error);
    if (req.file) fs.unlinkSync(req.file.path);
    res.status(500).json({ message: 'เกิดข้อผิดพลาดในการประมวลผลการชำระเงิน' });
  }
};