const swaggerJSDoc = require('swagger-jsdoc');

// ข้อมูลการกำหนดค่า Swagger (OpenAPI Specification 3.0)
const swaggerDefinition = {
  openapi: '3.0.0',
  info: {
    title: '🏆 Sport Complex Booking API',
    version: '1.0.0',
    description: `### เอกสารแนะนำและทดสอบระบบหลังบ้าน (Interactive API Documentation)
    
ระบบหลังบ้านสำหรับจัดการการจองสนามกีฬา ครอบคลุมระบบสมาชิก กีฬา สนามจอง การโอนชำระสลิปเงินด้วย Thunder API และระบบล้างคิวหมดอายุเบื้องหลัง
    
* **ระบบความปลอดภัย**: ใช้ JWT Token (กรอกได้ที่ปุ่ม **Authorize** ด้านบนขวา)
* **กติกาจองสนาม**: จองล่วงหน้าเต็มชั่วโมง ให้บริการ 10:00 - 22:00 น. จำกัดการจองสูงสุด 3 ชม. และล็อกสนามรอโอนสลิป 15 นาที`,
    contact: {
      name: 'ผู้พัฒนาและดูแลระบบ',
      email: 'developer@sportcomplex.com'
    }
  },
  servers: [
    {
      url: 'http://localhost:5000',
      description: 'Local Development Server'
    }
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'ป้อน JWT Token ที่ได้จากการล็อกอินเพื่อยืนยันสิทธิ์เข้าใช้ API (ไม่ต้องพิมพ์คำว่า Bearer นำหน้า)'
      }
    }
  },
  // ใช้ Bearer Auth เป็นตัวเลือกตรวจสอบสิทธิ์ความปลอดภัยในเอกสารทั้งหมด
  security: [
    {
      bearerAuth: []
    }
  ]
};

// ตั้งค่าในการสแกนดึง JSDoc Comment จากโฟลเดอร์ routes
const options = {
  swaggerDefinition,
  apis: [
    './routes/*.js',
    './backend/routes/*.js',
    './controllers/*.js',
    './backend/controllers/*.js'
  ]
};

const swaggerSpec = swaggerJSDoc(options);

module.exports = swaggerSpec;
