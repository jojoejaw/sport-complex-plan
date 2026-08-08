import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { User, Mail, Lock, Eye, EyeOff, UserPlus } from 'lucide-react';
import toast from 'react-hot-toast';

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

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
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

    // 1. ตรวจสอบความถูกต้องเบื้องต้น (Validation)
    if (!formData.username || !formData.email || !formData.password || !formData.confirmPassword) {
      toast.error('กรุณากรอกข้อมูลให้ครบถ้วนทุกช่อง');
      return;
    }

    if (formData.username.length < 6 || formData.username.length > 30) {
      toast.error('ชื่อผู้ใช้งานต้องมีความยาวระหว่าง 6 ถึง 30 ตัวอักษร');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      toast.error('รหัสผ่านและยืนยันรหัสผ่านไม่ตรงกัน');
      return;
    }

    if (formData.password.length < 6) {
      toast.error('รหัสผ่านต้องมีความยาวอย่างน้อย 6 ตัวอักษร');
      return;
    }

    if (!formData.agreeTerms) {
      toast.error('กรุณากดยอมรับเงื่อนไขการใช้งานและนโยบายความเป็นส่วนตัว');
      return;
    }

    setLoading(true);
    try {
      const result = await register(formData.username, formData.email, formData.password);
      toast.success(result.message || 'สมัครสมาชิกสำเร็จแล้ว!');
      navigate('/login');
    } catch (error) {
      const errorMsg = error.response?.data?.message || 'เกิดข้อผิดพลาดในการสมัครสมาชิก';
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full bg-white rounded-3xl p-8 sm:p-10 shadow-lg border border-gray-100 text-center relative overflow-hidden">
        
        {/* 1. โลโก้แบรนด์ด้านบน ( Hexagon Logo ) */}
        <div className="flex justify-center mb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-11 h-11 bg-[#0B5D2D] rounded-2xl flex items-center justify-center text-white shadow-md">
              <svg className="w-6 h-6 stroke-current" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 2L21 7V17L12 22L3 17V7L12 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <circle cx="12" cy="12" r="3.5" stroke="currentColor" strokeWidth="1.8"/>
              </svg>
            </div>
            <span className="text-2xl font-bold tracking-tight text-gray-900 font-['Kanit',sans-serif]">
              SPORT <span className="text-[#0B5D2D]">COMPLEX</span>
            </span>
          </div>
        </div>

        {/* 2. ไอคอนรูปวงกลมผู้ใช้ (ตรงตามภาพ Page-Register.png) */}
        <div className="w-12 h-12 bg-[#ECFDF5] text-[#0B5D2D] rounded-full flex items-center justify-center mx-auto my-3 border border-[#0B5D2D]/20">
          <User className="w-6 h-6" />
        </div>

        {/* 3. หัวข้อและคำอธิบาย */}
        <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-1 font-['Kanit',sans-serif]">
          สมัครสมาชิก
        </h2>
        <p className="text-gray-500 text-sm mb-6 font-['Kanit',sans-serif]">
          สร้างบัญชีเพื่อใช้งานระบบ SPORT COMPLEX
        </p>

        {/* 4. ฟอร์มสมัครสมาชิก */}
        <form onSubmit={handleSubmit} className="space-y-4 text-left">
          
          {/* ช่อง 1: ชื่อผู้ใช้ (Username) */}
          <div>
            <label className="block text-xs sm:text-sm font-semibold text-gray-800 mb-1 font-['Kanit',sans-serif]">
              ชื่อผู้ใช้ (Username)
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                <User className="w-4 h-4 sm:w-5 sm:h-5" />
              </div>
              <input
                type="text"
                name="username"
                value={formData.username}
                onChange={handleChange}
                placeholder="กรอกชื่อผู้ใช้"
                className="w-full pl-10 pr-4 py-2.5 sm:py-3 bg-white border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 text-sm focus:outline-none focus:border-[#0B5D2D] focus:ring-2 focus:ring-[#0B5D2D]/20 transition-all font-['Kanit',sans-serif]"
                required
              />
            </div>
          </div>

          {/* ช่อง 2: อีเมล (E-mail) */}
          <div>
            <label className="block text-xs sm:text-sm font-semibold text-gray-800 mb-1 font-['Kanit',sans-serif]">
              อีเมล (E-mail)
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                <Mail className="w-4 h-4 sm:w-5 sm:h-5" />
              </div>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="กรอกอีเมลของคุณ"
                className="w-full pl-10 pr-4 py-2.5 sm:py-3 bg-white border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 text-sm focus:outline-none focus:border-[#0B5D2D] focus:ring-2 focus:ring-[#0B5D2D]/20 transition-all font-['Kanit',sans-serif]"
                required
              />
            </div>
          </div>

          {/* ช่อง 3: รหัสผ่าน (Password) */}
          <div>
            <label className="block text-xs sm:text-sm font-semibold text-gray-800 mb-1 font-['Kanit',sans-serif]">
              รหัสผ่าน (Password)
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                <Lock className="w-4 h-4 sm:w-5 sm:h-5" />
              </div>
              <input
                type={showPassword ? 'text' : 'password'}
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="กรอกรหัสผ่าน"
                className="w-full pl-10 pr-10 py-2.5 sm:py-3 bg-white border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 text-sm focus:outline-none focus:border-[#0B5D2D] focus:ring-2 focus:ring-[#0B5D2D]/20 transition-all font-['Kanit',sans-serif]"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-gray-400 hover:text-gray-600 cursor-pointer"
              >
                {showPassword ? <EyeOff className="w-4 h-4 sm:w-5 sm:h-5" /> : <Eye className="w-4 h-4 sm:w-5 sm:h-5" />}
              </button>
            </div>
          </div>

          {/* ช่อง 4: ยืนยันรหัสผ่าน (Confirm Password) */}
          <div>
            <label className="block text-xs sm:text-sm font-semibold text-gray-800 mb-1 font-['Kanit',sans-serif]">
              ยืนยันรหัสผ่าน (Confirm Password)
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                <Lock className="w-4 h-4 sm:w-5 sm:h-5" />
              </div>
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                placeholder="กรอกยืนยันรหัสผ่าน"
                className="w-full pl-10 pr-10 py-2.5 sm:py-3 bg-white border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 text-sm focus:outline-none focus:border-[#0B5D2D] focus:ring-2 focus:ring-[#0B5D2D]/20 transition-all font-['Kanit',sans-serif]"
                required
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-gray-400 hover:text-gray-600 cursor-pointer"
              >
                {showConfirmPassword ? <EyeOff className="w-4 h-4 sm:w-5 sm:h-5" /> : <Eye className="w-4 h-4 sm:w-5 sm:h-5" />}
              </button>
            </div>
          </div>

          {/* Checkbox ยอมรับเงื่อนไข */}
          <div className="pt-1">
            <label className="flex items-start gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                name="agreeTerms"
                checked={formData.agreeTerms}
                onChange={handleChange}
                className="w-4 h-4 mt-0.5 text-[#0B5D2D] border-gray-300 rounded-xs focus:ring-[#0B5D2D]"
              />
              <span className="text-xs sm:text-sm text-gray-600 font-['Kanit',sans-serif] leading-tight">
                ฉันยอมรับ <a href="#" onClick={(e) => e.preventDefault()} className="text-[#0B5D2D] font-semibold hover:underline">เงื่อนไขการใช้งาน</a> และ <a href="#" onClick={(e) => e.preventDefault()} className="text-[#0B5D2D] font-semibold hover:underline">นโยบายความเป็นส่วนตัว</a>
              </span>
            </label>
          </div>

          {/* ปุ่มกดหลัก: ยืนยันการสมัครสมาชิก ( Primary Green Button #0B5D2D ) */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#0B5D2D] hover:bg-[#064E26] text-white font-semibold py-3.5 px-4 rounded-xl shadow-md hover:shadow-lg transition-all duration-200 flex items-center justify-center gap-2 text-base cursor-pointer disabled:opacity-70 disabled:cursor-not-allowed mt-3"
          >
            {loading ? (
              <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <span>ยืนยันการสมัครสมาชิก</span>
            )}
          </button>
        </form>

        {/* 5. เส้นแบ่งและลิงก์ไปยังหน้าเข้าสู่ระบบ (ตรงตามภาพ Page-Register.png) */}
        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-200"></div>
          </div>
          <div className="relative flex justify-center text-xs">
            <span className="px-3 bg-white text-gray-500 font-medium font-['Kanit',sans-serif]">
              มีบัญชีอยู่แล้ว?
            </span>
          </div>
        </div>

        <div className="text-sm font-['Kanit',sans-serif]">
          <Link to="/login" className="text-[#0B5D2D] font-bold hover:underline">
            เข้าสู่ระบบ คลิกที่นี่
          </Link>
        </div>

      </div>
    </div>
  );
};

export default RegisterPage;
