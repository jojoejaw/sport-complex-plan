import api from './api';

export const bookingService = {
  // 1. ดึงตารางความว่างรายชั่วโมงของสนาม (GET /api/bookings/availability)
  // รับ court_id และ date (YYYY-MM-DD)
  // คืนค่า: { court_status: 'active', slots: [{ label: '10.00-11.00', start_time: '10:00:00', end_time: '11:00:00', status: 'available' | 'unavailable' | 'pending_approval' | 'locked' }] }
  getAvailableSlots: async (courtId, date) => {
    const response = await api.get('/bookings/availability', {
      params: {
        court_id: courtId,
        date: date
      }
    });
    return response.data;
  },

  // 2. สร้างรายการจองสนามใหม่ (POST /api/bookings)
  // รับ { court_id, booking_date, start_time, end_time, contact_phone }
  createBooking: async (bookingData) => {
    const response = await api.post('/bookings', bookingData);
    return response.data;
  },

  // 3. ดึงรายการประวัติการจองของตนเอง (GET /api/bookings/my-bookings)
  getMyBookings: async () => {
    const response = await api.get('/bookings/my-bookings');
    return response.data;
  },

  // 4. ยกเลิกการจองสนาม (PUT /api/bookings/:id/cancel)
  // แก้ไขตาม Backend: เปลี่ยน HTTP Method จาก DELETE เป็น PUT ให้ตรงกับ Backend
  cancelBooking: async (bookingId) => {
    const response = await api.put(`/bookings/${bookingId}/cancel`);
    return response.data;
  },

  // 5. ดึงรายการการจองทั้งหมดของทุกคน (GET /api/bookings/admin/list) - สำหรับ Admin
  // แก้ไขตาม Backend: เปลี่ยน URL จาก /bookings/admin/all เป็น /bookings/admin/list
  getAllBookingsAdmin: async (statusFilter = null) => {
    const params = statusFilter ? { status: statusFilter } : {};
    const response = await api.get('/bookings/admin/list', { params });
    return response.data;
  },

  // 6. แอดมินอนุมัติ/ปฏิเสธสลิปการจองสนาม (PUT /api/bookings/:id/verify) - สำหรับ Admin
  // แก้ไขตาม Backend: เปลี่ยน URL จาก /bookings/admin/:id/status เป็น /bookings/:id/verify
  updateBookingStatusAdmin: async (bookingId, status, rejectReason = '') => {
    const response = await api.put(`/bookings/${bookingId}/verify`, {
      status,
      reject_reason: rejectReason
    });
    return response.data;
  },

  // แอดมินรับเงินสดหน้าร้าน: Backend จะบันทึก Payment และอนุมัติ Booking พร้อมกัน
  approveCashBooking: async (bookingId) => {
    const response = await api.put(`/bookings/${bookingId}/approve-cash`);
    return response.data;
  }
};

export default bookingService;
