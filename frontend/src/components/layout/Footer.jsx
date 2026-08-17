import React from 'react';
import { Link } from 'react-router-dom';
import { MapPin, Phone } from 'lucide-react';

const Footer = () => (
  <footer className="mx-auto mt-4 w-full max-w-7xl border-t border-[#e4e4e4] bg-white/50 px-5 py-5 text-[13px] text-[#222]">
    <div className="grid grid-cols-[1.1fr_1.8fr_1fr] items-center gap-8 max-md:grid-cols-1 max-md:text-center">
      <div className="max-md:mx-auto">
        <h2 className="mb-2 text-[15px] font-semibold">ติดต่อเรา</h2>
        <p className="flex items-center gap-2 max-md:justify-center"><Phone className="h-4 w-4 fill-current" />090-221-4698</p>
        <p className="mt-1 flex items-center gap-2 max-md:justify-center"><MapPin className="h-4 w-4 fill-current" />123 ถนนกีฬา แขวงสปอร์ต กรุงเทพมหานคร 10230</p>
      </div>
      <div className="border-x border-[#e3e3e3] px-9 max-md:border-0 max-md:px-0">
        <h2 className="mb-3 text-[15px] font-semibold">ลิงก์ด่วน</h2>
        <div className="flex flex-wrap gap-x-9 gap-y-2 max-md:justify-center">
          <Link to="/">หน้าแรก</Link><Link to="/courts">สนาม & จองสนาม</Link><Link to="/my-bookings">ประวัติการจองของฉัน</Link><Link to="/contact">ติดต่อเรา</Link>
        </div>
      </div>
      <p className="text-right leading-6 max-md:text-center">© 2026 Sport Complex.<br />All rights reserved.</p>
    </div>
  </footer>
);

export default Footer;
