import { X } from 'lucide-react';

const BOOKING_STEPS = ['เลือกวันและเวลา', 'ตรวจสอบรายการ', 'ชำระเงิน'];

const BookingModalHeader = ({
  courtName,
  pricePerHour,
  currentStep,
  onClose,
  closeDisabled = false,
}) => (
  <header className={`booking-modal-header flex border-b border-[#e3e8ef] bg-white px-6 max-lg:px-5 max-md:py-4 ${currentStep === 3 ? 'relative min-h-[126px] items-start pt-4 max-sm:min-h-[88px] max-sm:items-center max-sm:py-3' : 'min-h-[76px] items-center max-md:items-start'}`}>
    <div className="flex min-w-[350px] items-center gap-3 max-lg:min-w-0 max-lg:flex-1">
      <div className="grid h-14 w-14 shrink-0 place-items-center rounded-full border-4 border-[#c8ead6] bg-[#08752e] text-2xl shadow-inner">⚽</div>
      <div>
        <h2 id="booking-title" className="text-[21px] font-bold text-[#111827] max-sm:text-lg">จองสนาม: {courtName}</h2>
        <p className="text-sm font-semibold text-[#08752e]">฿{Number(pricePerHour || 0).toLocaleString('th-TH')} / ชั่วโมง</p>
      </div>
    </div>

    <div className={`flex items-center gap-3 whitespace-nowrap max-lg:hidden ${currentStep === 3 ? 'absolute bottom-4 left-1/2 -translate-x-1/2' : 'mx-auto translate-y-1'}`}>
      {BOOKING_STEPS.map((label, index) => (
        <div key={label} className="contents">
          <div className={`flex items-center gap-2 text-[13px] font-semibold ${index + 1 === currentStep ? 'text-[#08752e]' : 'text-[#52617a]'}`}>
            <span className={`grid h-7 w-7 place-items-center rounded-full text-xs text-white ${index + 1 === currentStep ? 'bg-[#08752e]' : 'bg-[#254875]'}`}>{index + 1}</span>
            {label}
          </div>
          {index < BOOKING_STEPS.length - 1 && <span className={`h-[2px] rounded-full bg-[#d9e1eb] ${currentStep === 3 ? 'w-10' : 'w-8'}`} />}
        </div>
      ))}
    </div>

    <button
      type="button"
      onClick={onClose}
      disabled={closeDisabled}
      className={`grid h-11 w-11 shrink-0 place-items-center rounded-full bg-[#f0f3f7] text-[#14213a] transition enabled:hover:bg-[#e3e8ef] disabled:cursor-not-allowed disabled:opacity-45 ${currentStep === 3 ? 'ml-auto' : 'ml-5'}`}
      aria-label="ปิดหน้าต่างจองสนาม"
    >
      <X className="h-6 w-6" />
    </button>
  </header>
);

export default BookingModalHeader;
