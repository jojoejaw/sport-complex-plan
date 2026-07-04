import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { User, Mail, Lock, Eye, EyeOff, ArrowRight } from 'lucide-react';
import Swal from 'sweetalert2';
import api from '../api';

export default function Register() {
  const navigate = useNavigate();

  // กำหนด State ของฟอร์มกรอกข้อมูล
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
  });

  // State สำหรับควบคุมการเปิด-ปิดตาดูรหัสผ่าน
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  // State สำหรับควบคุมปุ่มกดในขณะที่กำลังดาวน์โหลดข้อมูล (Loading)
  const [isLoading, setIsLoading] = useState(false);

  // ดักจับการแก้ไขอินพุตและบันทึกลงใน State
  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  // ตรวจสอบความถูกต้องฝั่งหน้าบ้าน (Client-Side validation)
  const validateForm = () => {
    const { username, email, password, confirmPassword } = formData;

    if (!username.trim() || !email.trim() || !password || !confirmPassword) {
      Swal.fire({
        icon: 'warning',
        title: 'กรุณากรอกข้อมูลให้ครบถ้วน',
        text: 'โปรดกรอกช่องข้อมูลทุกช่องก่อนทำการสมัครสมาชิก',
        confirmButtonColor: '#10b981',
      });
      return false;
    }

    // เช็คแพทเทิร์น Email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      Swal.fire({
        icon: 'warning',
        title: 'รูปแบบอีเมลไม่ถูกต้อง',
        text: 'กรุณากรอกอีเมลจริง เช่น example@domain.com',
        confirmButtonColor: '#10b981',
      });
      return false;
    }

    if (password.length < 6) {
      Swal.fire({
        icon: 'warning',
        title: 'รหัสผ่านสั้นเกินไป',
        text: 'เพื่อความปลอดภัย รหัสผ่านของคุณควรมีอย่างน้อย 6 ตัวอักษร',
        confirmButtonColor: '#10b981',
      });
      return false;
    }

    if (password !== confirmPassword) {
      Swal.fire({
        icon: 'error',
        title: 'รหัสผ่านไม่ตรงกัน',
        text: 'กรุณาตรวจสอบว่าช่องยืนยันรหัสผ่านกรอกข้อมูลตรงกับรหัสผ่านหลักหรือไม่',
        confirmButtonColor: '#ef4444',
      });
      return false;
    }

    return true;
  };

  // การส่งข้อมูลสมัครสมาชิก (Submit Handle)
  const handleSubmit = async (e) => {
    e.preventDefault();

    // หากตรวจสอบฝั่ง Client แล้วพบว่าไม่ผ่าน ให้หยุดทำงาน
    if (!validateForm()) return;

    setIsLoading(true);

    try {
      // ยิง API ไปหาหลังบ้าน
      const response = await api.post('/auth/register', {
        username: formData.username.trim(),
        email: formData.email.trim(),
        password: formData.password,
      });

      // สมัครสมาชิกสำเร็จ แสดงป๊อปอัพสีเขียวแจ้งผู้ใช้
      Swal.fire({
        icon: 'success',
        title: 'สมัครสมาชิกสำเร็จ!',
        text: response.data.message || 'สร้างบัญชีผู้ใช้งานเรียบร้อยแล้ว ยินดีต้อนรับครับ',
        confirmButtonColor: '#10b981',
      }).then(() => {
        // ย้ายหน้าไปยังหน้าเข้าสู่ระบบ (/login) เพื่อให้ใช้งานต่อ
        navigate('/login');
      });

    } catch (error) {
      // สมัครสมาชิกพัง ดึงสาเหตุจริงจากฝั่งหลังบ้านมาแสดง
      const errorMessage = error.response?.data?.message || 'ไม่สามารถสมัครสมาชิกได้ในขณะนี้ กรุณาลองใหม่อีกครั้ง';
      Swal.fire({
        icon: 'error',
        title: 'สมัครสมาชิกไม่สำเร็จ',
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
        {/* หัวข้อของการ์ด */}
        <div className="auth-header">
          <h2>สมัครสมาชิก</h2>
          <p>เพื่อเริ่มต้นสัมผัสประสบการณ์จองสนามกีฬาระดับพรีเมียม</p>
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
                placeholder="กรอกชื่อผู้ใช้สำหรับล็อกอิน"
                value={formData.username}
                onChange={handleChange}
                disabled={isLoading}
              />
            </div>
          </div>

          {/* ช่องที่ 2: Email */}
          <div className="form-group">
            <label htmlFor="email">อีเมล</label>
            <div className="input-wrapper">
              <Mail className="input-icon" size={18} />
              <input
                type="email"
                id="email"
                name="email"
                placeholder="กรอกอีเมลสำหรับติดต่อ"
                value={formData.email}
                onChange={handleChange}
                disabled={isLoading}
              />
            </div>
          </div>

          {/* ช่องที่ 3: Password */}
          <div className="form-group">
            <label htmlFor="password">รหัสผ่าน</label>
            <div className="input-wrapper">
              <Lock className="input-icon" size={18} />
              <input
                type={showPassword ? 'text' : 'password'}
                id="password"
                name="password"
                placeholder="ตั้งรหัสผ่านอย่างน้อย 6 ตัวอักษร"
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

          {/* ช่องที่ 4: Confirm Password */}
          <div className="form-group">
            <label htmlFor="confirmPassword">ยืนยันรหัสผ่านอีกครั้ง</label>
            <div className="input-wrapper">
              <Lock className="input-icon" size={18} />
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                id="confirmPassword"
                name="confirmPassword"
                placeholder="กรอกรหัสผ่านให้ตรงกัน"
                value={formData.confirmPassword}
                onChange={handleChange}
                disabled={isLoading}
              />
              <button
                type="button"
                className="btn-toggle-eye"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                disabled={isLoading}
              >
                {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          {/* ปุ่มส่งฟอร์ม */}
          <button
            type="submit"
            className="btn btn-primary btn-auth-submit"
            disabled={isLoading}
          >
            {isLoading ? (
              <span>กำลังส่งข้อมูล...</span>
            ) : (
              <>
                <span>สร้างบัญชีผู้ใช้</span>
                <ArrowRight size={18} />
              </>
            )}
          </button>
        </form>

        {/* เส้นแบ่งลิงก์สลับหน้าไป Login */}
        <div className="auth-footer">
          <p>
            มีบัญชีผู้ใช้งานอยู่แล้วใช่ไหม?{' '}
            <Link to="/login" className="auth-link">
              เข้าสู่ระบบที่นี่
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
