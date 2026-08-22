import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowRight,
  CalendarDays,
  Check,
  CheckCircle2,
  CircleDollarSign,
  CircleDot,
  Clock3,
  Info,
  MapPin,
  Moon,
  ShieldCheck,
  Sun,
  Sunrise,
  TimerReset,
  X,
} from 'lucide-react';
import bookingService from '../../services/bookingService';
import { useAuth } from '../../context/authContextStore';
import ConfirmModal from '../common/ConfirmModal';
import AlertModal from '../common/AlertModal';
import BookingPaymentStep from './BookingPaymentStep';
import BookingModalHeader from './BookingModalHeader';
import BookingPhoneModal from './BookingPhoneModal';
import BookingReviewStep from './BookingReviewStep';
import toast from 'react-hot-toast';
import reviewBackground from '../../assets/bg.png';

const toBangkokDateInput = (date = new Date()) => {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Bangkok',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(date);
  const values = Object.fromEntries(
    parts.filter((part) => part.type !== 'literal').map((part) => [part.type, part.value]),
  );
  return `${values.year}-${values.month}-${values.day}`;
};

const disablePastSlotsForToday = (slots, selectedDate) => {
  const bangkokParts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Bangkok',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(new Date());
  const values = Object.fromEntries(
    bangkokParts.filter((part) => part.type !== 'literal').map((part) => [part.type, part.value]),
  );
  const todayInBangkok = `${values.year}-${values.month}-${values.day}`;

  if (selectedDate !== todayInBangkok) return slots;

  const currentHourInBangkok = Number(values.hour);
  return slots.map((slot) => {
    const slotStartHour = Number(slot.start_time?.slice(0, 2));
    if (slot.status === 'available' && slotStartHour <= currentHourInBangkok) {
      return { ...slot, status: 'past' };
    }
    return slot;
  });
};

