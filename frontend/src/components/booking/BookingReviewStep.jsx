import {
  ArrowLeft,
  ArrowRight,
  CalendarDays,
  Check,
  Clock3,
  LockKeyhole,
  Map,
  Phone,
  Tag,
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
  const pricePerHour = Number(court.price || court.price_per_hour || 0);

  const details = [
    { icon: Map, label: 'สนาม', value: court.name },
    { icon: CalendarDays, label: 'วันที่จอง', value: formattedDate },
    { icon: Clock3, label: 'ช่วงเวลา', value: `${startTime} - ${endTime} น. (${hours} ชม.)` },
    { icon: Tag, label: `ราคา (฿ ${pricePerHour.toLocaleString('th-TH')} / ชั่วโมง)`, value: `฿ ${totalPrice.toLocaleString('th-TH')}` },
    { icon: Phone, label: 'เบอร์โทรศัพท์', value: contactPhone },
  ];

  return (
    <main className="col-span-2 min-h-0 overflow-hidden bg-[#fffefb] px-4 py-3 max-lg:col-span-1 max-sm:overflow-y-auto max-sm:px-3">
      <div className="mx-auto w-full max-w-[540px] origin-top lg:scale-[0.95]">
        <article className="relative bg-[#fffefb] px-8 py-5 shadow-[0_10px_30px_rgba(29,45,62,0.14)] max-sm:px-4 max-sm:py-4">
          <span className="absolute -left-2.5 bottom-[105px] h-5 w-5 rounded-full bg-[#fffefb]" />
          <span className="absolute -right-2.5 bottom-[105px] h-5 w-5 rounded-full bg-[#fffefb]" />

          <div className="flex items-center justify-between gap-4 border-b border-dashed border-[#cbd2d7] pb-3">
            <div className="flex items-center gap-4">
              <span className="grid h-[58px] w-[58px] shrink-0 place-items-center rounded-full border-4 border-[#d7eadc] bg-gradient-to-br from-[#205e2e] to-[#063a17] text-white shadow-inner">
                <Check className="h-9 w-9" strokeWidth={3.5} />
              </span>
              <div>
                <h3 className="text-[23px] font-bold text-[#155426] max-sm:text-lg">กำลังตรวจสอบรายการจอง</h3>
                <p className="text-sm text-[#415168]">กรุณาตรวจสอบความถูกต้องก่อนยืนยัน</p>
              </div>
            </div>
            <div className="grid h-[82px] w-[82px] shrink-0 rotate-[-9deg] place-items-center rounded-full border-[3px] border-double border-[#17602b] text-center text-[8px] font-bold uppercase tracking-wider text-[#17602b] max-sm:hidden">
              <span>Sport Complex<br /><span className="text-[23px]">⚽</span><br />Booking Review</span>
            </div>
          </div>

          <div
            className="mx-auto mt-3 aspect-[2.42/1] w-[94%] bg-center bg-no-repeat"
            style={{
              ...imageStyle,
              backgroundSize: 'cover',
              clipPath: 'polygon(1.2% 0,98.8% 0,98.8% 4%,100% 8%,98.8% 12%,100% 16%,98.8% 20%,100% 24%,98.8% 28%,100% 32%,98.8% 36%,100% 40%,98.8% 44%,100% 48%,98.8% 52%,100% 56%,98.8% 60%,100% 64%,98.8% 68%,100% 72%,98.8% 76%,100% 80%,98.8% 84%,100% 88%,98.8% 92%,100% 96%,98.8% 100%,1.2% 100%,1.2% 96%,0 92%,1.2% 88%,0 84%,1.2% 80%,0 76%,1.2% 72%,0 68%,1.2% 64%,0 60%,1.2% 56%,0 52%,1.2% 48%,0 44%,1.2% 40%,0 36%,1.2% 32%,0 28%,1.2% 24%,0 20%,1.2% 16%,0 12%,1.2% 8%,1.2% 4%)',
            }}
          />

          <div className="mt-2 divide-y divide-dashed divide-[#cbd2d7]">
            {details.map(({ icon: Icon, label, value }) => (
              <div key={label} className="grid grid-cols-[40px_1fr_1.3fr] items-center gap-3 py-1.5 max-sm:grid-cols-[36px_1fr]">
                <span className="grid h-8 w-8 place-items-center rounded-full bg-[#eef4ef] text-[#145b29]"><Icon className="h-4 w-4" /></span>
                <span className="text-sm font-semibold text-[#26364d]">{label}</span>
                <strong className="text-[15px] text-[#12602b] max-sm:col-start-2">{value}</strong>
              </div>
            ))}
          </div>

          <div className="relative mt-2 flex items-center justify-between overflow-hidden rounded-[12px] bg-gradient-to-r from-[#17682e] via-[#0b7b34] to-[#075c28] px-6 py-3 text-white">
            <span className="font-semibold">รวมทั้งหมด</span>
            <strong className="text-[27px]">฿ {totalPrice.toLocaleString('th-TH')}</strong>
            <span className="absolute -bottom-9 -right-5 h-28 w-28 rounded-full border-[12px] border-white/5 bg-white/5" />
          </div>

          <div className="mt-3 border-t-2 border-dashed border-[#768079] pt-3">
            <div className="text-center text-[#0f5a28]">
              <p className="font-serif text-[29px] italic leading-none">Thank you!</p>
              <p className="mt-1 text-[10px] tracking-[0.24em]">♡ &nbsp; SEE YOU AGAIN</p>
            </div>
          </div>
        </article>

        <div className="mx-auto mt-3 grid w-[80%] grid-cols-[0.8fr_1.2fr] gap-3 max-sm:w-full max-sm:grid-cols-1">
          <button type="button" onClick={onBack} disabled={submitting} className="flex h-10 items-center justify-center gap-3 rounded-xl border border-[#15813a] bg-white text-base font-semibold text-[#147333] shadow-sm transition hover:bg-[#f0faf4] disabled:opacity-50">
            <ArrowLeft className="h-5 w-5" />ย้อนกลับ
          </button>
          <button type="button" onClick={onNext} disabled={submitting} className="flex h-10 items-center justify-center gap-3 rounded-xl bg-gradient-to-r from-[#167333] to-[#098138] text-base font-semibold text-white shadow-[0_6px_14px_rgba(10,113,49,0.2)] transition enabled:hover:brightness-110 disabled:opacity-50">
            {submitting ? 'กำลังสร้างรายการ...' : 'ยืนยันการจอง และไปชำระเงิน'}<ArrowRight className="h-5 w-5" />
          </button>
        </div>
        {submitError && <div role="alert" className="mx-auto mt-2 w-[80%] rounded-xl border border-red-200 bg-red-50 px-4 py-2 text-center text-xs text-red-600">{submitError}</div>}
        <p className="mt-2 flex items-center justify-center gap-2 text-xs text-[#53637a]"><LockKeyhole className="h-3.5 w-3.5" />ระบบจะล็อกสนามไว้ 15 นาทีหลังยืนยันรายการ</p>
      </div>
    </main>
  );
};

export default BookingReviewStep;
