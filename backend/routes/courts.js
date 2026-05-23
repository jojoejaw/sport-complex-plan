// =============================================================================
// 1. โหลด Dependencies
// =============================================================================
const express = require('express');
const router = express.Router();
const courtController = require('../controllers/courtController');

// =============================================================================
// 2. Public Routes (ลูกค้าดูข้อมูล — ไม่ต้องล็อกอิน)
// =============================================================================
router.get('/sports', courtController.getSports);
router.get('/courts', courtController.getCourts);

// =============================================================================
// 3. Admin Routes (จัดการสนาม — เพิ่ม / แก้ไข / ลบ)
// =============================================================================
router.post('/courts', courtController.createCourt);
router.put('/courts/:id', courtController.updateCourt);
router.delete('/courts/:id', courtController.deleteCourt);

// =============================================================================
// 4. ส่งออก Router ให้ server.js ใช้งาน
// =============================================================================
module.exports = router;
