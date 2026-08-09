import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { LogOut, Menu, Shield, User, X } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import logo from '../../assets/sport-complex-logo.png';

const links = [
  { name: 'หน้าแรก', path: '/' },
  { name: 'สนาม & จองสนาม', path: '/courts' },
  { name: 'ประวัติการจองของฉัน', path: '/my-bookings' },
  { name: 'เกี่ยวกับเรา', path: '/about' },
];

const Navbar = () => {
  const { user, isAuthenticated, isAdmin, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const active = (path) => location.pathname === path;

  const closeMenu = () => setOpen(false);
  const signOut = () => {
    logout();
    closeMenu();
    navigate('/login');
  };

  return (
    <nav className="sticky top-0 z-50 bg-white text-[#111111] shadow-[0_1px_10px_rgba(0,0,0,0.025)]">
      <div className="mx-auto grid h-[89px] w-full grid-cols-[360px_minmax(0,1fr)_auto] items-center px-10 max-[1100px]:grid-cols-[auto_1fr_auto] max-[1100px]:gap-6 max-[1100px]:px-6 max-md:flex max-md:h-[72px] max-md:justify-between max-md:px-4">
        <Link to="/" onClick={closeMenu} className="block w-[314px] shrink-0 max-[1100px]:w-[250px] max-md:w-[230px]" aria-label="SPORT COMPLEX หน้าแรก">
          <img src={logo} alt="SPORT COMPLEX" className="block h-auto w-full" />
        </Link>

        <div className="flex h-full items-center justify-center gap-[41px] whitespace-nowrap max-[1180px]:gap-6 max-md:hidden">
          {links.map((link) => (
            <Link
              key={link.path}
              to={link.path}
              className={`relative flex h-full items-center pt-px text-[16px] font-medium transition-colors ${
                active(link.path) ? 'text-[#086b2d]' : 'text-[#111111] hover:text-[#086b2d]'
              }`}
            >
              {link.name}
              {active(link.path) && (
                <span className="absolute bottom-[7px] left-1/2 h-[2px] w-[51px] -translate-x-1/2 bg-[#08702e]" />
              )}
            </Link>
          ))}
        </div>

        <div className="flex items-center justify-end gap-[11px] pl-7 max-[1100px]:pl-0 max-md:hidden">
          {isAuthenticated ? (
            <>
              <span className="flex h-[46px] items-center gap-2 rounded-[9px] border border-[#08702e] px-4 text-[15px] font-medium text-[#08702e]">
                <User className="h-4 w-4" />
                {user?.username}
              </span>
              {isAdmin && (
                <Link to="/admin" className="flex h-[46px] items-center rounded-[9px] border border-amber-500 px-4 text-[15px] font-medium text-amber-700">
                  <Shield className="mr-1.5 h-4 w-4" />แอดมิน
                </Link>
              )}
              <button onClick={signOut} className="flex h-[46px] w-[46px] items-center justify-center rounded-[9px] bg-[#086b2d] text-white transition hover:bg-[#075c27]" aria-label="ออกจากระบบ">
                <LogOut className="h-4 w-4" />
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="flex h-[46px] items-center rounded-[9px] border border-[#08702e] px-[17px] text-[16px] font-medium text-[#08702e] transition hover:bg-[#f1f9f4]">
                เข้าสู่ระบบ
              </Link>
              <Link to="/register" className="flex h-[46px] items-center rounded-[9px] bg-[#086b2d] px-[17px] text-[16px] font-medium text-white shadow-[0_2px_5px_rgba(8,107,45,0.18)] transition hover:bg-[#075c27]">
                สมัครสมาชิก
              </Link>
            </>
          )}
        </div>

        <button onClick={() => setOpen((value) => !value)} className="rounded-lg p-2 text-[#086b2d] md:hidden" aria-label={open ? 'ปิดเมนู' : 'เปิดเมนู'} aria-expanded={open}>
          {open ? <X /> : <Menu />}
        </button>
      </div>

      {open && (
        <div className="border-t border-[#e5eee8] bg-white px-4 pb-5 pt-3 md:hidden">
          <div className="space-y-1">
            {links.map((link) => (
              <Link key={link.path} to={link.path} onClick={closeMenu} className={`block rounded-lg px-3 py-2.5 text-[15px] font-medium ${active(link.path) ? 'bg-[#edf7f0] text-[#086b2d]' : 'text-[#222]'}`}>
                {link.name}
              </Link>
            ))}
          </div>
          <div className="mt-3 grid grid-cols-2 gap-2 border-t border-[#e5eee8] pt-3">
            {isAuthenticated ? (
              <button onClick={signOut} className="col-span-2 rounded-lg bg-[#086b2d] py-2.5 font-medium text-white">ออกจากระบบ</button>
            ) : (
              <>
                <Link to="/login" onClick={closeMenu} className="rounded-lg border border-[#08702e] py-2.5 text-center font-medium text-[#08702e]">เข้าสู่ระบบ</Link>
                <Link to="/register" onClick={closeMenu} className="rounded-lg bg-[#086b2d] py-2.5 text-center font-medium text-white">สมัครสมาชิก</Link>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
