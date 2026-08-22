import { useEffect, useMemo, useState } from 'react';
import {
  CalendarDays, ChevronRight,
  Clock3, CreditCard, Eye, Grid2X2, LayoutDashboard,
  Menu, ShieldCheck,
  X,
} from 'lucide-react';
import bookingService from '../../services/bookingService';
import courtService from '../../services/courtService';
import AdminCourtsPanel from './AdminCourtsPanel';
import AdminBookingsPanel from './AdminBookingsPanel';
import AdminBookingManagementModal from './AdminBookingManagementModal';

const menuItems = [
  { id: 'dashboard', label: 'Dashboard', description: 'ภาพรวมระบบ', icon: LayoutDashboard },
  { id: 'courts', label: 'จัดการสนาม', description: 'เพิ่ม / แก้ไข / ลบสนาม', icon: Grid2X2 },
  { id: 'bookings', label: 'รายการจอง', description: 'จัดการการจองทั้งหมด', icon: CalendarDays },
];

const toNumber = (value) => Number(value || 0);
const dateKey = (value) => String(value || '').slice(0, 10);
const revenueDate = (booking) => booking.transfer_time || booking.uploaded_at || booking.updated_at;
const formatMoney = (value) => toNumber(value).toLocaleString('th-TH');
const formatDate = (value) => {
  const [year, month, day] = dateKey(value).split('-').map(Number);
  if (!year || !month || !day) return '-';
  return new Intl.DateTimeFormat('th-TH', { day: 'numeric', month: 'short', year: 'numeric' }).format(new Date(Date.UTC(year, month - 1, day)));
};
const shortTime = (value) => String(value || '').slice(0, 5);
const bookingStatus = {
  approved: ['อนุมัติแล้ว', 'bg-green-100 text-green-700'],
  pending_payment: ['รอชำระเงิน', 'bg-amber-100 text-amber-700'],
  cancelled: ['ยกเลิก', 'bg-red-100 text-red-700'],
  pending_approval: ['ติดต่อแอดมิน', 'bg-slate-100 text-slate-600'],
  rejected: ['ติดต่อแอดมิน', 'bg-slate-100 text-slate-600'],
};

const SummaryCard = ({ icon: Icon, title, value, color, soft, suffix = '' }) => (
  <article className="flex h-[88px] min-w-0 items-center gap-3 overflow-hidden rounded-[15px] border border-[#e4e8ee] bg-white px-3 py-2 shadow-[0_4px_13px_rgba(28,44,68,0.07)]">
    <span className="grid h-[48px] w-[48px] shrink-0 place-items-center rounded-[16px]" style={{ background: soft, color }}><Icon className="h-7 w-7" strokeWidth={1.8} /></span>
    <div className="min-w-0"><p className="truncate text-[12px] font-semibold text-[#18223b]">{title}</p><strong className="mt-1 block text-[23px] leading-none text-[#0d1730]">{value}{suffix}</strong><p className="mt-2 whitespace-nowrap text-[10px] text-[#30394c]"><span className="mr-1.5 font-bold" style={{ color }}>↑ ล่าสุด</span>ข้อมูลปัจจุบัน</p></div>
  </article>
);

const Panel = ({ title, children, className = '' }) => (
  <section className={`rounded-[18px] border border-[#e5e9ef] bg-white p-4 shadow-[0_4px_15px_rgba(28,44,68,0.07)] ${className}`}>
    <h2 className="mb-4 text-[15px] font-semibold text-[#14203a]">{title}</h2>{children}
  </section>
);

const Donut = ({ parts, totalLabel = 'ทั้งหมด', compact = false }) => {
  const total = Math.max(1, parts.reduce((sum, item) => sum + item.value, 0));
  let cursor = 0;
  const stops = parts.map((item) => {
    const start = cursor;
    cursor += (item.value / total) * 100;
    return `${item.color} ${start}% ${cursor}%`;
  }).join(', ');
  return <div className={`relative shrink-0 rounded-full ${compact ? 'h-28 w-28' : 'h-36 w-36'}`} style={{ background: `conic-gradient(${stops || '#e8edf2 0 100%'})` }}><span className={`absolute grid place-items-center rounded-full bg-white text-center text-[#4e596d] ${compact ? 'inset-[22px] text-[9px]' : 'inset-[28px] text-[11px]'}`}>{totalLabel}<b className={`block text-[#152039] ${compact ? 'text-lg' : 'text-xl'}`}>{parts.reduce((sum, item) => sum + item.value, 0)}</b><small>รายการ</small></span></div>;
};

