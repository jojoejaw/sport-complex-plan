// =============================================================================
// 1. โหลด Dependencies (ไลบรารีและการตั้งค่าพื้นฐาน)
// =============================================================================
const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();
const db = require('./config/db');
const logger = require('./utils/logger');

// =============================================================================
// 2. โหลด Routes (แผนผังเส้นทาง API แต่ละระบบ)
// =============================================================================
const authRoutes = require('./routes/auth');
const courtRoutes = require('./routes/courts');
const bookingRoutes = require('./routes/bookings');
const paymentRoutes = require('./routes/payments');

// =============================================================================
// 3. สร้างแอปและตั้งค่าพอร์ต
// =============================================================================
const app = express();
const PORT = process.env.PORT || 5000;

// =============================================================================
// 4. Middleware (ประมวลผลก่อนเข้า Route)
// =============================================================================
app.use(cors());
app.use(express.json());

// =============================================================================
// 5. Static Files (ให้เข้าถึงไฟล์อัปโหลดผ่าน URL)
// =============================================================================
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// =============================================================================
// 5.5 Swagger API Documentation (ระบบหน้าคู่มือเอกสาร API)
// =============================================================================
const swaggerUi = require('swagger-ui-express');
const swaggerSpec = require('./config/swagger');
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// =============================================================================
// 6. API Routes (เชื่อมเส้นทางย่อยกับแอปหลัก)
// =============================================================================
app.use('/api/auth', authRoutes);
app.use('/api', courtRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/payments', paymentRoutes);

// =============================================================================
// 7. Route ทดสอบ (ตรวจว่าเซิร์ฟเวอร์ตอบกลับได้)
// =============================================================================
app.get('/', (req, res) => {
  res.json({ message: 'ยินดีต้อนรับสู่ระบบจองสนามกีฬา API' });
});

// =============================================================================
// 8. Global Error Handler (จัดการข้อผิดพลาดระบบและ Multer อัตโนมัติ)
// =============================================================================
app.use((err, req, res, next) => {
  logger.error('🔥 Global Error Caught: ' + (err.stack || err.message || err));

  // จัดการข้อผิดพลาดจาก Multer (อัปโหลดสลิป)
  if (err.name === 'MulterError') {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ message: 'ขนาดไฟล์ภาพสลิปต้องไม่เกิน 5MB' });
    }
    return res.status(400).json({ message: `ข้อผิดพลาดในการอัปโหลดไฟล์: ${err.message}` });
  }

  // ข้อผิดพลาดแบบ Custom File Filter จาก Multer
  if (err.message && err.message.includes('กรุณาอัปโหลดเฉพาะไฟล์รูปภาพ')) {
    return res.status(400).json({ message: err.message });
  }

  res.status(err.status || 500).json({
    message: err.message || 'เกิดข้อผิดพลาดภายในเซิร์ฟเวอร์'
  });
});

// =============================================================================
// 9. เริ่มรันเซิร์ฟเวอร์
// =============================================================================
app.listen(PORT, () => {
  logger.info(`🚀 เซิร์ฟเวอร์ทำงานที่พอร์ต http://localhost:${PORT}`);
  
  // เริ่มการทำงานของระบบล้างรายการจองที่หมดอายุในเบื้องหลัง
  const { startBookingCleanup } = require('./utils/bookingCleanup');
  startBookingCleanup();
});
