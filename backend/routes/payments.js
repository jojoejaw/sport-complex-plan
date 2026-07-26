// =============================================================================
// 1. โหลด Dependencies
// =============================================================================
const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/paymentController');
const auth = require('../middlewares/auth');

/**
 * @swagger
 * tags:
 *   name: Payments
 *   description: ระบบการชำระเงิน ตรวจสอบสลิปด้วย Thunder API และดึงข้อมูลพร้อมเพย์
 */

/**
 * @swagger
 * /api/payments/upload:
 *   post:
 *     summary: อัปโหลดรูปภาพสลิปเพื่อยืนยันการจ่ายเงิน (สแกนตรวจสลิปและอนุมัติอัตโนมัติ)
 *     tags: [Payments]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - booking_id
 *               - slip
 *             properties:
 *               booking_id:
 *                 type: integer
 *                 description: ไอดีของรายการจองที่ต้องการโอนชำระเงิน
 *                 example: 45
 *               slip:
 *                 type: string
 *                 format: binary
 *                 description: ไฟล์ภาพสลิปโอนเงิน (jpg, jpeg, png ขนาดไม่เกิน 5MB)
 *     responses:
 *       200:
 *         description: ตรวจสอบสลิปผ่านและระบบอนุมัติการจองให้สำเร็จโดยอัตโนมัติ
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: ชำระเงินสำเร็จเรียบร้อยแล้ว! ระบบอนุมัติการจองของท่านอัตโนมัติ
 *       400:
 *         description: ไฟล์ภาพไม่ถูกต้อง, ยอดโอนไม่ตรงกับยอดจอง, โอนเงินก่อนเวลาจอง, หรือสลิปซ้ำซ้อน
 *       403:
 *         description: คุณไม่มีสิทธิ์ทำรายการจ่ายเงินในใบจองรหัสนี้
 *       404:
 *         description: ไม่พบรายการจองนี้ในระบบ
 *       500:
 *         description: เกิดข้อผิดพลาดในระบบตรวจสลิปภายนอก หรือข้อผิดพลาดภายในเซิร์ฟเวอร์
 */
router.post('/upload', auth, paymentController.upload.single('slip'), paymentController.submitPayment);

/**
 * @swagger
 * /api/payments/config:
 *   get:
 *     summary: ดึงข้อมูลการตั้งค่าบัญชีพร้อมเพย์ (เลขเบอร์โทร/ชื่อเจ้าของบัญชี) สำหรับขึ้นแสดงฝั่งหน้าบ้าน
 *     tags: [Payments]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: ข้อมูลพร้อมเพย์ของร้านค้า
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 promptpayId:
 *                   type: string
 *                   example: "0902214698"
 *                 promptpayName:
 *                   type: string
 *                   example: "ณรงฤทธิ์ โจทจันทร์"
 *       500:
 *         description: ข้อผิดพลาดภายในเซิร์ฟเวอร์
 */
router.get('/config', auth, paymentController.getPaymentConfig);

// =============================================================================
// 3. ส่งออก Router ให้ server.js ใช้งาน
// =============================================================================
module.exports = router;
