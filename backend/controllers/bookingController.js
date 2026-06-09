// =============================================================================
// 1. โหลด Dependencies
// =============================================================================
const db = require('../config/db');

// =============================================================================
// 2. checkAvailability — ตรวจความว่างของสนามรายชั่วโมง (GET /api/bookings/availability)
//    Flow: รับ court_id + date → ตรวจสนาม → ดึงการจอง → สร้างสล็อต 10:00–22:00 → ตอบกลับ
// =============================================================================
exports.checkAvailability = async (req, res) => {
  const { court_id, date } = req.query;

  // --- ขั้นที่ 1: ตรวจสอบพารามิเตอร์ ---
  if (!court_id || !date) {
    return res.status(400).json({ message: 'กรุณาระบุสนามและวันที่ต้องการตรวจสอบ' });
  }

  try {
    // --- ขั้นที่ 2: ตรวจสอบว่าสนามมีอยู่และเปิดบริการหรือไม่ ---
    const [court] = await db.query('SELECT status FROM courts WHERE id = ?', [court_id]);
    if (court.length === 0) {
      return res.status(404).json({ message: 'ไม่พบสนามนี้ในระบบ' });
    }
    if (court[0].status === 'maintenance') {
      return res.json({ court_status: 'maintenance', slots: [] });
    }

    // --- ขั้นที่ 3: ดึงการจองของวันนั้น (ไม่รวมที่ยกเลิกแล้ว) ---
    const [bookings] = await db.query(
      `SELECT start_time, end_time, status, created_at, updated_at 
       FROM bookings 
       WHERE court_id = ? AND booking_date = ? AND status != 'cancelled'`,
      [court_id, date]
    );

    // --- ขั้นที่ 4: สร้างสล็อตรายชั่วโมง 10:00–22:00 (12 ช่อง) และกำหนดสถานะแต่ละช่อง ---
    const slots = [];
    for (let hour = 10; hour < 22; hour++) {
      const startTimeStr = `${hour.toString().padStart(2, '0')}:00:00`;
      const endTimeStr = `${(hour + 1).toString().padStart(2, '0')}:00:00`;
      const displayLabel = `${hour.toString().padStart(2, '0')}.00-${(hour + 1).toString().padStart(2, '0')}.00`;

      let status = 'available';
      let bookingDetail = null;

      for (const booking of bookings) {
        if (startTimeStr >= booking.start_time && startTimeStr < booking.end_time) {

          if (booking.status === 'approved') {
            status = 'unavailable';
          }
          else if (booking.status === 'pending_approval') {
            status = 'pending_approval';
          }
          else if (booking.status === 'pending_payment') {
            const timeDiff = (new Date() - new Date(booking.created_at)) / 1000 / 60;
            if (timeDiff <= 15) {
              status = 'locked';
            }
          }
          else if (booking.status === 'rejected') {
            const timeDiff = (new Date() - new Date(booking.updated_at)) / 1000 / 60;
            if (timeDiff <= 15) {
              status = 'locked';
            }
          }
          bookingDetail = booking;
          break;
        }
      }

      slots.push({
        label: displayLabel,
        start_time: startTimeStr,
        end_time: endTimeStr,
        status: status
      });
    }

    // --- ขั้นที่ 5: ตอบกลับรายการสล็อต ---
    res.json({ court_status: 'active', slots });
  } catch (error) {
    console.error('CheckAvailability Error:', error);
    res.status(500).json({ message: 'เกิดข้อผิดพลาดในการตรวจสอบความว่างของสนาม' });
  }
};

