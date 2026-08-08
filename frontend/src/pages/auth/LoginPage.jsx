import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Mail, Lock, Eye, EyeOff, LogIn } from 'lucide-react';
import toast from 'react-hot-toast';

const LoginPage = () => {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    username: '',
    password: '',
    rememberMe: false,
  });

  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.username || !formData.password) {
      toast.error('กรุณากรอกชื่อผู้ใช้/อีเมล และรหัสผ่าน');
      return;
    }

    setLoading(true);
    try {
      const result = await login(formData.username, formData.password);
      toast.success(result.message || 'เข้าสู่ระบบสำเร็จ!');
      
      // นำทางตามบทบาท (Role)
      if (result.user?.role === 'admin') {
        navigate('/admin');
      } else {
        navigate('/');
      }
    } catch (error) {
      const errorMsg = error.response?.data?.message || 'เกิดข้อผิดพลาดในการเข้าสู่ระบบ';
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full bg-white rounded-3xl p-8 sm:p-10 shadow-lg border border-gray-100 text-center relative overflow-hidden">
        
        {/* 1. โลโก้แบรนด์ด้านบน ( Hexagon Logo ) */}
        <div className="flex justify-center mb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-12 h-12 bg-[#0B5D2D] rounded-2xl flex items-center justify-center text-white shadow-md">
              <svg className="w-7 h-7 stroke-current" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 2L21 7V17L12 22L3 17V7L12 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <circle cx="12" cy="12" r="3.5" stroke="currentColor" strokeWidth="1.8"/>
              </svg>
            </div>
            <span className="text-2xl font-bold tracking-tight text-gray-900 font-['Kanit',sans-serif]">
              SPORT <span className="text-[#0B5D2D]">COMPLEX</span>
            </span>
          </div>
        </div>

        {/* 2. หัวข้อและคำอธิบาย (ตรงตามภาพ Page-Login.png) */}
        <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-1 font-['Kanit',sans-serif]">
          เข้าสู่ระบบ
        </h2>
        <p className="text-gray-500 text-sm mb-8 font-['Kanit',sans-serif]">
          เข้าสู่ระบบเพื่อจองสนามได้อย่างง่ายดาย
        </p>

        {/* 3. ฟอร์มเข้าสู่ระบบ */}
        <form onSubmit={handleSubmit} className="space-y-5 text-left">
          
          {/* ช่อง 1: อีเมลหรือชื่อผู้ใช้ */}
          <div>
            <label className="block text-sm font-semibold text-gray-800 mb-1.5 font-['Kanit',sans-serif]">
              อีเมลหรือชื่อผู้ใช้
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                <Mail className="w-5 h-5" />
              </div>
              <input
                type="text"
                name="username"
                value={formData.username}
                onChange={handleChange}
                placeholder="กรอกอีเมลหรือชื่อผู้ใช้"
                className="w-full pl-11 pr-4 py-3 bg-white border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 text-sm focus:outline-none focus:border-[#0B5D2D] focus:ring-2 focus:ring-[#0B5D2D]/20 transition-all font-['Kanit',sans-serif]"
                required
              />
            </div>
          </div>

          {/* ช่อง 2: รหัสผ่าน */}
          <div>
            <label className="block text-sm font-semibold text-gray-800 mb-1.5 font-['Kanit',sans-serif]">
              รหัสผ่าน
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                <Lock className="w-5 h-5" />
              </div>
              <input
                type={showPassword ? 'text' : 'password'}
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="กรอกรหัสผ่าน"
                className="w-full pl-11 pr-11 py-3 bg-white border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 text-sm focus:outline-none focus:border-[#0B5D2D] focus:ring-2 focus:ring-[#0B5D2D]/20 transition-all font-['Kanit',sans-serif]"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-gray-400 hover:text-gray-600 cursor-pointer"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          {/* แถบ Checkbox จำฉันไว้ในระบบ & ลืมรหัสผ่าน */}
          <div className="flex items-center justify-between text-sm pt-1">
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                name="rememberMe"
                checked={formData.rememberMe}
                onChange={handleChange}
                className="w-4 h-4 text-[#0B5D2D] border-gray-300 rounded-xs focus:ring-[#0B5D2D]"
              />
              <span className="text-gray-600 font-medium font-['Kanit',sans-serif]">จำฉันไว้ในระบบ</span>
            </label>
            <a href="#" onClick={(e) => { e.preventDefault(); toast('ฟังก์ชันลืมรหัสผ่านอยู่ในระหว่างพัฒนา'); }} className="text-[#0B5D2D] font-semibold hover:underline font-['Kanit',sans-serif]">
              ลืมรหัสผ่าน?
            </a>
          </div>

          {/* ปุ่มกดหลัก: เข้าสู่ระบบ ( Primary Green Button #0B5D2D ) */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#0B5D2D] hover:bg-[#064E26] text-white font-semibold py-3.5 px-4 rounded-xl shadow-md hover:shadow-lg transition-all duration-200 flex items-center justify-center gap-2 text-base cursor-pointer disabled:opacity-70 disabled:cursor-not-allowed mt-2"
          >
            {loading ? (
              <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <span>เข้าสู่ระบบ</span>
              </>
            )}
          </button>
        </form>

        {/* 4. เส้นแบ่ง Social Login (ตรงตามภาพ Page-Login.png) */}
        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-200"></div>
          </div>
          <div className="relative flex justify-center text-xs">
            <span className="px-3 bg-white text-gray-500 font-medium font-['Kanit',sans-serif]">
              หรือเข้าสู่ระบบด้วย
            </span>
          </div>
        </div>

        {/* ปุ่ม Social Login (Google & Facebook) */}
        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => toast('ระบบเข้าสู่ระบบด้วย Google อยู่ระหว่างพัฒนา')}
            className="flex items-center justify-center gap-2 py-2.5 px-4 border border-gray-200 rounded-xl hover:bg-gray-50 text-sm font-semibold text-gray-700 transition-all cursor-pointer font-['Kanit',sans-serif]"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
            </svg>
            Google
          </button>
          <button
            type="button"
            onClick={() => toast('ระบบเข้าสู่ระบบด้วย Facebook อยู่ระหว่างพัฒนา')}
            className="flex items-center justify-center gap-2 py-2.5 px-4 border border-gray-200 rounded-xl hover:bg-gray-50 text-sm font-semibold text-gray-700 transition-all cursor-pointer font-['Kanit',sans-serif]"
          >
            <svg className="w-5 h-5 fill-[#1877F2]" viewBox="0 0 24 24">
              <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
            </svg>
            Facebook
          </button>
        </div>

        {/* 5. ลิงก์ด้านล่างไปสมัครสมาชิก */}
        <div className="mt-8 pt-4 border-t border-gray-100 text-sm text-gray-600 font-['Kanit',sans-serif]">
          ยังไม่มีบัญชี?{' '}
          <Link to="/register" className="text-[#0B5D2D] font-bold hover:underline">
            สมัครสมาชิก
          </Link>
        </div>

      </div>
    </div>
  );
};

export default LoginPage;
