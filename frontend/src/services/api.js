import axios from 'axios';
import { API_BASE_URL } from '../utils/constants';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

let isHandlingUnauthorized = false;

// Request Interceptors: ใส่ Authorization header ถ้ามี token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor: จัดการข้อผิดพลาดระบบและ Token หมดอายุ (401)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && !isHandlingUnauthorized) {
      isHandlingUnauthorized = true;
      localStorage.removeItem('token');
      localStorage.removeItem('user');

      window.dispatchEvent(new CustomEvent('auth:session-expired', {
        detail: { message: error.response?.data?.message || 'เซสชันหมดอายุ กรุณาเข้าสู่ระบบใหม่' },
      }));

      const isAuthPage = window.location.pathname.startsWith('/login')
        || window.location.pathname.startsWith('/register');

      if (!isAuthPage) {
        const returnTo = `${window.location.pathname}${window.location.search}${window.location.hash}`;
        sessionStorage.setItem('auth:returnTo', returnTo);
        window.location.replace('/login?reason=session-expired');
      } else {
        isHandlingUnauthorized = false;
      }
    }
    return Promise.reject(error);
  }
);

export default api;
