const db = require('../config/db');
const logger = require('./logger');

function startBookingCleanup() {
  // รันทุกๆ 1 นาที (60000 มิลลิวินาที)เพื่อเช็คการจองที่เลยกำหนดเวลาชำระเงิน แล้วยกเลิกอัตโนมัติ
  setInterval(async () => {
    try {
      const query = `
        UPDATE bookings 
        SET status = 'cancelled' 
        WHERE (status = 'pending_payment' AND created_at < NOW() - INTERVAL 15 MINUTE)
           OR (status = 'rejected' AND updated_at < NOW() - INTERVAL 15 MINUTE)
      `;
      const [result] = await db.query(query);
      if (result.affectedRows > 0) {
        logger.info(`[Cleanup Scheduler] Automatically cancelled ${result.affectedRows} expired bookings.`);
      }
    } catch (error) {
      logger.error('[Cleanup Scheduler Error] Failed to auto-cancel bookings: ' + (error.stack || error));
    }
  }, 60000);
}

module.exports = { startBookingCleanup };
