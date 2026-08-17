import { useEffect, useMemo, useState } from 'react';
import { CalendarDays, ChevronLeft, ChevronRight, Search } from 'lucide-react';
import AdminBookingManagementModal from './AdminBookingManagementModal';

const dateKey = (value) => String(value || '').slice(0, 10);
const formatDate = (value) => {
  const [year, month, day] = dateKey(value).split('-').map(Number);
  if (!year || !month || !day) return '-';
  return new Intl.DateTimeFormat('th-TH', { day: 'numeric', month: 'short', year: 'numeric' }).format(new Date(Date.UTC(year, month - 1, day)));
};
const statusMeta = {
  approved: ['อนุมัติแล้ว', 'bg-green-100 text-green-700'], pending_payment: ['รอชำระเงิน', 'bg-amber-100 text-amber-700'],
  cancelled: ['ยกเลิก', 'bg-red-100 text-red-700'], pending_approval: ['ติดต่อแอดมิน', 'bg-slate-100 text-slate-600'], rejected: ['ติดต่อแอดมิน', 'bg-slate-100 text-slate-600'],
};

const AdminBookingsPanel = ({ bookings, loading }) => {
  const [items, setItems] = useState(bookings);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('all');
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState(null);
  useEffect(() => setItems(bookings), [bookings]);
  useEffect(() => {
    const sync = (event) => { setItems((current) => current.map((item) => item.id === event.detail.id ? event.detail : item)); setSelected((current) => current?.id === event.detail.id ? event.detail : current); };
    window.addEventListener('admin-booking-status-updated', sync);
    return () => window.removeEventListener('admin-booking-status-updated', sync);
  }, []);

  const filtered = useMemo(() => {
    const keyword = search.trim().toLocaleLowerCase('th-TH');
    return items.filter((item) => `${item.id} ${item.username || ''} ${item.court_name || ''}`.toLocaleLowerCase('th-TH').includes(keyword) && (status === 'all' || item.status === status));
  }, [items, search, status]);
  const pageSize = 10;
  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const visible = filtered.slice((safePage - 1) * pageSize, safePage * pageSize);

  return <div><header className="mb-4 flex items-end justify-between rounded-[18px] border border-[#e2e9e5] bg-white px-5 py-4 shadow-sm"><div><p className="text-xs font-semibold uppercase tracking-[.18em] text-[#079143]">ADMIN / BOOKINGS</p><h1 className="mt-1 text-2xl font-bold">รายการจอง</h1><p className="mt-1 text-sm text-[#657085]">คลิกที่รายการเพื่อดูรายละเอียดและจัดการสถานะ</p></div><strong className="rounded-xl bg-[#eaf8ef] px-4 py-2 text-sm text-[#07883d]">ทั้งหมด {items.length} รายการ</strong></header>
    <section className="overflow-hidden rounded-[18px] border border-[#e3e8ed] bg-white shadow-sm"><div className="flex gap-3 border-b border-[#e6ebe8] p-4"><label className="relative flex-1"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#738095]" /><input value={search} onChange={(event) => { setSearch(event.target.value); setPage(1); }} placeholder="ค้นหา Booking ID ลูกค้า หรือสนาม" className="h-10 w-full rounded-xl border border-[#dce3e8] pl-10 pr-3 text-sm outline-none focus:border-[#079143]" /></label><select value={status} onChange={(event) => { setStatus(event.target.value); setPage(1); }} className="h-10 min-w-[180px] rounded-xl border border-[#dce3e8] bg-white px-3 text-sm"><option value="all">ทุกสถานะ</option><option value="pending_payment">รอชำระเงิน</option><option value="approved">อนุมัติแล้ว</option><option value="cancelled">ยกเลิก</option></select></div>
      <div className="overflow-x-auto"><table className="w-full min-w-[900px] text-xs"><thead className="bg-[#f7faf8] text-[#596376]"><tr>{['Booking ID','ชื่อลูกค้า','สนาม','วันที่ใช้งาน','ช่วงเวลา','ยอดชำระ','สถานะ'].map((title) => <th key={title} className="px-4 py-3 text-center font-medium">{title}</th>)}</tr></thead><tbody>{visible.map((item) => { const meta = statusMeta[item.status] || statusMeta.cancelled; return <tr key={item.id} tabIndex="0" onClick={() => setSelected(item)} onKeyDown={(event) => { if (event.key === 'Enter') setSelected(item); }} className="cursor-pointer border-t border-[#edf0f2] transition-colors hover:bg-[#eef8f1] focus:bg-[#eef8f1] focus:outline-none"><td className="px-4 py-3 text-center font-bold text-[#07883d]">#{item.id}</td><td className="px-4 py-3 text-center">{item.username || '-'}</td><td className="px-4 py-3 text-center font-medium">{item.court_name || '-'}</td><td className="px-4 py-3 text-center">{formatDate(item.booking_date)}</td><td className="px-4 py-3 text-center">{String(item.start_time || '').slice(0,5)} - {String(item.end_time || '').slice(0,5)}</td><td className="px-4 py-3 text-center font-semibold">฿{Number(item.total_price || 0).toLocaleString('th-TH')}</td><td className="px-4 py-3 text-center"><span className={`rounded-lg px-3 py-1.5 font-semibold ${meta[1]}`}>{meta[0]}</span></td></tr>; })}{!loading && visible.length === 0 && <tr><td colSpan="7" className="h-[260px] text-center text-[#697386]"><CalendarDays className="mx-auto mb-3 h-10 w-10 opacity-40" />ไม่พบรายการจอง</td></tr>}</tbody></table></div>
      <footer className="flex items-center justify-between border-t border-[#e6ebe8] px-4 py-3 text-xs text-[#667185]"><span>แสดง {visible.length} จาก {filtered.length} รายการ</span><div className="flex items-center gap-2"><button type="button" disabled={safePage === 1} onClick={() => setPage((value) => Math.max(1, value - 1))} className="grid h-8 w-8 place-items-center rounded-lg border disabled:opacity-40"><ChevronLeft className="h-4 w-4" /></button><b>หน้า {safePage} / {totalPages}</b><button type="button" disabled={safePage === totalPages} onClick={() => setPage((value) => Math.min(totalPages, value + 1))} className="grid h-8 w-8 place-items-center rounded-lg border disabled:opacity-40"><ChevronRight className="h-4 w-4" /></button></div></footer></section>
    {selected && <AdminBookingManagementModal booking={selected} onClose={() => setSelected(null)} />}
  </div>;
};

export default AdminBookingsPanel;
