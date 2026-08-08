import api from './api';

export const authService = {
  // 1. เข้าสู่ระบบ (POST /api/auth/login)
  // รับ username (หรือ email) และ password ส่งไปยัง backend API
  login: async (username, password) => {
    const response = await api.post('/auth/login', { username, password });
    return response.data;
  },

  // 2. สมัครสมาชิกใหม่ (POST /api/auth/register)
  // รับ username, email และ password สำหรับลงทะเบียนผู้ใช้ใหม่ (role: customer)
  register: async (username, email, password) => {
    const response = await api.post('/auth/register', { username, email, password });
    return response.data;
  },

  // 3. ดึงข้อมูลผู้ใช้ปัจจุบัน (GET /api/auth/me)
  // ใช้ Token ที่อยู่ใน Header ในการตรวจสอบว่าใครกำลังล็อกอินอยู่
  getMe: async () => {
    const response = await api.get('/auth/me');
    return response.data;
  }
};

export default authService;