const formatThaiDate = (value) => {
  if (!value) return '-';
  return new Intl.DateTimeFormat('th-TH', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(new Date(`${value}T12:00:00`));
};

const shortTime = (value) => value?.slice(0, 5).replace(':', '.') || '';

const formatDateInput = (value) => {
  if (!value) return 'วว/ดด/ปปปป';
  const [year, month, day] = value.split('-');
  return `${day}/${month}/${year}`;
};

const getTimePeriod = (time) => {
  const hour = Number(time?.slice(0, 2));
  if (hour < 12) return 'morning';
  if (hour < 17) return 'afternoon';
  return 'evening';
};

const statusStyles = {
  available: 'border-[#d7dee8] bg-white text-[#13213a] hover:border-[#07863a] hover:bg-[#f1fbf5]',
  past: 'cursor-not-allowed border-slate-200 bg-slate-100 text-slate-400',
  unavailable: 'cursor-not-allowed border-red-200 bg-red-50 text-red-500',
  pending_approval: 'cursor-not-allowed border-amber-300 bg-amber-50 text-amber-600',
  locked: 'cursor-not-allowed border-orange-300 bg-orange-50 text-orange-600',
};

const BookingModal = ({ court, fallbackImage, onClose }) => {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const [date, setDate] = useState(toBangkokDateInput());
  const [slots, setSlots] = useState([]);
  const [selectedIndexes, setSelectedIndexes] = useState([]);
  const [currentStep, setCurrentStep] = useState(1);
  const [showConfirm, setShowConfirm] = useState(false);
  const [showProceedConfirm, setShowProceedConfirm] = useState(false);
  const [showBookingConfirm, setShowBookingConfirm] = useState(false);
  const [contactPhone, setContactPhone] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [bookingAlert, setBookingAlert] = useState({ isOpen: false, title: '', message: '' });
  const [bookingResult, setBookingResult] = useState(null);
  const [modalEntered, setModalEntered] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const modalRef = useRef(null);

  useEffect(() => {
    let secondFrame;
    const firstFrame = window.requestAnimationFrame(() => {
      secondFrame = window.requestAnimationFrame(() => setModalEntered(true));
    });
    return () => {
      window.cancelAnimationFrame(firstFrame);
      if (secondFrame) window.cancelAnimationFrame(secondFrame);
    };
  }, []);

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    const previousRootOverflow = document.documentElement.style.overflow;
    const previousRootOverscroll = document.documentElement.style.overscrollBehavior;
    document.body.style.overflow = 'hidden';
    document.documentElement.style.overflow = 'hidden';
    document.documentElement.style.overscrollBehavior = 'none';
    const handleKeyDown = (event) => {
      if (event.key !== 'Escape') return;
      if (showConfirm) setShowConfirm(false);
      else if (showProceedConfirm) setShowProceedConfirm(false);
      else if (showBookingConfirm) setShowBookingConfirm(false);
      else if (!submitting) onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.documentElement.style.overflow = previousRootOverflow;
      document.documentElement.style.overscrollBehavior = previousRootOverscroll;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [onClose, showConfirm, showProceedConfirm, showBookingConfirm, submitting]);

  useEffect(() => {
    let active = true;
    const loadSlots = async () => {
      try {
        setLoading(true);
        setError('');
        setSelectedIndexes([]);
        const data = await bookingService.getAvailableSlots(court.id, date);
        if (!active) return;
        if (data.court_status === 'maintenance') {
          setSlots([]);
          setError('สนามนี้อยู่ระหว่างการปรับปรุงและยังไม่พร้อมให้บริการ');
          return;
        }
        setSlots(disablePastSlotsForToday(data.slots || [], date));
      } catch (requestError) {
        console.error('Unable to load available slots:', requestError);
        if (active) setError('ไม่สามารถโหลดรอบเวลาว่างได้ กรุณาลองใหม่อีกครั้ง');
      } finally {
        if (active) setLoading(false);
      }
    };
    loadSlots();
    return () => { active = false; };
  }, [court.id, date]);

  const selectedSlots = useMemo(
    () => selectedIndexes.map((index) => slots[index]).filter(Boolean),
    [selectedIndexes, slots],
  );
  const activePeriods = useMemo(
    () => new Set(selectedSlots.map((slot) => getTimePeriod(slot.start_time))),
    [selectedSlots],
  );
  const totalPrice = selectedSlots.length * Number(court.price || court.price_per_hour || 0);
  const startTime = selectedSlots[0]?.start_time;
  const endTime = selectedSlots[selectedSlots.length - 1]?.end_time;

  const selectSlot = (index) => {
    if (slots[index]?.status !== 'available') return;

    setSelectedIndexes((current) => {
      if (current.includes(index)) {
        const remaining = current.filter((item) => item !== index);
        const stillContiguous = remaining.every((item, position) => position === 0 || item === remaining[position - 1] + 1);
        return stillContiguous ? remaining : [];
      }
      if (current.length === 0) return [index];

      const next = [...current, index].sort((a, b) => a - b);
      const contiguous = next.every((item, position) => position === 0 || item === next[position - 1] + 1);
      if (!contiguous || next.length > 3) return [index];
      return next;
    });
  };

  const handleNextStep = () => {
    if (selectedSlots.length === 0) return;
    setSubmitError('');
    setShowProceedConfirm(true);
  };

  const handleConfirmProceed = () => {
    setShowProceedConfirm(false);
    setShowConfirm(true);
  };

  const handleBookingAction = () => {
    if (!isAuthenticated) return;
    handleNextStep();
  };

  const handleConfirmNextStep = () => {
    if (!/^\d{10}$/.test(contactPhone)) return;
    setShowConfirm(false);
    setCurrentStep(2);
  };

  const handleCreateBooking = async () => {
    if (!isAuthenticated) {
      setSubmitError('กรุณาเข้าสู่ระบบก่อนยืนยันการจอง');
      return;
    }

    try {
      setSubmitting(true);
      setSubmitError('');
      const result = await bookingService.createBooking({
        court_id: court.id,
        booking_date: date,
        start_time: startTime,
        end_time: endTime,
        contact_phone: contactPhone,
      });
      setBookingResult(result);
      setCurrentStep(3);
      toast.success(result.message || 'สร้างรายการจองสำเร็จ');
    } catch (requestError) {
      const message = requestError.response?.data?.message || 'ไม่สามารถสร้างรายการจองได้ กรุณาลองใหม่อีกครั้ง';
      setSubmitError(message);
      setBookingAlert({
        isOpen: true,
        title: 'ไม่สามารถทำรายการจองได้',
        message,
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleConfirmCreateBooking = () => {
    setShowBookingConfirm(false);
    handleCreateBooking();
  };

  const imageStyle = court.image_url
    ? { backgroundImage: `url(${court.image_url})`, backgroundSize: 'cover', backgroundPosition: 'center' }
    : { backgroundImage: `url(${fallbackImage})`, backgroundSize: '400% 100%', backgroundPosition: court.position };

  const handleResponsiveWheel = (event) => {
    if (window.innerWidth > 1024 || !modalRef.current) return;
    const modalElement = modalRef.current;
    if (modalElement.scrollHeight <= modalElement.clientHeight) return;
    event.preventDefault();
    modalElement.scrollTop += event.deltaY;
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center overflow-auto overscroll-contain bg-[#07111e]/80 p-4 backdrop-blur-[2px] max-sm:p-0" onWheel={handleResponsiveWheel} onMouseDown={(event) => event.target === event.currentTarget && !submitting && onClose()}>
      <div
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="booking-title"
        style={{
          transform: modalEntered ? 'translate3d(0, 0, 0)' : 'translate3d(0, 18px, 0)',
        }}
        className={`booking-modal mx-auto flex h-auto max-h-[calc(100dvh-32px)] w-full min-w-0 flex-col overflow-hidden rounded-[22px] shadow-[0_18px_42px_rgba(0,0,0,0.22)] transition-[opacity,transform] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] will-change-[transform,opacity] motion-reduce:transition-none max-lg:overflow-y-auto max-lg:overscroll-contain max-sm:h-dvh max-sm:max-h-dvh max-sm:rounded-none ${modalEntered ? 'opacity-100' : 'opacity-0'} ${currentStep === 3 ? 'max-w-[800px] bg-[#fffefb]' : 'max-w-[1430px] bg-[#f7f9fc]'}`}
      >
        <BookingModalHeader
          courtName={court.name}
          pricePerHour={court.price || court.price_per_hour}
          currentStep={currentStep}
          onClose={onClose}
          closeDisabled={submitting}
        />

        <div
          className="booking-modal-content grid min-h-0 flex-auto touch-pan-y grid-cols-[minmax(0,1fr)_clamp(280px,25vw,360px)] items-stretch gap-4 overflow-y-auto overscroll-contain p-4 max-lg:flex max-lg:flex-none max-lg:flex-col max-lg:overflow-visible max-sm:gap-2 max-sm:p-2"
          style={currentStep === 2 || currentStep === 3 ? {
            backgroundImage: `linear-gradient(rgba(224, 241, 230, 0.28), rgba(194, 224, 205, 0.38)), url(${reviewBackground})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          } : undefined}
        >
          {currentStep === 1 ? (
            <>
              <main className="booking-modal-main flex min-h-0 min-w-0 flex-col gap-3 max-lg:h-auto max-lg:flex-none">
                <section className="booking-booking-info grid shrink-0 grid-cols-[clamp(235px,22vw,300px)_clamp(170px,15vw,225px)_minmax(280px,1fr)] overflow-hidden rounded-[16px] bg-white shadow-sm max-lg:grid-cols-1">
                  <div className="border-r border-[#e2e7ee] p-5 max-lg:border-r-0 max-lg:border-b">
                    <label htmlFor="booking-date" className="mb-3 flex items-center gap-3 whitespace-nowrap font-semibold max-xl:gap-2 max-xl:text-sm"><CalendarDays className="h-6 w-6 shrink-0 max-xl:h-5 max-xl:w-5" />เลือกวันที่ต้องการเข้าใช้งาน</label>
                    <div className="relative">
                      <input id="booking-date" type="date" min={toBangkokDateInput()} value={date} onChange={(event) => setDate(event.target.value)} className="booking-date-input h-12 w-full cursor-pointer rounded-xl border border-[#cfd8e6] px-4 text-[18px] font-semibold text-transparent caret-transparent outline-none focus:border-[#08752e]" />
                      <span className="pointer-events-none absolute inset-y-0 left-4 flex items-center text-[18px] font-semibold text-[#18345f]">{formatDateInput(date)}</span>
                    </div>
                  </div>
                  <div className="border-r border-[#e2e7ee] p-5 max-lg:border-r-0 max-lg:border-b">
                    <p className="mb-3 flex items-center gap-3 whitespace-nowrap font-semibold max-xl:gap-2 max-xl:text-sm"><TimerReset className="h-6 w-6 shrink-0 text-[#08752e] max-xl:h-5 max-xl:w-5" />เวลาเปิด - ปิด</p>
                    <div className="flex h-12 items-center justify-center whitespace-nowrap rounded-xl border border-[#b8dfc7] bg-[#eef9f2] text-[18px] font-bold text-[#075c2a] max-xl:text-[16px]">10.00 - 22.00 น.</div>
                  </div>
                  <div className="p-5">
                    <p className="mb-4 flex items-center gap-3 whitespace-nowrap font-semibold max-xl:gap-2 max-xl:text-sm"><Clock3 className="h-6 w-6 shrink-0 text-[#173b70] max-xl:h-5 max-xl:w-5" />เลือกช่วงเวลา (เลือกได้สูงสุด 3 ชม.)</p>
                    <div className="flex flex-wrap gap-x-7 gap-y-2 text-sm font-medium max-xl:gap-x-4 max-xl:text-xs">
                      <span className="flex items-center gap-2"><i className="h-4 w-4 rounded-full bg-[#159547]" />ว่าง (เลือกได้)</span>
                      <span className="flex items-center gap-2"><i className="h-4 w-4 rounded-full bg-red-500" />จองแล้ว</span>
                      <span className="flex items-center gap-2"><i className="h-4 w-4 rounded-full bg-amber-400" />รอชำระเงิน</span>
                    </div>
                  </div>
                </section>

                <section className="booking-periods shrink-0 overflow-hidden rounded-[16px] bg-white shadow-sm max-md:hidden">
                  <div className="grid h-[50px] grid-cols-3 overflow-hidden rounded-[13px] border border-[#d8e0eb] bg-[#f6f8fc]">
                    <div className={`flex items-center justify-center gap-3 font-semibold transition-all ${activePeriods.has('morning') ? 'bg-gradient-to-r from-[#08752e] to-[#169b50] text-white shadow-[4px_0_12px_rgba(8,117,46,0.18)]' : 'text-[#17345f]'}`}><Sunrise className="h-5 w-5" />เช้า&nbsp; 10.00 - 12.00</div>
                    <div className={`flex items-center justify-center gap-3 border-l border-[#e0e6ef] font-semibold transition-all ${activePeriods.has('afternoon') ? 'bg-gradient-to-r from-[#08752e] to-[#169b50] text-white shadow-[4px_0_12px_rgba(8,117,46,0.18)]' : 'text-[#17345f]'}`}><Sun className="h-5 w-5" />บ่าย&nbsp; 12.00 - 17.00</div>
                    <div className={`flex items-center justify-center gap-3 border-l border-[#e0e6ef] font-semibold transition-all ${activePeriods.has('evening') ? 'bg-gradient-to-r from-[#08752e] to-[#169b50] text-white shadow-[4px_0_12px_rgba(8,117,46,0.18)]' : 'text-[#17345f]'}`}><Moon className="h-5 w-5" />เย็น&nbsp; 17.00 - 22.00</div>
                  </div>

                  {!loading && !error && (
                    <div className="grid grid-cols-[62px_repeat(12,minmax(0,1fr))] px-3 py-3 text-center text-[11px] font-semibold text-[#14213a]">
                      <div className="flex flex-col justify-around text-left"><span>เวลา</span><span>สถานะ:</span></div>
                      {slots.map((slot) => (
                        <div key={`summary-${slot.start_time}`} className="flex min-w-0 flex-col items-center border-l border-[#dfe5ed] px-1">
                          <span>{shortTime(slot.start_time)}</span><span>{shortTime(slot.end_time)}</span>
                          <SlotStatusIcon status={slot.status} className="mt-2" />
                        </div>
                      ))}
                    </div>
                  )}
                </section>

                <section className="booking-slots min-h-0 shrink-0 rounded-[16px] bg-white p-4 shadow-sm">
                  <div className="mb-3 flex items-center justify-between">
                    <h3 className="text-[17px] font-semibold">เลือกช่วงเวลา <span className="font-normal text-[#62708a]">(คลิกที่ช่องเวลา)</span></h3>
                    {selectedSlots.length > 0 && <button onClick={() => setSelectedIndexes([])} className="text-sm font-medium text-red-500 underline">ยกเลิกการเลือก</button>}
                  </div>

                  {loading ? (
                    <div className="grid grid-cols-12 gap-1 max-md:grid-cols-3 max-sm:grid-cols-2"><>{Array.from({ length: 12 }).map((_, index) => <div key={index} className="h-24 animate-pulse rounded-xl bg-[#e8edf3]" />)}</></div>
                  ) : error ? (
                    <div className="rounded-xl border border-red-200 bg-red-50 p-8 text-center text-red-600">{error}</div>
                  ) : (
                    <div>
                      <div className="relative mb-2 grid grid-cols-12 gap-1 text-center text-[10px] font-semibold text-[#18345f] max-md:hidden">
                        <span className="absolute left-[calc(100%/24)] right-[calc(100%/24)] top-[26px] h-px bg-[#bdc9d8]" />
                        {slots.map((slot) => (
                          <span key={`timeline-${slot.start_time}`} className="relative z-10 flex flex-col items-center gap-2">
                            <span>{shortTime(slot.start_time)}</span>
                            <i className="h-2 w-2 rounded-full border-2 border-white bg-[#6d82a0]" />
                          </span>
                        ))}
                      </div>
                      <div className="grid grid-cols-12 gap-1 max-md:grid-cols-3 max-sm:grid-cols-2">
                        {slots.map((slot, index) => {
                          const selected = selectedIndexes.includes(index);
                          return (
                            <button key={slot.start_time} onClick={() => selectSlot(index)} disabled={slot.status !== 'available'} className={`relative flex h-[100px] flex-col items-center justify-center rounded-xl border text-[12px] font-semibold transition ${selected ? 'border-[#07863a] bg-gradient-to-b from-[#159b4b] to-[#08752e] text-white shadow-[0_7px_18px_rgba(8,117,46,0.25)]' : statusStyles[slot.status] || statusStyles.unavailable}`}>
                              <span>{shortTime(slot.start_time)}</span><span>{shortTime(slot.end_time)}</span>
                              <span className={`mt-2 grid h-5 w-5 place-items-center rounded-full text-[11px] ${selected ? 'bg-white text-[#08752e]' : slot.status === 'available' ? 'bg-[#159547] text-white' : 'bg-current text-white'}`}>{selected ? <Check className="h-3.5 w-3.5" /> : slot.status === 'available' ? '•' : <X className="h-3 w-3" />}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  <div className="mt-5 flex flex-wrap items-center justify-center gap-5">
                    <span className="rounded-full bg-[#eaf8ef] px-5 py-2 font-semibold text-[#08752e]">เลือกแล้ว {selectedSlots.length} ชม.</span>
                    <span className="flex items-center gap-2 rounded-full bg-[#f0f7f3] px-5 py-2 font-semibold"><Clock3 className="h-5 w-5 text-[#08752e]" />{startTime ? `${shortTime(startTime)} - ${shortTime(endTime)} น.` : 'ยังไม่ได้เลือกเวลา'}</span>
                  </div>
                  <p className="mt-4 flex items-center justify-center gap-2 text-sm text-[#596985]"><Info className="h-4 w-4" />กรุณาเลือกช่วงเวลาอย่างน้อย 1 ชั่วโมง และสูงสุด 3 ชั่วโมง</p>
                </section>

                <section className="booking-notes relative shrink-0 overflow-hidden rounded-[16px] border border-[#d8e9df] bg-gradient-to-r from-[#f7fcf9] to-[#f1f8f4] px-7 py-4">
                  <CircleDot className="pointer-events-none absolute -bottom-16 right-5 h-44 w-44 rotate-[-18deg] text-[#c8d9cf]/35" strokeWidth={1} />
                  <div className="relative z-10">
                    <h3 className="mb-2 flex items-center gap-3 text-[16px] font-semibold text-[#08752e]"><ShieldCheck className="h-6 w-6 fill-[#08752e] text-white" />หมายเหตุการจอง</h3>
                    <div className="grid grid-cols-[minmax(0,35fr)_minmax(0,65fr)] gap-x-1 gap-y-2 text-[13px] text-[#17221b] max-md:grid-cols-1">
                      <p className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 shrink-0 text-[#07833a]" />เลือกช่วงเวลาได้สูงสุด 3 ชั่วโมงต่อการจอง</p>
                      <p className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 shrink-0 text-[#07833a]" />กรุณามาถึงก่อนเวลาอย่างน้อย 15 นาที</p>
                      <p className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 shrink-0 text-[#07833a]" />กรุณาชำระเงินภายใน 15 นาที</p>
                      <p className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 shrink-0 text-[#07833a]" />หากต้องการยกเลิก กรุณาแจ้งล่วงหน้าอย่างน้อย 2 ชั่วโมง</p>
                    </div>
                  </div>
                </section>
              </main>

              <aside
                className="booking-summary relative flex h-full min-h-0 flex-col self-stretch overflow-hidden rounded-[18px] bg-[#06151c] px-4 pb-3 pt-4 text-white shadow-lg max-lg:h-auto max-lg:min-h-0 max-lg:shrink-0 max-lg:overflow-visible"
              >
                <div aria-hidden="true" className="pointer-events-none absolute inset-0 opacity-20 [background-image:radial-gradient(circle_at_75%_20%,#a7eb24_0,transparent_27%),linear-gradient(135deg,transparent_45%,#8bc51e_46%,transparent_47%)]" />
                
                {/* Scrollable details container */}
                <div className="booking-summary-scroll flex flex-1 min-h-0 flex-col overflow-y-auto space-y-3 pr-1">
                  <div className="relative flex items-center gap-3">
                    <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full border border-white/15 bg-white/10 text-[#55eb91] shadow-[inset_0_1px_0_rgba(255,255,255,0.12)]">
                      <CalendarDays className="h-5 w-5" strokeWidth={2.2} />
                    </span>
                    <div className="min-w-0">
                      <h3 className="text-[18px] font-bold leading-tight tracking-[-0.01em] text-white">สรุปการเลือก</h3>
                      <p className="mt-1 text-[11px] leading-tight text-[#cbe7d6]">ตรวจสอบรายการก่อนยืนยันการจอง</p>
                    </div>
                  </div>
                  <div className="relative aspect-video w-full shrink-0 rounded-[14px] bg-cover bg-center" style={imageStyle} />
                  <div className="booking-summary-ticket relative flex min-h-[250px] shrink-0 flex-col bg-[#fffefb] px-4 pb-3 pt-3 text-[#14213a] shadow-[inset_0_0_0_1px_rgba(222,226,220,0.7)]">
                    <span aria-hidden="true" className="pointer-events-none absolute -top-[6px] left-0 h-3 w-full bg-[radial-gradient(circle_at_6px_6px,#fffefb_5.5px,transparent_6px)] bg-[length:12px_12px] bg-repeat-x" />
                    <span aria-hidden="true" className="pointer-events-none absolute -bottom-[6px] left-0 h-3 w-full bg-[radial-gradient(circle_at_6px_6px,#fffefb_5.5px,transparent_6px)] bg-[length:12px_12px] bg-repeat-x" />
                    <div className="mb-1 text-center">
                      <span className="inline-flex rounded-full bg-[#e8f7ed] px-3 py-1 text-[10px] font-semibold text-[#08752e]">★ กำลังตรวจสอบ ★</span>
                      <h4 className="mt-1 text-[16px] font-bold">รายการจองของคุณ</h4>
                    </div>
                    <div className="divide-y divide-dashed divide-[#d6ddd8]">
                      <SummaryRow icon={MapPin} label="สนาม" value={court.name} />
                      <SummaryRow icon={CalendarDays} label="วันที่" value={formatThaiDate(date)} />
                      <SummaryRow icon={Clock3} label="ช่วงเวลา" value={startTime ? `${shortTime(startTime)} - ${shortTime(endTime)} น.` : 'กรุณาเลือกเวลา'} />
                      <SummaryRow icon={TimerReset} label="ระยะเวลา" value={selectedSlots.length > 0 ? `${selectedSlots.length} ชั่วโมง` : '-'} />
                      <SummaryRow icon={CircleDollarSign} label="ราคาต่อชั่วโมง" value={`฿${Number(court.price || court.price_per_hour).toLocaleString('th-TH')}`} />
                    </div>
                    <div className="mt-auto flex items-end justify-between border-t border-dashed border-[#9eaaa2] pt-2">
                      <p className="text-sm font-semibold text-[#08752e]">รวมทั้งหมด</p>
                      <p className="text-[25px] font-bold leading-none text-[#08752e]">฿{totalPrice.toLocaleString('th-TH')}</p>
                    </div>
                    <p className="mt-2 text-center text-[9px] font-medium tracking-[0.14em] text-[#59645e]">REVIEW ONLY • NOT CONFIRMED</p>
                  </div>
                </div>

                {/* Fixed footer button section pinned at the bottom */}
                <div className="booking-summary-footer relative z-10 flex shrink-0 flex-col items-center pt-3 border-t border-white/10">
                  <button
                    type="button"
                    onClick={handleBookingAction}
                    disabled={!isAuthenticated || selectedSlots.length === 0}
                    className="group relative z-10 flex h-10.5 w-auto items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#078333] via-[#0fa64c] to-[#077b30] px-7 text-[15px] font-bold text-white shadow-[0_5px_16px_rgba(8,117,46,0.35)] transition-all duration-200 enabled:cursor-pointer enabled:hover:scale-[1.03] enabled:hover:from-[#06742d] enabled:hover:to-[#066c2a] enabled:hover:shadow-[0_7px_20px_rgba(8,117,46,0.48)] enabled:active:scale-[0.97] disabled:cursor-not-allowed disabled:bg-none disabled:bg-[#475569] disabled:opacity-60 disabled:shadow-none"
                  >
                    <span>{isAuthenticated ? 'ถัดไป' : 'กรุณาเข้าสู่ระบบก่อนจองสนาม'}</span>
                    <ArrowRight className="h-4.5 w-4.5 transition-transform duration-200 group-hover:translate-x-1" />
                  </button>
                  {!isAuthenticated && (
                    <p className="relative mt-2 text-center text-xs text-[#d3dbe5]">
                      ต้องเข้าสู่ระบบก่อนทำรายการ{' '}
                      <button type="button" onClick={() => navigate('/login')} className="cursor-pointer font-semibold text-[#4be18a] underline underline-offset-2 hover:text-[#7ce9a8]">
                        ไปหน้าเข้าสู่ระบบ
                      </button>
                    </p>
                  )}
                </div>
              </aside>
            </>
          ) : currentStep === 2 ? (
            <BookingReviewStep
              court={court}
              imageStyle={imageStyle}
              formattedDate={formatThaiDate(date)}
              startTime={shortTime(startTime)}
              endTime={shortTime(endTime)}
              hours={selectedSlots.length}
              totalPrice={totalPrice}
              onBack={() => setCurrentStep(1)}
              contactPhone={contactPhone}
              onNext={() => setShowBookingConfirm(true)}
              submitting={submitting}
              submitError={submitError}
            />
          ) : (
            <BookingPaymentStep
              bookingResult={bookingResult}
              onClose={onClose}
            />
          )}
        </div>
        <ConfirmModal
          isOpen={showProceedConfirm}
          title="ยืนยันดำเนินการต่อ"
          message="คุณแน่ใจหรือไม่ว่าต้องการดำเนินการต่อ?"
          confirmText="ยืนยันและดำเนินการต่อ"
          cancelText="กลับไปแก้ไข"
          onConfirm={handleConfirmProceed}
          onCancel={() => setShowProceedConfirm(false)}
        />
        <ConfirmModal
          isOpen={showBookingConfirm}
          title="ยืนยันการจองสนาม"
          message="คุณแน่ใจหรือไม่ว่าต้องการยืนยันการจองและไปชำระเงิน?"
          confirmText="ยืนยันการจองและไปชำระเงิน"
          cancelText="กลับไปตรวจสอบ"
          confirmDisabled={submitting}
          onConfirm={handleConfirmCreateBooking}
          onCancel={() => setShowBookingConfirm(false)}
        />
        <BookingPhoneModal
          isOpen={showConfirm}
          contactPhone={contactPhone}
          user={user}
          onPhoneChange={(value) => {
            setContactPhone(value);
            setSubmitError('');
          }}
          onConfirm={handleConfirmNextStep}
          onCancel={() => setShowConfirm(false)}
        />
        <AlertModal
          isOpen={bookingAlert.isOpen}
          type="error"
          title={bookingAlert.title}
          message={bookingAlert.message}
          confirmText="รับทราบ"
          lightBackdrop
          onClose={() => setBookingAlert((current) => ({ ...current, isOpen: false }))}
        />
      </div>
    </div>
  );
};

const SummaryRow = ({ icon: Icon, label, value, highlight = false }) => (
  <div className="grid grid-cols-[24px_minmax(0,1fr)_minmax(0,1.35fr)] items-center gap-2 py-1.5">
    <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-[#eef4ef] text-[#176633]"><Icon className="h-3.5 w-3.5" /></span>
    <p className="text-[11px] text-[#526078]">{label}</p>
    <p className={`text-right text-[12px] font-semibold ${highlight ? 'text-[#08752e]' : 'text-[#172033]'}`}>{value}</p>
  </div>
);

const SlotStatusIcon = ({ status, className = '' }) => {
  if (status === 'available') return <span className={`h-3 w-3 rounded-full bg-[#159547] ${className}`} />;
  if (status === 'past') return <span className={`h-3 w-3 rounded-full bg-slate-300 ${className}`} />;
  if (status === 'pending_approval' || status === 'locked') return <span className={`grid h-4 w-4 place-items-center rounded-full border-2 border-amber-500 text-amber-500 ${className}`}><Clock3 className="h-2.5 w-2.5" /></span>;
  return <span className={`grid h-4 w-4 place-items-center rounded-full bg-red-500 text-white ${className}`}><X className="h-2.5 w-2.5" /></span>;
};

export default BookingModal;
