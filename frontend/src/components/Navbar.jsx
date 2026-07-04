import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Shield, Home, CalendarRange, User, LogOut, Search, Menu, X, Settings } from 'lucide-react';

export default function Navbar() {
  const location = useLocation();
  const navigate = useNavigate();
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  // ดึงข้อมูลการเข้าสู่ระบบและบทบาทผู้ใช้จริงจาก LocalStorage
  const token = localStorage.getItem('token');
  const user = JSON.parse(localStorage.getItem('user'));

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setIsMobileOpen(false);
    
    // โหลดหน้าใหม่ไปที่หน้าเข้าสู่ระบบเพื่อเคลียร์สถานะ
    window.location.href = '/login';
  };

  return (
    <nav className="navbar">
      <div className="navbar-container">
        {/* ส่วนที่ 1: โลโก้ด้านซ้าย */}
        <Link to="/" className="nav-logo" onClick={() => setIsMobileOpen(false)}>
          <Shield className="logo-icon" size={24} />
          <span>Sport Complex Booking</span>
        </Link>

        {/* ปุ่มสามขีด Hamburger สำหรับมือถือ */}
        <button className="mobile-toggle" onClick={() => setIsMobileOpen(!isMobileOpen)}>
          {isMobileOpen ? <X size={24} /> : <Menu size={24} />}
        </button>

        {/* ส่วนที่ 2: เมนูตรงกลางและข้อมูลผู้ใช้งาน (จะยืดหดเป็นแนวตั้งบนมือถือ) */}
        <div className={`nav-menu-wrapper ${isMobileOpen ? 'active' : ''}`}>
          
          {/* แถบลิงก์หน้าจอต่างๆ */}
          <div className="nav-links">
            <Link to="/" className={`nav-link ${location.pathname === '/' ? 'active' : ''}`} onClick={() => setIsMobileOpen(false)}>
              <Home size={18} />
              <span>หน้าแรก</span>
            </Link>
            <Link to="/booking" className={`nav-link ${location.pathname === '/booking' ? 'active' : ''}`} onClick={() => setIsMobileOpen(false)}>
              <Search size={18} />
              <span>ค้นหาสนามว่าง/จองสนาม</span>
            </Link>
            
            {/* แสดงปุ่มประวัติการจองเฉพาะลูกค้าธรรมดาที่ล็อกอินแล้ว */}
            {token && user?.role === 'customer' && (
              <Link to="/my-bookings" className={`nav-link ${location.pathname === '/my-bookings' ? 'active' : ''}`} onClick={() => setIsMobileOpen(false)}>
                <CalendarRange size={18} />
                <span>ประวัติการจองของฉัน</span>
              </Link>
            )}

            {/* แสดงปุ่มระบบจัดการหลังบ้านเฉพาะแอดมินเท่านั้น */}
            {token && user?.role === 'admin' && (
              <Link to="/admin" className={`nav-link ${location.pathname === '/admin' ? 'active' : ''}`} onClick={() => setIsMobileOpen(false)}>
                <Settings size={18} />
                <span>ระบบจัดการแอดมิน</span>
              </Link>
            )}
          </div>

          {/* ส่วนที่ 3: จัดการปุ่มสมาชิกและการทักทาย */}
          <div className="nav-user-area">
            {token ? (
              <>
                <div className="user-profile">
                  <User size={18} className="profile-icon" />
                  <span>
                    สวัสดี, {user?.username || 'ผู้ใช้งาน'} {user?.role === 'admin' && <span className="admin-badge">(Admin)</span>}
                  </span>
                </div>
                <button onClick={handleLogout} className="btn btn-outline-light btn-logout">
                  <LogOut size={16} />
                  <span>ออกจากระบบ</span>
                </button>
              </>
            ) : (
              <div className="auth-buttons">
                <Link to="/login" className="btn btn-outline-light" onClick={() => setIsMobileOpen(false)}>เข้าสู่ระบบ</Link>
                <Link to="/register" className="btn btn-primary" onClick={() => setIsMobileOpen(false)}>สมัครสมาชิก</Link>
              </div>
            )}
          </div>

        </div>
      </div>
    </nav>
  );
}
