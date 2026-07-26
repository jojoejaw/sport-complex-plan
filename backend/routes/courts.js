// =============================================================================
// 1. โหลด Dependencies
// =============================================================================
const express = require('express');
const router = express.Router();
const courtController = require('../controllers/courtController');
const auth = require('../middlewares/auth');

/**
 * @swagger
 * tags:
 *   name: Courts
 *   description: ระบบจัดการประเภทกีฬาและสนามกีฬา
 */

/**
 * @swagger
 * /api/sports:
 *   get:
 *     summary: ดึงข้อมูลประเภทกีฬาทั้งหมด (เช่น ฟุตบอล, บาสเกตบอล, แบดมินตัน)
 *     tags: [Courts]
 *     responses:
 *       200:
 *         description: รายการประเภทกีฬาทั้งหมด
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: integer
 *                     example: 1
 *                   name:
 *                     type: string
 *                     example: ฟุตบอล
 *                   image_url:
 *                     type: string
 *                     nullable: true
 *                     example: null
 *       500:
 *         description: ข้อผิดพลาดภายในเซิร์ฟเวอร์
 */
router.get('/sports', courtController.getSports);

/**
 * @swagger
 * /api/courts:
 *   get:
 *     summary: ดึงข้อมูลสนามกีฬาทั้งหมด (กรองตามประเภทกีฬาได้ด้วย query parameter)
 *     tags: [Courts]
 *     parameters:
 *       - in: query
 *         name: sport_id
 *         schema:
 *           type: integer
 *         required: false
 *         description: ไอดีประเภทกีฬาที่ต้องการกรองดูสนาม (ถ้าไม่ส่งมาจะดึงทุกประเภทสนาม)
 *         example: 1
 *     responses:
 *       200:
 *         description: รายการสนามกีฬาที่ดึงมาสำเร็จ
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: integer
 *                     example: 1
 *                   sport_id:
 *                     type: integer
 *                     example: 1
 *                   name:
 *                     type: string
 *                     example: สนามฟุตบอล A (ในร่ม)
 *                   description:
 *                     type: string
 *                     nullable: true
 *                     example: สนามหญ้าเทียมพรีเมียม
 *                   price_per_hour:
 *                     type: string
 *                     example: "600.00"
 *                   status:
 *                     type: string
 *                     enum: [active, maintenance]
 *                     example: active
 *                   image_url:
 *                     type: string
 *                     nullable: true
 *                     example: null
 *       500:
 *         description: ข้อผิดพลาดภายในเซิร์ฟเวอร์
 */
router.get('/courts', courtController.getCourts);

/**
 * @swagger
 * /api/courts:
 *   post:
 *     summary: เพิ่มสนามใหม่ (Admin เท่านั้น)
 *     tags: [Courts]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - sport_id
 *               - name
 *               - price_per_hour
 *             properties:
 *               sport_id:
 *                 type: integer
 *                 description: ไอดีของประเภทกีฬา
 *                 example: 1
 *               name:
 *                 type: string
 *                 description: ชื่อสนามใหม่
 *                 example: สนามฟุตบอล C
 *               description:
 *                 type: string
 *                 example: สนามกลางแจ้ง ขนาดมาตรฐาน
 *               price_per_hour:
 *                 type: number
 *                 description: ค่าบริการต่อชั่วโมง
 *                 example: 450.0
 *               image_url:
 *                 type: string
 *                 example: https://example.com/court_c.jpg
 *     responses:
 *       201:
 *         description: เพิ่มสนามใหม่สำเร็จ
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: เพิ่มสนามใหม่สำเร็จ!
 *                 courtId:
 *                   type: integer
 *                   example: 9
 *       400:
 *         description: กรอกข้อมูลไม่ครบถ้วน
 *       403:
 *         description: คุณไม่มีสิทธิ์เข้าถึงฟังก์ชันของแอดมิน
 *       500:
 *         description: ข้อผิดพลาดภายในเซิร์ฟเวอร์
 */
router.post('/courts', auth, courtController.createCourt);

/**
 * @swagger
 * /api/courts/{id}:
 *   put:
 *     summary: แก้ไขข้อมูลสนามเดิม (Admin เท่านั้น)
 *     tags: [Courts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ไอดีของสนามที่ต้องการแก้ไข
 *         example: 1
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - price_per_hour
 *               - status
 *             properties:
 *               name:
 *                 type: string
 *                 example: สนามฟุตบอล A (ในร่มอัพเกรด)
 *               description:
 *                 type: string
 *                 example: สนามหญ้าเทียมพรีเมียมพร้อมไฟ LED
 *               price_per_hour:
 *                 type: number
 *                 example: 650.0
 *               status:
 *                 type: string
 *                 enum: [active, maintenance]
 *                 example: active
 *               image_url:
 *                 type: string
 *                 example: null
 *     responses:
 *       200:
 *         description: อัปเดตข้อมูลสนามเรียบร้อยแล้ว
 *       403:
 *         description: ไม่มีสิทธิ์แอดมิน
 *       404:
 *         description: ไม่พบข้อมูลสนามที่ต้องการแก้ไข
 *       500:
 *         description: ข้อผิดพลาดภายในเซิร์ฟเวอร์
 */
router.put('/courts/:id', auth, courtController.updateCourt);

/**
 * @swagger
 * /api/courts/{id}:
 *   delete:
 *     summary: ลบสนามออกจากระบบ (Admin เท่านั้น)
 *     tags: [Courts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ไอดีของสนามที่ต้องการลบ
 *         example: 8
 *     responses:
 *       200:
 *         description: ลบสนามสำเร็จแล้ว
 *       400:
 *         description: ไม่สามารถลบได้เนื่องจากสนามมีประวัติการจองอยู่ (แนะนำให้เปลี่ยน status เป็น maintenance แทน)
 *       403:
 *         description: ไม่มีสิทธิ์แอดมิน
 *       404:
 *         description: ไม่พบข้อมูลสนามที่ต้องการลบ
 *       500:
 *         description: ข้อผิดพลาดภายในเซิร์ฟเวอร์
 */
router.delete('/courts/:id', auth, courtController.deleteCourt);

// =============================================================================
// 4. ส่งออก Router ให้ server.js ใช้งาน
// =============================================================================
module.exports = router;
