const db = require('../config/db');

// 1. เช็คความว่างของสนามรายชั่วโมง (10.00 น. - 22.00 น.) ในวันที่เลือก
// URL ตัวอย่าง: GET /api/bookings/availability?court_id=1&date=2026-05-23
exports.checkAvailability = async (req, res) => {
  const { court_id, date } = req.query;

  if (!court_id || !date) {
    return res.status(400).json({ message: 'กรุณาระบุสนามและวันที่ต้องการตรวจสอบ' });
  }

  try {
    // 1. ตรวจสอบก่อนว่าสนามเปิดบริการ (active) หรือไม่
    const [court] = await db.query('SELECT status FROM courts WHERE id = ?', [court_id]);
    if (court.length === 0) {
      return res.status(404).json({ message: 'ไม่พบสนามนี้ในระบบ' });
    }
    if (court[0].status === 'maintenance') {
      // หากสนามปิดปรับปรุง ให้ตอบกลับเป็นปิดปรับปรุงทั้งหมด
      return res.json({ court_status: 'maintenance', slots: [] });
    }

    // 2. ดึงประวัติการจองทั้งหมดของสนามนี้ในวันที่เลือก (ไม่เอาคิวที่ยกเลิกไปแล้ว)
    const [bookings] = await db.query(
      `SELECT start_time, end_time, status, created_at, updated_at 
       FROM bookings 
       WHERE court_id = ? AND booking_date = ? AND status != 'cancelled'`,
      [court_id, date]
    );

    // 3. สร้างช่วงเวลาที่ระบบกำหนด (10:00 - 22:00 น.) รายชั่วโมง (ทั้งหมด 12 สล็อต)
    const slots = [];
    for (let hour = 10; hour < 22; hour++) {
      const startTimeStr = `${hour.toString().padStart(2, '0')}:00:00`;
      const endTimeStr = `${(hour + 1).toString().padStart(2, '0')}:00:00`;
      const displayLabel = `${hour.toString().padStart(2, '0')}.00-${(hour + 1).toString().padStart(2, '0')}.00`;

      // ค้นหาว่าช่วงเวลานี้ชนกับใบจองไหนใน DB หรือไม่
      let status = 'available'; // สเตตัสเริ่มต้นคือ ว่าง (🟢)
      let bookingDetail = null;

      for (const booking of bookings) {
        // เงื่อนไขเวลาชนกัน: start_time ของสล็อต อยู่ระหว่างช่วงจองของเขา
        if (startTimeStr >= booking.start_time && startTimeStr < booking.end_time) {
          
          if (booking.status === 'approved') {
            status = 'unavailable'; // จองแล้วสำเร็จ (🔴)
          } 
          else if (booking.status === 'pending_approval') {
            status = 'pending_approval'; // ลูกค้าแนบสลิปแล้ว รออนุมัติ (🟡)
          } 
          else if (booking.status === 'pending_payment') {
            // เช็คว่าการจองยังไม่เกิน 15 นาที (ล็อกชั่วคราว 🟡)
            const timeDiff = (new Date() - new Date(booking.created_at)) / 1000 / 60; // นาที
            if (timeDiff <= 15) {
              status = 'locked'; // รอชำระเงิน/ล็อกชั่วคราว
            }
          } 
          else if (booking.status === 'rejected') {
            // เช็คว่าหลังจากแอดมินปฏิเสธ ยังไม่เกิน 15 นาทีสำหรับการโอนใหม่ (Grace Period 🟡)
            const timeDiff = (new Date() - new Date(booking.updated_at)) / 1000 / 60;
            if (timeDiff <= 15) {
              status = 'locked'; // รอชำระเงินใหม่
            }
          }
          bookingDetail = booking;
          break; // เมื่อพบช่วงเวลาที่จองแล้วให้หยุดค้นหาใบอื่นในชั่วโมงนั้น
        }
      }

      slots.push({
        label: displayLabel,
        start_time: startTimeStr,
        end_time: endTimeStr,
        status: status
      });
    }

    res.json({ court_status: 'active', slots });
  } catch (error) {
    console.error('CheckAvailability Error:', error);
    res.status(500).json({ message: 'เกิดข้อผิดพลาดในการตรวจสอบความว่างของสนาม' });
  }
};

