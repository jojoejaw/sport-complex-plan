import api from './api';

export const paymentService = {
  // 1. อัปโหลดรูปภาพสลิปโอนเงิน (POST /api/payments/upload)
  // รับ bookingId และ slipFile (File Object)
  uploadSlip: async (bookingId, slipFile) => {
    const formData = new FormData();
    formData.append('booking_id', bookingId);
    formData.append('slip', slipFile);

    const response = await api.post('/payments/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  // 2. ดึงข้อมูลการตั้งค่าบัญชีพร้อมเพย์ (GET /api/payments/config)
  // คืนค่า: { promptpayId: '0902214698', promptpayName: 'ณรงฤทธิ์ โจทจันทร์' }
  getPaymentConfig: async () => {
    const response = await api.get('/payments/config');
    return response.data;
  },
};

export default paymentService;
