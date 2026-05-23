const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/paymentController');
const auth = require('../middlewares/auth');

// เส้นทางแนบสลิปชำระเงิน: POST /api/payments/upload
router.post('/upload', auth, paymentController.upload.single('slip'), paymentController.submitPayment);

module.exports = router;