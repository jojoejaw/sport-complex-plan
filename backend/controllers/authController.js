const db = require('../config/db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// 1. ระบบสมัครสมาชิก (Register)
exports.register = async (req, res) => {
  const { username, email, password } = req.body;

  // ตรวจสอบความครบถ้วนของข้อมูลที่ส่งมา
  if (!username || !email || !password) {
    return res.status(400).json({ message: 'กรุณากรอกข้อมูลให้ครบถ้วน' });
  }

  try {
    // เช็คว่า username หรือ email นี้มีอยู่แล้วในระบบหรือไม่
    const [existingUser] = await db.query(
      'SELECT id FROM users WHERE username = ? OR email = ?',
      [username, email]
    );

    if (existingUser.length > 0) {
      return res.status(400).json({ message: 'ชื่อผู้ใช้งานหรืออีเมลนี้ถูกใช้งานแล้ว' });
    }

    // เข้ารหัสรหัสผ่าน (Hash Password) ก่อนบันทึก
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // บันทึกผู้ใช้ใหม่ลงฐานข้อมูล (กำหนดบทบาทเริ่มต้นเป็น customer)
    await db.query(
      'INSERT INTO users (username, email, password, role) VALUES (?, ?, ?, ?)',
      [username, email, hashedPassword, 'customer']
    );

    res.status(201).json({ message: 'สมัครสมาชิกสำเร็จแล้ว!' });
  } catch (error) {
    console.error('Register Error:', error);
    res.status(500).json({ message: 'เกิดข้อผิดพลาดภายในเซิร์ฟเวอร์' });
  }
};

// 2. ระบบเข้าสู่ระบบ (Login)
exports.login = async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ message: 'กรุณากรอกชื่อผู้ใช้และรหัสผ่าน' });
  }

  try {
    // ค้นหาผู้ใช้จาก username
    const [users] = await db.query('SELECT * FROM users WHERE username = ?', [username]);

    if (users.length === 0) {
      return res.status(400).json({ message: 'ชื่อผู้ใช้งานหรือรหัสผ่านไม่ถูกต้อง' });
    }

    const user = users[0];

    // ตรวจสอบรหัสผ่านที่ส่งมาเปรียบเทียบกับรหัสผ่านที่เข้ารหัสไว้ใน DB
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'ชื่อผู้ใช้งานหรือรหัสผ่านไม่ถูกต้อง' });
    }

    // สร้าง Token (JWT) เพื่อส่งกลับไปให้ฝั่งหน้าบ้านเก็บไว้ใช้ส่งมายืนยันตัวตน
    const token = jwt.sign(
      { id: user.id, username: user.username, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '1d' } // มีอายุการใช้งาน 1 วัน
    );

    res.json({
      message: 'เข้าสู่ระบบสำเร็จ!',
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Login Error:', error);
    res.status(500).json({ message: 'เกิดข้อผิดพลาดภายในเซิร์ฟเวอร์' });
  }
};