const RevenueChart = ({ values, showPointLabels = false }) => {
  const maxValue = Math.max(1, ...values.map((item) => item.value));
  const axisMax = Math.ceil(maxValue / 100) * 100 || 100;
  const yTicks = [0, 0.25, 0.5, 0.75, 1].map((ratio) => ({
    value: axisMax * ratio,
    y: 160 - ratio * 115,
  }));
  const xAt = (index) => values.length <= 1 ? 290 : 70 + (index * 440) / (values.length - 1);
  const yAt = (value) => 160 - (value / axisMax) * 115;
  const points = values.map((item, index) => `${xAt(index)},${yAt(item.value)}`).join(' ');
  return <div><div className="mb-3 flex gap-6 text-[11px] text-[#566176]"><span className="before:mr-2 before:inline-block before:h-[2px] before:w-5 before:bg-[#0ba24a]">รายได้ปัจจุบัน</span><span className="before:mr-2 before:inline-block before:h-[2px] before:w-5 before:border-t before:border-dashed before:border-[#aab4c2]">ชี้หรือแตะจุดเพื่อดูยอด</span></div><svg viewBox="0 0 540 205" className="h-[225px] w-full"><defs><linearGradient id="revenueFill" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#18a653" stopOpacity=".24"/><stop offset="1" stopColor="#18a653" stopOpacity="0"/></linearGradient></defs>{yTicks.map(({ value, y }) => <g key={value}><line x1="58" x2="520" y1={y} y2={y} stroke="#e7ebef" strokeWidth="1" /><text x="52" y={y + 3} textAnchor="end" fontSize="9" fill="#738095">฿{formatMoney(value)}</text></g>)}<polygon points={`58,165 ${points} 520,165`} fill="url(#revenueFill)"/><polyline points={points} fill="none" stroke="#0ba24a" strokeWidth="3" strokeLinejoin="round"/>{values.map((item,index) => <g key={item.label} className="group"><title>{`${item.label}: ${formatMoney(item.value)} บาท`}</title><circle cx={xAt(index)} cy={yAt(item.value)} r="8" fill="transparent" /><circle cx={xAt(index)} cy={yAt(item.value)} r="4" fill="white" stroke="#0ba24a" strokeWidth="2"/>{showPointLabels && <text x={xAt(index)} y={Math.max(12, yAt(item.value) - 9)} textAnchor="middle" fontSize="9" fontWeight="600" fill="#07883d">฿{formatMoney(item.value)}</text>}<text x={xAt(index)} y="188" textAnchor="middle" fontSize="10" fill="#596376">{item.label}</text></g>)}</svg></div>;
};