// 2. สร้างรายการจองสนามใหม่ (ล็อกสนามชั่วคราว 15 นาที)
exports.createBooking = async (req, res) => {
  const { court_id, booking_date, start_time, end_time, contact_phone } = req.body;
  const user_id = req.user.id; // ดึงมาจาก JWT Token ที่ผ่าน Middleware

  if (!court_id || !booking_date || !start_time || !end_time || !contact_phone) {
    return res.status(400).json({ message: 'กรุณากรอกข้อมูลการจองให้ครบถ้วน' });
  }

  try {
    // กฎข้อที่ 1: จำกัดระยะเวลาการจองสูงสุดไม่เกิน 3 ชั่วโมง
    const startHour = parseInt(start_time.split(':')[0]);
    const endHour = parseInt(end_time.split(':')[0]);
    const totalHours = endHour - startHour;

    if (totalHours <= 0 || totalHours > 3) {
      return res.status(400).json({ message: 'คุณสามารถจองสนามได้สูงสุดครั้งละไม่เกิน 3 ชั่วโมงติดต่อกัน' });
    }

    // กฎข้อที่ 2: ป้องกันผู้ใช้สแปม (ต้องไม่มีรายการ pending_payment ที่ยังไม่หมดอายุ 15 นาทีค้างอยู่ในระบบ)
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

    // กฎข้อที่ 3: เช็คว่าเวลาที่จะจองนี้ถูกผู้อื่นล็อกหรือจองไปแล้วหรือยัง
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

    // กฎข้อที่ 4: ดึงราคาสนามต่อชั่วโมงมาคำนวณยอดสุทธิ
    const [court] = await db.query('SELECT price_per_hour, status FROM courts WHERE id = ?', [court_id]);
    if (court.length === 0) {
      return res.status(404).json({ message: 'ไม่พบสนามนี้' });
    }
    if (court[0].status === 'maintenance') {
      return res.status(400).json({ message: 'สนามนี้อยู่ระหว่างการปรับปรุง ไม่พร้อมให้บริการ' });
    }

    const pricePerHour = court[0].price_per_hour;
    const totalPrice = pricePerHour * totalHours;

    // 4. บันทึกข้อมูลการจองลง MySQL (สถานะเริ่มต้นคือ pending_payment ล็อกสนาม 15 นาที)
    const [result] = await db.query(
      `INSERT INTO bookings (user_id, court_id, booking_date, start_time, end_time, total_price, contact_phone, status) 
       VALUES (?, ?, ?, ?, ?, ?, ?, 'pending_payment')`,
      [user_id, court_id, booking_date, start_time, end_time, totalPrice, contact_phone]
    );

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

// 3. ดึงประวัติการจองของผู้ใช้งานล็อกอินอยู่ (ดูของตนเอง) - GET /api/bookings/my-bookings
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
  
  // 4. ลูกค้ากดยกเลิกการจองเองก่อนโอนเงิน (เฉพาะสถานะ pending_payment เท่านั้น) - PUT /api/bookings/:id/cancel
  //    หรือ แอดมินกดยกเลิกในกรณีเกิดเหตุสุดวิสัย (ยกเลิกได้ทุกสถานะ)
  exports.cancelBooking = async (req, res) => {
    const { id } = req.params;
    const user_id = req.user.id;
    const user_role = req.user.role; // 🆕 ดึงสิทธิ์ผู้ใช้งานมาตรวจสอบ
  
    try {
      const [bookings] = await db.query('SELECT status, user_id FROM bookings WHERE id = ?', [id]);
      if (bookings.length === 0) {
        return res.status(404).json({ message: 'ไม่พบรายการจองนี้' });
      }
  
      // 🆕 สิทธิ์พิเศษสำหรับแอดมิน: สามารถยกเลิกได้ทุกใบจองและทุกสถานะ (กรณีเกิดเหตุสุดวิสัย)
      if (user_role === 'admin') {
        if (bookings[0].status === 'cancelled') {
          return res.status(400).json({ message: 'รายการจองนี้ถูกยกเลิกไปก่อนหน้านี้แล้ว' });
        }
        await db.query("UPDATE bookings SET status = 'cancelled' WHERE id = ?", [id]);
        return res.json({ message: 'แอดมินยกเลิกรายการจองสำเร็จ (คืนสิทธิ์สนามว่างเรียบร้อย)' });
      }
  
      // --- สิทธิ์สำหรับลูกค้าทั่วไป ---
      // ต้องเป็นผู้จองเองถึงจะสั่งยกเลิกได้
      if (bookings[0].user_id !== user_id) {
        return res.status(403).json({ message: 'คุณไม่มีสิทธิ์ยกเลิกใบจองนี้' });
      }
  
      // ต้องมีสถานะเป็นรอโอนเงิน (pending_payment) เท่านั้นจึงจะกดยกเลิกเองได้
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
  
  // 5. แอดมินตรวจสอบสลิปและกดยืนยัน (Approve) หรือปฏิเสธ (Reject) - PUT /api/bookings/:id/verify
  exports.verifyBooking = async (req, res) => {
    const { id } = req.params;
    const { status, reject_reason } = req.body; // status: 'approved' หรือ 'rejected'
    const admin_role = req.user.role;
  
    // ตรวจสอบสิทธิ์ว่าต้องเป็น Admin เท่านั้น
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
      const [bookings] = await db.query('SELECT status FROM bookings WHERE id = ?', [id]);
      if (bookings.length === 0) {
        return res.status(404).json({ message: 'ไม่พบรายการจองนี้' });
      }
  
      if (bookings[0].status !== 'pending_approval') {
        return res.status(400).json({ message: 'รายการจองนี้ไม่อยู่ในสถานะรอแอดมินอนุมัติ' });
      }
  
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

  // 6. แอดมินดึงรายการจองทั้งหมดในระบบ (รวมถึงรายละเอียดผู้ใช้ สนาม และสลิป) - GET /api/bookings/admin/list
exports.getAdminBookings = async (req, res) => {
  const admin_role = req.user.role;

  // ตรวจสอบสิทธิ์ว่าต้องเป็น Admin เท่านั้น
  if (admin_role !== 'admin') {
    return res.status(403).json({ message: 'คุณไม่มีสิทธิ์เข้าถึงข้อมูลส่วนนี้' });
  }

  try {
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