// =============================================================================
// 1. โหลด Dependencies
// =============================================================================
const db = require('../config/db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const logger = require('../utils/logger');

// =============================================================================
// 2. Register — สมัครสมาชิก (POST /api/auth/register)
//    Flow: รับข้อมูล → ตรวจครบ → เช็คซ้ำ → เข้ารหัสรหัสผ่าน → บันทึก DB → ตอบกลับ
// =============================================================================
exports.register = async (req, res) => {
  const { username, email, password } = req.body;

  // --- ขั้นที่ 1: ตรวจสอบความครบถ้วนของข้อมูล ---
  if (!username || !email || !password) {
    return res.status(400).json({ message: 'กรุณากรอกข้อมูลให้ครบถ้วน' });
  }

  const cleanUsername = String(username).trim();
  const cleanEmail = String(email).trim().toLowerCase();

  // --- 1.1 ตรวจสอบ username: ภาษาอังกฤษหรือตัวเลขเท่านั้น ความยาว 5-30 ตัวอักษร ---
  const usernameRegex = /^[a-zA-Z0-9]{5,30}$/;
  if (!usernameRegex.test(cleanUsername)) {
    return res.status(400).json({
      message: 'ชื่อผู้ใช้งานต้องเป็นตัวอักษรภาษาอังกฤษหรือตัวเลขเท่านั้น ห้ามใส่เว้นวรรค ภาษาไทย หรือสัญลักษณ์พิเศษ และต้องมีความยาวระหว่าง 5 ถึง 30 ตัวอักษร'
    });
  }

  // --- 1.2 ตรวจสอบ email: ฟอร์แมตถูกต้องและความยาวไม่เกิน 100 ตัวอักษร ---
  if (cleanEmail.length > 100) {
    return res.status(400).json({ message: 'ความยาวอีเมลต้องไม่เกิน 100 ตัวอักษร' });
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(cleanEmail)) {
    return res.status(400).json({ message: 'รูปแบบอีเมลไม่ถูกต้อง (ต้องอยู่ในรูปแบบ user@example.com)' });
  }

  // --- 1.3 ตรวจสอบ password: ความยาวอย่างน้อย 6 ตัวอักษร และต้องมี A-Z, a-z, 0-9 อย่างละ 1 ตัว ---
  const passRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{6,}$/;
  if (!passRegex.test(password)) {
    return res.status(400).json({
      message: 'รหัสผ่านต้องมีความยาวอย่างน้อย 6 ตัวอักษร และต้องประกอบด้วยตัวพิมพ์ใหญ่ (A-Z) ตัวพิมพ์เล็ก (a-z) และตัวเลข (0-9) อย่างน้อยอย่างละ 1 ตัว'
    });
  }

  try {
    // --- ขั้นที่ 2: เช็คว่า username หรือ email ซ้ำในระบบหรือไม่ ---
    const [existingUser] = await db.query(
      'SELECT id FROM users WHERE username = ? OR email = ?',
      [cleanUsername, cleanEmail]
    );

    if (existingUser.length > 0) {
      return res.status(400).json({ message: 'ชื่อผู้ใช้งานหรืออีเมลนี้ถูกใช้งานแล้ว' });
    }

    // --- ขั้นที่ 3: เข้ารหัสรหัสผ่านก่อนบันทึก ---
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // --- ขั้นที่ 4: บันทึกผู้ใช้ใหม่ (role เริ่มต้น = customer) ---
    await db.query(
      'INSERT INTO users (username, email, password, role) VALUES (?, ?, ?, ?)',
      [cleanUsername, cleanEmail, hashedPassword, 'customer']
    );

    // --- ขั้นที่ 5: ตอบกลับสำเร็จ ---
    res.status(201).json({ message: 'สมัครสมาชิกสำเร็จแล้ว!' });
  } catch (error) {
    logger.error('Register Error: ' + (error.stack || error));
    res.status(500).json({ message: 'เกิดข้อผิดพลาดภายในเซิร์ฟเวอร์' });
  }
};

// =============================================================================
// 3. Login — เข้าสู่ระบบ (POST /api/auth/login)
//    Flow: รับข้อมูล → ตรวจครบ → ค้นหาผู้ใช้ → ตรวจรหัสผ่าน → สร้าง JWT → ตอบกลับ
// =============================================================================
exports.login = async (req, res) => {
  const { username, password } = req.body;

  // --- ขั้นที่ 1: ตรวจสอบความครบถ้วนของข้อมูล ---
  if (!username || !password) {
    return res.status(400).json({ message: 'กรุณากรอกชื่อผู้ใช้และรหัสผ่าน' });
  }

  try {
    // --- ขั้นที่ 2: ค้นหาผู้ใช้จาก username ---
    const [users] = await db.query('SELECT * FROM users WHERE username = ?', [username]);

    if (users.length === 0) {
      return res.status(400).json({ message: 'ชื่อผู้ใช้งานหรือรหัสผ่านไม่ถูกต้อง' });
    }

    const user = users[0];

    // --- ขั้นที่ 3: เปรียบเทียบรหัสผ่านกับที่เข้ารหัสไว้ใน DB ---
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'ชื่อผู้ใช้งานหรือรหัสผ่านไม่ถูกต้อง' });
    }

    // --- ขั้นที่ 4: สร้าง JWT ส่งกลับให้ฝั่งหน้าบ้านเก็บไว้ยืนยันตัวตน ---
    const token = jwt.sign(
      { id: user.id, username: user.username, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '1d' }
    );

    // --- ขั้นที่ 5: ตอบกลับ token และข้อมูลผู้ใช้ ---
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
    logger.error('Login Error: ' + (error.stack || error));
    res.status(500).json({ message: 'เกิดข้อผิดพลาดภายในเซิร์ฟเวอร์' });
  }
};

// =============================================================================
// 4. Get Current User Info — ดึงข้อมูลผู้ใช้ปัจจุบัน (GET /api/auth/me)
// =============================================================================
exports.getMe = async (req, res) => {
  try {
    const [users] = await db.query('SELECT id, username, email, role, created_at FROM users WHERE id = ?', [req.user.id]);
    if (users.length === 0) {
      return res.status(404).json({ message: 'ไม่พบข้อมูลผู้ใช้งาน' });
    }
    res.json({ user: users[0] });
  } catch (error) {
    logger.error('GetMe Error: ' + (error.stack || error));
    res.status(500).json({ message: 'เกิดข้อผิดพลาดภายในเซิร์ฟเวอร์' });
  }
};

