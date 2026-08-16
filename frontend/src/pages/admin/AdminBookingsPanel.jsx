import { useEffect, useMemo, useState } from 'react';
import { Ban, CalendarDays, CheckCircle2, ChevronLeft, ChevronRight, Clock3, Mail, MapPin, Phone, Search, UserRound, X } from 'lucide-react';
import bookingService from '../../services/bookingService';

const dateKey = (value) => String(value || '').slice(0, 10);
const shortTime = (value) => String(value || '').slice(0, 5);
const formatDate = (value) => {
  const [year, month, day] = dateKey(value).split('-').map(Number);
  if (!year || !month || !day) return '-';
  return new Intl.DateTimeFormat('th-TH', { day: 'numeric', month: 'short', year: 'numeric' }).format(new Date(Date.UTC(year, month - 1, day)));
};
const statusMeta = {
  approved: ['อนุมัติแล้ว', 'bg-green-100 text-green-700'], pending_payment: ['รอชำระเงิน', 'bg-amber-100 text-amber-700'],
  cancelled: ['ยกเลิก', 'bg-red-100 text-red-700'], pending_approval: ['ติดต่อแอดมิน', 'bg-slate-100 text-slate-600'], rejected: ['ติดต่อแอดมิน', 'bg-slate-100 text-slate-600'],
};
const Detail = ({ icon: Icon, label, value }) => <div className="flex gap-3 rounded-xl border border-[#e7ece9] p-3"><span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-[#eaf8ef] text-[#07883d]"><Icon className="h-4 w-4" /></span><div className="min-w-0"><p className="text-[11px] text-[#758079]">{label}</p><strong className="block truncate text-sm">{value || '-'}</strong></div></div>;

const AdminBookingsPanel = ({ bookings, loading }) => {
  const [items, setItems] = useState(bookings);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('all');
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState(null);
  const [confirmAction, setConfirmAction] = useState('');
  const [updating, setUpdating] = useState(false);
  const [actionError, setActionError] = useState('');
  useEffect(() => setItems(bookings), [bookings]);

  const filtered = useMemo(() => {
    const keyword = search.trim().toLocaleLowerCase('th-TH');
    return items.filter((item) => `${item.id} ${item.username || ''} ${item.court_name || ''}`.toLocaleLowerCase('th-TH').includes(keyword) && (status === 'all' || item.status === status));
  }, [items, search, status]);
  const pageSize = 10;
  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const visible = filtered.slice((safePage - 1) * pageSize, safePage * pageSize);
  const openBooking = (booking) => { setSelected(booking); setConfirmAction(''); setActionError(''); };

  const updateStatus = async (nextStatus) => {
    if (!selected || updating) return;
    setUpdating(true); setActionError('');
    try {
      await bookingService.updateBookingStatusAdmin(selected.id, nextStatus);
      const updated = { ...selected, status: nextStatus, reject_reason: null };
      setItems((current) => current.map((item) => item.id === selected.id ? updated : item));
      window.dispatchEvent(new CustomEvent('admin-booking-status-updated', { detail: updated }));
      setSelected(updated); setConfirmAction('');
    } catch (error) {
      setActionError(error.response?.data?.message || 'ไม่สามารถเปลี่ยนสถานะรายการจองได้');
    } finally { setUpdating(false); }
  };

  return <div>
    <header className="mb-4 flex items-end justify-between rounded-[18px] border border-[#e2e9e5] bg-white px-5 py-4 shadow-sm"><div><p className="text-xs font-semibold uppercase tracking-[.18em] text-[#079143]">ADMIN / BOOKINGS</p><h1 className="mt-1 text-2xl font-bold">รายการจอง</h1><p className="mt-1 text-sm text-[#657085]">คลิกที่รายการเพื่อดูรายละเอียดและจัดการสถานะ</p></div><strong className="rounded-xl bg-[#eaf8ef] px-4 py-2 text-sm text-[#07883d]">ทั้งหมด {items.length} รายการ</strong></header>
    <section className="overflow-hidden rounded-[18px] border border-[#e3e8ed] bg-white shadow-sm">
      <div className="flex gap-3 border-b border-[#e6ebe8] p-4"><label className="relative flex-1"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#738095]" /><input value={search} onChange={(event) => { setSearch(event.target.value); setPage(1); }} placeholder="ค้นหา Booking ID ลูกค้า หรือสนาม" className="h-10 w-full rounded-xl border border-[#dce3e8] pl-10 pr-3 text-sm outline-none focus:border-[#079143]" /></label><select value={status} onChange={(event) => { setStatus(event.target.value); setPage(1); }} className="h-10 min-w-[180px] rounded-xl border border-[#dce3e8] bg-white px-3 text-sm"><option value="all">ทุกสถานะ</option><option value="pending_payment">รอชำระเงิน</option><option value="approved">อนุมัติแล้ว</option><option value="cancelled">ยกเลิก</option></select></div>
      <div className="overflow-x-auto"><table className="w-full min-w-[900px] text-xs"><thead className="bg-[#f7faf8] text-[#596376]"><tr>{['Booking ID','ชื่อลูกค้า','สนาม','วันที่ใช้งาน','ช่วงเวลา','ยอดชำระ','สถานะ'].map((title) => <th key={title} className="px-4 py-3 text-center font-medium">{title}</th>)}</tr></thead><tbody>{visible.map((item) => { const meta = statusMeta[item.status] || statusMeta.cancelled; return <tr key={item.id} tabIndex="0" onClick={() => openBooking(item)} onKeyDown={(event) => { if (event.key === 'Enter') openBooking(item); }} className="cursor-pointer border-t border-[#edf0f2] transition-colors hover:bg-[#eef8f1] focus:bg-[#eef8f1] focus:outline-none"><td className="px-4 py-3 text-center font-bold text-[#07883d]">#{item.id}</td><td className="px-4 py-3 text-center">{item.username || '-'}</td><td className="px-4 py-3 text-center font-medium">{item.court_name || '-'}</td><td className="px-4 py-3 text-center">{formatDate(item.booking_date)}</td><td className="px-4 py-3 text-center">{shortTime(item.start_time)} - {shortTime(item.end_time)}</td><td className="px-4 py-3 text-center font-semibold">฿{Number(item.total_price || 0).toLocaleString('th-TH')}</td><td className="px-4 py-3 text-center"><span className={`rounded-lg px-3 py-1.5 font-semibold ${meta[1]}`}>{meta[0]}</span></td></tr>; })}{!loading && visible.length === 0 && <tr><td colSpan="7" className="h-[260px] text-center text-[#697386]"><CalendarDays className="mx-auto mb-3 h-10 w-10 opacity-40" />ไม่พบรายการจอง</td></tr>}</tbody></table></div>
      <footer className="flex items-center justify-between border-t border-[#e6ebe8] px-4 py-3 text-xs text-[#667185]"><span>แสดง {visible.length} จาก {filtered.length} รายการ</span><div className="flex items-center gap-2"><button type="button" disabled={safePage === 1} onClick={() => setPage((value) => Math.max(1, value - 1))} className="grid h-8 w-8 place-items-center rounded-lg border disabled:opacity-40"><ChevronLeft className="h-4 w-4" /></button><b>หน้า {safePage} / {totalPages}</b><button type="button" disabled={safePage === totalPages} onClick={() => setPage((value) => Math.min(totalPages, value + 1))} className="grid h-8 w-8 place-items-center rounded-lg border disabled:opacity-40"><ChevronRight className="h-4 w-4" /></button></div></footer>
    </section>

    {selected && <div className="fixed inset-0 z-[120] grid place-items-center bg-[#071421]/45 p-4 backdrop-blur-[2px]" onMouseDown={(event) => { if (event.target === event.currentTarget && !updating) setSelected(null); }}><section className="w-full max-w-[620px] overflow-hidden rounded-[22px] bg-white shadow-2xl"><header className="flex items-start justify-between bg-gradient-to-r from-[#071b30] to-[#087d3d] px-6 py-5 text-white"><div><p className="text-xs font-semibold tracking-[.16em] text-green-200">BOOKING DETAILS</p><h2 className="mt-1 text-xl font-bold">จัดการรายการจอง #{selected.id}</h2></div><button type="button" disabled={updating} onClick={() => setSelected(null)} className="grid h-9 w-9 place-items-center rounded-full bg-white/15"><X className="h-5 w-5" /></button></header><div className="p-6"><div className="mb-4 flex items-center justify-between rounded-xl border border-[#e0e8e3] bg-[#f7faf8] p-3"><span className="text-sm text-[#697386]">สถานะปัจจุบัน</span><span className={`rounded-lg px-3 py-1.5 text-xs font-bold ${(statusMeta[selected.status] || statusMeta.cancelled)[1]}`}>{(statusMeta[selected.status] || statusMeta.cancelled)[0]}</span></div><div className="grid gap-3 sm:grid-cols-2"><Detail icon={UserRound} label="ลูกค้า" value={selected.username} /><Detail icon={Mail} label="อีเมล" value={selected.email} /><Detail icon={Phone} label="เบอร์โทรศัพท์" value={selected.contact_phone} /><Detail icon={MapPin} label="สนาม" value={selected.court_name} /><Detail icon={CalendarDays} label="วันที่ใช้งาน" value={formatDate(selected.booking_date)} /><Detail icon={Clock3} label="ช่วงเวลา" value={`${shortTime(selected.start_time)} - ${shortTime(selected.end_time)} น.`} /></div><div className="mt-3 flex items-center justify-between rounded-xl border border-[#dce8e0] bg-[#eff9f2] px-4 py-3"><span className="text-sm font-semibold">ยอดชำระทั้งหมด</span><strong className="text-xl text-[#07883d]">฿{Number(selected.total_price || 0).toLocaleString('th-TH')}</strong></div>{selected.reject_reason && <p className="mt-3 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700"><b>เหตุผลเดิม:</b> {selected.reject_reason}</p>}{selected.status === 'pending_payment' && <p className="mt-3 rounded-xl border border-blue-200 bg-blue-50 p-3 text-xs text-blue-700">หากลูกค้าชำระเงินสดหน้าร้านแล้ว แอดมินสามารถกด “อนุมัติรับเงินสด” เพื่อยืนยันรายการนี้ได้ทันที</p>}{actionError && <p className="mt-3 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">{actionError}</p>}{confirmAction ? <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm"><p className="font-semibold">{confirmAction === 'approved' && selected.status === 'pending_payment' ? 'ยืนยันว่าได้รับเงินสดจากลูกค้าครบถ้วน และต้องการอนุมัติรายการนี้หรือไม่?' : `ยืนยันการ${confirmAction === 'approved' ? 'อนุมัติ' : 'ยกเลิก'}รายการนี้หรือไม่?`}</p><div className="mt-3 flex gap-2"><button type="button" disabled={updating} onClick={() => setConfirmAction('')} className="h-9 flex-1 rounded-lg border bg-white font-semibold">กลับ</button><button type="button" disabled={updating} onClick={() => updateStatus(confirmAction)} className={`h-9 flex-1 rounded-lg font-semibold text-white ${confirmAction === 'approved' ? 'bg-[#07883d]' : 'bg-[#e43d4b]'}`}>{updating ? 'กำลังบันทึก...' : 'ยืนยัน'}</button></div></div> : <div className="mt-5 grid grid-cols-2 gap-3"><button type="button" disabled={selected.status === 'cancelled' || updating} onClick={() => setConfirmAction('cancelled')} className="flex h-11 items-center justify-center gap-2 rounded-xl border border-red-200 text-sm font-semibold text-red-600 disabled:opacity-40"><Ban className="h-4 w-4" />ยกเลิกรายการ</button><button type="button" disabled={['approved','cancelled'].includes(selected.status) || updating} onClick={() => setConfirmAction('approved')} className="flex h-11 items-center justify-center gap-2 rounded-xl bg-[#07883d] text-sm font-semibold text-white disabled:bg-[#9ac9ad]"><CheckCircle2 className="h-4 w-4" />{selected.status === 'pending_payment' ? 'อนุมัติรับเงินสด' : 'อนุมัติรายการ'}</button></div>}</div></section></div>}
  </div>;
};

export default AdminBookingsPanel;
