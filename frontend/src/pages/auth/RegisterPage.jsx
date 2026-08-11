import React, { useState, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { User, Mail, Lock, Eye, EyeOff } from 'lucide-react';
import AlertModal from '../../components/common/AlertModal';

const RegisterPage = () => {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    agreeTerms: false,
  });

  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [alert, setAlert] = useState({ isOpen: false, type: 'info', title: '', message: '', onClose: null });

  const usernameRef = useRef(null);
  const emailRef = useRef(null);
  const passwordRef = useRef(null);
  const confirmPasswordRef = useRef(null);

  const showAlert = (type, title, message, onClose = null) => setAlert({ isOpen: true, type, title, message, onClose });
  const closeAlert = () => {
    const nextAction = alert.onClose;
    setAlert((current) => ({ ...current, isOpen: false, onClose: null }));
    nextAction?.();
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    let newValue = value;

    if (name === 'username') {
      // บล็อคภาษาไทย สเปคบาร์ และอักขระพิเศษ (อนุญาตเฉพาะ a-z, A-Z, 0-9)
      newValue = value.replace(/[^a-zA-Z0-9]/g, '');
    } else if (name === 'email') {
      // บล็อคภาษาไทย และสเปคบาร์ (ตัดช่องว่างออกทันที)
      newValue = value.replace(/[\u0E00-\u0E7F\s]/g, '');
    } else if (name === 'password' || name === 'confirmPassword') {
      // บล็อคภาษาไทย และสเปคบาร์ (ตัดช่องว่างออกทันที)
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

    const newErrors = {};
    if (!formData.username) newErrors.username = true;
    if (!formData.email) newErrors.email = true;
    if (!formData.password) newErrors.password = true;
    if (!formData.confirmPassword) newErrors.confirmPassword = true;

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      showAlert('error', 'ข้อมูลไม่ครบ', 'กรุณากรอกข้อมูลให้ครบทุกช่อง');
      if (newErrors.username) usernameRef.current?.focus();
      else if (newErrors.email) emailRef.current?.focus();
      else if (newErrors.password) passwordRef.current?.focus();
      else if (newErrors.confirmPassword) confirmPasswordRef.current?.focus();
      return;
    }

    const cleanUsername = formData.username.trim();
    const cleanEmail = formData.email.trim().toLowerCase();

    // 1. ตรวจสอบชื่อผู้ใช้ (Username)
    if (cleanUsername.length < 5) {
      setErrors({ username: true });
      usernameRef.current?.focus();
      showAlert('error', 'ชื่อผู้ใช้ไม่ถูกต้อง', 'ชื่อผู้ใช้ต้องมีความยาวอย่างน้อย 5 ตัวอักษร');
      return;
    }
    if (cleanUsername.length > 30) {
      setErrors({ username: true });
      usernameRef.current?.focus();
      showAlert('error', 'ชื่อผู้ใช้ไม่ถูกต้อง', 'ชื่อผู้ใช้ต้องไม่เกิน 30 ตัวอักษร');
      return;
    }
    if (!/^[a-zA-Z0-9]+$/.test(cleanUsername)) {
      setErrors({ username: true });
      usernameRef.current?.focus();
      showAlert('error', 'ชื่อผู้ใช้ไม่ถูกต้อง', 'ชื่อผู้ใช้งานต้องเป็นตัวอักษรภาษาอังกฤษหรือตัวเลขเท่านั้น');
      return;
    }

    // 2. ตรวจสอบรูปแบบอีเมลและความยาว (จำกัดไม่เกิน 50 ตัวอักษร)
    if (cleanEmail.length > 50) {
      setErrors({ email: true });
      emailRef.current?.focus();
      showAlert('error', 'อีเมลไม่ถูกต้อง', 'ความยาวอีเมลต้องไม่เกิน 50 ตัวอักษร');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(cleanEmail)) {
      setErrors({ email: true });
      emailRef.current?.focus();
      showAlert('error', 'อีเมลไม่ถูกต้อง', 'รูปแบบอีเมลไม่ถูกต้อง ');
      return;
    }

    // 3. ตรวจสอบรหัสผ่านและยืนยันรหัสผ่าน
    if (formData.password !== formData.confirmPassword) {
      setErrors({ password: true, confirmPassword: true });
      passwordRef.current?.focus();
      showAlert('error', 'รหัสผ่านไม่ตรงกัน', 'รหัสผ่านและยืนยันรหัสผ่านไม่ตรงกัน');
      return;
    }

    // 4. ตรวจสอบรหัสผ่านทีละข้อกำหนด (ความยาว, พิมพ์ใหญ่, พิมพ์เล็ก, ตัวเลข)
    if (formData.password.length < 6) {
      setErrors({ password: true });
      passwordRef.current?.focus();
      showAlert('error', 'รหัสผ่านไม่ถูกต้อง', 'รหัสผ่านต้องมีความยาวอย่างน้อย 6 ตัวอักษร');
      return;
    }
    if (formData.password.length > 30) {
      setErrors({ password: true });
      passwordRef.current?.focus();
      showAlert('error', 'รหัสผ่านไม่ถูกต้อง', 'รหัสผ่านต้องไม่เกิน 30 ตัวอักษร');
      return;
    }
    if (!/[A-Z]/.test(formData.password)) {
      setErrors({ password: true });
      passwordRef.current?.focus();
      showAlert('error', 'รหัสผ่านไม่ถูกต้อง', 'รหัสผ่านต้องประกรอบด้วย(A-Z, a-z)');
      return;
    }
    if (!/[a-z]/.test(formData.password)) {
      setErrors({ password: true });
      passwordRef.current?.focus();
      showAlert('error', 'รหัสผ่านไม่ถูกต้อง', 'รหัสผ่านต้องมีตัวพิมพ์เล็ก (a-z) อย่างน้อย 1 ตัว');
      return;
    }
    if (!/\d/.test(formData.password)) {
      setErrors({ password: true });
      passwordRef.current?.focus();
      showAlert('error', 'รหัสผ่านไม่ถูกต้อง', 'รหัสผ่านต้องมีตัวเลข (0-9)');
      return;
    }

    if (!formData.agreeTerms) {
      setErrors({ agreeTerms: true });
      showAlert('warning', 'กรุณายอมรับเงื่อนไข', 'กรุณากดยอมรับเงื่อนไขการใช้ยริการ');
      return;
    }

    setLoading(true);
    try {
      const result = await register(cleanUsername, cleanEmail, formData.password);
      showAlert('success', 'สมัครสมาชิกสำเร็จ', result.message || 'สมัครสมาชิกสำเร็จแล้ว!', () => navigate('/login'));
    } catch (error) {
      const errorMsg = error.response?.data?.message || 'เกิดข้อผิดพลาดในการสมัครสมาชิก';
      showAlert('error', 'สมัครสมาชิกไม่สำเร็จ', errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center py-4 px-4 sm:px-6">
      <AlertModal isOpen={alert.isOpen} type={alert.type} title={alert.title} message={alert.message} onClose={closeAlert} />
      <div className="max-w-sm sm:max-w-md w-full bg-white rounded-2xl p-5 sm:p-6 shadow-md border border-gray-100 text-center relative overflow-hidden my-2">

        {/* 1. โลโก้แบรนด์ด้านบน ( Hexagon Logo ) */}
        <div className="flex justify-center mb-2">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 sm:w-9 sm:h-9 bg-[#0B5D2D] rounded-xl flex items-center justify-center text-white shadow-xs">
              <svg className="w-4 h-4 sm:w-5 sm:h-5 stroke-current" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 2L21 7V17L12 22L3 17V7L12 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                <circle cx="12" cy="12" r="3.5" stroke="currentColor" strokeWidth="1.8" />
              </svg>
            </div>
            <span className="text-xl sm:text-2xl font-bold tracking-tight text-gray-900 font-['Kanit',sans-serif]">
              SPORT <span className="text-[#0B5D2D]">COMPLEX</span>
            </span>
          </div>
        </div>

        {/* 2. หัวข้อและคำอธิบาย */}
        <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-1 font-['Kanit',sans-serif]">
          สมัครสมาชิก
        </h2>
        <p className="text-gray-500 text-xs sm:text-sm mb-4 font-['Kanit',sans-serif]">
          สร้างบัญชีเพื่อใช้งาน SPORT COMPLEX
        </p>

        {/* 3. ฟอร์มสมัครสมาชิก */}
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
                placeholder="username"
                className={`w-full pl-9 pr-3 py-2 bg-white border rounded-lg text-sm focus:outline-none transition-all font-['Kanit',sans-serif] ${errors.username
                  ? 'border-red-500 ring-2 ring-red-500/20 text-red-900 placeholder-red-300'
                  : 'border-gray-200 text-gray-900 placeholder-gray-400 focus:border-[#0B5D2D] focus:ring-2 focus:ring-[#0B5D2D]/20'
                  }`}
              />
            </div>
          </div>

          {/* ช่อง 2: อีเมล (E-mail) */}
          <div>
            <label className={`block text-xs sm:text-sm font-semibold mb-1 font-['Kanit',sans-serif] ${errors.email ? 'text-red-600' : 'text-gray-800'}`}>
              อีเมล (E-mail)
            </label>
            <div className="relative">
              <div className={`absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none ${errors.email ? 'text-red-500' : 'text-gray-400'}`}>
                <Mail className="w-4 h-4" />
              </div>
              <input
                ref={emailRef}
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                onKeyDown={handleKeyDownNoSpace}
                maxLength={50}
                placeholder="e-mail"
                className={`w-full pl-9 pr-3 py-2 bg-white border rounded-lg text-sm focus:outline-none transition-all font-['Kanit',sans-serif] ${errors.email
                  ? 'border-red-500 ring-2 ring-red-500/20 text-red-900 placeholder-red-300'
                  : 'border-gray-200 text-gray-900 placeholder-gray-400 focus:border-[#0B5D2D] focus:ring-2 focus:ring-[#0B5D2D]/20'
                  }`}
              />
            </div>
          </div>

          {/* ช่อง 3: รหัสผ่าน (Password) */}
          <div>
            <label className={`block text-xs sm:text-sm font-semibold mb-1 font-['Kanit',sans-serif] ${errors.password ? 'text-red-600' : 'text-gray-800'}`}>
              รหัสผ่าน (Password)
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
                placeholder="password"
                className={`w-full pl-9 pr-9 py-2 bg-white border rounded-lg text-sm focus:outline-none transition-all font-['Kanit',sans-serif] ${errors.password
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

          {/* ช่อง 4: ยืนยันรหัสผ่าน (Confirm Password) */}
          <div>
            <label className={`block text-xs sm:text-sm font-semibold mb-1 font-['Kanit',sans-serif] ${errors.confirmPassword ? 'text-red-600' : 'text-gray-800'}`}>
              ยืนยันรหัสผ่าน (Confirm Password)
            </label>
            <div className="relative">
              <div className={`absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none ${errors.confirmPassword ? 'text-red-500' : 'text-gray-400'}`}>
                <Lock className="w-4 h-4" />
              </div>
              <input
                ref={confirmPasswordRef}
                type={showConfirmPassword ? 'text' : 'password'}
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                onKeyDown={handleKeyDownNoSpace}
                maxLength={30}
                placeholder="confirm password"
                className={`w-full pl-9 pr-9 py-2 bg-white border rounded-lg text-sm focus:outline-none transition-all font-['Kanit',sans-serif] ${errors.confirmPassword
                  ? 'border-red-500 ring-2 ring-red-500/20 text-red-900 placeholder-red-300'
                  : 'border-gray-200 text-gray-900 placeholder-gray-400 focus:border-[#0B5D2D] focus:ring-2 focus:ring-[#0B5D2D]/20'
                  }`}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 cursor-pointer"
              >
                {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Checkbox ยอมรับเงื่อนไข */}
          <div className="pt-0.5">
            <label className="flex items-start gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                name="agreeTerms"
                checked={formData.agreeTerms}
                onChange={handleChange}
                className={`w-3.5 h-3.5 mt-0.5 border-gray-300 rounded ${errors.agreeTerms ? 'accent-red-500 ring-2 ring-red-500/30' : 'text-[#0B5D2D] focus:ring-[#0B5D2D]'}`}
              />
              <span className={`text-xs sm:text-sm font-['Kanit',sans-serif] leading-tight ${errors.agreeTerms ? 'text-red-600 font-medium' : 'text-gray-600'}`}>
                ฉันยอมรับ <a href="#" onClick={(e) => e.preventDefault()} className="text-[#0B5D2D] font-semibold hover:underline">เงื่อนไขการใช้งาน</a> และ <a href="#" onClick={(e) => e.preventDefault()} className="text-[#0B5D2D] font-semibold hover:underline">นโยบายความเป็นส่วนตัว</a>
              </span>
            </label>
          </div>

          {/* ปุ่มกดหลัก: ยืนยันการสมัครสมาชิก */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#0B5D2D] hover:bg-[#064E26] text-white font-semibold py-2.5 px-4 rounded-lg shadow-sm hover:shadow-md transition-all duration-200 flex items-center justify-center gap-2 text-sm sm:text-base cursor-pointer disabled:opacity-70 disabled:cursor-not-allowed mt-2"
          >
            {loading ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <span>ยืนยันการสมัครสมาชิก</span>
            )}
          </button>
        </form>

        {/* 4. เส้นแบ่งและลิงก์ไปยังหน้าเข้าสู่ระบบ */}
        <div className="mt-5 pt-4 border-t border-gray-100 text-center text-xs sm:text-sm font-['Kanit',sans-serif]">
          <span className="text-gray-500 font-medium">มีบัญชีอยู่แล้ว? </span>
          <Link
            to="/login"
            className="text-[#0B5D2D] hover:text-[#064E26] font-bold transition-all inline-flex items-center gap-1 group ml-1"
          >
            <span>เข้าสู่ระบบ</span>
            <span className="text-xs group-hover:translate-x-0.5 transition-transform">➔</span>
          </Link>
        </div>

      </div>
    </div>
  );
};

export default RegisterPage;
