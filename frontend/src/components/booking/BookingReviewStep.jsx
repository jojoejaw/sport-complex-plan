import {
  ArrowLeft,
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  Clock3,
  Dumbbell,
  Lightbulb,
  LockKeyhole,
  MapPin,
  Phone,
  ShieldCheck,
  Sparkles,
  Tag,
  TimerReset,
} from 'lucide-react';

const BookingReviewStep = ({
  court,
  imageStyle,
  formattedDate,
  startTime,
  endTime,
  hours,
  totalPrice,
  onBack,
  onNext,
  contactPhone,
  submitting = false,
  submitError = '',
}) => {
  const pricePerHour = Number(court?.price || court?.price_per_hour || 0);
  const safeTotalPrice = Number(totalPrice || 0);
  const safeHours = Number(hours || 0);
  const reviewIsValid = Boolean(
    court?.name
    && formattedDate
    && formattedDate !== '-'
    && startTime
    && endTime
    && Number.isInteger(safeHours)
    && safeHours >= 1
    && safeHours <= 3
    && /^\d{10}$/.test(String(contactPhone || ''))
    && Number.isFinite(pricePerHour)
    && pricePerHour > 0
    && Number.isFinite(safeTotalPrice)
    && safeTotalPrice > 0
  );

  const details = [
    { icon: CalendarDays, label: 'วันที่จอง', value: formattedDate },
    { icon: Clock3, label: 'ช่วงเวลา', value: `${startTime} - ${endTime} น. (${safeHours} ชม.)` },
    { icon: Tag, label: `ราคา (฿${pricePerHour.toLocaleString('th-TH')} / ชั่วโมง)`, value: `฿${safeTotalPrice.toLocaleString('th-TH')}` },
    { icon: TimerReset, label: 'จำนวนชั่วโมง', value: `${safeHours} ชั่วโมง` },
    { icon: Phone, label: 'เบอร์โทรศัพท์', value: contactPhone || '-' },
  ];

  return (
    <main className="booking-review-step booking-step-enter col-span-2 flex min-h-0 flex-col overflow-y-auto overflow-x-hidden bg-transparent p-4 max-lg:col-span-1 max-lg:flex-none max-lg:overflow-visible max-sm:p-2">
      <section className="booking-review-card relative mx-auto flex min-h-0 w-full max-w-[1260px] flex-1 overflow-hidden rounded-[22px] bg-[#fffefb] shadow-[0_18px_44px_rgba(0,22,13,0.28)] max-lg:flex-none max-lg:flex-col">
        <span className="absolute left-1/2 top-0 z-10 h-8 w-8 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#e8f3ec] max-lg:hidden" />
        <span className="absolute bottom-0 left-1/2 z-10 h-8 w-8 -translate-x-1/2 translate-y-1/2 rounded-full bg-[#c9dfd1] max-lg:hidden" />

        <article className="flex min-w-0 flex-[1.2] flex-col border-r-2 border-dashed border-[#8ba998] px-8 py-5 max-lg:border-b-2 max-lg:border-r-0 max-lg:px-5 max-sm:px-3">
          <header className="flex items-center justify-between border-b border-dashed border-[#afc2b6] pb-3">
            <div className="flex items-center gap-4">
              <span className="grid h-14 w-14 shrink-0 place-items-center text-[#116331]"><ShieldCheck className="h-14 w-14" strokeWidth={1.8} /></span>
              <div><h3 className="text-[23px] font-bold text-[#18364a] max-lg:text-xl">ตรวจสอบรายละเอียดการจอง</h3><p className="text-sm text-[#53657a]">กรุณาตรวจสอบข้อมูลให้ถูกต้อง ก่อนยืนยันการจอง</p></div>
            </div>
            <div className="grid h-20 w-20 shrink-0 rotate-[-8deg] place-items-center rounded-full border-[3px] border-double border-[#16813c] text-center text-[8px] font-bold uppercase tracking-wider text-[#167238] max-sm:hidden"><span>Sport Complex<br /><span className="text-xl">⚽</span><br />Booking Review</span></div>
          </header>

          <div className="mt-3 aspect-[2.55/1] w-full rounded-[13px] bg-center bg-no-repeat" style={{ ...imageStyle, backgroundSize: 'cover' }} />

          <div className="mt-3 flex items-center gap-4">
            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-[#0d7b37] text-white"><MapPin className="h-6 w-6" /></span>
            <div><h4 className="text-lg font-bold text-[#172d3f]">{court?.name || '-'}</h4><p className="text-sm font-semibold text-[#147335]">฿{pricePerHour.toLocaleString('th-TH')} / ชั่วโมง</p></div>
          </div>
          <p className="mt-2 text-xs leading-5 text-[#53657a]">สนามกีฬาคุณภาพมาตรฐาน พร้อมพื้นที่และสิ่งอำนวยความสะดวกสำหรับการเล่นกีฬาอย่างเต็มที่</p>

          <div className="mt-auto grid grid-cols-3 divide-x divide-[#dce5df] rounded-xl border border-[#d8e3dc] px-3 py-3 text-xs text-[#33485a] max-sm:grid-cols-1 max-sm:divide-x-0 max-sm:divide-y">
            <div className="flex items-center gap-2 px-2"><ShieldCheck className="h-6 w-6 shrink-0 text-[#15743a]" /><span><strong className="block">มาตรฐานดี</strong>พื้นที่คุณภาพ</span></div>
            <div className="flex items-center gap-2 px-3"><Lightbulb className="h-6 w-6 shrink-0 text-[#15743a]" /><span><strong className="block">ไฟส่องสว่าง</strong>ใช้งานชัดเจน</span></div>
            <div className="flex items-center gap-2 px-3"><Dumbbell className="h-6 w-6 shrink-0 text-[#15743a]" /><span><strong className="block">พร้อมใช้งาน</strong>สะดวกสบาย</span></div>
          </div>
        </article>

        <article className="flex min-w-0 flex-1 flex-col px-8 py-5 max-lg:px-5 max-sm:px-3">
          <header className="relative border-b-2 border-dashed border-[#a6bbae] pb-4 text-center">
            <Sparkles className="absolute right-1 top-0 h-7 w-7 text-[#118039]" />
            <h3 className="text-[28px] font-extrabold tracking-wide text-[#11612f] max-lg:text-2xl">SPORT COMPLEX</h3>
            <p className="text-xs font-bold tracking-[0.26em] text-[#244c38]">★ BOOKING REVIEW ★</p>
          </header>

          <div className="mt-3 divide-y divide-[#d4ddd7]">
            {details.map(({ icon: Icon, label, value }) => (
              <div key={label} className="grid grid-cols-[36px_minmax(0,1fr)_minmax(0,1.35fr)] items-center gap-3 py-2 max-sm:grid-cols-[32px_minmax(0,1fr)] max-sm:gap-x-2 max-sm:gap-y-0">
                <span className="grid h-8 w-8 place-items-center rounded-full bg-[#edf5ef] text-[#14743a]"><Icon className="h-4 w-4" /></span>
                <span className="text-sm font-semibold text-[#34465a]">{label}</span>
                <strong className="min-w-0 break-words text-[15px] text-[#173d2a] max-sm:col-start-2">{value}</strong>
              </div>
            ))}
          </div>

          <div className="mt-auto flex min-h-[86px] overflow-hidden rounded-[14px] border-2 border-[#14743a] max-sm:flex-col">
            <div className="flex flex-1 flex-col justify-center px-6 text-[#12612f]"><span className="text-xl font-bold">รวมทั้งหมด</span><em className="font-serif text-sm">Total Amount</em></div>
            <div className="grid min-w-[170px] place-items-center bg-gradient-to-br from-[#147a36] to-[#075425] px-6 text-white max-sm:min-w-0 max-sm:py-3"><strong className="text-[38px] leading-none max-sm:text-[32px]">฿{safeTotalPrice.toLocaleString('th-TH')}</strong><span className="text-xs font-semibold tracking-wider">THB</span></div>
          </div>

          <div className="mt-4 border-t-2 border-dashed border-[#8fa599] pt-3 text-center">
            <p className="font-semibold tracking-[0.18em] text-[#486255]">รายการรอตรวจสอบ</p>
            <p className="mt-1 text-[10px] tracking-[0.2em] text-[#6b7b72]">REVIEW ONLY • NOT CONFIRMED</p>
          </div>
        </article>
      </section>

      <footer className="booking-review-actions mx-auto mt-3 flex w-full max-w-[1260px] items-center justify-end gap-5 max-sm:flex-col max-sm:gap-2">
        <div className="mr-auto max-sm:mr-0 max-sm:w-full">
          {submitError && <div role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-2 text-center text-xs text-red-600">{submitError}</div>}
        </div>
        <button type="button" onClick={onBack} disabled={submitting} className="flex h-11 min-w-[125px] items-center justify-center gap-1.5 rounded-xl border-2 border-[#15813a] bg-white px-2 text-xs font-semibold text-[#147333] transition-colors hover:bg-[#f0faf4] disabled:cursor-not-allowed disabled:opacity-50 max-sm:min-w-0 max-sm:w-full"><ArrowLeft className="h-4 w-4" />กลับไปแก้ไข</button>
        <button type="button" onClick={onNext} disabled={submitting || !reviewIsValid} className="flex h-11 min-w-[165px] items-center justify-center gap-1.5 rounded-xl bg-gradient-to-r from-[#167333] to-[#098138] px-2 text-xs font-semibold text-white shadow-[0_6px_14px_rgba(10,113,49,0.2)] transition-colors enabled:hover:from-[#125f2b] enabled:hover:to-[#087432] disabled:cursor-not-allowed disabled:opacity-50 max-sm:min-w-0 max-sm:w-full">{submitting ? 'กำลังสร้างรายการ...' : 'ยืนยันการจอง'}<CheckCircle2 className="h-4 w-4" /><ArrowRight className="h-4 w-4" /></button>
      </footer>

      {!reviewIsValid && <div role="alert" className="mx-auto mt-2 w-full max-w-[760px] rounded-xl border border-amber-200 bg-amber-50 px-4 py-2 text-center text-xs text-amber-700">ข้อมูลรายการจองไม่ครบหรือไม่ถูกต้อง กรุณาย้อนกลับไปตรวจสอบข้อมูล</div>}
      <p className="mt-1 flex items-center justify-center gap-2 text-[13px] font-medium text-[#345c49]"><LockKeyhole className="h-3.5 w-3.5" />ระบบจะล็อกสนามไว้ 15 นาทีหลังยืนยันรายการ</p>
    </main>
  );
};

export default BookingReviewStep;
