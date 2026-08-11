import { AlertCircle, X } from 'lucide-react';
import modalBackground from '../../assets/bg.png';

const ConfirmModal = ({
  isOpen,
  title,
  message,
  children,
  confirmText = 'ยืนยัน',
  cancelText = 'ยกเลิก',
  confirmDisabled = false,
  onConfirm,
  onCancel,
}) => {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[120] flex items-center justify-center bg-[#07111e]/65 p-4 backdrop-blur-[3px]"
      onMouseDown={(event) => event.target === event.currentTarget && onCancel()}
    >
      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="confirm-modal-title"
        aria-describedby={message ? 'confirm-modal-message' : undefined}
        className="relative w-full max-w-[460px] overflow-hidden rounded-[22px] bg-white p-6 shadow-[0_24px_70px_rgba(0,0,0,0.32)]"
        style={{
          backgroundImage: `linear-gradient(rgba(224, 241, 230, 0.28), rgba(194, 224, 205, 0.38)), url(${modalBackground})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        <div className="flex items-start gap-4">
          <span className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-[#eaf8ef] text-[#08752e]">
            <AlertCircle className="h-7 w-7" />
          </span>
          <div className="min-w-0 flex-1">
            <h2 id="confirm-modal-title" className="text-xl font-bold text-[#111827]">{title}</h2>
            {message && <p id="confirm-modal-message" className="mt-1 text-sm text-[#607087]">{message}</p>}
          </div>
          <button type="button" onClick={onCancel} aria-label="ปิดกล่องยืนยัน" className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-[#f1f4f7] text-[#26364d] transition hover:bg-[#e3e8ef]">
            <X className="h-5 w-5" />
          </button>
        </div>

        {children && <div className="mt-5 rounded-[14px] border border-[#dce5df] bg-[#f6fbf8] p-4">{children}</div>}

        <div className="mt-6 grid grid-cols-2 gap-3">
          <button type="button" onClick={onCancel} className="h-11 rounded-xl border border-[#cdd7e3] font-semibold text-[#34445b] transition hover:bg-[#f3f6f9]">
            {cancelText}
          </button>
          <button type="button" onClick={onConfirm} disabled={confirmDisabled} className="h-11 rounded-xl bg-gradient-to-r from-[#08752e] to-[#12a94e] font-semibold text-white transition enabled:hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-45">
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmModal;
