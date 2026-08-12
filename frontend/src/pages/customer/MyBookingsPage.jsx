import { useEffect, useState } from 'react';
import {
  CalendarDays,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock3,
  FileWarning,
  Grid2X2,
  Headphones,
  Hourglass,
  MapPin,
  ShieldCheck,
  Ticket,
  Upload,
  UserRound,
  CalendarX2,
  XCircle,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import bookingService from '../../services/bookingService';
import courtPanorama from '../../assets/court-panorama.png';
import ConfirmModal from '../../components/common/ConfirmModal';
import AlertModal from '../../components/common/AlertModal';
import BookingPaymentStep from '../../components/booking/BookingPaymentStep';
import BookingModalHeader from '../../components/booking/BookingModalHeader';
import reviewBackground from '../../assets/bg.png';
import sportsHero from '../../assets/sports-hero2.png';

const sportIcons = {
  ฟุตบอล: '⚽',
  แบดมินตัน: '🏸',
  บาสเกตบอล: '🏀',
  วอลเลย์บอล: '🏐',
};

const sportFilters = ['ทั้งหมด', 'ฟุตบอล', 'แบดมินตัน', 'บาสเกตบอล', 'วอลเลย์บอล'];
const BOOKINGS_PER_PAGE = 4;

const statusStyles = {
  pending_payment: { label: 'รอชำระเงิน', icon: Clock3, panel: 'border-amber-300 bg-gradient-to-br from-[#fff9e9] to-[#ffe5a5]', color: 'text-[#e36d00]' },
  pending_approval: { label: 'ติดต่อแอดมิน', icon: Hourglass, panel: 'border-slate-200 bg-gradient-to-br from-[#f8f9fb] to-[#e2e6eb]', color: 'text-[#566276]' },
  approved: { label: 'อนุมัติแล้ว', icon: CheckCircle2, panel: 'border-green-200 bg-gradient-to-br from-[#f1fff0] to-[#d7f4d1]', color: 'text-[#07852b]' },
  rejected: { label: 'ติดต่อแอดมิน', icon: XCircle, panel: 'border-slate-200 bg-gradient-to-br from-[#f8f9fb] to-[#e2e6eb]', color: 'text-[#566276]' },
  cancelled: { label: 'ยกเลิกแล้ว', icon: XCircle, panel: 'border-red-200 bg-gradient-to-br from-[#fff5f5] to-[#ffdede]', color: 'text-[#d71920]' },
};

const formatDate = (value) => {
  if (!value) return '-';
  const datePart = String(value).slice(0, 10);
  const [year, month, day] = datePart.split('-').map(Number);
  if (!year || !month || !day) return '-';
  return new Intl.DateTimeFormat('th-TH', { day: 'numeric', month: 'short', year: 'numeric' })
    .format(new Date(Date.UTC(year, month - 1, day)));
};

const formatTime = (value) => String(value || '').slice(0, 5).replace(':', '.');

const formatActionDate = (value) => value
  ? `${formatDate(value)} | ${new Date(value).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit', hour12: false })}`
  : '-';

const getRemainingSeconds = (booking, currentServerTime = Date.now()) => {
  if (booking.status !== 'pending_payment' || !booking.created_at) return 0;
  const expiry = new Date(booking.created_at).getTime() + (15 * 60 * 1000);
  return Math.max(0, Math.floor((expiry - currentServerTime) / 1000));
};

const BookingStatus = ({ booking, currentServerTime, cancelling, onCancel, onPayment }) => {
  const config = statusStyles[booking.status] || statusStyles.cancelled;
  const Icon = config.icon;
  const remaining = booking.status === 'pending_payment' ? getRemainingSeconds(booking, currentServerTime) : 0;
  const minutes = String(Math.floor(remaining / 60)).padStart(2, '0');
  const seconds = String(remaining % 60).padStart(2, '0');

  return (
    <div className={`booking-status-ticket relative flex h-full min-h-0 flex-col justify-center border-l px-6 py-3 ${config.panel} max-lg:min-h-[140px] max-lg:border-l-0 max-lg:border-t`}>
      <h3 className={`flex items-center gap-2 text-[18px] font-bold ${config.color}`}><span className="grid h-7 w-7 place-items-center rounded-full bg-current"><Icon className="h-[18px] w-[18px] text-white" /></span>{config.label}</h3>
      {booking.status === 'pending_payment' && (
        <>
          <div className="mt-2 flex items-end justify-between gap-3"><p className="text-sm text-[#523b20]">กรุณาชำระภายใน</p><div className="text-center"><strong className="block rounded-lg bg-white/60 px-3 text-[28px] leading-8 text-[#e87800]">{minutes}:{seconds}</strong><small className="text-[10px] text-[#6d5032]">นาที&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;วินาที</small></div></div>
          <div className="mt-2 grid grid-cols-2 gap-2">
            <button type="button" onClick={() => onPayment(booking)} disabled={remaining <= 0} className="flex h-8 items-center justify-center gap-1 rounded-lg border border-orange-300 bg-white/90 text-sm font-semibold text-[#e87800] transition hover:bg-orange-50 disabled:cursor-not-allowed disabled:opacity-45"><Upload className="h-4 w-4" />อัปโหลดสลิป</button>
            <button type="button" onClick={() => onCancel(booking)} disabled={cancelling} className="h-8 rounded-lg border border-red-300 bg-white/85 text-sm font-semibold text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50">{cancelling ? 'กำลังยกเลิก...' : 'ยกเลิกการจอง'}</button>
          </div>
        </>
      )}
      {booking.status === 'pending_approval' && <p className="mt-2 text-sm text-slate-600">ติดต่อแอดมิน</p>}
      {booking.status === 'approved' && <><p className="mt-2 text-sm text-[#245a2d]">ชำระเงินสำเร็จ<br />{formatActionDate(booking.updated_at)}</p><span className="pointer-events-none absolute right-5 top-1/2 -rotate-12 rounded border-[3px] border-green-600/25 px-2 py-1 text-xl font-black text-green-600/25">APPROVED</span></>}
      {booking.status === 'rejected' && <><FileWarning className="absolute right-5 top-1/2 h-10 w-10 -translate-y-1/2 text-slate-500" /><p className="mt-2 text-sm font-semibold text-slate-600">ติดต่อแอดมิน</p></>}
      {booking.status === 'cancelled' && <><p className="mt-2 text-sm text-red-700">รายการถูกยกเลิก<br />{formatActionDate(booking.updated_at)}</p><CalendarX2 className="absolute right-5 top-1/2 h-10 w-10 -translate-y-1/2 text-red-500" /></>}
    </div>
  );
};

const MyBookingsPage = () => {
  const { user } = useAuth();
  const [bookings, setBookings] = useState([]);
  const [selectedSport, setSelectedSport] = useState('ทั้งหมด');
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [cancelTarget, setCancelTarget] = useState(null);
  const [cancelling, setCancelling] = useState(false);
  const [alert, setAlert] = useState({ isOpen: false, type: 'info', title: '', message: '' });
  const [paymentBooking, setPaymentBooking] = useState(null);
  const [now, setNow] = useState(new Date());
  const [serverTimeOffset, setServerTimeOffset] = useState(0);

  const loadBookings = async () => {
    try {
      setLoading(true);
      setLoadError('');
      const requestStartedAt = Date.now();
      const response = await bookingService.getMyBookings();
      const responseReceivedAt = Date.now();
      setBookings(response.bookings);
      const estimatedClientTimeAtResponse = requestStartedAt + ((responseReceivedAt - requestStartedAt) / 2);
      setServerTimeOffset(new Date(response.server_time).getTime() - estimatedClientTimeAtResponse);
    } catch (error) {
      setLoadError(error.response?.data?.message || 'ไม่สามารถโหลดประวัติการจองได้');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadBookings(); }, []);
  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  const sports = sportFilters;
  const visibleBookings = selectedSport === 'ทั้งหมด'
    ? bookings
    : bookings.filter((booking) => booking.sport_name === selectedSport);
  const totalPages = Math.max(1, Math.ceil(visibleBookings.length / BOOKINGS_PER_PAGE));
  const paginatedBookings = visibleBookings.slice(
    (currentPage - 1) * BOOKINGS_PER_PAGE,
    currentPage * BOOKINGS_PER_PAGE,
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [selectedSport]);

  useEffect(() => {
    setCurrentPage((page) => Math.min(page, totalPages));
  }, [totalPages]);

  const confirmCancel = async () => {
    if (!cancelTarget) return;
    try {
      setCancelling(true);
      const result = await bookingService.cancelBooking(cancelTarget.id);
      setCancelTarget(null);
      await loadBookings();
      setAlert({ isOpen: true, type: 'success', title: 'ยกเลิกการจองสำเร็จ', message: result.message || 'คืนสิทธิ์สนามเรียบร้อยแล้ว' });
    } catch (error) {
      setCancelTarget(null);
      setAlert({ isOpen: true, type: 'error', title: 'ยกเลิกการจองไม่สำเร็จ', message: error.response?.data?.message || 'กรุณาลองใหม่อีกครั้ง' });
    } finally {
      setCancelling(false);
    }
  };

  const closePayment = async () => {
    setPaymentBooking(null);
    await loadBookings();
  };

  return (
    <div className="my-bookings-page mt-3 h-[calc(100vh-94px)] overflow-hidden bg-[radial-gradient(circle_at_75%_10%,rgba(20,148,71,0.08),transparent_28%),#f6f8f7] p-2.5 max-lg:h-auto max-lg:min-h-[calc(100vh-94px)] max-lg:overflow-visible">
      <div className="mx-auto grid h-full max-w-[1500px] grid-cols-[280px_minmax(0,1fr)] gap-5 max-lg:h-auto max-lg:grid-cols-1">
        <aside className="grid min-h-0 grid-rows-[minmax(0,1fr)_132px] gap-3 text-white max-lg:hidden">
          <div className="member-ticket relative overflow-hidden bg-[#071a27] px-7 py-5 text-center shadow-[0_14px_35px_rgba(7,26,39,0.22)]">
            <img src={sportsHero} alt="" className="pointer-events-none absolute inset-0 h-full w-full object-cover opacity-20" />
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-[#071724]/65 via-[#061723]/90 to-[#020b11]" />
            <div className="pointer-events-none absolute inset-[11px] rounded-[18px] border border-dashed border-white/45" />
            <div className="relative flex h-full min-h-0 flex-col">
              <div><p className="mb-1 text-sm tracking-[.45em] text-white">✦ <span className="text-2xl text-[#8aea2b]">★</span> ✦</p><p className="text-[42px] font-black italic leading-[0.82] drop-shadow-lg">SPORT<br /><span className="text-[#8aea2b]">COMPLEX</span></p><p className="mt-3 text-xs tracking-[0.14em] text-white/90">ENJOY THE GAME</p></div>
              <div className="relative mx-auto mt-3 h-16 w-24"><span className="absolute left-1/2 top-1/2 grid h-16 w-16 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-[radial-gradient(circle_at_35%_30%,white_0_18%,#132431_19%_34%,white_35%_48%,#07111e_49%)] text-3xl shadow-xl">⚽</span></div>
              <div className="relative mx-auto mt-1 w-[180px] bg-gradient-to-r from-[#063d1d] via-[#148b31] to-[#063d1d] py-1 text-sm font-bold shadow-[0_0_12px_rgba(103,244,55,.45)] before:absolute before:-left-5 before:top-2 before:border-y-[11px] before:border-r-[20px] before:border-y-transparent before:border-r-[#08752e] after:absolute after:-right-5 after:top-2 after:border-y-[11px] after:border-l-[20px] after:border-y-transparent after:border-l-[#08752e]">THANK YOU</div>
              <p className="mt-1 text-xs tracking-[.4em]">★ ★ ★</p>
              <div className="mt-3 flex items-center gap-3 text-left"><span className="grid h-10 w-10 place-items-center rounded-full border-2 border-[#8aea2b] text-[#8aea2b]"><UserRound className="h-6 w-6" /></span><strong className="translate-y-1 uppercase">{user?.username || 'USER'}</strong></div>
              <div className="my-3 h-px border-t border-dashed border-white/55" />
              <div className="space-y-3 text-left text-sm"><div className="flex gap-3"><CalendarDays className="shrink-0 text-white" /><span>{now.toLocaleDateString('th-TH', { dateStyle: 'long' })}<small className="block text-white/65">{now.toLocaleDateString('th-TH', { weekday: 'long' })}</small></span></div><div className="flex gap-3"><Clock3 className="shrink-0 text-white" /><span>{now.toLocaleTimeString('th-TH', { hour12: false })}<small className="block text-white/65">เวลาปัจจุบัน</small></span></div></div>
              <div className="mt-3"><p className="font-bold tracking-wider text-[#8aea2b]">MOVE • PLAY • WIN</p><p className="mt-1 text-[10px] leading-4 tracking-wide">LET'S MAKE EVERY MATCH<br />YOUR BEST MOMENT</p></div>
            </div>
          </div>
          <div className="help-ticket relative flex items-center justify-center gap-4 overflow-hidden bg-[#071a27] px-5 text-white shadow-lg"><div className="absolute inset-[7px] border border-[#8aea2b]/70" /><Headphones className="relative h-11 w-11 text-[#8aea2b]" /><div className="relative"><p className="font-bold text-[#8aea2b]">Need Help?</p><p className="text-lg font-semibold">02-123-4567</p><p>09:00 - 22:00 น.</p></div></div>
        </aside>

        <section className="flex min-h-0 min-w-0 flex-col rounded-[22px] border border-[#e4ebe6] bg-white/90 p-3 shadow-[0_12px_34px_rgba(20,50,30,0.09)] backdrop-blur-sm sm:p-4">
          <header className="flex items-center gap-3 border-b border-[#dce5df] pb-2.5"><span className="grid h-10 w-10 place-items-center rounded-xl bg-[#eaf8ee] text-[#12913a]"><Ticket className="h-7 w-7 -rotate-12" /></span><div><h1 className="text-[25px] font-bold text-[#111827]">รายการจองของฉัน</h1><p className="text-xs text-[#657086]">My Bookings</p></div></header>

          <nav className="mt-2 flex gap-2 overflow-x-auto border-b border-[#dce5df] pb-2">
            {sports.map((sport) => <button type="button" key={sport} onClick={() => setSelectedSport(sport)} className={`flex h-10 min-w-[125px] shrink-0 items-center justify-center gap-2 rounded-full px-4 text-sm font-semibold transition ${selectedSport === sport ? 'bg-[#071a27] text-[#8aea2b] shadow-md' : 'bg-white text-[#26354c] hover:bg-[#f1f7f3]'}`}>{sport === 'ทั้งหมด' ? <Grid2X2 className="h-5 w-5" /> : <span className="text-xl">{sportIcons[sport] || '🏟️'}</span>}{sport}</button>)}
          </nav>

          <div className="mt-3 min-h-0 flex-1 space-y-2.5 overflow-hidden max-lg:overflow-visible">
            {loading && Array.from({ length: 4 }).map((_, index) => <div key={index} className="h-[126px] animate-pulse rounded-2xl bg-[#eaf0ec]" />)}
            {!loading && loadError && <div className="rounded-2xl border border-red-200 bg-red-50 p-8 text-center text-red-700"><p>{loadError}</p><button type="button" onClick={loadBookings} className="mt-4 rounded-lg bg-red-600 px-5 py-2 font-semibold text-white">ลองใหม่</button></div>}
            {!loading && !loadError && visibleBookings.length === 0 && <div className="rounded-2xl border border-dashed border-[#bdd3c4] bg-[#f7fbf8] p-12 text-center"><Ticket className="mx-auto h-12 w-12 text-[#69a779]" /><h2 className="mt-3 text-xl font-bold">ยังไม่มีรายการจอง</h2><p className="mt-1 text-sm text-gray-500">รายการจองสนามของคุณจะแสดงอยู่ที่นี่</p></div>}

            {!loading && !loadError && paginatedBookings.map((booking) => {
              return (
                <article key={booking.id} className="grid h-[140px] overflow-hidden rounded-2xl border border-[#dfe7e2] bg-white shadow-[0_4px_12px_rgba(20,40,30,0.08)] transition hover:-translate-y-0.5 hover:shadow-lg max-lg:h-auto lg:grid-cols-[170px_minmax(230px,1.35fr)_0.8fr_0.65fr_1.1fr]">
                  <img src={booking.image_url || courtPanorama} alt={booking.court_name} className="h-full min-h-0 w-full object-cover max-lg:max-h-[230px] max-lg:min-h-[180px]" />
                  <div className="flex min-w-0 flex-col justify-center border-r border-[#e0e7e2] px-5 py-3 max-lg:border-r-0 max-lg:border-b">
                    <h2 className="truncate text-[19px] font-bold">{booking.court_name}</h2>
                    <p className="mt-2 flex items-center gap-1 text-sm text-gray-500"><MapPin className="h-4 w-4" />SPORT COMPLEX</p>
                    <p className="mt-1 text-xs text-gray-500">Booking ID : {booking.id}</p>
                  </div>
                  <div className="flex flex-col justify-center gap-3 border-r border-[#e0e7e2] px-5 py-3 max-lg:border-r-0 max-lg:border-b"><p className="flex gap-3"><CalendarDays className="h-5 w-5" /><span><small className="block text-gray-500">วันที่</small>{formatDate(booking.booking_date)}</span></p><p className="flex gap-3"><Clock3 className="h-5 w-5" /><span><small className="block text-gray-500">เวลา</small>{formatTime(booking.start_time)} - {formatTime(booking.end_time)} น.</span></p></div>
                  <div className="flex flex-col items-center justify-center border-r border-[#e0e7e2] px-5 py-3 text-center max-lg:border-r-0 max-lg:border-b"><small className="text-[13px] text-gray-500">ราคารวม</small><strong className="mt-1 text-[32px] leading-none text-[#101827]">{Number(booking.total_price).toLocaleString('th-TH')}</strong><span className="mt-1 text-sm">บาท</span></div>
                  <BookingStatus booking={booking} currentServerTime={now.getTime() + serverTimeOffset} cancelling={cancelling && cancelTarget?.id === booking.id} onCancel={setCancelTarget} onPayment={setPaymentBooking} />
                </article>
              );
            })}
          </div>
          {!loading && !loadError && visibleBookings.length > BOOKINGS_PER_PAGE && (
            <nav aria-label="หน้ารายการจอง" className="mt-3 flex shrink-0 items-center justify-center gap-1.5">
              <button type="button" aria-label="หน้าก่อนหน้า" disabled={currentPage === 1} onClick={() => setCurrentPage((page) => page - 1)} className="grid h-8 w-8 place-items-center rounded-lg border border-[#cbd8cf] text-[#174e2a] transition hover:bg-[#edf7f0] disabled:cursor-not-allowed disabled:opacity-35"><ChevronLeft className="h-4 w-4" /></button>
              {Array.from({ length: totalPages }, (_, index) => index + 1).map((page) => <button type="button" key={page} aria-current={currentPage === page ? 'page' : undefined} onClick={() => setCurrentPage(page)} className={`h-8 min-w-8 rounded-lg px-2 text-sm font-bold transition ${currentPage === page ? 'bg-[#08752e] text-white shadow-sm' : 'border border-[#cbd8cf] bg-white text-[#34445b] hover:bg-[#edf7f0]'}`}>{page}</button>)}
              <button type="button" aria-label="หน้าถัดไป" disabled={currentPage === totalPages} onClick={() => setCurrentPage((page) => page + 1)} className="grid h-8 w-8 place-items-center rounded-lg border border-[#cbd8cf] text-[#174e2a] transition hover:bg-[#edf7f0] disabled:cursor-not-allowed disabled:opacity-35"><ChevronRight className="h-4 w-4" /></button>
            </nav>
          )}
          <footer className="mt-2 flex shrink-0 items-center justify-center gap-2 rounded-xl bg-[#071a27] py-2 text-xs text-white"><ShieldCheck className="h-4 w-4 text-[#8aea2b]" />ข้อมูลการจองของคุณถูกเข้ารหัส ปลอดภัย 100%</footer>
        </section>
      </div>

      <ConfirmModal isOpen={Boolean(cancelTarget)} title="ยืนยันยกเลิกการจอง" message="คุณแน่ใจหรือไม่ว่าต้องการยกเลิกรายการนี้?" confirmText="ยืนยันการยกเลิก" cancelText="กลับไป" confirmDisabled={cancelling} onConfirm={confirmCancel} onCancel={() => !cancelling && setCancelTarget(null)} />
      <AlertModal isOpen={alert.isOpen} type={alert.type} title={alert.title} message={alert.message} confirmText="รับทราบ" onClose={() => setAlert((current) => ({ ...current, isOpen: false }))} />
      {paymentBooking && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[#07111e]/80 p-4 backdrop-blur-[2px]">
          <div role="dialog" aria-modal="true" aria-labelledby="booking-title" className="booking-modal flex max-h-[calc(100dvh-24px)] w-full max-w-[800px] flex-col overflow-hidden rounded-[22px] bg-[#fffefb] shadow-[0_18px_42px_rgba(0,0,0,0.22)]">
            <BookingModalHeader courtName={paymentBooking.court_name} pricePerHour={Number(paymentBooking.total_price) / Math.max(1, Number(String(paymentBooking.end_time).slice(0, 2)) - Number(String(paymentBooking.start_time).slice(0, 2)))} currentStep={3} onClose={closePayment} />
            <div className="booking-modal-content grid min-h-0 flex-auto grid-cols-2 overflow-hidden p-4" style={{ backgroundImage: `linear-gradient(rgba(224,241,230,.28),rgba(194,224,205,.38)),url(${reviewBackground})`, backgroundSize: 'cover', backgroundPosition: 'center' }}>
              <BookingPaymentStep bookingResult={{ bookingId: paymentBooking.id, total_price: paymentBooking.total_price }} initialSeconds={getRemainingSeconds(paymentBooking, Date.now() + serverTimeOffset)} onClose={closePayment} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MyBookingsPage;
