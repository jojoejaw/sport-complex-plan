// ค่าคงที่ของระบบ (System Constants)

export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

export const BOOKING_STATUS = {
  PENDING_PAYMENT: 'pending_payment',
  PENDING_APPROVAL: 'pending_approval',
  APPROVED: 'approved',
  REJECTED: 'rejected',
  CANCELLED: 'cancelled'
};

export const BOOKING_STATUS_LABEL = {
  pending_payment: 'รอชำระเงิน',
  pending_approval: 'รอแอดมินอนุมัติ',
  approved: 'อนุมัติแล้ว',
  rejected: 'ไม่อนุมัติ',
  cancelled: 'ยกเลิกแล้ว'
};

export const BOOKING_STATUS_COLOR = {
  pending_payment: 'bg-amber-100 text-amber-800 border-amber-300',
  pending_approval: 'bg-blue-100 text-blue-800 border-blue-300',
  approved: 'bg-emerald-100 text-emerald-800 border-emerald-300',
  rejected: 'bg-rose-100 text-rose-800 border-rose-300',
  cancelled: 'bg-gray-100 text-gray-700 border-gray-300'
};

export const COURT_STATUS = {
  ACTIVE: 'active',
  MAINTENANCE: 'maintenance'
};
