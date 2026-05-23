const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();
const db = require('./config/db'); // โหลดค่าการเชื่อมฐานข้อมูลเพื่อตรวจเช็คความเชื่อมต่อ
const authRoutes = require('./routes/auth');
const courtRoutes = require('./routes/courts');
const bookingRoutes = require('./routes/bookings');
const paymentRoutes = require('./routes/payments');


const app = express();
const PORT = process.env.PORT || 5000;

// เรียกใช้งาน Middleware ต่างๆ
app.use(cors()); // อนุญาตให้หน้าบ้านจอยกันได้โดยไม่ติด CORS
app.use(express.json()); // อนุญาตให้ Express อ่านข้อมูล JSON ใน Body ที่ส่งมาได้

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));


app.use('/api/auth', authRoutes);
app.use('/api', courtRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/payments', paymentRoutes);

// สร้าง Route ทดสอบ
app.get('/', (req, res) => {
  res.json({ message: 'ยินดีต้อนรับสู่ระบบจองสนามกีฬา API' });
});

// สั่งรันเซิร์ฟเวอร์หลังบ้าน
app.listen(PORT, () => {
  console.log(`🚀 เซิร์ฟเวอร์ทำงานที่พอร์ต http://localhost:${PORT}`);
});