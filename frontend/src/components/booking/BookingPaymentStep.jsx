import { useEffect, useState } from 'react';
import { CheckCircle2, Copy, CreditCard, Upload } from 'lucide-react';
import toast from 'react-hot-toast';
import paymentService from '../../services/paymentService';

const BookingPaymentStep = ({ bookingResult, onClose }) => {
  const [paymentConfig, setPaymentConfig] = useState(null);
  const [slipFile, setSlipFile] = useState(null);
  const [loadingConfig, setLoadingConfig] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [paid, setPaid] = useState(false);

  useEffect(() => {
    let active = true;
    paymentService.getPaymentConfig()
      .then((data) => active && setPaymentConfig(data))
      .catch(() => active && setError('ไม่สามารถโหลดข้อมูลบัญชีพร้อมเพย์ได้'))
      .finally(() => active && setLoadingConfig(false));
    return () => { active = false; };
  }, []);

  const copyPromptPay = async () => {
    if (!paymentConfig?.promptpayId) return;
    try {
      await navigator.clipboard.writeText(paymentConfig.promptpayId);
      toast.success('คัดลอกหมายเลขพร้อมเพย์แล้ว');
    } catch {
      toast.error('ไม่สามารถคัดลอกหมายเลขพร้อมเพย์ได้');
    }
  };

  const submitSlip = async (event) => {
    event.preventDefault();
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
      <main className="booking-step-enter col-span-2 flex min-h-0 items-center justify-center overflow-y-auto bg-[#fffefb] p-5 max-lg:col-span-1">
        <section className="w-full max-w-[500px] rounded-[22px] border border-[#cde7d6] bg-white p-8 text-center shadow-lg">
          <CheckCircle2 className="mx-auto h-20 w-20 text-[#08752e]" />
          <h3 className="mt-4 text-2xl font-bold text-[#155426]">ชำระเงินสำเร็จ</h3>
          <p className="mt-2 text-[#607087]">รายการจอง #{bookingResult.bookingId} ได้รับการยืนยันแล้ว</p>
          <button type="button" onClick={onClose} className="mt-6 h-11 w-full rounded-xl bg-[#08752e] font-semibold text-white">ปิดหน้าต่าง</button>
        </section>
      </main>
    );
  }

  return (
    <main className="booking-step-enter col-span-2 min-h-0 overflow-y-auto bg-[#fffefb] p-5 max-lg:col-span-1 max-sm:p-3">
      <form onSubmit={submitSlip} className="mx-auto w-full max-w-[560px] rounded-[22px] border border-[#dce5df] bg-white p-7 shadow-lg max-sm:p-5">
        <div className="flex items-center gap-4 border-b border-[#e5ebe7] pb-5">
          <span className="grid h-12 w-12 place-items-center rounded-full bg-[#eaf8ef] text-[#08752e]"><CreditCard className="h-6 w-6" /></span>
          <div><h3 className="text-xl font-bold">ชำระเงินเพื่อยืนยันการจอง</h3><p className="text-sm text-[#607087]">กรุณาชำระและส่งสลิปภายใน 15 นาที</p></div>
        </div>
        <div className="mt-5 rounded-2xl bg-gradient-to-r from-[#0d6c30] to-[#0a8b3c] p-5 text-white">
          <p className="text-sm text-white/80">ยอดที่ต้องชำระ</p><strong className="text-3xl">฿ {Number(bookingResult.total_price || 0).toLocaleString('th-TH')}</strong>
          <p className="mt-2 text-xs text-white/75">เลขที่การจอง #{bookingResult.bookingId}</p>
        </div>
        <section className="mt-5 rounded-2xl border border-[#dce5df] bg-[#f7fbf8] p-4">
          <p className="text-sm text-[#607087]">โอนผ่านพร้อมเพย์</p>
          {loadingConfig ? <p className="mt-2">กำลังโหลดข้อมูล...</p> : paymentConfig && (
            <div className="mt-2 flex items-center justify-between gap-3">
              <div><strong className="text-xl text-[#155426]">{paymentConfig.promptpayId}</strong><p className="text-sm text-[#607087]">{paymentConfig.promptpayName}</p></div>
              <button type="button" onClick={copyPromptPay} className="grid h-10 w-10 place-items-center rounded-full border border-[#bcd8c5] text-[#08752e]" aria-label="คัดลอกหมายเลขพร้อมเพย์"><Copy className="h-5 w-5" /></button>
            </div>
          )}
        </section>
        <label className="mt-5 flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-[#b9cfc1] bg-[#fbfdfb] p-6 text-center">
          <Upload className="h-8 w-8 text-[#08752e]" /><span className="mt-2 font-semibold">{slipFile ? slipFile.name : 'เลือกรูปภาพสลิป'}</span>
          <span className="mt-1 text-xs text-[#607087]">รองรับ JPG, JPEG หรือ PNG ขนาดไม่เกิน 5MB</span>
          <input type="file" accept="image/jpeg,image/png" className="sr-only" onChange={(event) => { setSlipFile(event.target.files?.[0] || null); setError(''); }} />
        </label>
        {error && <div role="alert" className="mt-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-600">{error}</div>}
        <button type="submit" disabled={!slipFile || submitting || loadingConfig} className="mt-5 h-11 w-full rounded-xl bg-gradient-to-r from-[#08752e] to-[#12a94e] font-semibold text-white disabled:cursor-not-allowed disabled:opacity-45">{submitting ? 'กำลังตรวจสอบสลิป...' : 'ยืนยันการชำระเงิน'}</button>
      </form>
    </main>
  );
};

export default BookingPaymentStep;