// =============================================================================
// 3. createBooking — สร้างการจองใหม่ ล็อกสนาม 15 นาที (POST /api/bookings)
//    Flow: รับข้อมูล → ตรวจครบ → กฎ 1–4 → บันทึก pending_payment → ตอบกลับ
// =============================================================================
exports.createBooking = async (req, res) => {
  const { court_id, booking_date, start_time, end_time, contact_phone } = req.body;
  const user_id = req.user.id;

  // --- ขั้นที่ 1: ตรวจสอบความครบถ้วนของข้อมูล ---
  if (!court_id || !booking_date || !start_time || !end_time || !contact_phone) {
    return res.status(400).json({ message: 'กรุณากรอกข้อมูลการจองให้ครบถ้วน' });
  }

  try {
    // --- ขั้นที่ 2: กฎข้อที่ 1 — จำกัดการจองไม่เกิน 3 ชั่วโมงติดต่อกัน ---
    const startHour = parseInt(start_time.split(':')[0]);
    const endHour = parseInt(end_time.split(':')[0]);
    const totalHours = endHour - startHour;

    if (totalHours <= 0 || totalHours > 3) {
      return res.status(400).json({ message: 'คุณสามารถจองสนามได้สูงสุดครั้งละไม่เกิน 3 ชั่วโมงติดต่อกัน' });
    }

    // --- ขั้นที่ 3: กฎข้อที่ 2 — ป้องกันสแปม (ห้ามมี pending_payment ค้างภายใน 15 นาที) ---
    const [spamCheck] = await db.query(
      `SELECT id FROM bookings 
       WHERE user_id = ? 
         AND status = 'pending_payment' 
         AND created_at >= NOW() - INTERVAL 15 MINUTE`,
      [user_id]
    );

    if (spamCheck.length > 0) {
      return res.status(400).json({
        message: 'คุณมีรายการจองเก่าที่ยังไม่ได้ชำระเงินค้างอยู่ กรุณายกเลิกของเก่าหรือรอให้ระบบปลดล็อก (15 นาที) ก่อนทำการจองใหม่'
      });
    }

    // --- ขั้นที่ 4: กฎข้อที่ 3 — เช็คช่วงเวลาชนกับการจองอื่น ---
    const [overlapCheck] = await db.query(
      `SELECT status, created_at, updated_at FROM bookings 
       WHERE court_id = ? 
         AND booking_date = ? 
         AND status != 'cancelled'
         AND NOT (end_time <= ? OR start_time >= ?)`,
      [court_id, booking_date, start_time, end_time]
    );

    for (const booking of overlapCheck) {
      if (booking.status === 'approved' || booking.status === 'pending_approval') {
        return res.status(400).json({ message: 'ช่วงเวลานี้ถูกจองไปแล้ว' });
      }
      if (booking.status === 'pending_payment') {
        const timeDiff = (new Date() - new Date(booking.created_at)) / 1000 / 60;
        if (timeDiff <= 15) {
          return res.status(400).json({ message: 'ช่วงเวลานี้อยู่ระหว่างรอการชำระเงินโดยผู้ใช้อื่น' });
        }
      }
      if (booking.status === 'rejected') {
        const timeDiff = (new Date() - new Date(booking.updated_at)) / 1000 / 60;
        if (timeDiff <= 15) {
          return res.status(400).json({ message: 'ช่วงเวลานี้อยู่ระหว่างรอการส่งหลักฐานชำระเงินใหม่โดยผู้ใช้อื่น' });
        }
      }
    }

    // --- ขั้นที่ 5: กฎข้อที่ 4 — ดึงราคาสนามและคำนวณยอดรวม ---
    const [court] = await db.query('SELECT price_per_hour, status FROM courts WHERE id = ?', [court_id]);
    if (court.length === 0) {
      return res.status(404).json({ message: 'ไม่พบสนามนี้' });
    }
    if (court[0].status === 'maintenance') {
      return res.status(400).json({ message: 'สนามนี้อยู่ระหว่างการปรับปรุง ไม่พร้อมให้บริการ' });
    }

    const pricePerHour = court[0].price_per_hour;
    const totalPrice = pricePerHour * totalHours;

    // --- ขั้นที่ 6: บันทึกการจอง (สถานะเริ่มต้น = pending_payment) ---
    const [result] = await db.query(
      `INSERT INTO bookings (user_id, court_id, booking_date, start_time, end_time, total_price, contact_phone, status) 
       VALUES (?, ?, ?, ?, ?, ?, ?, 'pending_payment')`,
      [user_id, court_id, booking_date, start_time, end_time, totalPrice, contact_phone]
    );

    // --- ขั้นที่ 7: ตอบกลับ bookingId และยอดชำระ ---
    res.status(201).json({
      message: 'สร้างการจองสำเร็จ! กรุณาโอนเงินเพื่อยืนยันภายใน 15 นาที',
      bookingId: result.insertId,
      total_price: totalPrice
    });
  } catch (error) {
    console.error('CreateBooking Error:', error);
    res.status(500).json({ message: 'เกิดข้อผิดพลาดในการจองสนาม' });
  }
};

