import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { LogOut, User, Shield, Menu, X } from 'lucide-react';

const Navbar = () => {
  const { user, isAuthenticated, isAdmin, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // ตรวจสอบว่าลิงก์กำลังใช้งานอยู่หรือไม่ (Active Link)
  const isActive = (path) => location.pathname === path;

  const navLinks = [
    { name: 'หน้าแรก', path: '/' },
    { name: 'สนาม & จองสนาม', path: '/courts' },
    { name: 'ประวัติการจองของฉัน', path: '/my-bookings' },
    { name: 'เกี่ยวกับเรา', path: '/about' },
  ];

  return (
    <nav className="bg-white border-b border-gray-100 sticky top-0 z-50 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-20 items-center">
          
          {/* 1. โลโก้ฝั่งซ้าย (Logo & Brand Name - ตรงตามภาพ Design Theme) */}
          <Link to="/" className="flex items-center gap-3 group">
            {/* Hexagon Logo Icon */}
            <div className="w-11 h-11 bg-[#0B5D2D] rounded-xl flex items-center justify-center text-white shadow-sm group-hover:scale-105 transition-transform">
              <svg className="w-7 h-7 stroke-current" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 2L21 7V17L12 22L3 17V7L12 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <circle cx="12" cy="12" r="3.5" stroke="currentColor" strokeWidth="1.8"/>
              </svg>
            </div>
            <span className="text-2xl font-bold tracking-tight text-gray-900 font-['Kanit',sans-serif]">
              SPORT <span className="text-[#0B5D2D]">COMPLEX</span>
            </span>
          </Link>

          {/* 2. เมนูกลาง (Center Navigation Links - 100% Match) */}
          <div className="hidden md:flex items-center space-x-8">
            {navLinks.map((link) => {
              const active = isActive(link.path);
              return (
                <Link
                  key={link.path}
                  to={link.path}
                  className={`relative py-2 text-base font-medium transition-colors ${
                    active ? 'text-[#0B5D2D] font-semibold' : 'text-gray-700 hover:text-[#0B5D2D]'
                  }`}
                >
                  {link.name}
                  {/* เส้นใต้ขีดเขียวแสดงสถานะ Active ตรงตามภาพตัวอย่าง */}
                  {active && (
                    <span className="absolute bottom-0 left-0 w-full h-[3px] bg-[#0B5D2D] rounded-full" />
                  )}
                </Link>
              );
            })}
          </div>

          {/* 3. ปุ่มฝั่งขวา (Right Action Buttons - สลับตามสถานะ Auth) */}
          <div className="hidden md:flex items-center gap-3">
            {isAuthenticated ? (
              // กรณีล็อกอินแล้ว
              <div className="flex items-center gap-3">
                {/* User Info Pill */}
                <div className="flex items-center gap-2 bg-[#F4F7F5] border border-gray-200 px-3.5 py-1.5 rounded-xl">
                  <div className="w-7 h-7 rounded-full bg-[#0B5D2D] text-white flex items-center justify-center text-xs font-bold">
                    <User className="w-4 h-4" />
                  </div>
                  <span className="text-sm font-semibold text-gray-800">{user?.username}</span>
                  {isAdmin && (
                    <span className="bg-amber-100 text-amber-800 text-xs font-bold px-2 py-0.5 rounded-md flex items-center gap-1 border border-amber-300">
                      <Shield className="w-3 h-3" /> Admin
                    </span>
                  )}
                </div>

                {/* แอดมิน แดชบอร์ด (กรณีเป็นแอดมิน) */}
                {isAdmin && (
                  <Link
                    to="/admin"
                    className="bg-amber-500 hover:bg-amber-600 text-white text-sm font-medium px-3.5 py-2 rounded-xl transition-all shadow-xs flex items-center gap-1.5"
                  >
                    <Shield className="w-4 h-4" />
                    แดชบอร์ดแอดมิน
                  </Link>
                )}

                {/* ปุ่มออกจากระบบ */}
                <button
                  onClick={handleLogout}
                  className="border border-rose-200 text-rose-600 hover:bg-rose-50 px-3.5 py-2 rounded-xl text-sm font-medium transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <LogOut className="w-4 h-4" />
                  ออกจากระบบ
                </button>
              </div>
            ) : (
              // กรณีทียังไม่ได้ล็อกอิน (ตรงตามรูปภาพ 100%)
              <div className="flex items-center gap-3">
                <Link
                  to="/login"
                  className="border border-[#0B5D2D] text-[#0B5D2D] hover:bg-[#ECFDF5] px-5 py-2.5 rounded-xl text-base font-semibold transition-all shadow-2xs"
                >
                  เข้าสู่ระบบ
                </Link>
                <Link
                  to="/register"
                  className="bg-[#0B5D2D] hover:bg-[#064E26] text-white px-5 py-2.5 rounded-xl text-base font-semibold transition-all shadow-sm hover:shadow-md"
                >
                  สมัครสมาชิก
                </Link>
              </div>
            )}
          </div>

          {/* ปุ่ม Toggle สำหรับมือถือ (Mobile Menu Button) */}
          <div className="md:hidden flex items-center">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="text-gray-700 hover:text-[#0B5D2D] p-2 rounded-lg"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>

        </div>
      </div>

      {/* เมนูมือถือ (Mobile Dropdown Menu) */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-white border-b border-gray-200 px-4 pt-2 pb-6 space-y-3">
          {navLinks.map((link) => (
            <Link
              key={link.path}
              to={link.path}
              onClick={() => setMobileMenuOpen(false)}
              className={`block px-3 py-2 rounded-lg text-base font-medium ${
                isActive(link.path)
                  ? 'bg-[#ECFDF5] text-[#0B5D2D] font-semibold'
                  : 'text-gray-700 hover:bg-gray-50'
              }`}
            >
              {link.name}
            </Link>
          ))}
          <div className="pt-4 border-t border-gray-100 flex flex-col gap-2">
            {isAuthenticated ? (
              <>
                <div className="px-3 py-2 text-sm text-gray-600 flex items-center gap-2">
                  <User className="w-4 h-4 text-[#0B5D2D]" />
                  <span>ผู้ใช้: <strong>{user?.username}</strong></span>
                  {isAdmin && <span className="text-amber-700 font-bold text-xs bg-amber-100 px-2 py-0.5 rounded-md">ADMIN</span>}
                </div>
                {isAdmin && (
                  <Link
                    to="/admin"
                    onClick={() => setMobileMenuOpen(false)}
                    className="w-full bg-amber-500 text-white text-center py-2.5 rounded-xl font-medium"
                  >
                    แดชบอร์ดแอดมิน
                  </Link>
                )}
                <button
                  onClick={() => {
                    handleLogout();
                    setMobileMenuOpen(false);
                  }}
                  className="w-full border border-rose-200 text-rose-600 text-center py-2.5 rounded-xl font-medium"
                >
                  ออกจากระบบ
                </button>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-full border border-[#0B5D2D] text-[#0B5D2D] text-center py-2.5 rounded-xl font-semibold"
                >
                  เข้าสู่ระบบ
                </Link>
                <Link
                  to="/register"
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-full bg-[#0B5D2D] text-white text-center py-2.5 rounded-xl font-semibold"
                >
                  สมัครสมาชิก
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
