import {
  ArrowLeft,
  CalendarDays,
  CheckCircle2,
  Clock3,
  Clock9,
  LockKeyhole,
  Map,
  Phone,
  ShieldCheck,
  Tag,
  X,
} from 'lucide-react';

const BookingPhoneModal = ({
  isOpen,
  court,
  formattedDate,
  startTime,
  endTime,
  hours,
  totalPrice,
  contactPhone,
  user,
  onPhoneChange,
  onCancel,
  onConfirm,
}) => {
  if (!isOpen) return null;

  const phoneIsValid = /^\d{10}$/.test(contactPhone);
  const pricePerHour = Number(court.price || court.price_per_hour || 0);
  const summaryItems = [
    { icon: Map, label: 'สนาม', value: court.name },
    { icon: CalendarDays, label: 'วันที่', value: formattedDate },
    { icon: Clock3, label: 'เวลา', value: `${startTime} - ${endTime} น. (${hours} ชม.)` },
    { icon: Tag, label: 'ราคา', value: `฿ ${pricePerHour.toLocaleString('th-TH')} / ชั่วโมง` },
  ];

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center bg-[#07111e]/70 p-4 backdrop-blur-[2px]" onMouseDown={(event) => event.target === event.currentTarget && onCancel()}>
      <div role="dialog" aria-modal="true" aria-labelledby="phone-modal-title" className="booking-phone-dialog booking-dialog-enter relative grid max-h-[calc(100dvh-24px)] w-full max-w-[1500px] origin-center grid-cols-[410px_minmax(0,1fr)] overflow-hidden rounded-[28px] bg-white ring-2 ring-white/70 shadow-[0_26px_58px_rgba(2,20,13,0.42)] lg:[zoom:0.6] max-lg:grid-cols-[320px_minmax(0,1fr)] max-md:block max-md:overflow-y-auto">
        <aside className="relative border-r-2 border-dashed border-[#d7dad5] bg-[#fffef9] px-8 py-7 max-lg:px-6 max-md:border-b-2 max-md:border-r-0">
          <div className="flex items-center gap-4 border-b border-dashed border-[#aeb6ae] pb-5">
            <span className="grid h-[68px] w-[68px] shrink-0 place-items-center rounded-full border-4 border-[#c8ead6] bg-[#08752e] text-[34px] shadow-md">⚽</span>
            <div><p className="text-4xl font-bold tracking-tight text-[#101c2e]">SPORT COMPLEX</p><p className="text-2xl font-semibold text-[#08752e]">จองสนามกีฬาออนไลน์</p></div>
          </div>

          <h3 className="mt-6 text-4xl font-bold text-[#08752e]">สรุปรายการจอง</h3>
          <div className="mt-4 space-y-4">
            {summaryItems.map(({ icon: Icon, label, value }) => (
              <div key={label} className="grid grid-cols-[44px_1fr] items-center gap-3">
                <Icon className="h-8 w-8 text-[#08752e]" strokeWidth={1.8} />
                <div><p className="text-xl text-[#34445b]">{label}</p><p className="text-2xl font-bold text-[#111827]">{value}</p></div>
              </div>
            ))}
          </div>

          <div className="mt-5 border-y border-dashed border-[#9fa8a0] py-4 text-center">
            <p className="text-2xl font-semibold text-[#08752e]">รวมทั้งหมด</p>
            <p className="text-[46px] font-bold leading-tight text-[#08752e]">฿ {totalPrice.toLocaleString('th-TH')}</p>
            <p className="text-xl font-semibold">{totalPrice.toLocaleString('th-TH')} บาทถ้วน</p>
          </div>

        </aside>

        <section className="relative flex min-h-0 flex-col px-16 py-8 max-xl:px-10 max-lg:px-7 max-md:px-5 max-md:py-6">
          <button type="button" onClick={onCancel} aria-label="ปิดหน้ากรอกเบอร์โทรศัพท์" className="absolute right-7 top-7 grid h-12 w-12 cursor-pointer place-items-center rounded-full bg-[#f1f3f5] text-[#101827] transition-colors hover:bg-[#e5e9ed] max-md:right-4 max-md:top-4"><X className="h-7 w-7" /></button>

          <header className="flex items-center justify-center gap-5 pr-14 max-md:justify-start">
            <span className="grid h-24 w-24 shrink-0 place-items-center rounded-full border-[8px] border-[#f0f7f2] bg-[#f7fcf8] text-[#0b9345] shadow-lg max-lg:h-20 max-lg:w-20"><Phone className="h-12 w-12 fill-[#0b9345]/15 max-lg:h-10 max-lg:w-10" /></span>
            <div><h2 id="phone-modal-title" className="text-[36px] font-bold tracking-tight text-[#111827] max-lg:text-[30px] max-sm:text-2xl">กรอกเบอร์โทรศัพท์</h2><p className="text-xl text-[#637087] max-lg:text-lg">ใช้สำหรับติดต่อเกี่ยวกับรายการจองนี้</p></div>
          </header>

          <div className="mt-6 flex min-h-0 flex-col rounded-[18px] border border-[#d7dce2] px-14 py-5 max-xl:px-9 max-lg:px-6 max-sm:px-4">
            <div className="mt-5">
              <label htmlFor="booking-phone-modal" className="text-[28px] font-bold text-[#152033]">เบอร์โทรศัพท์ 10 หลัก <span className="text-red-500">*</span></label>
              <div className={`mt-3 flex h-[70px] items-center gap-4 rounded-[14px] border bg-white px-5 transition ${phoneIsValid ? 'border-[#16a653] shadow-[0_0_16px_rgba(22,166,83,0.28)]' : 'border-[#cbd5df] focus-within:border-[#16a653] focus-within:shadow-[0_0_16px_rgba(22,166,83,0.22)]'}`}>
                <Phone className="h-8 w-8 shrink-0 text-[#0b9345]" />
                <input id="booking-phone-modal" type="tel" inputMode="numeric" autoComplete="tel" autoFocus value={contactPhone} onChange={(event) => onPhoneChange(event.target.value.replace(/\D/g, '').slice(0, 10))} placeholder="เช่น 0812345678" className="h-full min-w-0 flex-1 bg-transparent text-[35px] font-semibold text-[#172033] outline-none placeholder:text-[#8d97a8] max-lg:text-[28px]" />
                {phoneIsValid && <CheckCircle2 className="h-7 w-7 shrink-0 text-[#0b9345]" />}
              </div>
              <p className={`mt-3 text-[22px] ${contactPhone.length > 0 && !phoneIsValid ? 'text-red-600' : 'text-[#435168]'}`}>{contactPhone.length > 0 && !phoneIsValid ? 'กรุณากรอกตัวเลขให้ครบ 10 หลัก' : 'กรอกตัวเลขให้ครบ 10 หลัก'}</p>
            </div>

            <div className="mt-5 flex items-center gap-5 rounded-[16px] border border-[#d7e2dc] bg-[#f7faf8] p-5">
              <span className="grid h-14 w-14 shrink-0 place-items-center rounded-full bg-white text-[#08752e] shadow"><LockKeyhole className="h-7 w-7" /></span>
              <div><h3 className="text-[27px] font-bold text-[#08752e]">ทำไมต้องกรอกเบอร์โทร?</h3><p className="text-[22px] text-[#26364d]">เพื่อให้เราสามารถติดต่อและแจ้งรายละเอียดการจอง หรือเปลี่ยนแปลงรายการได้อย่างรวดเร็ว</p></div>
            </div>

            <div className="mt-5 grid grid-cols-3 divide-x divide-[#dfe4e1] rounded-[16px] border border-[#dfe4e1] p-5 max-sm:grid-cols-1 max-sm:divide-x-0 max-sm:divide-y">
              {[{ icon: ShieldCheck, title: 'ปลอดภัย 100%', text: 'ข้อมูลของคุณถูกเข้ารหัส' }, { icon: Phone, title: 'ติดต่อสะดวก', text: 'รับข่าวสารและแจ้งเตือน' }, { icon: Clock9, title: 'รวดเร็วทันใจ', text: 'เพื่อประสบการณ์ที่ดีที่สุด' }].map(({ icon: Icon, title, text }) => (
                <div key={title} className="flex items-center gap-3 px-4 first:pl-0 last:pr-0 max-sm:px-0 max-sm:py-3"><span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-[#f3faf5] text-[#08752e]"><Icon className="h-6 w-6" /></span><div><p className="text-[22px] font-bold text-[#08752e]">{title}</p><p className="text-xl text-[#435168]">{text}</p></div></div>
              ))}
            </div>

            <p className="mt-4 flex items-center justify-center gap-2 border-t border-[#d8dee2] pt-4 text-[22px] text-[#536177]"><ShieldCheck className="h-5 w-5 text-[#08752e]" />ข้อมูลของคุณจะถูกเก็บรักษาอย่างปลอดภัย</p>
          </div>

          <div className="mt-6 grid grid-cols-[0.7fr_1.3fr] gap-6 max-sm:grid-cols-1 max-sm:gap-3">
            <button type="button" onClick={onCancel} className="flex h-[74px] cursor-pointer items-center justify-center gap-4 rounded-[14px] border border-[#16a653] bg-white text-3xl font-bold text-[#08752e] transition-colors hover:bg-[#f2faf5] max-lg:h-14 max-lg:text-xl"><ArrowLeft className="h-6 w-6" />กลับไป</button>
            <button type="button" onClick={onConfirm} disabled={!phoneIsValid || !user} className="flex h-[74px] cursor-pointer items-center justify-center gap-4 rounded-[14px] bg-gradient-to-r from-[#0d7b36] to-[#079442] px-5 text-3xl font-bold text-white shadow-[0_8px_20px_rgba(8,117,46,0.24)] transition-colors enabled:hover:from-[#09672d] enabled:hover:to-[#078039] disabled:cursor-not-allowed disabled:opacity-45 max-lg:h-14 max-lg:text-xl"><CheckCircle2 className="h-8 w-8" /><span>ยืนยันและตรวจสอบรายการ<span className="block text-lg font-normal">ไปยังขั้นตอนถัดไป: ตรวจสอบรายการ</span></span></button>
          </div>
        </section>
      </div>
    </div>
  );
};

export default BookingPhoneModal;
