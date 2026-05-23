const express = require('express');
const router = express.Router();
const courtController = require('../controllers/courtController');

// เส้นทางสำหรับลูกค้าดูข้อมูล
router.get('/sports', courtController.getSports);
router.get('/courts', courtController.getCourts);
// 🆕 เพิ่มเส้นทางสำหรับแอดมินจัดการสนาม
router.post('/courts', courtController.createCourt);       // เพิ่มสนาม
router.put('/courts/:id', courtController.updateCourt);    // แก้ไขสนาม (รวมถึงสวิตช์ปิด/เปิด)
router.delete('/courts/:id', courtController.deleteCourt); // ลบสนาม

module.exports = router;