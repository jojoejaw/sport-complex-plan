// =============================================================================
// 1. โหลด Dependencies
// =============================================================================
const express = require('express');
const router = express.Router();
const bookingController = require('../controllers/bookingController');
const auth = require('../middlewares/auth');

/**
 * @swagger
 * tags:
 *   name: Bookings
 *   description: ระบบจองสนาม ตรวจสอบสถานะสล็อตว่าง และจัดการใบจอง
 */

/**
 * @swagger
 * /api/bookings/availability:
 *   get:
 *     summary: ตรวจสอบความว่างรายชั่วโมงของสนาม (10:00 - 22:00 น.)
 *     tags: [Bookings]
 *     parameters:
 *       - in: query
 *         name: court_id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ไอดีของสนามที่ต้องการตรวจสอบ
 *         example: 1
 *       - in: query
 *         name: date
 *         required: true
 *         schema:
 *           type: string
 *           format: date
 *         description: วันที่ต้องการเช็ค (รูปแบบ YYYY-MM-DD)
 *         example: "2030-01-01"
 *     responses:
 *       200:
 *         description: สล็อตเวลาของสนามทั้งหมด 12 สล็อตในวันนั้น
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 court_status:
 *                   type: string
 *                   enum: [active, maintenance]
 *                   example: active
 *                 slots:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       label:
 *                         type: string
 *                         example: "10.00-11.00"
 *                       start_time:
 *                         type: string
 *                         example: "10:00:00"
 *                       end_time:
 *                         type: string
 *                         example: "11:00:00"
 *                       status:
 *                         type: string
 *                         enum: [available, unavailable, pending_approval, locked]
 *                         description: |
 *                           - available: สนามว่าง
 *                           - unavailable: สนามถูกจองและอนุมัติแล้ว
 *                           - pending_approval: รอตรวจสลิปจากแอดมิน
 *                           - locked: มีผู้ใช้อื่นจองและกำลังอยู่ในเวลาโอนเงิน 15 นาที
 *                         example: available
 *       400:
 *         description: ไม่ได้ส่งพารามิเตอร์ตรวจสอบที่ครบถ้วน
 *       404:
 *         description: ไม่พบรหัสสนามในระบบ
 *       500:
 *         description: ข้อผิดพลาดภายในเซิร์ฟเวอร์
 */
router.get('/availability', bookingController.checkAvailability);

/**
 * @swagger
 * /api/bookings:
 *   post:
 *     summary: สร้างรายการจองสนามใหม่ (ล็อกสนามรอโอน 15 นาที)
 *     tags: [Bookings]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - court_id
 *               - booking_date
 *               - start_time
 *               - end_time
 *               - contact_phone
 *             properties:
 *               court_id:
 *                 type: integer
 *                 description: ไอดีของสนาม
 *                 example: 1
 *               booking_date:
 *                 type: string
 *                 format: date
 *                 description: วันที่จอง (ห้ามเป็นอดีต)
 *                 example: "2030-01-01"
 *               start_time:
 *                 type: string
 *                 pattern: "^[0-9]{2}:00:00$"
 *                 description: เวลาเริ่มต้น (ตรงชั่วโมงเท่านั้น เช่น 10:00:00)
 *                 example: "10:00:00"
 *               end_time:
 *                 type: string
 *                 pattern: "^[0-9]{2}:00:00$"
 *                 description: เวลาสิ้นสุด (ตรงชั่วโมงเท่านั้น เช่น 12:00:00)
 *                 example: "12:00:00"
 *               contact_phone:
 *                 type: string
 *                 description: เบอร์โทรติดต่อ
 *                 example: "0812345678"
 *     responses:
 *       201:
 *         description: สร้างรายการจองสำเร็จ
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: สร้างการจองสำเร็จ! กรุณาโอนเงินเพื่อยืนยันภายใน 15 นาที
 *                 bookingId:
 *                   type: integer
 *                   example: 45
 *                 total_price:
 *                   type: number
 *                   example: 1200.00
 *       400:
 *         description: ข้อมูลจองย้อนหลัง เกิน 3 ชั่วโมง ติดเวลานอกทำการ หรือชนกับการจองอื่น
 *       500:
 *         description: ข้อผิดพลาดภายในเซิร์ฟเวอร์
 */
router.post('/', auth, bookingController.createBooking);

