import { useState } from 'react';
import { Ban, CalendarDays, CheckCircle2, Clock3, CreditCard, Mail, MapPin, Phone, ReceiptText, ShieldCheck, Star, UserRound, X } from 'lucide-react';
import bookingService from '../../services/bookingService';
import sportBg from '../../assets/bg.png';

const statusMeta = {
  approved: ['อนุมัติแล้ว', 'text-green-700 bg-green-50 border-green-200'], pending_payment: ['รอชำระเงิน', 'text-amber-700 bg-amber-50 border-amber-200'],
  cancelled: ['ยกเลิก', 'text-red-600 bg-red-50 border-red-200'], pending_approval: ['ติดต่อแอดมิน', 'text-slate-600 bg-slate-50 border-slate-200'], rejected: ['ติดต่อแอดมิน', 'text-slate-600 bg-slate-50 border-slate-200'],
};
const shortTime = (value) => String(value || '').slice(0, 5);
const formatDate = (value) => {
  const [year, month, day] = String(value || '').slice(0, 10).split('-').map(Number);
  if (!year || !month || !day) return '-';
  return new Intl.DateTimeFormat('th-TH', { day: 'numeric', month: 'short', year: 'numeric', weekday: 'long' }).format(new Date(Date.UTC(year, month - 1, day)));
};
const formatPaidAt = (value) => {
  if (!value) return 'ยังไม่ได้ชำระเงิน';
  const normalized = String(value).replace(' ', 'T');
  const date = new Date(normalized);
  if (Number.isNaN(date.getTime())) return '-';
  return new Intl.DateTimeFormat('th-TH', {
    timeZone: 'Asia/Bangkok', day: 'numeric', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit', hourCycle: 'h23',
  }).format(date) + ' น.';
};
const paymentMethodLabel = (booking) => {
  if (booking.payment_method === 'promptpay' || booking.slip_image_path) return 'พร้อมเพย์';
  if (booking.payment_method === 'cash' || booking.status === 'approved') return 'เงินสดหน้าร้าน';
  return 'ยังไม่ได้ชำระเงิน';
};
const Detail = ({ icon: Icon, label, value }) => <div className="relative flex min-h-[52px] items-center gap-2.5 rounded-[12px] border border-[#d8e6dd] bg-white/85 px-3 py-1.5 shadow-[0_2px_8px_rgba(22,62,39,.04)] before:absolute before:-left-1.5 before:top-1/2 before:h-2.5 before:w-2.5 before:-translate-y-1/2 before:rounded-full before:bg-[#edf4ef] after:absolute after:-right-1.5 after:top-1/2 after:h-2.5 after:w-2.5 after:-translate-y-1/2 after:rounded-full after:bg-[#edf4ef]"><span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-gradient-to-br from-[#049b48] to-[#00682f] text-white shadow-[0_4px_10px_rgba(5,124,57,.2)]"><Icon className="h-4 w-4" /></span><div className="min-w-0 flex-1"><p className="text-[10px] font-medium text-[#69756f]">{label}</p><strong className="block truncate text-xs font-bold text-[#132139]">{value || '-'}</strong></div></div>;

const AdminBookingManagementModal = ({ booking, onClose }) => {
  const [current, setCurrent] = useState(booking);
  const [confirmAction, setConfirmAction] = useState('');
  const [updating, setUpdating] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  if (!current) return null;
  const meta = statusMeta[current.status] || statusMeta.cancelled;

  const updateStatus = async (nextStatus) => {
    if (updating) return;
    setUpdating(true); setErrorMessage('');
    try {
      const isCashApproval = nextStatus === 'approved' && current.status === 'pending_payment';
      const result = isCashApproval
        ? await bookingService.approveCashBooking(current.id)
        : await bookingService.updateBookingStatusAdmin(current.id, nextStatus);
      const updated = result.booking || { ...current, status: nextStatus, reject_reason: null };
      setCurrent(updated);
      window.dispatchEvent(new CustomEvent('admin-booking-status-updated', { detail: updated }));
      setConfirmAction('');
    } catch (error) {
      setErrorMessage(error.response?.data?.message || 'ไม่สามารถเปลี่ยนสถานะรายการจองได้');
    } finally { setUpdating(false); }
  };

  return <div className="fixed inset-0 z-[130] grid place-items-center overflow-y-auto bg-[#071525]/65 p-3 backdrop-blur-[3px]" onMouseDown={(event) => { if (event.target === event.currentTarget && !updating) onClose(); }}>
    <section className="relative grid w-full max-w-[780px] grid-cols-[190px_minmax(0,1fr)] overflow-hidden rounded-[20px] border border-white/70 bg-[#f8fbf9] shadow-[0_20px_50px_rgba(3,19,31,.32)] max-md:max-w-[500px] max-md:grid-cols-1" style={{ backgroundImage: `linear-gradient(rgba(255,255,255,.18),rgba(255,255,255,.18)),url(${sportBg})`, backgroundSize: 'cover', backgroundPosition: 'center' }}>
      <aside className="relative flex flex-col border-r border-dashed border-[#aab9af] bg-white/55 max-md:hidden">
        <div className="relative flex h-[125px] flex-col items-center justify-center overflow-hidden bg-gradient-to-br from-[#049b48] to-[#006a31] text-white"><div className="absolute inset-0 opacity-20" style={{ backgroundImage: `url(${sportBg})`, backgroundSize: 'cover', backgroundPosition: 'left center' }} /><span className="relative grid h-12 w-12 place-items-center rounded-[14px] border-2 border-white/80 bg-white/10"><ShieldCheck className="h-7 w-7" /></span><strong className="relative mt-1.5 text-sm italic tracking-wide">SPORT COMPLEX</strong><small className="relative mt-0.5 text-[9px] tracking-[.18em]">BOOKING TICKET</small></div>
        <div className="flex flex-1 flex-col items-center px-4 py-3 text-center"><p className="text-[10px] font-semibold tracking-[.18em] text-[#087c3b]">BOOKING ID</p><div className="mt-1 flex items-center gap-2"><Star className="h-3 w-3 fill-[#07883d] text-[#07883d]" /><strong className="text-2xl font-black text-[#102139]">#{current.id}</strong><Star className="h-3 w-3 fill-[#07883d] text-[#07883d]" /></div><div className="my-2.5 w-full border-t border-dashed border-[#aebbb3]" /><p className="text-[10px] font-semibold text-[#087c3b]">สถานะปัจจุบัน</p><div className={`mt-1.5 w-full rounded-lg border px-2.5 py-1.5 text-xs font-bold ${meta[1]}`}>{meta[0]}</div><div className="my-2.5 w-full border-t border-dashed border-[#aebbb3]" /><p className="text-[10px] font-semibold text-[#087c3b]">ยอดชำระทั้งหมด</p><strong className="mt-0.5 text-2xl font-bold text-[#07883d]">฿{Number(current.total_price || 0).toLocaleString('th-TH')}</strong></div>
        <span aria-hidden="true" className="pointer-events-none absolute -left-2 bottom-2 top-2 z-20 w-4" style={{ backgroundImage: 'radial-gradient(circle,#edf4ef 0 5px,transparent 5.5px)', backgroundPosition: 'center top', backgroundSize: '14px 14px' }} />
        <span aria-hidden="true" className="pointer-events-none absolute -right-2 bottom-2 top-2 z-20 w-4" style={{ backgroundImage: 'radial-gradient(circle,#edf4ef 0 5px,transparent 5.5px)', backgroundPosition: 'center top', backgroundSize: '14px 14px' }} />
      </aside>

      <div className="relative bg-white/10 p-4 max-sm:p-3">
        <button type="button" disabled={updating} onClick={onClose} className="absolute right-3.5 top-3.5 z-10 grid h-8 w-8 place-items-center rounded-full border border-[#9ba9a0] bg-white/80 text-[#172137] transition hover:bg-white"><X className="h-4.5 w-4.5" /></button>
        <header className="pr-12"><div className="flex items-center gap-1.5 text-[#0b8b42]"><span className="h-px w-6 bg-[#0b8b42]" /><Star className="h-3 w-3 fill-current" /><Star className="h-4 w-4 fill-current" /><Star className="h-3 w-3 fill-current" /><span className="h-px w-6 bg-[#0b8b42]" /></div><h2 className="mt-0.5 text-xl font-black italic tracking-wide text-[#00652f] max-sm:text-lg">BOOKING DETAILS</h2><p className="text-xs font-semibold text-[#667169]">รายละเอียดการจอง</p></header>
        <div className="mt-2.5 grid grid-cols-2 gap-2 max-sm:grid-cols-1"><Detail icon={UserRound} label="ลูกค้า" value={current.username} /><Detail icon={Mail} label="อีเมล" value={current.email} /><Detail icon={Phone} label="เบอร์โทรศัพท์" value={current.contact_phone} /><Detail icon={MapPin} label="สนาม" value={current.court_name} /><Detail icon={CalendarDays} label="วันที่ใช้งาน" value={formatDate(current.booking_date)} /><Detail icon={Clock3} label="ช่วงเวลา" value={`${shortTime(current.start_time)} - ${shortTime(current.end_time)} น.`} /><Detail icon={CreditCard} label="วิธีชำระเงิน" value={paymentMethodLabel(current)} /><Detail icon={ReceiptText} label="วันและเวลาที่ชำระ" value={formatPaidAt(current.paid_at || current.transfer_time || current.uploaded_at)} /></div>
        <div className="mt-2 flex h-[38px] items-center rounded-[12px] border border-[#d7e5dc] bg-white/70 px-4 text-[#08783a]"><span className="font-serif text-sm italic">Thank you for booking with us! ♡</span></div>
        {current.status === 'pending_payment' && <p className="mt-2 rounded-lg border border-blue-200 bg-blue-50/90 px-3 py-1.5 text-xs text-blue-700">หากลูกค้าชำระเงินสดหน้าร้านแล้ว สามารถกด “อนุมัติรับเงินสด” ได้ทันที</p>}{errorMessage && <p className="mt-2 rounded-lg border border-red-200 bg-red-50 p-2.5 text-xs text-red-700">{errorMessage}</p>}
        <div className="mt-2.5 border-t border-dashed border-[#aebbb3] pt-2.5">{confirmAction ? <div className="rounded-lg border border-amber-200 bg-amber-50 p-2.5 text-xs"><p className="text-center font-semibold">{confirmAction === 'approved' && current.status === 'pending_payment' ? 'ยืนยันว่าได้รับเงินสดครบถ้วน และต้องการอนุมัติรายการนี้หรือไม่?' : `ยืนยันการ${confirmAction === 'approved' ? 'อนุมัติ' : 'ยกเลิก'}รายการนี้หรือไม่?`}</p><div className="mt-2 flex gap-2"><button type="button" disabled={updating} onClick={() => setConfirmAction('')} className="h-8 flex-1 rounded-lg border bg-white font-semibold">กลับ</button><button type="button" disabled={updating} onClick={() => updateStatus(confirmAction)} className={`h-8 flex-1 rounded-lg font-semibold text-white ${confirmAction === 'approved' ? 'bg-[#07883d]' : 'bg-[#e43d4b]'}`}>{updating ? 'กำลังบันทึก...' : 'ยืนยัน'}</button></div></div> : <div className="grid grid-cols-2 gap-3"><button type="button" disabled={current.status === 'cancelled'} onClick={() => setConfirmAction('cancelled')} className="flex h-9 items-center justify-center gap-1.5 rounded-lg border-2 border-red-400 bg-white/85 text-xs font-bold text-red-600 disabled:opacity-40"><Ban className="h-4 w-4" />ยกเลิกรายการ</button><button type="button" disabled={['approved','cancelled'].includes(current.status)} onClick={() => setConfirmAction('approved')} className="flex h-9 items-center justify-center gap-1.5 rounded-lg bg-gradient-to-r from-[#087b3b] to-[#09a34b] text-xs font-bold text-white shadow-md disabled:bg-none disabled:bg-[#9ac9ad]"><CheckCircle2 className="h-4 w-4" />{current.status === 'pending_payment' ? 'อนุมัติรับเงินสด' : 'อนุมัติรายการ'}</button></div>}</div>
      </div>
      <span className="absolute -top-5 left-[150px] z-30 h-10 w-[70px] rounded-b-full border-b border-[#d8e5dc] bg-[#edf4ef] max-md:hidden" /><span className="absolute -bottom-5 left-[150px] z-30 h-10 w-[70px] rounded-t-full border-t border-[#d8e5dc] bg-[#edf4ef] max-md:hidden" />
    </section>
  </div>;
};

export default AdminBookingManagementModal;