// =============================================================================
// 4. getMyBookings — ดูประวัติการจองของตนเอง (GET /api/bookings/my-bookings)
//    Flow: ดึง user_id จาก Token → query รวมข้อมูลสนาม/กีฬา/สลิป → ตอบกลับ
// =============================================================================
exports.getMyBookings = async (req, res) => {
  const user_id = req.user.id;

  try {
    const [myBookings] = await db.query(
      `SELECT b.*, c.name AS court_name, s.name AS sport_name, p.slip_image_path, p.transfer_time
       FROM bookings b
       INNER JOIN courts c ON b.court_id = c.id
       INNER JOIN sports s ON c.sport_id = s.id
       LEFT JOIN payments p ON b.id = p.booking_id
       WHERE b.user_id = ?
       ORDER BY b.created_at DESC`,
      [user_id]
    );
    res.json(myBookings);
  } catch (error) {
    console.error('getMyBookings Error:', error);
    res.status(500).json({ message: 'เกิดข้อผิดพลาดในการดึงประวัติการจอง' });
  }
};

// =============================================================================
// 5. cancelBooking — ยกเลิกการจอง (PUT /api/bookings/:id/cancel)
//    Flow: ค้นหาใบจอง → แยกสิทธิ์ admin / ลูกค้า → อัปเดต cancelled → ตอบกลับ
// =============================================================================
exports.cancelBooking = async (req, res) => {
  const { id } = req.params;
  const user_id = req.user.id;
  const user_role = req.user.role;

  try {
    // --- ขั้นที่ 1: ค้นหารายการจอง ---
    const [bookings] = await db.query('SELECT status, user_id FROM bookings WHERE id = ?', [id]);
    if (bookings.length === 0) {
      return res.status(404).json({ message: 'ไม่พบรายการจองนี้' });
    }

    // --- ขั้นที่ 2: กรณีแอดมิน — ยกเลิกได้ทุกสถานะ (ยกเว้นที่ยกเลิกแล้ว) ---
    if (user_role === 'admin') {
      if (bookings[0].status === 'cancelled') {
        return res.status(400).json({ message: 'รายการจองนี้ถูกยกเลิกไปก่อนหน้านี้แล้ว' });
      }
      await db.query("UPDATE bookings SET status = 'cancelled' WHERE id = ?", [id]);
      return res.json({ message: 'แอดมินยกเลิกรายการจองสำเร็จ (คืนสิทธิ์สนามว่างเรียบร้อย)' });
    }

    // --- ขั้นที่ 3: กรณีลูกค้า — ต้องเป็นเจ้าของและสถานะ pending_payment เท่านั้น ---
    if (bookings[0].user_id !== user_id) {
      return res.status(403).json({ message: 'คุณไม่มีสิทธิ์ยกเลิกใบจองนี้' });
    }

    if (bookings[0].status !== 'pending_payment') {
      return res.status(400).json({ message: 'ไม่สามารถยกเลิกได้ เนื่องจากมีการชำระเงินหรือสถานะเปลี่ยนไปแล้ว' });
    }

    await db.query("UPDATE bookings SET status = 'cancelled' WHERE id = ?", [id]);
    res.json({ message: 'ยกเลิกรายการจองสำเร็จแล้ว คืนสิทธิ์สนามว่างเรียบร้อย' });
  } catch (error) {
    console.error('CancelBooking Error:', error);
    res.status(500).json({ message: 'เกิดข้อผิดพลาดในการยกเลิกการจอง' });
  }
};

