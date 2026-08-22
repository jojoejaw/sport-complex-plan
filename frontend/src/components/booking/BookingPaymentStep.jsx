import { useEffect, useMemo, useState } from 'react';
import {
  ArrowRight,
  Clock3,
  Copy,
  FileImage,
  Info,
  LockKeyhole,
  Phone,
  ShieldCheck,
  Upload,
  WalletCards,
  Zap,
} from 'lucide-react';
import toast from 'react-hot-toast';
import paymentService from '../../services/paymentService';
import AlertModal from '../common/AlertModal';

const PAYMENT_SECONDS = 15 * 60;

const BookingPaymentStep = ({ bookingResult, onClose, initialSeconds = PAYMENT_SECONDS }) => {
  const [paymentConfig, setPaymentConfig] = useState(null);
  const [slipFile, setSlipFile] = useState(null);
  const [loadingConfig, setLoadingConfig] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [paid, setPaid] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(() => Math.max(0, Math.min(PAYMENT_SECONDS, initialSeconds)));

  useEffect(() => {
    let active = true;
    paymentService.getPaymentConfig()
      .then((data) => active && setPaymentConfig(data))
      .catch(() => active && setError('ไม่สามารถโหลดข้อมูลบัญชีพร้อมเพย์ได้'))
      .finally(() => active && setLoadingConfig(false));
    return () => { active = false; };
  }, []);

  useEffect(() => {
    if (paid || secondsLeft <= 0) return undefined;
    const timer = window.setInterval(() => {
      setSecondsLeft((current) => Math.max(0, current - 1));
    }, 1000);
    return () => window.clearInterval(timer);
  }, [paid, secondsLeft]);

  const formattedTime = `${String(Math.floor(secondsLeft / 60)).padStart(2, '0')}:${String(secondsLeft % 60).padStart(2, '0')}`;
  const totalPrice = Number(bookingResult?.total_price || 0);
  const bookingCode = bookingResult?.bookingId || '-';
  const qrCodeUrl = useMemo(() => {
    if (!paymentConfig?.promptpayId) return '';
    const promptPayId = encodeURIComponent(paymentConfig.promptpayId.replace(/\s/g, ''));
    return `https://promptpay.io/${promptPayId}/${totalPrice.toFixed(2)}.png`;
  }, [paymentConfig, totalPrice]);

  const copyPromptPay = async () => {
    if (!paymentConfig?.promptpayId) return;
    try {
      await navigator.clipboard.writeText(paymentConfig.promptpayId);
      toast.success('คัดลอกหมายเลขพร้อมเพย์แล้ว');
    } catch {
      toast.error('ไม่สามารถคัดลอกหมายเลขพร้อมเพย์ได้');
    }
  };

  const selectSlip = (event) => {
    const file = event.target.files?.[0] || null;
    if (file && file.size > 5 * 1024 * 1024) {
      event.target.value = '';
      setSlipFile(null);
      setError('รูปภาพสลิปต้องมีขนาดไม่เกิน 5MB');
      return;
    }
    setSlipFile(file);
    setError('');
  };

  const submitSlip = async (event) => {
    event.preventDefault();
    if (secondsLeft <= 0) return setError('หมดเวลาชำระเงินแล้ว กรุณาทำรายการจองใหม่');
    if (!slipFile) return setError('กรุณาเลือกรูปภาพสลิปก่อนยืนยันการชำระเงิน');
    try {
      setSubmitting(true);
      setError('');
      await paymentService.uploadSlip(bookingResult.bookingId, slipFile);
      setPaid(true);
    } catch (requestError) {
      const message = requestError.response?.data?.message || 'ไม่สามารถตรวจสอบสลิปได้ กรุณาลองใหม่อีกครั้ง';
      setError(message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
    <main className="booking-step-enter col-span-2 min-h-0 min-w-0 overflow-y-auto bg-transparent p-1 max-lg:col-span-1 max-lg:h-auto max-lg:flex-none max-lg:overflow-visible max-sm:p-0">
      <form onSubmit={submitSlip} className="mx-auto grid h-full max-h-full min-w-0 w-full max-w-[1050px] grid-cols-[1.1fr_0.9fr] gap-2 rounded-[20px] border border-transparent bg-transparent p-2 shadow-none max-lg:h-auto max-lg:max-h-none max-lg:grid-cols-1 max-sm:gap-2.5 max-sm:p-1">
        <div className="flex min-w-0 flex-col gap-1.5">
          <section className="relative overflow-hidden rounded-[15px] bg-[#06151c] px-4 py-3 text-white shadow-md">
            <div className="absolute -right-12 -top-14 h-36 w-36 rounded-full border-[16px] border-[#9be522]/20" />
            <div className="relative flex items-center gap-4">
              <span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-[#b9f22c] to-[#65a900] text-[#102019] shadow-[0_0_16px_rgba(154,224,31,0.3)]"><WalletCards className="h-6.5 w-6.5" /></span>
              <div>
                <p className="text-sm font-semibold text-white/80">ยอดที่ต้องชำระ</p>
                <strong className="block text-3xl font-extrabold leading-tight text-[#a8eb27]">฿{totalPrice.toLocaleString('th-TH')}</strong>
                <p className="text-xs font-medium text-white/75">เลขที่การจอง #{bookingCode}</p>
              </div>
            </div>
          </section>

          <section className="flex items-center gap-3 rounded-[13px] border border-[#e0e6df] bg-white p-3 shadow-sm max-sm:flex-wrap">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[#071820] text-[#a9e92d]"><Phone className="h-5 w-5" /></span>
            <div className="min-w-0 flex-1"><p className="text-xs font-semibold text-[#4e5c54]">โอนเงินพร้อมเพย์</p>{loadingConfig ? <p className="text-sm font-semibold">กำลังโหลดข้อมูล...</p> : <><strong className="block truncate text-xl font-extrabold leading-tight text-[#0f351e]">{paymentConfig?.promptpayId || '-'}</strong><p className="truncate text-xs font-medium text-[#526058]">{paymentConfig?.promptpayName || '-'}</p></>}</div>
            <button type="button" onClick={copyPromptPay} disabled={!paymentConfig} className="flex h-9 items-center gap-1.5 rounded-full border border-[#ccd8ce] px-4 text-xs font-bold text-[#183d28] transition hover:bg-[#f1f7ef] disabled:opacity-40 max-sm:w-full max-sm:justify-center"><span>คัดลอก</span><Copy className="h-4 w-4" /></button>
          </section>

          <section className="flex items-center gap-3 rounded-[13px] border border-[#e0e6df] bg-white p-3 shadow-sm max-sm:flex-wrap">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[#071820] text-[#a9e92d]"><Clock3 className="h-5 w-5" /></span>
            <div className="flex-1"><p className="text-sm font-bold text-[#101d17]">กรุณาชำระภายใน</p><strong className={`text-2xl font-extrabold ${secondsLeft <= 60 ? 'text-red-600' : 'text-[#101d17]'}`}>{formattedTime}</strong><span className="ml-1.5 text-sm font-bold">นาที</span><p className="text-xs font-medium text-[#526058]">หลังจากหมดเวลา รายการจองจะถูกยกเลิกโดยอัตโนมัติ</p></div>
            <div className="grid h-9 w-9 shrink-0 place-items-center rounded-full border-3 border-[#a4db31] text-[#4d7910]"><Clock3 className="h-4.5 w-4.5" /></div>
          </section>

          <label className="flex cursor-pointer items-center gap-3 rounded-[13px] border border-[#e0e6df] bg-white p-3 shadow-sm hover:border-[#93c629] hover:bg-[#fbfef6] max-sm:flex-wrap">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[#071820] text-[#a9e92d]"><Upload className="h-5 w-5" /></span>
            <div className="min-w-0 flex-1"><p className="text-sm font-bold text-[#101d17]">อัปโหลดสลิปการชำระเงิน</p><p className="truncate text-xs font-medium text-[#526058]">{slipFile ? slipFile.name : 'รองรับไฟล์ JPG, JPEG, PNG ขนาดไม่เกิน 5MB'}</p></div>
            <span className="flex h-9 shrink-0 items-center gap-1.5 rounded-full border border-[#ccd8ce] px-4 text-xs font-bold max-sm:w-full max-sm:justify-center"><FileImage className="h-4 w-4" />เลือกไฟล์</span>
            <input type="file" accept="image/jpeg,image/png" className="sr-only" onChange={selectSlip} />
          </label>

          <section className="rounded-[13px] bg-[#f2f7ed] px-3.5 py-2.5 text-xs text-[#26352d]">
            <h4 className="mb-1 flex items-center gap-1.5 text-sm font-extrabold text-[#101d17]"><Info className="h-4 w-4 text-[#101d17]" />หมายเหตุ</h4>
            <div className="grid grid-cols-[0.9fr_1.1fr] gap-x-2 gap-y-1 text-xs font-bold leading-snug text-[#213028] max-sm:grid-cols-1"><p className="whitespace-nowrap max-sm:whitespace-normal">✓ ชำระตามยอดที่แสดงเท่านั้น</p><p className="whitespace-nowrap max-sm:whitespace-normal">✓ ระบบตรวจสอบสลิปอัตโนมัติ</p><p className="whitespace-nowrap max-sm:whitespace-normal">✓ ไม่ต้องใส่หมายเหตุการโอน</p><p className="whitespace-nowrap max-sm:whitespace-normal">✓ ไม่ได้รับการยืนยัน โปรดติดต่อบริการลูกค้า</p></div>
          </section>
        </div>

        <aside className="relative flex flex-col items-center justify-between overflow-hidden rounded-[15px] bg-[#06151c] p-3.5 text-white shadow-md max-lg:min-h-0 max-sm:py-3.5">
          <div className="absolute inset-0 opacity-20 [background-image:radial-gradient(circle_at_75%_20%,#a7eb24_0,transparent_27%),linear-gradient(135deg,transparent_45%,#8bc51e_46%,transparent_47%)]" />
          <div className="relative flex items-center gap-2.5"><span className="grid h-9 w-9 place-items-center rounded-lg bg-[#a8eb27]/15 text-[#a8eb27]"><Zap className="h-5.5 w-5.5 fill-current" /></span><div><h3 className="text-lg font-extrabold"><span className="text-[#a8eb27]">สแกน</span>เพื่อชำระเงิน</h3><p className="text-xs font-medium text-center text-white/85">พร้อมเพย์ <span className="rounded bg-[#174b83] px-1.5 py-0.5 text-xs font-bold">PromptPay</span></p></div></div>
          <div className="relative mt-1.5 grid w-full max-w-[210px] flex-1 place-items-center rounded-[16px] border-[3px] border-[#8cc621] bg-white p-2 shadow-[0_0_14px_rgba(154,224,31,0.2)] max-lg:flex-none">
            {loadingConfig ? <p className="text-xs font-semibold text-[#56635b]">กำลังสร้าง QR Code...</p> : qrCodeUrl ? <img src={qrCodeUrl} alt="QR Code พร้อมเพย์สำหรับชำระเงิน" className="aspect-square w-full object-contain" /> : <p className="text-center text-xs font-bold text-red-500">ไม่สามารถสร้าง QR Code ได้</p>}
          </div>
          <div className="relative mt-1 text-center"><p className="text-sm font-bold text-white">ชื่อบัญชี : {paymentConfig?.promptpayName || '-'}</p><p className="text-sm font-bold text-white">หมายเลข : <span className="text-base font-extrabold text-[#a8eb27]">{paymentConfig?.promptpayId || '-'}</span></p></div>
          <div className="relative mt-1 flex w-full items-center justify-center gap-2 rounded-lg border border-[#668b25] bg-[#0b241d] p-2 text-xs font-medium"><ShieldCheck className="h-5.5 w-5.5 shrink-0 text-[#a8eb27]" /><span>ปลอดภัยด้วยระบบพร้อมเพย์<br /><small className="text-[11px] text-white/80 font-normal">โอนเงินได้จากทุกธนาคาร</small></span><LockKeyhole className="ml-auto h-4.5 w-4.5 shrink-0 text-[#a8eb27]" /></div>
        </aside>

        <button type="submit" disabled={!slipFile || submitting || loadingConfig || secondsLeft <= 0} className="relative col-span-2 mt-1 flex h-12 items-center justify-center rounded-[13px] bg-[#071820] px-12 text-center text-base font-extrabold text-white shadow-md transition-colors enabled:hover:bg-[#0d2922] disabled:cursor-not-allowed max-lg:col-span-1 max-sm:h-12 max-sm:px-3 max-sm:text-xs"><ShieldCheck className="absolute left-[calc(50%-180px)] h-6 w-6 text-[#a8eb27] max-sm:hidden" /><span>{submitting ? 'กำลังตรวจสอบสลิป...' : 'ยืนยันการชำระเงินและตรวจสอบสลิป'}<small className="block text-xs font-normal text-white/80">ระบบจะตรวจสอบอัตโนมัติ ภายในไม่กี่วินาที</small></span><ArrowRight className="absolute right-4 h-5 w-5 text-[#a8eb27] max-sm:hidden" /></button>
      </form>
    </main>
      <AlertModal
        isOpen={paid}
        type="success"
        title="ชำระเงินสำเร็จ"
        message={`รายการจอง #${bookingResult.bookingId} ได้รับการยืนยันแล้ว`}
        confirmText="ปิดหน้าต่าง"
        lightBackdrop
        onClose={onClose}
      />
      <AlertModal
        isOpen={Boolean(error) && !paid}
        type="error"
        title="ตรวจสอบสลิปไม่สำเร็จ"
        message={error}
        confirmText="รับทราบ"
        lightBackdrop
        onClose={() => setError('')}
      />
    </>
  );
};

export default BookingPaymentStep;