const AdminDashboard = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [bookings, setBookings] = useState([]);
  const [courts, setCourts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [now, setNow] = useState(new Date());
  const [dashboardPeriod, setDashboardPeriod] = useState('daily');
  const [activeSection, setActiveSection] = useState('dashboard');
  const [selectedDashboardBooking, setSelectedDashboardBooking] = useState(null);

  useEffect(() => {
    let active = true;
    Promise.all([bookingService.getAllBookingsAdmin(), courtService.getCourts()])
      .then(([bookingData, courtData]) => { if (active) { setBookings(Array.isArray(bookingData) ? bookingData : []); setCourts(Array.isArray(courtData) ? courtData : []); } })
      .catch((requestError) => active && setError(requestError.response?.data?.message || 'ไม่สามารถโหลดข้อมูล Dashboard ได้'))
      .finally(() => active && setLoading(false));
    return () => { active = false; };
  }, []);

  useEffect(() => { const timer = window.setInterval(() => setNow(new Date()), 1000); return () => window.clearInterval(timer); }, []);

  useEffect(() => {
    const syncBooking = (event) => setBookings((current) => current.map((item) => item.id === event.detail.id ? event.detail : item));
    window.addEventListener('admin-booking-status-updated', syncBooking);
    return () => window.removeEventListener('admin-booking-status-updated', syncBooking);
  }, []);

  const dashboard = useMemo(() => {
    const bangkokToday = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Bangkok' }).format(new Date());
    const currentMonth = bangkokToday.slice(0, 7);
    const currentYear = bangkokToday.slice(0, 4);
    const inPeriod = (value) => {
      const key = dateKey(value);
      if (dashboardPeriod === 'daily') return key === bangkokToday;
      if (dashboardPeriod === 'monthly') return key.startsWith(currentMonth);
      if (dashboardPeriod === 'yearly') return key.startsWith(currentYear);
      return true;
    };
    const periodBookings = bookings.filter((item) => inPeriod(item.created_at));
    const approved = bookings.filter((item) => item.status === 'approved' && inPeriod(revenueDate(item)));
    const pending = bookings.filter((item) => item.status === 'pending_payment' && inPeriod(item.created_at));
    const cancelled = periodBookings.filter((item) => item.status === 'cancelled');
    const revenue = approved.reduce((sum, item) => sum + toNumber(item.total_price), 0);

    const activePeriodBookings = periodBookings.filter((item) => item.status !== 'cancelled');
    const sportMap = new Map();
    activePeriodBookings.forEach((item) => {
      sportMap.set(item.sport_name || 'อื่นๆ', (sportMap.get(item.sport_name || 'อื่นๆ') || 0) + 1);
    });
    const dailyRevenue = Array.from({ length: 7 }, (_, offset) => {
      const day = new Date();
      day.setDate(day.getDate() - (6 - offset));
      const key = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Bangkok' }).format(day);
      return {
        label: new Intl.DateTimeFormat('th-TH', { day: 'numeric', month: 'short', timeZone: 'Asia/Bangkok' }).format(day),
        value: bookings.filter((item) => item.status === 'approved' && dateKey(revenueDate(item)) === key).reduce((sum, item) => sum + toNumber(item.total_price), 0),
      };
    });
    const monthDays = new Date(Number(currentYear), Number(currentMonth.slice(5, 7)), 0).getDate();
    const currentMonthRevenue = Array.from({ length: monthDays }, (_, offset) => {
      const key = `${currentMonth}-${String(offset + 1).padStart(2, '0')}`;
      return { label: `${offset + 1}`, value: bookings.filter((item) => item.status === 'approved' && dateKey(revenueDate(item)) === key).reduce((sum, item) => sum + toNumber(item.total_price), 0) };
    });
    const currentYearRevenue = Array.from({ length: 12 }, (_, offset) => {
      const key = `${currentYear}-${String(offset + 1).padStart(2, '0')}`;
      return { label: new Intl.DateTimeFormat('th-TH', { month: 'short' }).format(new Date(Number(currentYear), offset, 1)), value: bookings.filter((item) => item.status === 'approved' && dateKey(revenueDate(item)).startsWith(key)).reduce((sum, item) => sum + toNumber(item.total_price), 0) };
    });
    const years = [...new Set(bookings.map((item) => dateKey(revenueDate(item)).slice(0, 4)).filter(Boolean))].sort();
    const totalRevenue = (years.length ? years : [currentYear]).map((year) => ({ label: String(Number(year) + 543), value: bookings.filter((item) => item.status === 'approved' && dateKey(revenueDate(item)).startsWith(year)).reduce((sum, item) => sum + toNumber(item.total_price), 0) }));
    const chartValues = dashboardPeriod === 'daily' ? dailyRevenue : dashboardPeriod === 'monthly' ? currentMonthRevenue : dashboardPeriod === 'yearly' ? currentYearRevenue : totalRevenue;
    return { periodBookings, activePeriodBookings, cancelled, approved, pending, revenue, sportMap, chartValues };
  }, [bookings, dashboardPeriod]);

  const sports = [...dashboard.sportMap.entries()].sort((a, b) => b[1] - a[1]);
  const sportColors = ['#13a052', '#2d91e8', '#ffad17', '#ff4a3d', '#8b95a5'];
  const sportParts = sports.slice(0, 5).map(([label, value], index) => ({ label, value, color: sportColors[index] }));
  const periodText = { total: 'ทั้งหมด', daily: 'วันนี้', monthly: 'เดือนนี้', yearly: 'ปีนี้' }[dashboardPeriod];

  return (
    <div className="admin-dashboard-page mt-3 h-[calc(100vh-94px)] overflow-hidden bg-[#f7f9fc] p-2.5 text-[#101a33] max-lg:h-auto max-lg:min-h-[calc(100vh-94px)] max-lg:overflow-visible">
      {sidebarOpen && <button type="button" aria-label="ปิดเมนู" className="fixed inset-0 z-40 bg-[#07111e]/45 lg:hidden" onClick={() => setSidebarOpen(false)} />}
      <div className="mx-auto grid h-full max-w-[1500px] grid-cols-[232px_minmax(0,1fr)] gap-5 max-lg:block max-lg:h-auto">
      <aside className={`relative z-40 flex h-full w-[232px] flex-col overflow-hidden rounded-[22px] border border-[#dce7df] bg-[#fbfcfa] shadow-[0_12px_34px_rgba(20,50,30,0.12)] transition-transform lg:translate-x-0 max-lg:fixed max-lg:bottom-0 max-lg:left-0 max-lg:top-[84px] max-lg:h-auto max-lg:rounded-none ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="admin-menu-header-ticket relative flex min-h-[112px] items-center gap-3 overflow-hidden border-b border-dashed border-[#9fb4a6] bg-white/80 px-5 pt-3"><span className="admin-menu-logo-ticket grid h-[54px] w-[54px] shrink-0 place-items-center border-[5px] border-[#07823a] bg-white text-[#10213b] shadow-sm"><ShieldCheck className="h-8 w-8" /></span><div><strong className="block text-[21px] leading-[19px] text-[#10213b]">SPORT<br /><span className="text-[#07883d]">COMPLEX</span></strong><small className="mt-1 block text-[10px] font-black tracking-[.12em] text-[#10213b]">/// ADMIN PANEL</small></div><button type="button" aria-label="ปิดเมนู" className="ml-auto lg:hidden" onClick={() => setSidebarOpen(false)}><X /></button></div>
        <nav className="space-y-2.5 px-3 py-4">{menuItems.map(({ id, label, description, icon: Icon }) => { const active = id === activeSection; return <button type="button" key={label} onClick={() => { if (id) setActiveSection(id); setSidebarOpen(false); }} className={`admin-menu-ticket group relative flex h-[72px] w-full items-center gap-3 overflow-hidden border px-4 text-left transition-colors ${active ? 'border-[#087b3b] bg-gradient-to-r from-[#092b39] to-[#09a149] text-white shadow-[0_7px_16px_rgba(4,99,48,.2)]' : 'border-[#e0e8e2] bg-white/90 text-[#10213b] shadow-[0_5px_14px_rgba(22,49,34,.08)] hover:border-[#8bc8a5]'}`}><span className={`grid h-11 w-11 shrink-0 place-items-center rounded-xl border ${active ? 'border-white/35 bg-white text-[#087c3b]' : 'border-[#dce9e0] bg-[#f7fbf8] text-[#087c3b]'}`}><Icon className="h-6 w-6" /></span><span className="min-w-0 flex-1 border-l border-dashed border-current/30 pl-3"><strong className="block truncate text-[15px] leading-5">{label}</strong><small className={`block truncate text-[11px] ${active ? 'text-white/75' : 'text-[#778094]'}`}>{description}</small></span>{!active && <ChevronRight className="h-5 w-5 shrink-0 text-[#087c3b]" />}</button>; })}</nav>
        <div className="admin-date-ticket mx-3 mt-auto border border-[#a9d4b8] bg-[#eff9ed]/90 px-4 py-4 shadow-inner"><div className="flex items-center gap-3 border-b border-dashed border-[#9dbca8] pb-2"><span className="grid h-9 w-9 place-items-center rounded-full border border-[#afd4bb] text-[#07883d]"><CalendarDays className="h-5 w-5" /></span><div><strong className="block text-[12px] text-[#10213b]">{now.toLocaleDateString('th-TH', { dateStyle: 'long' })}</strong><p className="text-[10px] text-[#687487]">{now.toLocaleDateString('th-TH', { weekday: 'long' })}</p></div></div><div className="flex items-center gap-3 pt-2"><span className="grid h-9 w-9 place-items-center rounded-full border border-[#afd4bb] text-[#07883d]"><Clock3 className="h-5 w-5" /></span><div><strong className="block text-[18px] leading-5 text-[#10213b]">{now.toLocaleTimeString('th-TH', { hour12: false })}</strong><p className="text-[10px] text-[#687487]">เวลาปัจจุบัน</p></div></div></div>
      </aside>

      <div className={`h-full min-h-0 rounded-[22px] border border-[#e4ebe6] bg-[#f7f9fc] shadow-[0_12px_34px_rgba(20,50,30,0.08)] max-lg:h-auto max-lg:overflow-visible ${activeSection === 'dashboard' ? 'overflow-hidden' : 'overflow-y-auto [scrollbar-gutter:stable]'}`}>
        <main className="p-2.5 lg:p-3" onClick={(event) => {
          const button = event.target.closest('button');
          const section = button?.closest('section');
          if (activeSection === 'dashboard' && button?.textContent.includes('ดูทั้งหมด') && section?.textContent.includes('รายการจองล่าสุด')) setActiveSection('bookings');
          if (activeSection === 'dashboard' && button?.textContent.includes('ดูรายละเอียด')) {
            const bookingId = Number(button.closest('tr')?.querySelector('td')?.textContent);
            setSelectedDashboardBooking(bookings.find((item) => Number(item.id) === bookingId) || null);
          }
        }}>
          <button type="button" aria-label="เปิดเมนูผู้ดูแลระบบ" className="mb-3 grid h-11 w-11 place-items-center rounded-xl border border-[#dce4df] bg-white shadow-sm lg:hidden" onClick={() => setSidebarOpen(true)}><Menu /></button>
          {loading && <div className="mb-4 h-1.5 animate-pulse rounded-full bg-gradient-to-r from-[#0a9644] via-[#8cdaa9] to-[#0a9644]" />}
          {error && <div className="mb-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>}
          {activeSection === 'bookings' ? <AdminBookingsPanel bookings={bookings} loading={loading} /> : activeSection === 'courts' ? <AdminCourtsPanel courts={courts} setCourts={setCourts} loading={loading} /> : <><div className="mb-2 flex h-[36px] justify-end"><div className="grid h-[36px] w-[310px] grid-cols-4 rounded-xl border border-[#dce5df] bg-white p-1 shadow-sm">{[['total','สรุปผลรวม'], ['daily','รายวัน'], ['monthly','รายเดือน'], ['yearly','รายปี']].map(([value, label]) => <button key={value} type="button" aria-pressed={dashboardPeriod === value} onClick={() => setDashboardPeriod(value)} className={`h-[28px] min-w-0 whitespace-nowrap rounded-lg px-1.5 text-xs font-semibold transition-colors ${dashboardPeriod === value ? 'bg-[#07883d] text-white shadow-sm' : 'text-[#4c586b] hover:bg-[#eef7f1]'}`}>{label}</button>)}</div></div><div className="grid grid-cols-5 gap-2 max-lg:grid-cols-5 max-sm:grid-cols-2">
            <SummaryCard icon={CalendarDays} title={`การจอง${periodText}`} value={dashboard.periodBookings.length} color="#0aa04a" soft="#e7f7ed" />
            <SummaryCard icon={X} title={`รายการจอง${periodText}ที่ยกเลิก`} value={dashboard.cancelled.length} color="#ef3e4e" soft="#ffe9eb" />
            <SummaryCard icon={Clock3} title={`รอชำระเงิน${periodText}`} value={dashboard.pending.length} color="#f29300" soft="#fff1dc" />
            <SummaryCard icon={ShieldCheck} title={`รับชำระแล้ว${periodText}`} value={dashboard.approved.length} color="#2479ed" soft="#e9f2ff" />
            <SummaryCard icon={CreditCard} title={`รายได้รับ${periodText}`} value={formatMoney(dashboard.revenue)} color="#0aa04a" soft="#e7f7ed" suffix=" บาท" />
          </div>

          <div className="mt-2.5 grid grid-cols-[1.3fr_1fr] gap-2.5 max-lg:grid-cols-1">
            <Panel title={`รายได้รับ${periodText} (อิงวันที่ชำระสำเร็จ/อนุมัติ)`} className="min-h-[230px] p-3"><RevenueChart values={dashboard.chartValues} showPointLabels={dashboardPeriod === 'total'} /></Panel>
            <Panel title={`สัดส่วนการจองที่ยังใช้งานตามประเภทกีฬา (${periodText})`} className="min-h-[230px] p-3"><div className="flex h-[180px] items-center justify-center gap-5 max-sm:flex-col"><Donut parts={sportParts} compact /><div className="w-full max-w-[200px] space-y-2">{sportParts.map((item) => <p key={item.label} className="grid grid-cols-[10px_1fr_auto] items-center gap-1.5 text-xs"><i className="h-2.5 w-2.5 rounded-full" style={{ background: item.color }} /><span className="truncate">{item.label}</span><b>{Math.round((item.value / Math.max(1, dashboard.activePeriodBookings.length)) * 100)}% ({item.value})</b></p>)}</div></div></Panel>
          </div>

          <section className="mt-2.5 overflow-hidden rounded-[16px] border border-[#e3e8ed] bg-white shadow-[0_4px_13px_rgba(28,44,68,0.07)]"><div className="flex items-center justify-between border-b border-[#e6eaee] px-3.5 py-2"><h2 className="text-xs font-bold text-[#14203a] sm:text-sm">รายการจองล่าสุด ({periodText})</h2><button type="button" className="flex items-center gap-1 rounded-lg border border-[#dce3e8] px-2.5 py-1 text-xs">ดูทั้งหมด <ChevronRight className="h-3.5 w-3.5" /></button></div><div className="max-h-[380px] overflow-auto"><table className="w-full min-w-[850px] text-xs"><thead className="sticky top-0 bg-[#f8faf9] text-[#596376] shadow-xs"><tr>{['Booking ID','ชื่อลูกค้า','สนาม','วันที่ใช้งาน','ช่วงเวลา','ยอดชำระ','สถานะ','ดำเนินการ'].map((title) => <th key={title} className="px-2.5 py-1.5 text-center font-medium">{title}</th>)}</tr></thead><tbody>{dashboard.periodBookings.slice(0,10).map((booking) => { const meta = bookingStatus[booking.status] || bookingStatus.cancelled; return <tr key={booking.id} className="border-t border-[#edf0f2]"><td className="px-2.5 py-1 text-center font-semibold text-[#079143]">{booking.id}</td><td className="px-2.5 py-1 text-center">{booking.username}</td><td className="px-2.5 py-1 text-center">{booking.court_name}</td><td className="px-2.5 py-1 text-center">{formatDate(booking.booking_date)}</td><td className="px-2.5 py-1 text-center">{shortTime(booking.start_time)} - {shortTime(booking.end_time)}</td><td className="px-2.5 py-1 text-center">{formatMoney(booking.total_price)}</td><td className="px-2.5 py-1 text-center"><span className={`rounded-md px-2 py-0.5 text-[11px] ${meta[1]}`}>{meta[0]}</span></td><td className="px-2.5 py-1 text-center"><button type="button" className="inline-flex items-center gap-1 rounded-md border border-[#dce3e8] px-2 py-0.5 text-[11px]"><Eye className="h-3 w-3" />ดูรายละเอียด</button></td></tr>; })}{!loading && dashboard.periodBookings.length === 0 && <tr><td colSpan="8" className="h-[100px] text-center text-[#697386]">ยังไม่มีรายการจองในช่วงเวลานี้</td></tr>}</tbody></table></div></section></>}
          {selectedDashboardBooking && <AdminBookingManagementModal booking={selectedDashboardBooking} onClose={() => setSelectedDashboardBooking(null)} />}
        </main>
      </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
