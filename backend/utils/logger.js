const winston = require('winston');
const path = require('path');
const fs = require('fs');

// ตรวจสอบและสร้างโฟลเดอร์ logs หากยังไม่มี
const logDir = path.join(__dirname, '../logs');
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}

// กำหนดรูปแบบการเขียน Log ข้อความ (Timestamp, Level, Message)
const logFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.printf(info => {
    const message = info.stack || info.message;
    return `${info.timestamp} [${info.level.toUpperCase()}]: ${message}`;
  })
);

// สร้าง Winston Logger instance
const logger = winston.createLogger({
  level: 'info',
  format: logFormat,
  transports: [
    // 1. บันทึกเฉพาะข้อมูล Error ลงไฟล์ error.log
    new winston.transports.File({ 
      filename: path.join(logDir, 'error.log'), 
      level: 'error' 
    }),
    // 2. บันทึกประวัติการทำรายการทุกประเภทลงไฟล์ combined.log
    new winston.transports.File({ 
      filename: path.join(logDir, 'combined.log') 
    })
  ]
});

// หากไม่ได้รันบน Production ให้เปิดแสดงผลข้อมูลบนหน้าจอเทอร์มินัลควบคู่ไปด้วยโดยมีสีแยกประเภทสถานะ
if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.combine(
      winston.format.colorize(),
      winston.format.printf(info => {
        const message = info.stack || info.message;
        return `${info.timestamp} [${info.level}]: ${message}`;
      })
    )
  }));
}

module.exports = logger;
