const express = require('express');
const router = express.Router();
const bookingController = require('../controllers/bookingController');
const auth = require('../middlewares/auth'); // โหลดสไลด์เช็ค Token

// 1. ดึงความว่างของสนาม (ใครๆ ก็ดูได้ ไม่จำเป็นต้องล็อกอิน)
router.get('/availability', bookingController.checkAvailability);

// 2. กดยืนยันการจองสนาม (จำเป็นต้องล็อกอิน และส่ง Token มาทาง Header)
router.post('/', auth, bookingController.createBooking);

router.get('/my-bookings', auth, bookingController.getMyBookings); // ดูประวัติการจองของตนเอง
router.put('/:id/cancel', auth, bookingController.cancelBooking);  // กดยกเลิกจองก่อนโอนเงิน
router.put('/:id/verify', auth, bookingController.verifyBooking);  // แอดมินตรวจสอบการชำระเงิน

// ดึงรายการจองทั้งหมด (เฉพาะ Admin เท่านั้น)
router.get('/admin/list', auth, bookingController.getAdminBookings);

module.exports = router;