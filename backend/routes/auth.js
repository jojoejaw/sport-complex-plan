const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

// เส้นทางสำหรับ Register: POST /api/auth/register
router.post('/register', authController.register);

// เส้นทางสำหรับ Login: POST /api/auth/login
router.post('/login', authController.login);

module.exports = router;