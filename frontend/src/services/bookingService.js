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

  // 4. ยกเลิกการจองสนาม (DELETE /api/bookings/:id/cancel)
  cancelBooking: async (bookingId) => {
    const response = await api.delete(`/bookings/${bookingId}/cancel`);
    return response.data;
  },

  // 5. ดึงรายการการจองทั้งหมด (GET /api/bookings/admin/all) - สำหรับ Admin
  getAllBookingsAdmin: async (statusFilter = null) => {
    const params = statusFilter ? { status: statusFilter } : {};
    const response = await api.get('/bookings/admin/all', { params });
    return response.data;
  },

  // 6. อัปเดตสถานะการจอง (PUT /api/bookings/admin/:id/status) - สำหรับ Admin อนุมัติ/ปฏิเสธ
  updateBookingStatusAdmin: async (bookingId, status, rejectReason = '') => {
    const response = await api.put(`/bookings/admin/${bookingId}/status`, {
      status,
      reject_reason: rejectReason
    });
    return response.data;
  }
};

export default bookingService;
