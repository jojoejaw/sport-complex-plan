import { useEffect, useRef, useState } from 'react';
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
import { useAuth } from '../../context/authContextStore';
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
    <div className={`booking-status-ticket relative flex h-full min-h-0 flex-col justify-center border-l px-3.5 py-2 ${config.panel} max-lg:min-h-[130px] max-lg:border-l-0 max-lg:border-t`}>
      <h3 className={`flex items-center gap-1.5 text-sm font-bold ${config.color}`}>
        <span className="grid h-5 w-5 place-items-center rounded-full bg-current"><Icon className="h-3 w-3 text-white" /></span>
        {config.label}
      </h3>
      {booking.status === 'pending_payment' && (
        <>
          <div className="mt-1 flex items-center justify-between gap-2">
            <p className="text-[11px] font-semibold text-[#523b20]">ชำระภายใน</p>
            <strong className="rounded bg-white/80 px-2 py-0.5 text-sm font-bold text-[#e87800] shadow-xs">{minutes}:{seconds}</strong>
          </div>
          <div className="mt-2 grid grid-cols-2 gap-1.5">
            <button type="button" onClick={() => onPayment(booking)} disabled={remaining <= 0} className="flex h-7 items-center justify-center gap-1 rounded-md border border-orange-300 bg-white/95 text-[11px] font-semibold text-[#e87800] shadow-xs transition hover:bg-orange-50 disabled:cursor-not-allowed disabled:opacity-45"><Upload className="h-3.5 w-3.5" />อัปโหลดสลิป</button>
            <button type="button" onClick={() => onCancel(booking)} disabled={cancelling} className="h-7 rounded-md border border-red-300 bg-white/90 text-[11px] font-semibold text-red-600 shadow-xs transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50">{cancelling ? 'ยกเลิก...' : 'ยกเลิกการจอง'}</button>
          </div>
        </>
      )}
      {booking.status === 'pending_approval' && <p className="mt-1 text-xs text-slate-600">ติดต่อแอดมิน</p>}
      {booking.status === 'approved' && <><p className="mt-1 text-xs text-[#245a2d]">ชำระเงินสำเร็จ<br />{formatActionDate(booking.updated_at)}</p><span className="pointer-events-none absolute right-3 top-1/2 -rotate-12 rounded border-2 border-green-600/25 px-1.5 py-0.5 text-xs font-black text-green-600/25">APPROVED</span></>}
      {booking.status === 'rejected' && <><FileWarning className="absolute right-3 top-1/2 h-7 w-7 -translate-y-1/2 text-slate-400 opacity-40" /><p className="mt-1 text-xs font-semibold text-slate-600">ติดต่อแอดมิน</p></>}
      {booking.status === 'cancelled' && <><p className="mt-1 text-xs text-red-700">รายการถูกยกเลิก<br />{formatActionDate(booking.updated_at)}</p><CalendarX2 className="absolute right-3 top-1/2 h-7 w-7 -translate-y-1/2 text-red-400 opacity-40" /></>}
    </div>
  );
};

