import axios from 'axios';

// 1. สร้าง Axios Instance และดึง Base URL จาก .env ที่ตั้งค่าไว้
const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
});

// 2. ตั้งค่า Interceptor เพื่อดักจับ Request ทุกตัวก่อนส่งไปหลังบ้าน
// หากพบว่ามี Token ในเครื่อง (จากการ Login สำเร็จ) จะแนบส่งไปใน Header อัตโนมัติทันที
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers['Authorization'] = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

export default api;