import React, { useEffect, useState, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/authContextStore';
import { User, Lock, Eye, EyeOff } from 'lucide-react';
import AlertModal from '../../components/common/AlertModal';

const LoginPage = () => {
  const { login, completeLogin } = useAuth();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    username: '',
    password: '',
  });

  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [alert, setAlert] = useState({ isOpen: false, type: 'info', title: '', message: '', onClose: null });

  const usernameRef = useRef(null);
  const passwordRef = useRef(null);

  const showAlert = (type, title, message, onClose = null) => setAlert({ isOpen: true, type, title, message, onClose });
  const closeAlert = () => {
    const nextAction = alert.onClose;
    setAlert((current) => ({ ...current, isOpen: false, onClose: null }));
    nextAction?.();
  };

  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    if (searchParams.get('reason') === 'session-expired') {
      setAlert({ isOpen: true, type: 'warning', title: 'เซสชันหมดอายุ', message: 'กรุณาเข้าสู่ระบบใหม่', onClose: null });
    }
  }, []);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    let newValue = value;

    if (name === 'username') {
      // บล็อคภาษาไทย สเปคบาร์ และอักขระพิเศษ (อนุญาตเฉพาะ a-z, A-Z, 0-9)
      newValue = value.replace(/[^a-zA-Z0-9]/g, '');
    } else if (name === 'password') {
      // บล็อคภาษาไทย และ สเปคบาร์ (อนุญาตเฉพาะตัวอักษรภาษาอังกฤษ ตัวเลข และสัญลักษณ์)
      newValue = value.replace(/[\u0E00-\u0E7F\s]/g, '');
    }

    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : newValue,
    }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: false }));
    }
  };

  const handleKeyDownNoSpace = (e) => {
    if (e.key === ' ') {
      e.preventDefault();
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrors({});

    const cleanUsername = formData.username.trim();

    // 1. เช็คเฉพาะการกรอกข้อมูลไม่ครบถ้วน (ตามหลัก Cyber Security ห้ามระบุรายละเอียดความยาวหรือฝั่งที่ผิด)
    if (!cleanUsername || !formData.password) {
      setErrors({ username: !cleanUsername, password: !formData.password });
      if (!cleanUsername) usernameRef.current?.focus();
      else passwordRef.current?.focus();
      showAlert('error', 'ข้อมูลไม่ครบถ้วน', 'กรุณากรอกชื่อผู้ใช้และรหัสผ่าน');
      return;
    }

    setLoading(true);
    try {
      const result = await login(cleanUsername, formData.password);
      const returnTo = sessionStorage.getItem('auth:returnTo');
      const safeReturnTo = returnTo?.startsWith('/') && !returnTo.startsWith('//') ? returnTo : null;
      sessionStorage.removeItem('auth:returnTo');

      const destination = safeReturnTo || (result.user?.role === 'admin' ? '/admin' : '/');
      showAlert('success', 'เข้าสู่ระบบสำเร็จ', result.message || 'เข้าสู่ระบบสำเร็จ!', () => {
        completeLogin(result);
        navigate(destination, { replace: true });
      });
    } catch {
      setErrors({ username: true, password: true });
      usernameRef.current?.focus();
      showAlert('error', 'เข้าสู่ระบบไม่สำเร็จ', 'ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center py-4 px-4 sm:px-6">
      <AlertModal isOpen={alert.isOpen} type={alert.type} title={alert.title} message={alert.message} onClose={closeAlert} />
      <div className="max-w-sm sm:max-w-md w-full bg-white rounded-2xl p-5 sm:p-6 shadow-md border border-gray-100 text-center relative overflow-hidden my-2">
        
        {/* 1. โลโก้แบรนด์ด้านบน */}
        <div className="flex justify-center mb-2">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 sm:w-9 sm:h-9 bg-[#0B5D2D] rounded-xl flex items-center justify-center text-white shadow-xs">
              <svg className="w-4 h-4 sm:w-5 sm:h-5 stroke-current" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 2L21 7V17L12 22L3 17V7L12 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <circle cx="12" cy="12" r="3.5" stroke="currentColor" strokeWidth="1.8"/>
              </svg>
            </div>
            <span className="text-xl sm:text-2xl font-bold tracking-tight text-gray-900 font-['Kanit',sans-serif]">
              SPORT <span className="text-[#0B5D2D]">COMPLEX</span>
            </span>
          </div>
        </div>

        {/* 2. หัวข้อและคำอธิบาย */}
        <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-1 font-['Kanit',sans-serif]">
          เข้าสู่ระบบ
        </h2>
        <p className="text-gray-500 text-xs sm:text-sm mb-4 font-['Kanit',sans-serif]">
          เข้าสู่ระบบเพื่อจองสนามได้อย่างง่ายดาย
        </p>

        {/* 3. ฟอร์มเข้าสู่ระบบ */}
        <form onSubmit={handleSubmit} noValidate className="space-y-3.5 text-left">
          
          {/* ช่อง 1: ชื่อผู้ใช้ (Username) */}
          <div>
            <label className={`block text-xs sm:text-sm font-semibold mb-1 font-['Kanit',sans-serif] ${errors.username ? 'text-red-600' : 'text-gray-800'}`}>
              ชื่อผู้ใช้ (Username)
            </label>
            <div className="relative">
              <div className={`absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none ${errors.username ? 'text-red-500' : 'text-gray-400'}`}>
                <User className="w-4 h-4" />
              </div>
              <input
                ref={usernameRef}
                type="text"
                name="username"
                value={formData.username}
                onChange={handleChange}
                onKeyDown={handleKeyDownNoSpace}
                maxLength={30}
                placeholder="กรอกชื่อผู้ใช้"
                className={`w-full pl-9 pr-3 py-2 bg-white border rounded-lg text-sm focus:outline-none transition-all font-['Kanit',sans-serif] ${
                  errors.username
                    ? 'border-red-500 ring-2 ring-red-500/20 text-red-900 placeholder-red-300'
                    : 'border-gray-200 text-gray-900 placeholder-gray-400 focus:border-[#0B5D2D] focus:ring-2 focus:ring-[#0B5D2D]/20'
                }`}
              />
            </div>
          </div>

          {/* ช่อง 2: รหัสผ่าน */}
          <div>
            <label className={`block text-xs sm:text-sm font-semibold mb-1 font-['Kanit',sans-serif] ${errors.password ? 'text-red-600' : 'text-gray-800'}`}>
              รหัสผ่าน
            </label>
            <div className="relative">
              <div className={`absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none ${errors.password ? 'text-red-500' : 'text-gray-400'}`}>
                <Lock className="w-4 h-4" />
              </div>
              <input
                ref={passwordRef}
                type={showPassword ? 'text' : 'password'}
                name="password"
                value={formData.password}
                onChange={handleChange}
                onKeyDown={handleKeyDownNoSpace}
                maxLength={30}
                placeholder="กรอกรหัสผ่าน"
                className={`w-full pl-9 pr-9 py-2 bg-white border rounded-lg text-sm focus:outline-none transition-all font-['Kanit',sans-serif] ${
                  errors.password
                    ? 'border-red-500 ring-2 ring-red-500/20 text-red-900 placeholder-red-300'
                    : 'border-gray-200 text-gray-900 placeholder-gray-400 focus:border-[#0B5D2D] focus:ring-2 focus:ring-[#0B5D2D]/20'
                }`}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 cursor-pointer"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* ลิงก์ลืมรหัสผ่าน */}
          <div className="flex justify-end text-xs sm:text-sm pt-0.5">
            <a href="#" onClick={(e) => { e.preventDefault(); showAlert('info', 'ยังไม่เปิดให้ใช้งาน', 'ฟังก์ชันลืมรหัสผ่านอยู่ในระหว่างพัฒนา'); }} className="text-[#0B5D2D] font-semibold hover:underline font-['Kanit',sans-serif]">
              ลืมรหัสผ่าน?
            </a>
          </div>

          {/* ปุ่มกดหลัก: เข้าสู่ระบบ */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#0B5D2D] hover:bg-[#064E26] text-white font-semibold py-2.5 px-4 rounded-lg shadow-sm hover:shadow-md transition-all duration-200 flex items-center justify-center gap-2 text-sm sm:text-base cursor-pointer disabled:opacity-70 disabled:cursor-not-allowed mt-2"
          >
            {loading ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <span>เข้าสู่ระบบ</span>
            )}
          </button>
        </form>

        {/* 4. เส้นแบ่ง Social Login */}
        <div className="relative my-3.5">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-200"></div>
          </div>
          <div className="relative flex justify-center text-xs sm:text-sm">
            <span className="px-2.5 bg-white text-gray-500 font-medium font-['Kanit',sans-serif]">
              หรือเข้าสู่ระบบด้วย
            </span>
          </div>
        </div>

        {/* ปุ่ม Social Login (Google & Facebook) */}
        <div className="grid grid-cols-2 gap-2.5">
          <button
            type="button"
            onClick={() => showAlert('info', 'ยังไม่เปิดให้ใช้งาน', 'ระบบเข้าสู่ระบบด้วย Google อยู่ระหว่างพัฒนา')}
            className="flex items-center justify-center gap-2 py-2 px-3 border border-gray-200 rounded-lg hover:bg-gray-50 text-xs sm:text-sm font-semibold text-gray-700 transition-all cursor-pointer font-['Kanit',sans-serif]"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
            </svg>
            Google
          </button>
          <button
            type="button"
            onClick={() => showAlert('info', 'ยังไม่เปิดให้ใช้งาน', 'ระบบเข้าสู่ระบบด้วย Facebook อยู่ระหว่างพัฒนา')}
            className="flex items-center justify-center gap-2 py-2 px-3 border border-gray-200 rounded-lg hover:bg-gray-50 text-xs sm:text-sm font-semibold text-gray-700 transition-all cursor-pointer font-['Kanit',sans-serif]"
          >
            <svg className="w-4 h-4 fill-[#1877F2]" viewBox="0 0 24 24">
              <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
            </svg>
            Facebook
          </button>
        </div>

        {/* 5. ลิงก์ด้านล่างไปสมัครสมาชิก */}
        <div className="mt-5 pt-4 border-t border-gray-100 text-center text-xs sm:text-sm font-['Kanit',sans-serif]">
          <span className="text-gray-500 font-medium">ยังไม่มีบัญชี? </span>
          <Link
            to="/register"
            className="text-[#0B5D2D] hover:text-[#064E26] font-bold transition-all inline-flex items-center gap-1 group ml-1"
          >
            <span>สมัครสมาชิก</span>
            <span className="text-xs group-hover:translate-x-0.5 transition-transform">➔</span>
          </Link>
        </div>

      </div>
    </div>
  );
};

export default LoginPage;