const getVisiblePages = (current, total) => {
  if (total <= 5) {
    return Array.from({ length: total }, (_, i) => i + 1);
  }
  if (current <= 3) {
    return [1, 2, 3, 4, '...', total];
  }
  if (current >= total - 2) {
    return [1, '...', total - 3, total - 2, total - 1, total];
  }
  return [1, '...', current - 1, current, current + 1, '...', total];
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
  const paymentModalRef = useRef(null);
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

  useEffect(() => {
    if (!paymentBooking) return undefined;
    const previousBodyOverflow = document.body.style.overflow;
    const previousRootOverflow = document.documentElement.style.overflow;
    document.body.style.overflow = 'hidden';
    document.documentElement.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previousBodyOverflow;
      document.documentElement.style.overflow = previousRootOverflow;
    };
  }, [paymentBooking]);

  const handlePaymentWheel = (event) => {
    if (window.innerWidth > 1024 || !paymentModalRef.current) return;
    event.preventDefault();
    paymentModalRef.current.scrollTop += event.deltaY;
  };

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
    <div className="my-bookings-page mt-2 h-[calc(100vh-86px)] overflow-hidden bg-[radial-gradient(circle_at_75%_10%,rgba(20,148,71,0.08),transparent_28%),#f6f8f7] p-2 max-lg:h-auto max-lg:min-h-[calc(100vh-86px)] max-lg:overflow-visible">
      <div className="mx-auto grid h-full max-w-[1500px] grid-cols-[280px_minmax(0,1fr)] gap-5 max-lg:h-auto max-lg:grid-cols-1">
        <aside className="grid min-h-0 grid-rows-[minmax(0,1fr)_112px] gap-3 text-white max-lg:hidden">
          <div className="member-ticket relative flex flex-col justify-between overflow-hidden bg-[#071a27] px-6 py-5 text-center shadow-[0_14px_35px_rgba(7,26,39,0.22)]">
            <img src={sportsHero} alt="" className="pointer-events-none absolute inset-0 h-full w-full object-cover opacity-20" />
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-[#071724]/65 via-[#061723]/90 to-[#020b11]" />
            <div className="pointer-events-none absolute inset-[10px] rounded-[18px] border border-dashed border-white/40" />

            <div className="relative flex h-full min-h-0 flex-col justify-between p-1">
              <div>
                <p className="mb-1 text-xs tracking-[.45em] text-white sm:text-sm">✦ <span className="text-xl text-[#8aea2b] sm:text-2xl">★</span> ✦</p>
                <p className="member-ticket-title text-[34px] font-black italic leading-[0.82] drop-shadow-lg sm:text-[40px]">SPORT<br /><span className="text-[#8aea2b]">COMPLEX</span></p>
                <p className="mt-2 text-[11px] tracking-[0.14em] text-white/90 sm:text-xs">ENJOY THE GAME</p>
              </div>

              <div className="my-1.5 flex flex-col items-center gap-1">
                <span className="member-ticket-ball grid h-12 w-12 place-items-center rounded-full bg-[radial-gradient(circle_at_35%_30%,white_0_18%,#132431_19%_34%,white_35%_48%,#07111e_49%)] text-2xl shadow-xl sm:h-14 sm:w-14 sm:text-3xl">⚽</span>
                <div className="member-ticket-banner relative w-[155px] bg-gradient-to-r from-[#063d1d] via-[#148b31] to-[#063d1d] py-1 text-xs font-bold shadow-[0_0_12px_rgba(103,244,55,.45)] before:absolute before:-left-4 before:top-1.5 before:border-y-[8px] before:border-r-[16px] before:border-y-transparent before:border-r-[#08752e] after:absolute after:-right-4 after:top-1.5 after:border-y-[8px] after:border-l-[16px] after:border-y-transparent after:border-l-[#08752e] sm:w-[175px] sm:py-1 sm:text-sm">THANK YOU</div>
                <p className="mt-0.5 text-[10px] tracking-[.35em] text-white/80 sm:text-xs">★ ★ ★</p>
              </div>

              <div className="w-full px-1">
                <div className="flex items-center gap-3 text-left">
                  <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full border-2 border-[#8aea2b] text-[#8aea2b]"><UserRound className="h-5 w-5" /></span>
                  <strong className="truncate text-xs uppercase tracking-wide text-white sm:text-sm">{user?.username || 'USER'}</strong>
                </div>
                <div className="my-2.5 h-px border-t border-dashed border-white/45" />
                <div className="space-y-2 text-left text-xs sm:space-y-2.5 sm:text-sm">
                  <div className="flex items-center gap-3"><CalendarDays className="h-4 w-4 shrink-0 text-[#8aea2b]" /><div><span>{now.toLocaleDateString('th-TH', { dateStyle: 'long' })}</span><small className="block text-[10px] text-white/65 sm:text-xs">{now.toLocaleDateString('th-TH', { weekday: 'long' })}</small></div></div>
                  <div className="flex items-center gap-3"><Clock3 className="h-4 w-4 shrink-0 text-[#8aea2b]" /><div><span>{now.toLocaleTimeString('th-TH', { hour12: false })}</span><small className="block text-[10px] text-white/65 sm:text-xs">เวลาปัจจุบัน</small></div></div>
                </div>
              </div>

              <div className="pb-1 text-center">
                <p className="text-xs font-bold tracking-wider text-[#8aea2b] sm:text-sm">MOVE • PLAY • WIN</p>
                <p className="mt-0.5 text-[9px] leading-3 tracking-wide text-white/80 sm:text-[10px]">LET'S MAKE EVERY MATCH YOUR BEST MOMENT</p>
              </div>
            </div>
          </div>

          <div className="help-ticket relative flex items-center justify-center gap-4 overflow-hidden bg-[#071a27] px-5 text-white shadow-lg">
            <div className="absolute inset-[7px] border border-[#8aea2b]/60" />
            <Headphones className="relative h-9 w-9 shrink-0 text-[#8aea2b] sm:h-10 sm:w-10" />
            <div className="relative text-left">
              <p className="text-xs font-bold text-[#8aea2b] sm:text-sm">Need Help?</p>
              <a href="tel:0902214698" className="block text-base font-semibold transition hover:text-[#8aea2b] sm:text-lg">090-221-4698</a>
              <p className="text-[10px] text-white/80 sm:text-xs">10:00 - 22:00 น.</p>
            </div>
          </div>
        </aside>

        <section className="flex min-h-0 min-w-0 flex-col rounded-[22px] border border-[#e4ebe6] bg-white/90 p-3 shadow-[0_12px_34px_rgba(20,50,30,0.09)] backdrop-blur-sm sm:p-4">
          <header className="flex items-center gap-3 border-b border-[#dce5df] pb-2.5"><span className="grid h-10 w-10 place-items-center rounded-xl bg-[#eaf8ee] text-[#12913a]"><Ticket className="h-7 w-7 -rotate-12" /></span><div><h1 className="text-[25px] font-bold text-[#111827]">รายการจองของฉัน</h1><p className="text-xs text-[#657086]">My Bookings</p></div></header>

          <nav className="mt-2 flex gap-2 overflow-x-auto border-b border-[#dce5df] pb-2">
            {sports.map((sport) => <button type="button" key={sport} onClick={() => setSelectedSport(sport)} className={`flex h-10 min-w-[125px] shrink-0 items-center justify-center gap-2 rounded-full px-4 text-sm font-semibold transition ${selectedSport === sport ? 'bg-[#071a27] text-[#8aea2b] shadow-md' : 'bg-white text-[#26354c] hover:bg-[#f1f7f3]'}`}>{sport === 'ทั้งหมด' ? <Grid2X2 className="h-5 w-5" /> : <span className="text-xl">{sportIcons[sport] || '🏟️'}</span>}{sport}</button>)}
          </nav>

          <div className="mt-2 min-h-0 flex-1 grid grid-rows-4 gap-1.5 overflow-hidden max-lg:flex max-lg:flex-col max-lg:overflow-visible">
            {loading && Array.from({ length: BOOKINGS_PER_PAGE }).map((_, index) => <div key={index} className="h-full animate-pulse rounded-2xl bg-[#eaf0ec]" />)}
            {!loading && loadError && <div className="rounded-2xl border border-red-200 bg-red-50 p-8 text-center text-red-700"><p>{loadError}</p><button type="button" onClick={loadBookings} className="mt-4 rounded-lg bg-red-600 px-5 py-2 font-semibold text-white">ลองใหม่</button></div>}
            {!loading && !loadError && visibleBookings.length === 0 && <div className="rounded-2xl border border-dashed border-[#bdd3c4] bg-[#f7fbf8] p-12 text-center"><Ticket className="mx-auto h-12 w-12 text-[#69a779]" /><h2 className="mt-3 text-xl font-bold">ยังไม่มีรายการจอง</h2><p className="mt-1 text-sm text-gray-500">รายการจองสนามของคุณจะแสดงอยู่ที่นี่</p></div>}

            {!loading && !loadError && paginatedBookings.map((booking) => {
              return (
                <article key={booking.id} className="grid h-full min-h-0 overflow-hidden rounded-2xl border border-[#dfe7e2] bg-white shadow-[0_3px_10px_rgba(20,40,30,0.06)] transition hover:-translate-y-0.5 hover:shadow-md max-lg:h-auto lg:grid-cols-[140px_minmax(160px,1.2fr)_minmax(160px,1.1fr)_85px_1.25fr]">
                  <img src={booking.image_url || courtPanorama} alt={booking.court_name} className="h-full min-h-0 w-full object-cover max-lg:max-h-[230px] max-lg:min-h-[180px]" />
                  <div className="flex min-w-0 flex-col justify-center border-r border-[#e0e7e2] px-4 py-2 max-lg:border-r-0 max-lg:border-b">
                    <h2 className="truncate text-base font-bold text-[#111827]">{booking.court_name}</h2>
                    <p className="mt-1 flex items-center gap-1 text-xs text-gray-500"><MapPin className="h-3.5 w-3.5" />SPORT COMPLEX</p>
                    <p className="mt-0.5 text-[11px] text-gray-400">Booking ID : {booking.id}</p>
                  </div>
                  <div className="flex flex-col justify-center gap-1.5 border-r border-[#e0e7e2] px-4 py-2 max-lg:border-r-0 max-lg:border-b">
                    <p className="flex items-center gap-2 text-xs"><CalendarDays className="h-4 w-4 shrink-0 text-gray-400" /><span><small className="block text-[10px] leading-none text-gray-400">วันที่</small><strong className="font-semibold text-gray-800 whitespace-nowrap">{formatDate(booking.booking_date)}</strong></span></p>
                    <p className="flex items-center gap-2 text-xs"><Clock3 className="h-4 w-4 shrink-0 text-gray-400" /><span><small className="block text-[10px] leading-none text-gray-400">เวลา</small><strong className="font-semibold text-gray-800 whitespace-nowrap">{formatTime(booking.start_time)} - {formatTime(booking.end_time)} น.</strong></span></p>
                  </div>
                  <div className="flex flex-col items-center justify-center border-r border-[#e0e7e2] px-3 py-2 text-center max-lg:border-r-0 max-lg:border-b">
                    <small className="text-xs text-gray-500">ราคารวม</small>
                    <strong className="mt-0.5 text-2xl font-bold leading-none text-[#101827]">{Number(booking.total_price).toLocaleString('th-TH')}</strong>
                    <span className="mt-0.5 text-xs text-gray-500">บาท</span>
                  </div>
                  <BookingStatus booking={booking} currentServerTime={now.getTime() + serverTimeOffset} cancelling={cancelling && cancelTarget?.id === booking.id} onCancel={setCancelTarget} onPayment={setPaymentBooking} />
                </article>
              );
            })}
          </div>
          {!loading && !loadError && visibleBookings.length > BOOKINGS_PER_PAGE && (
            <nav aria-label="หน้ารายการจอง" className="mt-2.5 flex max-w-full shrink-0 flex-wrap items-center justify-center gap-1.5 overflow-x-auto px-1 py-0.5">
              <button type="button" aria-label="หน้าก่อนหน้า" disabled={currentPage === 1} onClick={() => setCurrentPage((page) => page - 1)} className="grid h-8 w-8 shrink-0 place-items-center rounded-lg border border-[#cbd8cf] text-[#174e2a] transition hover:bg-[#edf7f0] disabled:cursor-not-allowed disabled:opacity-35"><ChevronLeft className="h-4 w-4" /></button>
              {getVisiblePages(currentPage, totalPages).map((page, index) => {
                if (page === '...') {
                  return (
                    <span key={`ellipsis-${index}`} className="flex h-8 w-5 shrink-0 items-center justify-center text-xs font-bold text-gray-400">
                      ...
                    </span>
                  );
                }
                return (
                  <button
                    type="button"
                    key={page}
                    aria-current={currentPage === page ? 'page' : undefined}
                    onClick={() => setCurrentPage(page)}
                    className={`h-8 min-w-8 shrink-0 rounded-lg px-2 text-sm font-bold transition ${currentPage === page ? 'bg-[#08752e] text-white shadow-sm' : 'border border-[#cbd8cf] bg-white text-[#34445b] hover:bg-[#edf7f0]'}`}
                  >
                    {page}
                  </button>
                );
              })}
              <button type="button" aria-label="หน้าถัดไป" disabled={currentPage === totalPages} onClick={() => setCurrentPage((page) => page + 1)} className="grid h-8 w-8 shrink-0 place-items-center rounded-lg border border-[#cbd8cf] text-[#174e2a] transition hover:bg-[#edf7f0] disabled:cursor-not-allowed disabled:opacity-35"><ChevronRight className="h-4 w-4" /></button>
            </nav>
          )}
          <footer className="mt-2 flex shrink-0 items-center justify-center gap-2 rounded-xl bg-[#071a27] py-1.5 text-xs text-white"><ShieldCheck className="h-4 w-4 text-[#8aea2b]" />ข้อมูลการจองของคุณถูกเข้ารหัส ปลอดภัย 100%</footer>
        </section>
      </div>

      <ConfirmModal isOpen={Boolean(cancelTarget)} title="ยืนยันยกเลิกการจอง" message="คุณแน่ใจหรือไม่ว่าต้องการยกเลิกรายการนี้?" confirmText="ยืนยันการยกเลิก" cancelText="กลับไป" confirmDisabled={cancelling} onConfirm={confirmCancel} onCancel={() => !cancelling && setCancelTarget(null)} />
      <AlertModal isOpen={alert.isOpen} type={alert.type} title={alert.title} message={alert.message} confirmText="รับทราบ" onClose={() => setAlert((current) => ({ ...current, isOpen: false }))} />
      {paymentBooking && (
        <div onWheel={handlePaymentWheel} className="fixed inset-0 z-[100] flex items-center justify-center overscroll-contain bg-[#07111e]/80 p-4 backdrop-blur-[2px] max-lg:items-start max-lg:p-0">
          <div ref={paymentModalRef} role="dialog" aria-modal="true" aria-labelledby="booking-title" className="booking-modal flex max-h-[calc(100dvh-24px)] w-full max-w-[920px] flex-col overflow-hidden rounded-[22px] bg-[#fffefb] shadow-[0_18px_42px_rgba(0,0,0,0.22)] max-lg:h-dvh max-lg:max-h-dvh max-lg:overflow-y-auto max-lg:overscroll-contain max-lg:rounded-none">
            <BookingModalHeader courtName={paymentBooking.court_name} pricePerHour={Number(paymentBooking.total_price) / Math.max(1, Number(String(paymentBooking.end_time).slice(0, 2)) - Number(String(paymentBooking.start_time).slice(0, 2)))} currentStep={3} onClose={closePayment} />
            <div className="booking-modal-content grid min-h-0 flex-auto grid-cols-2 overflow-hidden p-4 max-lg:flex max-lg:flex-none max-lg:flex-col max-lg:overflow-visible max-sm:p-2" style={{ backgroundImage: `linear-gradient(rgba(224,241,230,.28),rgba(194,224,205,.38)),url(${reviewBackground})`, backgroundSize: 'cover', backgroundPosition: 'center' }}>
              <BookingPaymentStep bookingResult={{ bookingId: paymentBooking.id, total_price: paymentBooking.total_price }} initialSeconds={getRemainingSeconds(paymentBooking, Date.now() + serverTimeOffset)} onClose={closePayment} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MyBookingsPage;
