// =============================================================================
// 1. โหลด Dependencies
// =============================================================================
const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/paymentController');
const auth = require('../middlewares/auth');

// =============================================================================
// 2. Payment Routes (ต้องล็อกอิน — ส่ง Token ใน Header)
// =============================================================================
router.post('/upload', auth, paymentController.upload.single('slip'), paymentController.submitPayment);

// =============================================================================
// 3. ส่งออก Router ให้ server.js ใช้งาน
// =============================================================================
module.exports = router;
