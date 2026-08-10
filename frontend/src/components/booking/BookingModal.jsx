import React, { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
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
import { useAuth } from '../../context/AuthContext';
import ConfirmModal from '../common/ConfirmModal';
import BookingPaymentStep from './BookingPaymentStep';
import BookingPhoneModal from './BookingPhoneModal';
import BookingReviewStep from './BookingReviewStep';
import toast from 'react-hot-toast';

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
  const [bookingResult, setBookingResult] = useState(null);
  const [modalEntered, setModalEntered] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [summaryHeight, setSummaryHeight] = useState(null);
  const notesRef = useRef(null);
  const summaryRef = useRef(null);

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
    document.body.style.overflow = 'hidden';
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

  useLayoutEffect(() => {
    if (currentStep !== 1 || !notesRef.current || !summaryRef.current) {
      setSummaryHeight(null);
      return undefined;
    }

    const notesElement = notesRef.current;
    const summaryElement = summaryRef.current;

    const alignSummaryBottom = () => {
      if (window.innerWidth < 1024) {
        setSummaryHeight(null);
        return;
      }
      const notesBottom = notesElement.getBoundingClientRect().bottom;
      const summaryTop = summaryElement.getBoundingClientRect().top;
      setSummaryHeight(Math.max(0, Math.round(notesBottom - summaryTop)));
    };

    alignSummaryBottom();
    const observer = new ResizeObserver(alignSummaryBottom);
    observer.observe(notesElement);
    window.addEventListener('resize', alignSummaryBottom);
    return () => {
      observer.disconnect();
      window.removeEventListener('resize', alignSummaryBottom);
    };
  }, [currentStep, loading, slots.length]);

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
      toast.error(message);
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

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[#07111e]/80 p-4 backdrop-blur-[2px]" onMouseDown={(event) => event.target === event.currentTarget && !submitting && onClose()}>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="booking-title"
        style={{ transform: modalEntered ? 'translate3d(0, 0, 0)' : 'translate3d(0, 18px, 0)' }}
        className={`booking-modal flex h-auto max-h-[calc(100dvh-24px)] w-full flex-col overflow-hidden rounded-[22px] shadow-[0_18px_42px_rgba(0,0,0,0.22)] transition-[opacity,transform] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] will-change-[transform,opacity] motion-reduce:transition-none ${modalEntered ? 'opacity-100' : 'opacity-0'} ${currentStep >= 2 ? 'max-w-[800px] bg-[#fffefb]' : 'max-w-[1430px] bg-[#f7f9fc]'}`}
      >
        <header className={`booking-modal-header flex border-b border-[#e3e8ef] bg-white px-6 max-lg:px-5 max-md:py-4 ${currentStep >= 2 ? 'relative min-h-[126px] items-start pt-4' : 'min-h-[76px] items-center max-md:items-start'}`}>
          <div className="flex min-w-[350px] items-center gap-3 max-lg:min-w-0 max-lg:flex-1">
            <div className="grid h-14 w-14 shrink-0 place-items-center rounded-full border-4 border-[#c8ead6] bg-[#08752e] text-2xl shadow-inner">⚽</div>
            <div>
              <h2 id="booking-title" className="text-[21px] font-bold text-[#111827] max-sm:text-lg">จองสนาม: {court.name}</h2>
              <p className="text-sm font-semibold text-[#08752e]">฿{Number(court.price || court.price_per_hour).toLocaleString('th-TH')} / ชั่วโมง</p>
            </div>
          </div>

          <div className={`flex items-center whitespace-nowrap max-lg:hidden ${currentStep >= 2 ? 'absolute bottom-4 left-1/2 -translate-x-1/2 gap-3' : 'mx-auto translate-y-1 gap-3'}`}>
            {['เลือกวันและเวลา', 'ตรวจสอบรายการ', 'ชำระเงิน'].map((label, index) => (
              <React.Fragment key={label}>
                <div className={`flex items-center font-semibold ${currentStep >= 2 ? 'gap-2 text-[13px]' : 'gap-2 text-[13px]'} ${index + 1 === currentStep ? 'text-[#08752e]' : 'text-[#52617a]'}`}>
                  <span className={`grid h-7 w-7 place-items-center rounded-full text-xs text-white ${index + 1 === currentStep ? 'bg-[#08752e]' : 'bg-[#254875]'}`}>{index + 1}</span>{label}
                </div>
                {index < 2 && <span className={`h-[2px] rounded-full bg-[#d9e1eb] ${currentStep >= 2 ? 'w-10' : 'w-8'}`} />}
              </React.Fragment>
            ))}
          </div>

          <button onClick={onClose} disabled={submitting} className={`grid h-11 w-11 shrink-0 place-items-center rounded-full bg-[#f0f3f7] text-[#14213a] transition enabled:hover:bg-[#e3e8ef] disabled:cursor-not-allowed disabled:opacity-45 ${currentStep >= 2 ? 'ml-auto' : 'ml-5'}`} aria-label="ปิดหน้าต่างจองสนาม"><X className="h-6 w-6" /></button>
        </header>

        <div className="booking-modal-content grid min-h-0 flex-auto grid-cols-[minmax(0,1fr)_360px] gap-4 overflow-hidden p-4 max-lg:grid-cols-1 max-lg:overflow-y-auto">
          {currentStep === 1 ? (
            <>
          <main className="booking-modal-main flex min-h-0 flex-col gap-3">
                <section className="booking-booking-info grid grid-cols-[300px_225px_1fr] overflow-hidden rounded-[16px] bg-white shadow-sm max-md:grid-cols-1">
                  <div className="border-r border-[#e2e7ee] p-5">
                    <label htmlFor="booking-date" className="mb-3 flex items-center gap-3 font-semibold"><CalendarDays className="h-6 w-6" />เลือกวันที่ต้องการเข้าใช้งาน</label>
                    <div className="relative">
                      <input id="booking-date" type="date" min={toBangkokDateInput()} value={date} onChange={(event) => setDate(event.target.value)} className="booking-date-input h-12 w-full cursor-pointer rounded-xl border border-[#cfd8e6] px-4 text-[18px] font-semibold text-transparent caret-transparent outline-none focus:border-[#08752e]" />
                      <span className="pointer-events-none absolute inset-y-0 left-4 flex items-center text-[18px] font-semibold text-[#18345f]">{formatDateInput(date)}</span>
                    </div>
                  </div>
                  <div className="border-r border-[#e2e7ee] p-5">
                    <p className="mb-3 flex items-center gap-3 font-semibold"><TimerReset className="h-6 w-6 text-[#08752e]" />เวลาเปิด - ปิด</p>
                    <div className="flex h-12 items-center justify-center rounded-xl border border-[#b8dfc7] bg-[#eef9f2] text-[18px] font-bold text-[#075c2a]">10.00 - 22.00 น.</div>
                  </div>
                  <div className="p-5">
                    <p className="mb-4 flex items-center gap-3 font-semibold"><Clock3 className="h-6 w-6 text-[#173b70]" />เลือกช่วงเวลา (เลือกได้สูงสุด 3 ชม.)</p>
                    <div className="flex flex-wrap gap-x-7 gap-y-2 text-sm font-medium">
                      <span className="flex items-center gap-2"><i className="h-4 w-4 rounded-full bg-[#159547]" />ว่าง (เลือกได้)</span>
                      <span className="flex items-center gap-2"><i className="h-4 w-4 rounded-full bg-red-500" />จองแล้ว</span>
                      <span className="flex items-center gap-2"><i className="h-4 w-4 rounded-full bg-amber-400" />รอชำระเงิน</span>
                    </div>
                  </div>
                </section>

                <section className="booking-periods overflow-hidden rounded-[16px] bg-white shadow-sm max-md:hidden">
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

                <section className="booking-slots min-h-0 rounded-[16px] bg-white p-4 shadow-sm">
                  <div className="mb-3 flex items-center justify-between">
                    <h3 className="text-[17px] font-semibold">เลือกช่วงเวลา <span className="font-normal text-[#62708a]">(คลิกที่ช่องเวลา)</span></h3>
                    {selectedSlots.length > 0 && <button onClick={() => setSelectedIndexes([])} className="text-sm font-medium text-red-500 underline">ยกเลิกการเลือก</button>}
                  </div>

                  {loading ? (
                    <div className="grid grid-cols-6 gap-2 max-md:grid-cols-3"><>{Array.from({ length: 12 }).map((_, index) => <div key={index} className="h-24 animate-pulse rounded-xl bg-[#e8edf3]" />)}</></div>
                  ) : error ? (
                    <div className="rounded-xl border border-red-200 bg-red-50 p-8 text-center text-red-600">{error}</div>
                  ) : (
                    <div>
                      <div className="relative mb-1 grid grid-cols-[repeat(13,minmax(0,1fr))] text-center text-[10px] font-semibold text-[#18345f] max-md:hidden">
                        <span className="absolute left-[4%] right-[4%] top-[26px] h-px bg-[#bdc9d8]" />
                        {[...slots.map((slot) => slot.start_time), slots[slots.length - 1]?.end_time].map((time, index) => (
                          <span key={`${time}-${index}`} className="relative z-10 flex flex-col items-center gap-2"><span>{shortTime(time)}</span><i className="h-2 w-2 rounded-full border-2 border-white bg-[#6d82a0]" /></span>
                        ))}
                      </div>
                      <div className="grid grid-cols-12 gap-1 max-xl:grid-cols-6 max-md:grid-cols-3 max-sm:grid-cols-2">
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

                <section ref={notesRef} className="booking-notes relative overflow-hidden rounded-[16px] border border-[#d8e9df] bg-gradient-to-r from-[#f7fcf9] to-[#f1f8f4] px-7 py-4">
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

          <aside ref={summaryRef} style={summaryHeight ? { height: `${summaryHeight}px` } : undefined} className="booking-summary flex min-h-0 flex-col self-start overflow-hidden rounded-[18px] bg-gradient-to-br from-[#132538] to-[#07131f] px-4 pb-2 pt-4 text-white shadow-lg max-lg:min-h-[520px]">
                <h3 className="flex items-center gap-3 text-lg font-semibold"><CalendarDays className="h-7 w-7 text-[#31d675]" />สรุปการเลือก</h3>
                <p className="ml-10 mt-0.5 text-xs text-[#d3dbe5]">ตรวจสอบรายการก่อนยืนยันการจอง</p>
                <div className="mt-3 aspect-video w-full shrink-0 rounded-[14px] border border-[#8090a3] bg-cover bg-center" style={imageStyle} />
                <div className="mt-2 divide-y divide-[#314153]">
                  <SummaryRow icon={MapPin} label="สนาม" value={court.name} />
                  <SummaryRow icon={CalendarDays} label="วันที่" value={formatThaiDate(date)} />
                  <SummaryRow icon={Clock3} label="ช่วงเวลา" value={startTime ? `${shortTime(startTime)} - ${shortTime(endTime)} น. (${selectedSlots.length} ชม.)` : 'กรุณาเลือกเวลา'} />
                  <SummaryRow icon={TimerReset} label="เวลาเปิด - ปิด" value="10.00 - 22.00 น." highlight />
                  <SummaryRow icon={CircleDollarSign} label={`ราคา (฿ ${Number(court.price || court.price_per_hour).toLocaleString('th-TH')} / ชั่วโมง)`} value={`฿ ${totalPrice.toLocaleString('th-TH')}`} />
                </div>
                <div className="mt-auto rounded-[15px] border border-[#0ba14d] bg-[#0b3028]/60 px-4 py-3">
                  <p className="text-sm font-semibold text-[#4be18a]">รวมทั้งหมด</p><p className="text-[28px] font-bold leading-8 text-[#4be18a]">฿ {totalPrice.toLocaleString('th-TH')}</p>
                </div>
                <button type="button" onClick={handleBookingAction} disabled={!isAuthenticated || selectedSlots.length === 0} className="mt-3 flex h-11 items-center justify-center gap-3 rounded-[12px] bg-gradient-to-r from-[#078333] to-[#12a94e] text-[15px] font-semibold text-white transition-colors enabled:cursor-pointer enabled:hover:from-[#066f2b] enabled:hover:to-[#0e963f] disabled:cursor-not-allowed disabled:from-[#657383] disabled:to-[#657383] disabled:opacity-70">{isAuthenticated ? 'ต่อไป : ตรวจสอบรายการ' : 'กรุณาเข้าสู่ระบบก่อนจองสนาม'} <ArrowRight className="h-5 w-5" /></button>
                {!isAuthenticated && (
                  <p className="mt-2 text-center text-xs text-[#d3dbe5]">
                    ต้องเข้าสู่ระบบก่อนทำรายการ{' '}
                    <button type="button" onClick={() => navigate('/login')} className="cursor-pointer font-semibold text-[#4be18a] underline underline-offset-2 hover:text-[#7ce9a8]">
                      ไปหน้าเข้าสู่ระบบ
                    </button>
                  </p>
                )}
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
      </div>
    </div>
  );
};

const SummaryRow = ({ icon: Icon, label, value, highlight = false }) => (
  <div className="flex gap-3 py-2">
    <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-[#0a402c] text-[#37d87a]"><Icon className="h-[18px] w-[18px]" /></span>
    <div><p className="text-xs text-[#cbd4df]">{label}</p><p className={`text-sm font-semibold ${highlight ? 'text-[#39de80]' : 'text-white'}`}>{value}</p></div>
  </div>
);

const SlotStatusIcon = ({ status, className = '' }) => {
  if (status === 'available') return <span className={`h-3 w-3 rounded-full bg-[#159547] ${className}`} />;
  if (status === 'past') return <span className={`h-3 w-3 rounded-full bg-slate-300 ${className}`} />;
  if (status === 'pending_approval' || status === 'locked') return <span className={`grid h-4 w-4 place-items-center rounded-full border-2 border-amber-500 text-amber-500 ${className}`}><Clock3 className="h-2.5 w-2.5" /></span>;
  return <span className={`grid h-4 w-4 place-items-center rounded-full bg-red-500 text-white ${className}`}><X className="h-2.5 w-2.5" /></span>;
};

export default BookingModal;
