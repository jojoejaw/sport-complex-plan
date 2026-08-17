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
const Detail = ({ icon: Icon, label, value }) => <div className="relative flex min-h-[76px] items-center gap-3 rounded-[15px] border border-[#d8e6dd] bg-white/85 px-4 py-2.5 shadow-[0_3px_10px_rgba(22,62,39,.04)] before:absolute before:-left-1.5 before:top-1/2 before:h-3 before:w-3 before:-translate-y-1/2 before:rounded-full before:bg-[#edf4ef] after:absolute after:-right-1.5 after:top-1/2 after:h-3 after:w-3 after:-translate-y-1/2 after:rounded-full after:bg-[#edf4ef]"><span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-gradient-to-br from-[#049b48] to-[#00682f] text-white shadow-[0_5px_12px_rgba(5,124,57,.25)]"><Icon className="h-5 w-5" /></span><div className="min-w-0"><p className="text-[11px] font-medium text-[#69756f]">{label}</p><strong className="mt-0.5 block truncate text-[15px] text-[#132139]">{value || '-'}</strong></div></div>;

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
      await bookingService.updateBookingStatusAdmin(current.id, nextStatus);
      const updated = {
        ...current,
        status: nextStatus,
        reject_reason: null,
        ...(nextStatus === 'approved' && !current.slip_image_path
          ? { payment_method: 'cash', paid_at: new Date().toISOString() }
          : {}),
      };
      setCurrent(updated);
      window.dispatchEvent(new CustomEvent('admin-booking-status-updated', { detail: updated }));
      setConfirmAction('');
    } catch (error) {
      setErrorMessage(error.response?.data?.message || 'ไม่สามารถเปลี่ยนสถานะรายการจองได้');
    } finally { setUpdating(false); }
  };

  return <div className="fixed inset-0 z-[130] grid place-items-center overflow-y-auto bg-[#071525]/65 p-4 backdrop-blur-[3px]" onMouseDown={(event) => { if (event.target === event.currentTarget && !updating) onClose(); }}>
    <section className="relative grid w-full max-w-[920px] grid-cols-[235px_minmax(0,1fr)] overflow-hidden rounded-[24px] border border-white/70 bg-[#f8fbf9] shadow-[0_24px_65px_rgba(3,19,31,.32)] max-md:max-w-[580px] max-md:grid-cols-1" style={{ backgroundImage: `linear-gradient(rgba(255,255,255,.18),rgba(255,255,255,.18)),url(${sportBg})`, backgroundSize: 'cover', backgroundPosition: 'center' }}>
      <aside className="relative flex flex-col border-r border-dashed border-[#aab9af] bg-white/55 max-md:hidden">
        <div className="relative flex h-[170px] flex-col items-center justify-center overflow-hidden bg-gradient-to-br from-[#049b48] to-[#006a31] text-white"><div className="absolute inset-0 opacity-20" style={{ backgroundImage: `url(${sportBg})`, backgroundSize: 'cover', backgroundPosition: 'left center' }} /><span className="relative grid h-16 w-16 place-items-center rounded-[18px] border-2 border-white/80 bg-white/10"><ShieldCheck className="h-10 w-10" /></span><strong className="relative mt-2 text-lg italic tracking-wide">SPORT COMPLEX</strong><small className="relative mt-0.5 text-[10px] tracking-[.2em]">BOOKING TICKET</small></div>
        <div className="flex flex-1 flex-col items-center px-5 py-4 text-center"><p className="text-[11px] font-semibold tracking-[.2em] text-[#087c3b]">BOOKING ID</p><div className="mt-1.5 flex items-center gap-2.5"><Star className="h-3.5 w-3.5 fill-[#07883d] text-[#07883d]" /><strong className="text-3xl text-[#102139]">#{current.id}</strong><Star className="h-3.5 w-3.5 fill-[#07883d] text-[#07883d]" /></div><div className="my-4 w-full border-t border-dashed border-[#aebbb3]" /><p className="text-[11px] font-semibold text-[#087c3b]">สถานะปัจจุบัน</p><div className={`mt-2 w-full rounded-xl border px-3 py-2.5 text-base font-bold ${meta[1]}`}>{meta[0]}</div><div className="my-4 w-full border-t border-dashed border-[#aebbb3]" /><p className="text-[11px] font-semibold text-[#087c3b]">ยอดชำระทั้งหมด</p><strong className="mt-1 text-3xl text-[#07883d]">฿{Number(current.total_price || 0).toLocaleString('th-TH')}</strong></div>
        <span aria-hidden="true" className="pointer-events-none absolute -left-2 bottom-2 top-2 z-20 w-4" style={{ backgroundImage: 'radial-gradient(circle,#edf4ef 0 6px,transparent 6.5px)', backgroundPosition: 'center top', backgroundSize: '16px 16px' }} />
        <span aria-hidden="true" className="pointer-events-none absolute -right-2 bottom-2 top-2 z-20 w-4" style={{ backgroundImage: 'radial-gradient(circle,#edf4ef 0 6px,transparent 6.5px)', backgroundPosition: 'center top', backgroundSize: '16px 16px' }} />
        <span aria-hidden="true" className="pointer-events-none absolute -top-2 left-2 right-2 z-20 h-4" style={{ backgroundImage: 'radial-gradient(circle,#edf4ef 0 6px,transparent 6.5px)', backgroundPosition: 'left center', backgroundSize: '16px 16px' }} />
        <span aria-hidden="true" className="pointer-events-none absolute -bottom-2 left-2 right-2 z-20 h-4" style={{ backgroundImage: 'radial-gradient(circle,#edf4ef 0 6px,transparent 6.5px)', backgroundPosition: 'left center', backgroundSize: '16px 16px' }} />
      </aside>

      <div className="relative bg-white/10 p-5 max-sm:p-4">
        <button type="button" disabled={updating} onClick={onClose} className="absolute right-5 top-5 z-10 grid h-11 w-11 place-items-center rounded-full border border-[#9ba9a0] bg-white/80 text-[#172137] transition hover:bg-white"><X className="h-6 w-6" /></button>
        <header className="pr-16"><div className="flex items-center gap-2 text-[#0b8b42]"><span className="h-px w-8 bg-[#0b8b42]" /><Star className="h-3.5 w-3.5 fill-current" /><Star className="h-5 w-5 fill-current" /><Star className="h-3.5 w-3.5 fill-current" /><span className="h-px w-8 bg-[#0b8b42]" /></div><h2 className="mt-1 text-[28px] font-black italic tracking-wide text-[#00652f] max-sm:text-2xl">BOOKING DETAILS</h2><p className="text-sm font-semibold text-[#667169]">รายละเอียดการจอง</p></header>
        <div className="mt-4 grid grid-cols-2 gap-2.5 max-sm:grid-cols-1"><Detail icon={UserRound} label="ลูกค้า" value={current.username} /><Detail icon={Mail} label="อีเมล" value={current.email} /><Detail icon={Phone} label="เบอร์โทรศัพท์" value={current.contact_phone} /><Detail icon={MapPin} label="สนาม" value={current.court_name} /><Detail icon={CalendarDays} label="วันที่ใช้งาน" value={formatDate(current.booking_date)} /><Detail icon={Clock3} label="ช่วงเวลา" value={`${shortTime(current.start_time)} - ${shortTime(current.end_time)} น.`} /><Detail icon={CreditCard} label="วิธีชำระเงิน" value={paymentMethodLabel(current)} /><Detail icon={ReceiptText} label="วันและเวลาที่ชำระ" value={formatPaidAt(current.paid_at || current.transfer_time || current.uploaded_at)} /></div>
        <div className="mt-3 flex h-[60px] items-center rounded-[14px] border border-[#d7e5dc] bg-white/70 px-5 text-[#08783a]"><span className="font-serif text-xl italic">Thank you for booking with us! ♡</span></div>
        {current.status === 'pending_payment' && <p className="mt-3 rounded-xl border border-blue-200 bg-blue-50/90 px-4 py-2 text-xs text-blue-700">หากลูกค้าชำระเงินสดหน้าร้านแล้ว สามารถกด “อนุมัติรับเงินสด” ได้ทันที</p>}{errorMessage && <p className="mt-3 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">{errorMessage}</p>}
        <div className="mt-4 border-t border-dashed border-[#aebbb3] pt-4">{confirmAction ? <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm"><p className="text-center font-semibold">{confirmAction === 'approved' && current.status === 'pending_payment' ? 'ยืนยันว่าได้รับเงินสดครบถ้วน และต้องการอนุมัติรายการนี้หรือไม่?' : `ยืนยันการ${confirmAction === 'approved' ? 'อนุมัติ' : 'ยกเลิก'}รายการนี้หรือไม่?`}</p><div className="mt-3 flex gap-3"><button type="button" disabled={updating} onClick={() => setConfirmAction('')} className="h-10 flex-1 rounded-xl border bg-white font-semibold">กลับ</button><button type="button" disabled={updating} onClick={() => updateStatus(confirmAction)} className={`h-10 flex-1 rounded-xl font-semibold text-white ${confirmAction === 'approved' ? 'bg-[#07883d]' : 'bg-[#e43d4b]'}`}>{updating ? 'กำลังบันทึก...' : 'ยืนยัน'}</button></div></div> : <div className="grid grid-cols-2 gap-4"><button type="button" disabled={current.status === 'cancelled'} onClick={() => setConfirmAction('cancelled')} className="flex h-12 items-center justify-center gap-2 rounded-xl border-2 border-red-400 bg-white/85 font-bold text-red-600 disabled:opacity-40"><Ban className="h-5 w-5" />ยกเลิกรายการ</button><button type="button" disabled={['approved','cancelled'].includes(current.status)} onClick={() => setConfirmAction('approved')} className="flex h-12 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#087b3b] to-[#09a34b] font-bold text-white shadow-lg disabled:bg-none disabled:bg-[#9ac9ad]"><CheckCircle2 className="h-5 w-5" />{current.status === 'pending_payment' ? 'อนุมัติรับเงินสด' : 'อนุมัติรายการ'}</button></div>}</div>
      </div>
      <span className="absolute -top-6 left-[190px] z-30 h-12 w-[82px] rounded-b-full border-b border-[#d8e5dc] bg-[#edf4ef] max-md:hidden" /><span className="absolute -bottom-6 left-[190px] z-30 h-12 w-[82px] rounded-t-full border-t border-[#d8e5dc] bg-[#edf4ef] max-md:hidden" />
    </section>
  </div>;
};

export default AdminBookingManagementModal;
