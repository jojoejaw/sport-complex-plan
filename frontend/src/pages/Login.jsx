import { useState } from 'react';
import { Link } from 'react-router-dom';
import { User, Lock, Eye, EyeOff, ArrowRight } from 'lucide-react';
import Swal from 'sweetalert2';
import api from '../api';

export default function Login() {
  // กำหนด State ของฟอร์มกรอกข้อมูลเข้าสู่ระบบ
  const [formData, setFormData] = useState({
    username: '',
    password: '',
  });

  // State สำหรับควบคุมการเปิด-ปิดตาดูรหัสผ่าน
  const [showPassword, setShowPassword] = useState(false);
  
  // State สำหรับควบคุมปุ่มกดขณะกำลังยิง API
  const [isLoading, setIsLoading] = useState(false);

  // ดักจับการกรอกข้อมูลในอินพุต
  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  // ตรวจสอบความถูกต้องเบื้องต้น (Validation)
  const validateForm = () => {
    const { username, password } = formData;

    if (!username.trim() || !password) {
      Swal.fire({
        icon: 'warning',
        title: 'กรุณากรอกข้อมูลให้ครบ',
        text: 'โปรดกรอกทั้งชื่อผู้ใช้และรหัสผ่านก่อนเข้าสู่ระบบ',
        confirmButtonColor: '#10b981',
      });
      return false;
    }
    return true;
  };

  // ฟังก์ชันส่งฟอร์มเข้าสู่ระบบ (Submit Handle)
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) return;

    setIsLoading(true);

    try {
      // ส่งคำขอเข้าสู่ระบบไปยังเซิร์ฟเวอร์หลังบ้าน
      const response = await api.post('/auth/login', {
        username: formData.username.trim(),
        password: formData.password,
      });

      // เก็บรหัส Token และข้อมูล User ลงในเครื่อง (LocalStorage)
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));

      // แสดงการแจ้งเตือนความสำเร็จ
      Swal.fire({
        icon: 'success',
        title: 'เข้าสู่ระบบสำเร็จ!',
        text: `ยินดีต้อนรับคุณ ${response.data.user.username} เข้าสู่ระบบจองสนาม`,
        confirmButtonColor: '#10b981',
      }).then(() => {
        // ใช้การเปลี่ยน URL โดยตรงเพื่อให้ทั้งเว็บรีเฟรชและ Navbar ดึงค่าล็อกอินใหม่ทันที
        window.location.href = '/';
      });

    } catch (error) {
      // เมื่อเกิดข้อผิดพลาดในการล็อกอิน ดึงข้อความจริงจากหลังบ้านมาโชว์
      const errorMessage = error.response?.data?.message || 'ชื่อผู้ใช้งานหรือรหัสผ่านไม่ถูกต้อง กรุณาลองใหม่อีกครั้ง';
      Swal.fire({
        icon: 'error',
        title: 'เข้าสู่ระบบไม่สำเร็จ',
        text: errorMessage,
        confirmButtonColor: '#ef4444',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="auth-page-container">
      <div className="auth-card">
        {/* หัวข้อของการ์ดเข้าสู่ระบบ */}
        <div className="auth-header">
          <h2>เข้าสู่ระบบ</h2>
          <p>เข้าใช้งานเพื่อตรวจสอบสนามว่างและบันทึกประวัติการจองของคุณ</p>
        </div>

        {/* ฟอร์มกรอกข้อมูล */}
        <form onSubmit={handleSubmit} className="auth-form">
          {/* ช่องที่ 1: Username */}
          <div className="form-group">
            <label htmlFor="username">ชื่อผู้ใช้งาน</label>
            <div className="input-wrapper">
              <User className="input-icon" size={18} />
              <input
                type="text"
                id="username"
                name="username"
                placeholder="กรอกชื่อผู้ใช้ของคุณ"
                value={formData.username}
                onChange={handleChange}
                disabled={isLoading}
              />
            </div>
          </div>

          {/* ช่องที่ 2: Password */}
          <div className="form-group">
            <label htmlFor="password">รหัสผ่าน</label>
            <div className="input-wrapper">
              <Lock className="input-icon" size={18} />
              <input
                type={showPassword ? 'text' : 'password'}
                id="password"
                name="password"
                placeholder="กรอกรหัสผ่านของคุณ"
                value={formData.password}
                onChange={handleChange}
                disabled={isLoading}
              />
              <button
                type="button"
                className="btn-toggle-eye"
                onClick={() => setShowPassword(!showPassword)}
                disabled={isLoading}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          {/* ปุ่มส่งข้อมูลเข้าสู่ระบบ */}
          <button
            type="submit"
            className="btn btn-primary btn-auth-submit"
            disabled={isLoading}
          >
            {isLoading ? (
              <span>กำลังตรวจสอบสิทธิ์...</span>
            ) : (
              <>
                <span>เข้าสู่ระบบ</span>
                <ArrowRight size={18} />
              </>
            )}
          </button>
        </form>

        {/* เส้นแบ่งลิงก์สลับหน้าไปสมัครสมาชิก */}
        <div className="auth-footer">
          <p>
            ยังไม่มีบัญชีผู้ใช้งานใช่ไหม?{' '}
            <Link to="/register" className="auth-link">
              สมัครสมาชิกใหม่ได้ที่นี่
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
