const db = require('../config/db');

// 1. ดึงประเภทกีฬาทั้งหมด (สำหรับหน้าแรกแสดง กีฬาฟุตบอล, บาสเกสบอล, แบดมินตัน, วอลเลย์บอล)
exports.getSports = async (req, res) => {
  try {
    const [sports] = await db.query('SELECT * FROM sports');
    res.json(sports);
  } catch (error) {
    console.error('getSports Error:', error);
    res.status(500).json({ message: 'เกิดข้อผิดพลาดในการดึงข้อมูลกีฬา' });
  }
};

// 2. ดึงข้อมูลสนามทั้งหมด หรือกรองตามประเภทกีฬา (เช่น เลือกดูเฉพาะสนามแบดมินตัน)
// URL ตัวอย่าง: /api/courts?sport_id=3
exports.getCourts = async (req, res) => {
  const { sport_id } = req.query; // ดึงค่า Parameter ที่ส่งมาหลังเครื่องหมาย ?

  try {
    let sql = 'SELECT * FROM courts';
    const params = [];

    // หากมีการส่ง sport_id มา ให้ดึงเฉพาะสนามของกีฬานั้นๆ
    if (sport_id) {
      sql += ' WHERE sport_id = ?';
      params.push(sport_id);
    }

    const [courts] = await db.query(sql, params);
    res.json(courts);
  } catch (error) {
    console.error('getCourts Error:', error);
    res.status(500).json({ message: 'เกิดข้อผิดพลาดในการดึงข้อมูลสนาม' });
  }
};

// 3. เพิ่มสนามใหม่ (Create) - POST /api/courts
exports.createCourt = async (req, res) => {
    const { sport_id, name, price_per_hour } = req.body;
  
    if (!sport_id || !name || !price_per_hour) {
      return res.status(400).json({ message: 'กรุณากรอกข้อมูลสนามให้ครบถ้วน' });
    }
  
    try {
      const [result] = await db.query(
        'INSERT INTO courts (sport_id, name, price_per_hour, status) VALUES (?, ?, ?, ?)',
        [sport_id, name, price_per_hour, 'active']
      );
      res.status(201).json({ message: 'เพิ่มสนามใหม่สำเร็จ!', courtId: result.insertId });
    } catch (error) {
      console.error('createCourt Error:', error);
      res.status(500).json({ message: 'เกิดข้อผิดพลาดในการเพิ่มสนาม' });
    }
  };
  
  // 4. แก้ไขข้อมูลสนาม (Update) - PUT /api/courts/:id
  exports.updateCourt = async (req, res) => {
    const { id } = req.params;
    const { name, price_per_hour, status } = req.body; // รับค่าฟิลด์ที่จะแก้ไข
  
    try {
      // ตรวจสอบก่อนว่ามีสนาม ID นี้อยู่จริงไหม
      const [existing] = await db.query('SELECT id FROM courts WHERE id = ?', [id]);
      if (existing.length === 0) {
        return res.status(404).json({ message: 'ไม่พบข้อมูลสนามที่ต้องการแก้ไข' });
      }
  
      // เขียนคำสั่ง SQL อัปเดตข้อมูล
      await db.query(
        'UPDATE courts SET name = ?, price_per_hour = ?, status = ? WHERE id = ?',
        [name, price_per_hour, status, id]
      );
  
      res.json({ message: 'อัปเดตข้อมูลสนามเรียบร้อยแล้ว!' });
    } catch (error) {
      console.error('updateCourt Error:', error);
      res.status(500).json({ message: 'เกิดข้อผิดพลาดในการแก้ไขข้อมูลสนาม' });
    }
  };
  
  // 5. ลบสนาม (Delete) - DELETE /api/courts/:id
  exports.deleteCourt = async (req, res) => {
    const { id } = req.params;
  
    try {
      const [existing] = await db.query('SELECT id FROM courts WHERE id = ?', [id]);
      if (existing.length === 0) {
        return res.status(404).json({ message: 'ไม่พบข้อมูลสนามที่ต้องการลบ' });
      }
  
      await db.query('DELETE FROM courts WHERE id = ?', [id]);
      res.json({ message: 'ลบสนามสำเร็จแล้ว!' });
    } catch (error) {
      console.error('deleteCourt Error:', error);
      
      // 💡 ข้อสำคัญ: หากสนามนี้ถูกจองไปแล้วในตาราง bookings 
      // ตัวต่างประเทศ (Foreign Key - ON DELETE RESTRICT) จะป้องกันไม่ให้กดลบได้
      if (error.code === 'ER_ROW_IS_REFERENCED_2') {
        return res.status(400).json({ 
          message: 'ไม่สามารถลบสนามนี้ได้เนื่องจากมีประวัติการจองอยู่แล้ว แนะนำให้เปลี่ยนสถานะเป็นปิดปรับปรุง (maintenance) แทน' 
        });
      }
      
      res.status(500).json({ message: 'เกิดข้อผิดพลาดในการลบสนาม' });
    }
  };