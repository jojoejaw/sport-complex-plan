// =============================================================================
// 1. โหลด Dependencies
// =============================================================================
const db = require('../config/db');

// =============================================================================
// 2. getSports — ดึงประเภทกีฬาทั้งหมด (GET /api/sports)
//    Flow: query ตาราง sports → ตอบกลับ
// =============================================================================
exports.getSports = async (req, res) => {
  try {
    const [sports] = await db.query('SELECT * FROM sports');
    res.json(sports);
  } catch (error) {
    console.error('getSports Error:', error);
    res.status(500).json({ message: 'เกิดข้อผิดพลาดในการดึงข้อมูลกีฬา' });
  }
};

// =============================================================================
// 3. getCourts — ดึงรายการสนามทั้งหมดหรือกรองตามกีฬา (GET /api/courts?sport_id=)
//    Flow: รับ sport_id (ถ้ามี) → สร้าง SQL → query → ตอบกลับ
// =============================================================================
exports.getCourts = async (req, res) => {
  const { sport_id } = req.query;

  try {
    // --- ขั้นที่ 1: สร้างคำสั่ง SQL (กรองตาม sport_id ถ้ามีการส่งมา) ---
    let sql = 'SELECT * FROM courts';
    const params = [];

    if (sport_id) {
      sql += ' WHERE sport_id = ?';
      params.push(sport_id);
    }

    // --- ขั้นที่ 2: ดึงข้อมูลและตอบกลับ ---
    const [courts] = await db.query(sql, params);
    res.json(courts);
  } catch (error) {
    console.error('getCourts Error:', error);
    res.status(500).json({ message: 'เกิดข้อผิดพลาดในการดึงข้อมูลสนาม' });
  }
};

// =============================================================================
// 4. createCourt — เพิ่มสนามใหม่ (POST /api/courts)
//    Flow: รับข้อมูล → ตรวจครบ → INSERT (status = active) → ตอบกลับ
// =============================================================================
exports.createCourt = async (req, res) => {
  const admin_role = req.user.role;                    

  if (admin_role !== 'admin') {                        
    return res.status(403).json({ message: 'คุณไม่มีสิทธิ์เข้าถึงฟังก์ชันของแอดมิน' });
  }

  const { sport_id, name, description, price_per_hour, image_url } = req.body;

  // --- ขั้นที่ 1: ตรวจสอบความครบถ้วนของข้อมูล ---
  if (!sport_id || !name || !price_per_hour) {
    return res.status(400).json({ message: 'กรุณากรอกข้อมูลสนามให้ครบถ้วน' });
  }

  try {
    // --- ขั้นที่ 2: บันทึกสนามใหม่ ---
    const [result] = await db.query(
      'INSERT INTO courts (sport_id, name, description, price_per_hour, status, image_url) VALUES (?, ?, ?, ?, ?, ?)',
      [sport_id, name, description || null, price_per_hour, 'active', image_url || null]
    );

    // --- ขั้นที่ 3: ตอบกลับสำเร็จ ---
    res.status(201).json({ message: 'เพิ่มสนามใหม่สำเร็จ!', courtId: result.insertId });
  } catch (error) {
    console.error('createCourt Error:', error);
    res.status(500).json({ message: 'เกิดข้อผิดพลาดในการเพิ่มสนาม' });
  }
};

// =============================================================================
// 5. updateCourt — แก้ไขข้อมูลสนาม (PUT /api/courts/:id)
//    Flow: รับ id + ข้อมูลใหม่ → ตรวจว่ามีสนาม → UPDATE → ตอบกลับ
// =============================================================================
exports.updateCourt = async (req, res) => {
  const admin_role = req.user.role;             

  if (admin_role !== 'admin') {                
    return res.status(403).json({ message: 'คุณไม่มีสิทธิ์เข้าถึงฟังก์ชันของแอดมิน' });
  }
  
  const { id } = req.params;
  const { name, description, price_per_hour, status, image_url } = req.body;

  try {
    // --- ขั้นที่ 1: ตรวจสอบว่ามีสนาม ID นี้ในระบบ ---
    const [existing] = await db.query('SELECT id FROM courts WHERE id = ?', [id]);
    if (existing.length === 0) {
      return res.status(404).json({ message: 'ไม่พบข้อมูลสนามที่ต้องการแก้ไข' });
    }

    // --- ขั้นที่ 2: อัปเดตข้อมูลสนาม ---
    await db.query(
      'UPDATE courts SET name = ?, description = ?, price_per_hour = ?, status = ?, image_url = ? WHERE id = ?',
      [name, description || null, price_per_hour, status, image_url || null, id]
    );

    // --- ขั้นที่ 3: ตอบกลับสำเร็จ ---
    res.json({ message: 'อัปเดตข้อมูลสนามเรียบร้อยแล้ว!' });
  } catch (error) {
    console.error('updateCourt Error:', error);
    res.status(500).json({ message: 'เกิดข้อผิดพลาดในการแก้ไขข้อมูลสนาม' });
  }
};

// =============================================================================
// 6. deleteCourt — ลบสนาม (DELETE /api/courts/:id)
//    Flow: รับ id → ตรวจว่ามีสนาม → DELETE → ตอบกลับ (หรือแจ้งถ้ามี FK อ้างอิง)
// =============================================================================
exports.deleteCourt = async (req, res) => {
  const admin_role = req.user.role;             

  if (admin_role !== 'admin') {                  
    return res.status(403).json({ message: 'คุณไม่มีสิทธิ์เข้าถึงฟังก์ชันของแอดมิน' });
  }

  const { id } = req.params;

  try {
    // --- ขั้นที่ 1: ตรวจสอบว่ามีสนาม ID นี้ในระบบ ---
    const [existing] = await db.query('SELECT id FROM courts WHERE id = ?', [id]);
    if (existing.length === 0) {
      return res.status(404).json({ message: 'ไม่พบข้อมูลสนามที่ต้องการลบ' });
    }

    // --- ขั้นที่ 2: ลบสนาม (ถ้ามีประวัติจอง FK จะบล็อกการลบ) ---
    await db.query('DELETE FROM courts WHERE id = ?', [id]);
    res.json({ message: 'ลบสนามสำเร็จแล้ว!' });
  } catch (error) {
    console.error('deleteCourt Error:', error);

    // --- ขั้นที่ 3: กรณีมีประวัติการจองอ้างอิง (Foreign Key RESTRICT) ---
    if (error.code === 'ER_ROW_IS_REFERENCED_2') {
      return res.status(400).json({
        message: 'ไม่สามารถลบสนามนี้ได้เนื่องจากมีประวัติการจองอยู่แล้ว แนะนำให้เปลี่ยนสถานะเป็นปิดปรับปรุง (maintenance) แทน'
      });
    }

    res.status(500).json({ message: 'เกิดข้อผิดพลาดในการลบสนาม' });
  }
};