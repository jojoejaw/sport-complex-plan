import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  CircleDot,
  LogOut,
  Menu,
  Shield,
  User,
  X,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const links = [
  { name: 'หน้าแรก', path: '/' },
  { name: 'จองสนาม', path: '/#courts-section' },
  { name: 'ประวัติการจองของฉัน', path: '/my-bookings' },
  { name: 'เกี่ยวกับเรา', path: '/about' },
];


const Brand = () => (
  <div className="flex items-center gap-3">
    <span className="relative grid h-[52px] w-[46px] place-items-center bg-[#11813a] [clip-path:polygon(50%_0,100%_25%,100%_75%,50%_100%,0_75%,0_25%)]">
      <span className="absolute inset-[4px] bg-white [clip-path:inherit]" />
      <span className="absolute inset-[8px] bg-gradient-to-b from-[#0a9b41] to-[#075622] [clip-path:inherit]" />
      <span className="relative grid h-7 w-7 place-items-center rounded-full bg-white text-black shadow-md">
        <CircleDot className="h-6 w-6 stroke-[2.6]" />
      </span>
    </span>
    <span className="leading-none">
      <span className="block text-[21px] font-bold tracking-[-1px] text-black">
        SPORT COMPLE<span className="text-[#05752b]">X</span>
      </span>
      <span className="mt-2.5 block text-[10px] font-medium tracking-[2.5px] text-[#707070]">
        PLAY MORE, LIVE BETTER
      </span>
    </span>
  </div>
);

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

  const handleNavClick = (e, path) => {
    if (path === '/#courts-section') {
      e.preventDefault();
      if (location.pathname === '/') {
        const el = document.getElementById('courts-section');
        if (el) {
          el.scrollIntoView({ behavior: 'smooth' });
        }
      } else {
        navigate('/?scroll=courts');
      }
      closeMenu();
    } else {
      closeMenu();
    }
  };

  return (
    <nav className="compact-navbar sticky top-3 z-50 mx-auto w-[calc(100%-40px)] max-w-[1280px] rounded-[26px] bg-white text-[#111] shadow-[0_3px_24px_rgba(0,0,0,0.06)] max-md:top-2 max-md:w-[calc(100%-16px)]">
      <div className="compact-navbar-inner mx-auto grid h-[72px] w-full grid-cols-[310px_minmax(0,1fr)_auto] items-center px-6 max-[1280px]:grid-cols-[275px_minmax(0,1fr)_auto] max-[1280px]:px-5 max-[1060px]:grid-cols-[auto_1fr_auto] max-md:flex max-md:h-[68px] max-md:justify-between max-md:px-4">
        <Link to="/" onClick={closeMenu} className="block shrink-0 border-r border-[#d7d7d7] pr-7 max-[1280px]:pr-4 max-[1060px]:border-0 max-[1060px]:pr-0" aria-label="SPORT COMPLEX หน้าแรก">
          <Brand />
        </Link>

        <div className="flex h-full items-stretch justify-center gap-8 whitespace-nowrap max-[1280px]:gap-4 max-[1060px]:hidden">
          {links.map(({ name, path }) => (
            <Link
              key={path}
              to={path}
              onClick={(e) => handleNavClick(e, path)}
              className={`group relative flex min-w-[88px] items-center justify-center text-[16px] font-semibold transition-colors ${active(path) ? 'text-[#06772d]' : 'text-[#111] hover:text-[#06772d]'}`}
            >
              <span>{name}</span>
              <span className={`absolute bottom-[11px] left-1/2 h-[3px] -translate-x-1/2 rounded-full bg-[#07802f] transition-all ${active(path) ? 'w-[46px] opacity-100' : 'w-0 opacity-0 group-hover:w-8 group-hover:opacity-100'}`} />
            </Link>
          ))}
        </div>


        <div className="flex items-center justify-end gap-4 pl-6 max-[1280px]:gap-2.5 max-[1280px]:pl-3 max-[1060px]:hidden">
          {isAuthenticated ? (
            <>
              <span className="flex h-[42px] items-center gap-2 rounded-[14px] border border-[#07802f] px-4 text-[14px] font-medium text-[#08752e]"><User className="h-4 w-4" />{user?.username}</span>
              {isAdmin && <Link to="/admin" className="flex h-[42px] items-center rounded-[14px] border border-amber-500 px-3.5 text-[14px] font-medium text-amber-700"><Shield className="mr-1.5 h-4 w-4" />แอดมิน</Link>}
              <button onClick={signOut} className="grid h-[42px] w-[42px] place-items-center rounded-[14px] bg-[#08752e] text-white transition hover:bg-[#056326]" aria-label="ออกจากระบบ"><LogOut className="h-[18px] w-[18px]" /></button>
            </>
          ) : (
            <>
              <Link to="/login" className="flex h-[42px] min-w-[124px] items-center justify-center rounded-[14px] border border-[#07802f] px-5 text-[14px] font-medium text-[#08752e] transition hover:bg-[#f0f9f3]">เข้าสู่ระบบ</Link>
              <Link to="/register" className="flex h-[42px] min-w-[136px] items-center justify-center rounded-[14px] bg-[#08752e] px-5 text-[14px] font-medium text-white shadow-[0_3px_8px_rgba(8,117,46,0.2)] transition hover:bg-[#056326]">สมัครสมาชิก</Link>
            </>
          )}
        </div>

        <button onClick={() => setOpen((value) => !value)} className="rounded-xl p-2 text-[#08752e] min-[1061px]:hidden" aria-label={open ? 'ปิดเมนู' : 'เปิดเมนู'} aria-expanded={open}>{open ? <X /> : <Menu />}</button>
      </div>

      {open && (
        <div className="border-t border-[#e5eee8] px-4 pb-5 pt-3 min-[1061px]:hidden">
          <div className="grid gap-1 sm:grid-cols-2">
            {links.map(({ name, path }) => <Link key={path} to={path} onClick={(e) => handleNavClick(e, path)} className={`rounded-xl px-3 py-3 font-medium ${active(path) ? 'bg-[#edf7f0] text-[#08752e]' : 'text-[#222]'}`}>{name}</Link>)}

          </div>
          <div className="mt-3 grid grid-cols-2 gap-2 border-t border-[#e5eee8] pt-3">
            {isAuthenticated ? <button onClick={signOut} className="col-span-2 rounded-xl bg-[#08752e] py-3 font-medium text-white">ออกจากระบบ</button> : <><Link to="/login" onClick={closeMenu} className="rounded-xl border border-[#07802f] py-3 text-center font-medium text-[#08752e]">เข้าสู่ระบบ</Link><Link to="/register" onClick={closeMenu} className="rounded-xl bg-[#08752e] py-3 text-center font-medium text-white">สมัครสมาชิก</Link></>}
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
