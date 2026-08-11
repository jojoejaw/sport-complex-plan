import { useEffect, useMemo, useState } from 'react';
import {
  ArrowRight,
  CheckCircle2,
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

const PAYMENT_SECONDS = 15 * 60;

const BookingPaymentStep = ({ bookingResult, onClose }) => {
  const [paymentConfig, setPaymentConfig] = useState(null);
  const [slipFile, setSlipFile] = useState(null);
  const [loadingConfig, setLoadingConfig] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [paid, setPaid] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(PAYMENT_SECONDS);

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
  const bookingCode = `BK${String(bookingResult?.bookingId || '').padStart(10, '0')}`;
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
      const result = await paymentService.uploadSlip(bookingResult.bookingId, slipFile);
      setPaid(true);
      toast.success(result.message || 'ชำระเงินสำเร็จ');
    } catch (requestError) {
      const message = requestError.response?.data?.message || 'ไม่สามารถตรวจสอบสลิปได้ กรุณาลองใหม่อีกครั้ง';
      setError(message);
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  };

  if (paid) {
    return (
      <main className="booking-step-enter col-span-2 flex min-h-0 items-center justify-center overflow-y-auto bg-[#f7f9f5] p-5 max-lg:col-span-1">
        <section className="w-full max-w-[500px] rounded-[24px] border border-[#d8e8c5] bg-white p-8 text-center shadow-[0_18px_50px_rgba(4,21,15,0.12)]">
          <CheckCircle2 className="mx-auto h-20 w-20 text-[#78ad13]" />
          <h3 className="mt-4 text-2xl font-bold text-[#123d25]">ชำระเงินสำเร็จ</h3>
          <p className="mt-2 text-[#607087]">รายการจอง #{bookingResult.bookingId} ได้รับการยืนยันแล้ว</p>
          <button type="button" onClick={onClose} className="mt-6 h-11 w-full rounded-xl bg-[#0b7d35] font-semibold text-white hover:bg-[#096a2d]">ปิดหน้าต่าง</button>
        </section>
      </main>
    );
  }

  return (
    <main className="booking-step-enter col-span-2 min-h-0 overflow-hidden bg-transparent p-2 max-lg:col-span-1 max-lg:overflow-y-auto max-sm:p-1">
      <form onSubmit={submitSlip} className="mx-auto grid h-full max-h-full w-full max-w-[1050px] grid-cols-[1.1fr_0.9fr] gap-2.5 rounded-[20px] border border-transparent bg-transparent p-3 shadow-none max-lg:h-auto max-lg:grid-cols-1 max-sm:p-2">
        <div className="flex min-w-0 flex-col gap-2">
          <section className="relative overflow-hidden rounded-[17px] bg-[#06151c] px-5 py-3.5 text-white shadow-md">
            <div className="absolute -right-12 -top-14 h-40 w-40 rounded-full border-[18px] border-[#9be522]/20" />
            <div className="relative flex items-center gap-5">
              <span className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-[#b9f22c] to-[#65a900] text-[#102019] shadow-[0_0_20px_rgba(154,224,31,0.3)]"><WalletCards className="h-8 w-8" /></span>
              <div>
                <p className="text-sm text-white/75">ยอดที่ต้องชำระ</p>
                <strong className="block text-[32px] leading-tight text-[#a8eb27]">฿{totalPrice.toLocaleString('th-TH')}</strong>
                <p className="mt-1 text-xs text-white/70">เลขที่การจอง #{bookingCode}</p>
              </div>
            </div>
          </section>

          <section className="flex items-center gap-3 rounded-[15px] border border-[#e0e6df] bg-white p-3 shadow-sm">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[#071820] text-[#a9e92d]"><Phone className="h-5 w-5" /></span>
            <div className="min-w-0 flex-1"><p className="text-xs text-[#5f6b65]">โอนเงินพร้อมเพย์</p>{loadingConfig ? <p className="font-semibold">กำลังโหลดข้อมูล...</p> : <><strong className="block truncate text-xl text-[#133d23]">{paymentConfig?.promptpayId || '-'}</strong><p className="truncate text-xs text-[#66736c]">{paymentConfig?.promptpayName || '-'}</p></>}</div>
            <button type="button" onClick={copyPromptPay} disabled={!paymentConfig} className="flex h-9 items-center gap-2 rounded-full border border-[#ccd8ce] px-4 text-sm font-semibold text-[#183d28] hover:bg-[#f1f7ef] disabled:opacity-40"><span>คัดลอก</span><Copy className="h-4 w-4" /></button>
          </section>

          <section className="flex items-center gap-3 rounded-[15px] border border-[#e0e6df] bg-white p-3 shadow-sm">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[#071820] text-[#a9e92d]"><Clock3 className="h-5 w-5" /></span>
            <div className="flex-1"><p className="text-sm font-semibold text-[#17231d]">กรุณาชำระภายใน</p><strong className={`text-2xl ${secondsLeft <= 60 ? 'text-red-600' : 'text-[#17231d]'}`}>{formattedTime}</strong><span className="ml-2 text-sm">นาที</span><p className="text-xs text-[#66736c]">หลังจากหมดเวลา รายการจองจะถูกยกเลิกโดยอัตโนมัติ</p></div>
            <div className="grid h-10 w-10 place-items-center rounded-full border-4 border-[#a4db31] text-[#4d7910]"><Clock3 className="h-5 w-5" /></div>
          </section>

          <label className="flex cursor-pointer items-center gap-3 rounded-[15px] border border-[#e0e6df] bg-white p-3 shadow-sm hover:border-[#93c629] hover:bg-[#fbfef6]">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[#071820] text-[#a9e92d]"><Upload className="h-5 w-5" /></span>
            <div className="min-w-0 flex-1"><p className="font-semibold text-[#17231d]">อัปโหลดสลิปการชำระเงิน</p><p className="truncate text-xs text-[#66736c]">{slipFile ? slipFile.name : 'รองรับไฟล์ JPG, JPEG, PNG ขนาดไม่เกิน 5MB'}</p></div>
            <span className="flex h-9 shrink-0 items-center gap-2 rounded-full border border-[#ccd8ce] px-4 text-sm font-semibold"><FileImage className="h-4 w-4" />เลือกไฟล์</span>
            <input type="file" accept="image/jpeg,image/png" className="sr-only" onChange={selectSlip} />
          </label>

          <section className="rounded-[15px] bg-[#f2f7ed] px-3 py-2.5 text-sm text-[#26352d]">
            <h4 className="mb-1 flex items-center gap-2 font-bold"><Info className="h-4 w-4 text-[#101d17]" />หมายเหตุ</h4>
            <div className="grid grid-cols-[0.9fr_1.1fr] gap-x-1 gap-y-1 text-[11px] font-semibold leading-tight max-sm:grid-cols-1"><p className="whitespace-nowrap">✓ ชำระตามยอดที่แสดงเท่านั้น</p><p className="whitespace-nowrap">✓ ระบบตรวจสอบสลิปอัตโนมัติ</p><p className="whitespace-nowrap">✓ ไม่ต้องใส่หมายเหตุการโอน</p><p className="whitespace-nowrap">✓ ไม่ได้รับการยืนยัน โปรดติดต่อบริการลูกค้า</p></div>
          </section>
        </div>

        <aside className="relative flex min-h-[450px] flex-col items-center overflow-hidden rounded-[17px] bg-[#06151c] p-3.5 text-white shadow-md max-lg:min-h-0">
          <div className="absolute inset-0 opacity-20 [background-image:radial-gradient(circle_at_75%_20%,#a7eb24_0,transparent_27%),linear-gradient(135deg,transparent_45%,#8bc51e_46%,transparent_47%)]" />
          <div className="relative flex items-center gap-2"><span className="grid h-10 w-10 place-items-center rounded-xl bg-[#a8eb27]/15 text-[#a8eb27]"><Zap className="h-6 w-6 fill-current" /></span><div><h3 className="text-xl font-bold"><span className="text-[#a8eb27]">สแกน</span>เพื่อชำระเงิน</h3><p className="text-xs text-center text-white/80">พร้อมเพย์ <span className="rounded bg-[#174b83] px-2 py-0.5 font-semibold">PromptPay</span></p></div></div>
          <div className="relative mt-2.5 grid w-full max-w-[245px] flex-1 place-items-center rounded-[18px] border-[3px] border-[#8cc621] bg-white p-3 shadow-[0_0_18px_rgba(154,224,31,0.24)] max-lg:flex-none">
            {loadingConfig ? <p className="text-[#56635b]">กำลังสร้าง QR Code...</p> : qrCodeUrl ? <img src={qrCodeUrl} alt="QR Code พร้อมเพย์สำหรับชำระเงิน" className="aspect-square w-full object-contain" /> : <p className="text-center text-red-600">ไม่สามารถสร้าง QR Code ได้</p>}
          </div>
          <div className="relative mt-2.5 text-center text-sm"><p className="font-semibold">ชื่อบัญชี : {paymentConfig?.promptpayName || '-'}</p><p className="font-semibold">หมายเลข : <span className="text-[#a8eb27]">{paymentConfig?.promptpayId || '-'}</span></p></div>
          <div className="relative mt-2.5 flex w-full items-center justify-center gap-2 rounded-xl border border-[#668b25] bg-[#0b241d] p-2 text-xs"><ShieldCheck className="h-6 w-6 text-[#a8eb27]" /><span>ปลอดภัยด้วยระบบพร้อมเพย์<br /><small className="text-white/70">โอนเงินได้จากทุกธนาคาร</small></span><LockKeyhole className="ml-auto h-5 w-5 text-[#a8eb27]" /></div>
        </aside>

        {error && <div role="alert" className="col-span-2 rounded-xl border border-red-200 bg-red-50 p-3 text-center text-sm text-red-600 max-lg:col-span-1">{error}</div>}
        <button type="submit" disabled={!slipFile || submitting || loadingConfig || secondsLeft <= 0} className="relative col-span-2 flex h-[52px] items-center justify-center rounded-[15px] bg-[#071820] px-14 text-center text-base font-bold text-white shadow-md transition-colors enabled:hover:bg-[#0d2922] disabled:cursor-not-allowed max-lg:col-span-1 max-sm:h-12 max-sm:text-sm"><ShieldCheck className="absolute left-[calc(50%-175px)] h-7 w-7 text-[#a8eb27] max-sm:left-4" /><span>{submitting ? 'กำลังตรวจสอบสลิป...' : 'ยืนยันการชำระเงินและตรวจสอบสลิป'}<small className="block text-[11px] font-normal text-white/70">ระบบจะตรวจสอบอัตโนมัติ ภายในไม่กี่วินาที</small></span><ArrowRight className="absolute right-5 h-6 w-6 text-[#a8eb27]" /></button>
      </form>
    </main>
  );
};

export default BookingPaymentStep;
