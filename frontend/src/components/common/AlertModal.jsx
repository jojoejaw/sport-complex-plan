import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  CheckCircle2,
  ChevronRight,
  CircleDot,
  Info,
  TriangleAlert,
  X,
  XCircle,
} from 'lucide-react';
import errorBackground from '../../assets/alert/Error.png';
import infoBackground from '../../assets/alert/Info.png';
import successBackground from '../../assets/alert/Success.png';
import warningBackground from '../../assets/alert/Warning.png';

const variants = {
  success: {
    background: successBackground,
    icon: CheckCircle2,
    accent: '#159447',
    border: 'border-[#21a653]',
    iconClass: 'from-[#35c65f] to-[#087c30] shadow-[0_10px_24px_rgba(20,148,71,0.28)]',
    buttonClass: 'from-[#2db64f] to-[#0b8a36] shadow-[0_8px_18px_rgba(20,148,71,0.28)] hover:from-[#25a947] hover:to-[#08762e]',
  },
  error: {
    background: errorBackground,
    icon: XCircle,
    accent: '#ed1f2b',
    border: 'border-[#ef2733]',
    iconClass: 'from-[#ff3b45] to-[#d90816] shadow-[0_10px_24px_rgba(237,31,43,0.3)]',
    buttonClass: 'from-[#ff2633] to-[#ce0713] shadow-[0_8px_18px_rgba(237,31,43,0.28)] hover:from-[#ed1f2b] hover:to-[#b90611]',
  },
  warning: {
    background: warningBackground,
    icon: TriangleAlert,
    accent: '#f08a00',
    border: 'border-[#f3931a]',
    iconClass: 'from-[#ffad28] to-[#ed7600] shadow-[0_10px_24px_rgba(240,138,0,0.3)]',
    buttonClass: 'from-[#ff9e18] to-[#e87500] shadow-[0_8px_18px_rgba(240,138,0,0.28)] hover:from-[#f39112] hover:to-[#ce6800]',
  },
  info: {
    background: infoBackground,
    icon: Info,
    accent: '#245dd8',
    border: 'border-[#2d68e4]',
    iconClass: 'from-[#4384ff] to-[#164bc5] shadow-[0_10px_24px_rgba(36,93,216,0.3)]',
    buttonClass: 'from-[#3477f2] to-[#174fc8] shadow-[0_8px_18px_rgba(36,93,216,0.28)] hover:from-[#286ae2] hover:to-[#1243ae]',
  },
};

const AlertModal = ({ isOpen, type = 'info', title, message, confirmText = 'ปิดการแจ้งเตือน', opaqueBackdrop = false, lightBackdrop = false, autoCloseMs = 0, onClose }) => {
  const variant = variants[type] || variants.info;
  const Icon = variant.icon;

  useEffect(() => {
    if (!isOpen) return undefined;
    const handleKeyDown = (event) => event.key === 'Escape' && onClose();
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  useEffect(() => {
    if (!isOpen || autoCloseMs <= 0) return undefined;
    const timer = window.setTimeout(onClose, autoCloseMs);
    return () => window.clearTimeout(timer);
  }, [autoCloseMs, isOpen, onClose]);

  if (!isOpen) return null;

  return createPortal(
    <div className={`fixed inset-0 z-[160] flex items-center justify-center p-4 ${opaqueBackdrop ? 'bg-[#07111e]' : lightBackdrop ? 'bg-transparent backdrop-blur-[3px]' : 'bg-[#07111e]/72 backdrop-blur-[3px]'}`}>
      <section
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="alert-modal-title"
        aria-describedby="alert-modal-message"
        className={`booking-dialog-enter relative w-full max-w-[530px] overflow-hidden rounded-[22px] border-2 bg-[#fffefe] px-7 pb-6 pt-5 text-center shadow-[0_24px_65px_rgba(0,0,0,0.34)] ${variant.border} max-sm:px-5 max-sm:pb-5`}
      >
        <div className="pointer-events-none absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url(${variant.background})` }} />

        <button type="button" onClick={onClose} aria-label="ปิดข้อความแจ้งเตือน" className="absolute right-4 top-4 z-10 grid h-10 w-10 place-items-center rounded-full border-2 bg-white/80 transition hover:bg-white" style={{ borderColor: variant.accent, color: variant.accent }}><X className="h-5 w-5" /></button>

        <div className="relative z-[1] mx-auto grid h-[88px] w-[88px] place-items-center rounded-full border border-white bg-white/70 shadow-[0_5px_18px_rgba(0,0,0,0.08)] max-sm:h-[78px] max-sm:w-[78px]">
          <span className={`grid h-[70px] w-[70px] place-items-center rounded-full bg-gradient-to-br text-white ${variant.iconClass} max-sm:h-[62px] max-sm:w-[62px]`}><Icon className="h-12 w-12 max-sm:h-10 max-sm:w-10" strokeWidth={type === 'warning' ? 2.5 : 3} /></span>
        </div>

        <h2 id="alert-modal-title" className="relative z-[1] mt-2.5 text-[26px] font-extrabold text-[#111827] max-sm:text-[22px]">{title}</h2>
        <p id="alert-modal-message" className="relative z-[1] mx-auto mt-1.5 max-w-[410px] text-[15px] font-semibold leading-6 text-[#374151] max-sm:text-sm">{message}</p>

        <button type="button" onClick={onClose} autoFocus className={`relative z-[1] mx-auto mt-5 flex h-[42px] w-full max-w-[200px] items-center justify-center rounded-[11px] bg-gradient-to-r px-9 text-sm font-bold text-white transition ${variant.buttonClass} max-sm:h-10 max-sm:max-w-[185px]`}>
          <CircleDot className="absolute left-3.5 h-5 w-5" />
          {confirmText}
          <ChevronRight className="absolute right-3.5 h-5 w-5" strokeWidth={3} />
        </button>
      </section>
    </div>,
    document.body,
  );
};

export default AlertModal;
