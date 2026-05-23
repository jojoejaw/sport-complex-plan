const jwt = require('jsonwebtoken');

module.exports = (req, res, next) => {
  // ดึงโทเค็นจาก Header: Authorization: Bearer <TOKEN>
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'กรุณาเข้าสู่ระบบก่อนทำรายการ' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // เก็บข้อมูลผู้ใช้ (id, username, role) ไว้ในตัวแปร req.user
    next(); // ผ่านไปทำงานในส่วนถัดไป
  } catch (error) {
    return res.status(403).json({ message: 'โทเค็นไม่ถูกต้องหรือหมดอายุแล้ว' });
  }
};