// =============================================================================
// 6. verifyBooking — แอดมินอนุมัติ/ปฏิเสธสลิป (PUT /api/bookings/:id/verify)
//    Flow: ตรวจสิทธิ์ admin → ตรวจ status ใน body → ค้นหาใบจอง → อัปเดต → ตอบกลับ
// =============================================================================
exports.verifyBooking = async (req, res) => {
  const { id } = req.params;
  const { status, reject_reason } = req.body;
  const admin_role = req.user.role;

  // --- ขั้นที่ 1: ตรวจสอบสิทธิ์และข้อมูลที่ส่งมา ---
  if (admin_role !== 'admin') {
    return res.status(403).json({ message: 'คุณไม่มีสิทธิ์เข้าถึงฟังก์ชันของแอดมิน' });
  }

  if (!status || (status !== 'approved' && status !== 'rejected')) {
    return res.status(400).json({ message: 'กรุณาระบุสถานะที่ต้องการเปลี่ยน (approved หรือ rejected)' });
  }

  if (status === 'rejected' && !reject_reason) {
    return res.status(400).json({ message: 'หากปฏิเสธการจอง กรุณากรอกเหตุผลด้วยครับ' });
  }

  try {
    // --- ขั้นที่ 2: ค้นหาใบจองและตรวจว่าอยู่ในสถานะ pending_approval ---
    const [bookings] = await db.query('SELECT status FROM bookings WHERE id = ?', [id]);
    if (bookings.length === 0) {
      return res.status(404).json({ message: 'ไม่พบรายการจองนี้' });
    }

    // ยอมให้อนุมัติได้ทั้งกรณีมีสลิปเข้าระบบ (pending_approval) หรือกรณีค้างจ่าย/เงินสดหน้าร้าน (pending_payment)
    if (!['pending_approval', 'pending_payment'].includes(bookings[0].status)) {
      return res.status(400).json({ message: 'รายการจองนี้ไม่อยู่ในสถานะที่สามารถทำการอนุมัติได้' });
    }

    // --- ขั้นที่ 3: อัปเดตสถานะตามที่แอดมินเลือก ---
    if (status === 'approved') {
      await db.query("UPDATE bookings SET status = 'approved', reject_reason = NULL WHERE id = ?", [id]);
      res.json({ message: 'อนุมัติการจองสำเร็จและแจ้งสิทธิ์การใช้งานแล้ว!' });
    } else {
      await db.query(
        "UPDATE bookings SET status = 'rejected', reject_reason = ? WHERE id = ?",
        [reject_reason, id]
      );
      res.json({ message: 'ปฏิเสธการจองและบันทึกเหตุผลเรียบร้อยแล้ว ส่งโอกาสให้ลูกค้าแนบสลิปใหม่ใน 15 นาที' });
    }
  } catch (error) {
    console.error('VerifyBooking Error:', error);
    res.status(500).json({ message: 'เกิดข้อผิดพลาดในการตรวจสอบสถานะ' });
  }
};

// =============================================================================
// 7. getAdminBookings — แอดมินดูรายการจองทั้งหมด (GET /api/bookings/admin/list)
//    Flow: ตรวจสิทธิ์ admin → query รวมข้อมูลผู้ใช้/สนาม/สลิป → ตอบกลับ
// =============================================================================
exports.getAdminBookings = async (req, res) => {
  const admin_role = req.user.role;

  // --- ขั้นที่ 1: ตรวจสอบสิทธิ์แอดมิน ---
  if (admin_role !== 'admin') {
    return res.status(403).json({ message: 'คุณไม่มีสิทธิ์เข้าถึงข้อมูลส่วนนี้' });
  }

  try {
    // --- ขั้นที่ 2: ดึงรายการจองทั้งหมดพร้อมรายละเอียดที่เกี่ยวข้อง ---
    const [allBookings] = await db.query(
      `SELECT b.*, 
              u.username, u.email, 
              c.name AS court_name, s.name AS sport_name, 
              p.slip_image_path, p.transfer_time, p.uploaded_at
       FROM bookings b
       INNER JOIN users u ON b.user_id = u.id
       INNER JOIN courts c ON b.court_id = c.id
       INNER JOIN sports s ON c.sport_id = s.id
       LEFT JOIN payments p ON b.id = p.booking_id
       ORDER BY b.created_at DESC`
    );
    res.json(allBookings);
  } catch (error) {
    console.error('GetAdminBookings Error:', error);
    res.status(500).json({ message: 'เกิดข้อผิดพลาดในการดึงรายการจองสำหรับแอดมิน' });
  }
};
