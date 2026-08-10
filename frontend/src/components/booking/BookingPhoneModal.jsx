import {
  ArrowLeft,
  CheckCircle2,
  Phone,
  X,
} from 'lucide-react';

const BookingPhoneModal = ({
  isOpen,
  contactPhone,
  user,
  onPhoneChange,
  onCancel,
  onConfirm,
}) => {
  if (!isOpen) return null;

  const phoneIsValid = /^\d{10}$/.test(contactPhone);
  const showPhoneError = contactPhone.length > 0 && !phoneIsValid;

  const handleSubmit = (event) => {
    event.preventDefault();
    if (phoneIsValid && user) onConfirm();
  };

  return (
    <div
      className="fixed inset-0 z-[120] flex items-center justify-center bg-[#07111e]/70 p-4 backdrop-blur-[2px]"
      onMouseDown={(event) => event.target === event.currentTarget && onCancel()}
    >
      <form
        role="dialog"
        aria-modal="true"
        aria-labelledby="phone-modal-title"
        onSubmit={handleSubmit}
        className="booking-phone-dialog booking-dialog-enter relative w-full max-w-[480px] rounded-[24px] bg-white p-7 shadow-[0_22px_55px_rgba(2,20,13,0.34)] ring-1 ring-white/70 max-sm:rounded-[20px] max-sm:p-5"
      >
        <button
          type="button"
          onClick={onCancel}
          aria-label="ปิดหน้ากรอกเบอร์โทรศัพท์"
          className="absolute right-5 top-5 grid h-10 w-10 cursor-pointer place-items-center rounded-full bg-[#f1f4f6] text-[#314057] transition-colors hover:bg-[#e4e9ed]"
        >
          <X className="h-5 w-5" />
        </button>

        <header className="flex items-center gap-4 pr-11">
          <span className="grid h-14 w-14 shrink-0 place-items-center rounded-full bg-[#eaf8ef] text-[#07863a]">
            <Phone className="h-7 w-7" />
          </span>
          <div>
            <h2 id="phone-modal-title" className="text-[23px] font-bold leading-tight text-[#111827]">
              กรอกเบอร์โทรศัพท์
            </h2>
            <p className="mt-1 text-sm text-[#647187]">ใช้สำหรับติดต่อเกี่ยวกับรายการจองนี้</p>
          </div>
        </header>

        <div className="mt-6">
          <label htmlFor="booking-phone-modal" className="text-[15px] font-semibold text-[#172033]">
            เบอร์โทรศัพท์ 10 หลัก <span className="text-red-500">*</span>
          </label>
          <div className={`mt-2 flex h-13 items-center gap-3 rounded-[13px] border bg-white px-4 transition-colors ${phoneIsValid ? 'border-[#16a653]' : showPhoneError ? 'border-red-400' : 'border-[#cbd5df] focus-within:border-[#16a653]'}`}>
            <Phone className="h-5 w-5 shrink-0 text-[#0b9345]" />
            <input
              id="booking-phone-modal"
              type="tel"
              inputMode="numeric"
              autoComplete="tel"
              autoFocus
              value={contactPhone}
              onChange={(event) => onPhoneChange(event.target.value.replace(/\D/g, '').slice(0, 10))}
              placeholder="เช่น 0812345678"
              aria-invalid={showPhoneError}
              aria-describedby="booking-phone-help"
              className="h-full min-w-0 flex-1 bg-transparent text-lg font-semibold text-[#172033] outline-none placeholder:font-normal placeholder:text-[#919bac]"
            />
            {phoneIsValid && <CheckCircle2 className="h-5 w-5 shrink-0 text-[#0b9345]" />}
          </div>
          <p id="booking-phone-help" className={`mt-2 text-sm ${showPhoneError ? 'text-red-600' : 'text-[#657187]'}`}>
            {showPhoneError ? 'กรุณากรอกตัวเลขให้ครบ 10 หลัก' : 'กรอกเฉพาะตัวเลขให้ครบ 10 หลัก'}
          </p>
        </div>

        {!user && (
          <p className="mt-3 rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-700">
            กรุณาเข้าสู่ระบบก่อนทำรายการ
          </p>
        )}

        <div className="mt-6 grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="flex h-11 cursor-pointer items-center justify-center gap-2 rounded-xl border border-[#b9c7d4] bg-white font-semibold text-[#34445b] transition-colors hover:bg-[#f5f7f8]"
          >
            <ArrowLeft className="h-4 w-4" />ย้อนกลับ
          </button>
          <button
            type="submit"
            disabled={!phoneIsValid || !user}
            className="flex h-11 cursor-pointer items-center justify-center gap-2 rounded-xl bg-[#0b8d40] px-4 font-semibold text-white transition-colors enabled:hover:bg-[#087535] disabled:cursor-not-allowed disabled:opacity-45"
          >
            ยืนยัน<CheckCircle2 className="h-5 w-5" />
          </button>
        </div>
      </form>
    </div>
  );
};

export default BookingPhoneModal;
