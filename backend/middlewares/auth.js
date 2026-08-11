// =============================================================================
// 1. โหลด Dependencies
// =============================================================================
const jwt = require('jsonwebtoken');

// =============================================================================
// 2. Auth Middleware (ตรวจสอบ Token ก่อนเข้า Route ที่ต้องล็อกอิน)
// =============================================================================
module.exports = (req, res, next) => {
  // --- ดึง Token จาก Header: Authorization: Bearer <TOKEN> ---
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  // --- ตรวจว่ามี Token หรือไม่ ---
  if (!token) {
    return res.status(401).json({ message: 'กรุณาเข้าสู่ระบบก่อนทำรายการ' });
  }

  // --- ตรวจสอบ Token และแนบข้อมูลผู้ใช้ใน req.user ---
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    const message = error.name === 'TokenExpiredError'
      ? 'เซสชันหมดอายุ กรุณาเข้าสู่ระบบใหม่'
      : 'โทเค็นไม่ถูกต้อง กรุณาเข้าสู่ระบบใหม่';
    return res.status(401).json({ message });
  }
};