/**
 * @swagger
 * /api/bookings/my-bookings:
 *   get:
 *     summary: ดึงรายการประวัติการจองของตนเอง
 *     tags: [Bookings]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: รายการประวัติการจองทั้งหมดของตนเอง
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: integer
 *                     example: 45
 *                   user_id:
 *                     type: integer
 *                     example: 2
 *                   court_id:
 *                     type: integer
 *                     example: 1
 *                   booking_date:
 *                     type: string
 *                     example: "2030-01-01"
 *                   start_time:
 *                     type: string
 *                     example: "10:00:00"
 *                   end_time:
 *                     type: string
 *                     example: "12:00:00"
 *                   total_price:
 *                     type: string
 *                     example: "1200.00"
 *                   contact_phone:
 *                     type: string
 *                     example: "0812345678"
 *                   status:
 *                     type: string
 *                     example: approved
 *                   court_name:
 *                     type: string
 *                     example: สนามฟุตบอล A (ในร่ม)
 *                   sport_name:
 *                     type: string
 *                     example: ฟุตบอล
 *                   slip_image_path:
 *                     type: string
 *                     nullable: true
 *                     example: "uploads/slips/slip-1700000000000.png"
 *       500:
 *         description: ข้อผิดพลาดภายในเซิร์ฟเวอร์
 */
router.get('/my-bookings', auth, bookingController.getMyBookings);

/**
 * @swagger
 * /api/bookings/{id}/cancel:
 *   put:
 *     summary: ยกเลิกการจองสนาม (ลูกค้าทำได้เฉพาะเมื่อยังไม่ได้จ่ายตังค์ แดมินทำได้ทุกกรณี)
 *     tags: [Bookings]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ไอดีของรายการจองที่ต้องการยกเลิก
 *         example: 45
 *     responses:
 *       200:
 *         description: ยกเลิกการจองสำเร็จและปลดปล่อยสนามว่างแล้ว
 *       400:
 *         description: รายการจองถูกยกเลิกไปแล้ว หรือชำระเงินไปแล้วลูกค้าขอยกเลิกไม่ได้
 *       403:
 *         description: ไม่ได้รับสิทธิ์ให้ยกเลิกรายการจองนี้
 *       500:
 *         description: ข้อผิดพลาดภายในเซิร์ฟเวอร์
 */
router.put('/:id/cancel', auth, bookingController.cancelBooking);

/**
 * @swagger
 * /api/bookings/{id}/verify:
 *   put:
 *     summary: แอดมินอนุมัติหรือปฏิเสธสลิปการจองสนามด้วยตนเอง (Admin เท่านั้น)
 *     tags: [Bookings]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ไอดีของการจอง
 *         example: 45
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - status
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [approved, rejected, pending_payment, pending_approval, cancelled]
 *                 description: สถานะที่แอดมินต้องการปรับเปลี่ยน
 *                 example: approved
 *               reject_reason:
 *                 type: string
 *                 description: เหตุผลกรณีเลือกสถานะเป็น rejected
 *                 example: "ภาพสลิปที่โอนไม่ชัดเจน หรือไม่มียอดโอนจริง"
 *     responses:
 *       200:
 *         description: อัปเดตสถานะสำเร็จ
 *       400:
 *         description: ไม่ระบุสถานะที่ถูกต้อง หรือ ลืมระบุเหตุผลปฏิเสธ
 *       403:
 *         description: ไม่มีสิทธิ์แอดมิน
 *       500:
 *         description: ข้อผิดพลาดภายในเซิร์ฟเวอร์
 */
router.put('/:id/verify', auth, bookingController.verifyBooking);

/**
 * @swagger
 * /api/bookings/admin/list:
 *   get:
 *     summary: ดึงข้อมูลการจองของทุกคนในระบบ (Admin เท่านั้น)
 *     tags: [Bookings]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: รายการการจองทั้งหมดในระบบพร้อมประวัติผู้ใช้และข้อมูลสลิป
 *       403:
 *         description: ไม่มีสิทธิ์แอดมิน
 *       500:
 *         description: ข้อผิดพลาดภายในเซิร์ฟเวอร์
 */
router.get('/admin/list', auth, bookingController.getAdminBookings);

// =============================================================================
// 5. ส่งออก Router ให้ server.js ใช้งาน
// =============================================================================
module.exports = router;
