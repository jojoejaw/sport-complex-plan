import api from './api';

export const courtService = {
  // 1. ดึงรายการประเภทกีฬาทั้งหมด (GET /api/sports)
  // คืนค่า: [{ id: 1, name: 'ฟุตบอล', image_url: null }, ...]
  getSports: async () => {
    const response = await api.get('/sports');
    return response.data;
  },

  // 2. ดึงรายการสนามกีฬาทั้งหมด (GET /api/courts)
  // สามารถส่ง sportId เพื่อกรองเฉพาะประเภทกีฬาที่ต้องการได้
  getCourts: async (sportId = null) => {
    const params = sportId ? { sport_id: sportId } : {};
    const response = await api.get('/courts', { params });
    return response.data;
  },

  // 3. เพิ่มสนามใหม่ (POST /api/courts) - สำหรับ Admin
  createCourt: async (courtData) => {
    const response = await api.post('/courts', courtData);
    return response.data;
  },

  // 4. แก้ไขข้อมูลสนาม (PUT /api/courts/:id) - สำหรับ Admin
  updateCourt: async (id, courtData) => {
    const response = await api.put(`/courts/${id}`, courtData);
    return response.data;
  },

  // 5. ลบสนามออก (DELETE /api/courts/:id) - สำหรับ Admin
  deleteCourt: async (id) => {
    const response = await api.delete(`/courts/${id}`);
    return response.data;
  }
};

export default courtService;
