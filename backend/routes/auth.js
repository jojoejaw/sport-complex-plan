// =============================================================================
// 1. โหลด Dependencies
// =============================================================================
const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

/**
 * @swagger
 * tags:
 *   name: Authentication
 *   description: ระบบสมัครสมาชิกและยืนยันตัวตนผู้ใช้
 */

/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     summary: สมัครสมาชิกใหม่ (สำหรับบทบาท customer)
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - username
 *               - email
 *               - password
 *             properties:
 *               username:
 *                 type: string
 *                 description: ชื่อผู้ใช้งาน (ต้องไม่ซ้ำในระบบ)
 *                 example: customertest
 *               email:
 *                 type: string
 *                 description: อีเมล (ต้องไม่ซ้ำในระบบ)
 *                 example: customertest@sportcomplex.com
 *               password:
 *                 type: string
 *                 description: รหัสผ่านเข้าสู่ระบบ
 *                 example: customer1234
 *     responses:
 *       201:
 *         description: สมัครสมาชิกสำเร็จแล้ว
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: สมัครสมาชิกสำเร็จแล้ว!
 *       400:
 *         description: กรอกข้อมูลไม่ครบถ้วน หรือชื่อผู้ใช้/อีเมลถูกใช้งานไปแล้ว
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: ชื่อผู้ใช้งานหรืออีเมลนี้ถูกใช้งานแล้ว
 *       500:
 *         description: ข้อผิดพลาดภายในเซิร์ฟเวอร์
 */
router.post('/register', authController.register);

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: เข้าสู่ระบบ (เพื่อขอรับ JWT Token สำหรับใช้งาน API อื่นๆ)
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - username
 *               - password
 *             properties:
 *               username:
 *                 type: string
 *                 example: customer
 *               password:
 *                 type: string
 *                 example: customer1234
 *     responses:
 *       200:
 *         description: เข้าสู่ระบบสำเร็จและได้รับ JWT Token
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: เข้าสู่ระบบสำเร็จ!
 *                 token:
 *                   type: string
 *                   description: JSON Web Token สำหรับแนบใน Header Authorization
 *                 user:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: integer
 *                       example: 2
 *                     username:
 *                       type: string
 *                       example: customer
 *                     email:
 *                       type: string
 *                       example: customer@sportcomplex.com
 *                     role:
 *                       type: string
 *                       example: customer
 *       400:
 *         description: กรอกข้อมูลไม่ครบถ้วน หรือชื่อผู้ใช้/รหัสผ่านไม่ถูกต้อง
 *       500:
 *         description: ข้อผิดพลาดภายในเซิร์ฟเวอร์
 */
router.post('/login', authController.login);

// =============================================================================
// 3. ส่งออก Router ให้ server.js ใช้งาน
// =============================================================================
module.exports = router;
