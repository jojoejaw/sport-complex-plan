import { useState } from 'react';
import { Ban, CalendarDays, CheckCircle2, Clock3, Mail, MapPin, Phone, UserRound, X } from 'lucide-react';
import bookingService from '../../services/bookingService';

const statusMeta = {
  approved: ['อนุมัติแล้ว', 'bg-green-100 text-green-700'], pending_payment: ['รอชำระเงิน', 'bg-amber-100 text-amber-700'],
  cancelled: ['ยกเลิก', 'bg-red-100 text-red-700'], pending_approval: ['ติดต่อแอดมิน', 'bg-slate-100 text-slate-600'], rejected: ['ติดต่อแอดมิน', 'bg-slate-100 text-slate-600'],
};
const shortTime = (value) => String(value || '').slice(0, 5);
const formatDate = (value) => {
  const [year, month, day] = String(value || '').slice(0, 10).split('-').map(Number);
  if (!year || !month || !day) return '-';
  return new Intl.DateTimeFormat('th-TH', { day: 'numeric', month: 'short', year: 'numeric' }).format(new Date(Date.UTC(year, month - 1, day)));
};
const Detail = ({ icon: Icon, label, value }) => <div className="flex gap-3 rounded-xl border border-[#e7ece9] p-3"><span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-[#eaf8ef] text-[#07883d]"><Icon className="h-4 w-4" /></span><div className="min-w-0"><p className="text-[11px] text-[#758079]">{label}</p><strong className="block truncate text-sm">{value || '-'}</strong></div></div>;

const AdminBookingManagementModal = ({ booking, onClose }) => {
  const [current, setCurrent] = useState(booking);
  const [confirmAction, setConfirmAction] = useState('');
  const [updating, setUpdating] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  if (!current) return null;

  const updateStatus = async (nextStatus) => {
    if (updating) return;
    setUpdating(true); setErrorMessage('');
    try {
      await bookingService.updateBookingStatusAdmin(current.id, nextStatus);
      const updated = { ...current, status: nextStatus, reject_reason: null };
      setCurrent(updated);
      window.dispatchEvent(new CustomEvent('admin-booking-status-updated', { detail: updated }));
      setConfirmAction('');
    } catch (error) {
      setErrorMessage(error.response?.data?.message || 'ไม่สามารถเปลี่ยนสถานะรายการจองได้');
    } finally { setUpdating(false); }
  };

  const meta = statusMeta[current.status] || statusMeta.cancelled;
  return <div className="fixed inset-0 z-[130] grid place-items-center bg-[#071421]/45 p-4 backdrop-blur-[2px]" onMouseDown={(event) => { if (event.target === event.currentTarget && !updating) onClose(); }}><section className="w-full max-w-[620px] overflow-hidden rounded-[22px] bg-white shadow-2xl"><header className="flex items-start justify-between bg-gradient-to-r from-[#071b30] to-[#087d3d] px-6 py-5 text-white"><div><p className="text-xs font-semibold tracking-[.16em] text-green-200">BOOKING DETAILS</p><h2 className="mt-1 text-xl font-bold">จัดการรายการจอง #{current.id}</h2></div><button type="button" disabled={updating} onClick={onClose} className="grid h-9 w-9 place-items-center rounded-full bg-white/15"><X className="h-5 w-5" /></button></header><div className="p-6"><div className="mb-4 flex items-center justify-between rounded-xl border border-[#e0e8e3] bg-[#f7faf8] p-3"><span className="text-sm text-[#697386]">สถานะปัจจุบัน</span><span className={`rounded-lg px-3 py-1.5 text-xs font-bold ${meta[1]}`}>{meta[0]}</span></div><div className="grid gap-3 sm:grid-cols-2"><Detail icon={UserRound} label="ลูกค้า" value={current.username} /><Detail icon={Mail} label="อีเมล" value={current.email} /><Detail icon={Phone} label="เบอร์โทรศัพท์" value={current.contact_phone} /><Detail icon={MapPin} label="สนาม" value={current.court_name} /><Detail icon={CalendarDays} label="วันที่ใช้งาน" value={formatDate(current.booking_date)} /><Detail icon={Clock3} label="ช่วงเวลา" value={`${shortTime(current.start_time)} - ${shortTime(current.end_time)} น.`} /></div><div className="mt-3 flex items-center justify-between rounded-xl border border-[#dce8e0] bg-[#eff9f2] px-4 py-3"><span className="text-sm font-semibold">ยอดชำระทั้งหมด</span><strong className="text-xl text-[#07883d]">฿{Number(current.total_price || 0).toLocaleString('th-TH')}</strong></div>{current.status === 'pending_payment' && <p className="mt-3 rounded-xl border border-blue-200 bg-blue-50 p-3 text-xs text-blue-700">หากลูกค้าชำระเงินสดหน้าร้านแล้ว สามารถกด “อนุมัติรับเงินสด” ได้ทันที</p>}{errorMessage && <p className="mt-3 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">{errorMessage}</p>}{confirmAction ? <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm"><p className="font-semibold">{confirmAction === 'approved' && current.status === 'pending_payment' ? 'ยืนยันว่าได้รับเงินสดครบถ้วน และต้องการอนุมัติรายการนี้หรือไม่?' : `ยืนยันการ${confirmAction === 'approved' ? 'อนุมัติ' : 'ยกเลิก'}รายการนี้หรือไม่?`}</p><div className="mt-3 flex gap-2"><button type="button" disabled={updating} onClick={() => setConfirmAction('')} className="h-9 flex-1 rounded-lg border bg-white font-semibold">กลับ</button><button type="button" disabled={updating} onClick={() => updateStatus(confirmAction)} className={`h-9 flex-1 rounded-lg font-semibold text-white ${confirmAction === 'approved' ? 'bg-[#07883d]' : 'bg-[#e43d4b]'}`}>{updating ? 'กำลังบันทึก...' : 'ยืนยัน'}</button></div></div> : <div className="mt-5 grid grid-cols-2 gap-3"><button type="button" disabled={current.status === 'cancelled'} onClick={() => setConfirmAction('cancelled')} className="flex h-11 items-center justify-center gap-2 rounded-xl border border-red-200 font-semibold text-red-600 disabled:opacity-40"><Ban className="h-4 w-4" />ยกเลิกรายการ</button><button type="button" disabled={['approved','cancelled'].includes(current.status)} onClick={() => setConfirmAction('approved')} className="flex h-11 items-center justify-center gap-2 rounded-xl bg-[#07883d] font-semibold text-white disabled:bg-[#9ac9ad]"><CheckCircle2 className="h-4 w-4" />{current.status === 'pending_payment' ? 'อนุมัติรับเงินสด' : 'อนุมัติรายการ'}</button></div>}</div></section></div>;
};

export default AdminBookingManagementModal;
