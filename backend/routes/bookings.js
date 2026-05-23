// =============================================================================
// 1. โหลด Dependencies
// =============================================================================
const express = require('express');
const router = express.Router();
const bookingController = require('../controllers/bookingController');
const auth = require('../middlewares/auth');

// =============================================================================
// 2. Public Routes (ไม่ต้องล็อกอิน)
// =============================================================================
router.get('/availability', bookingController.checkAvailability);

// =============================================================================
// 3. User Routes (ต้องล็อกอิน — ส่ง Token ใน Header)
// =============================================================================
router.post('/', auth, bookingController.createBooking);
router.get('/my-bookings', auth, bookingController.getMyBookings);
router.put('/:id/cancel', auth, bookingController.cancelBooking);

// =============================================================================
// 4. Admin Routes (ต้องล็อกอิน — สำหรับแอดมิน)
// =============================================================================
router.put('/:id/verify', auth, bookingController.verifyBooking);
router.get('/admin/list', auth, bookingController.getAdminBookings);

// =============================================================================
// 5. ส่งออก Router ให้ server.js ใช้งาน
// =============================================================================
module.exports = router;
