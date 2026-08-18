-- รองรับการรับชำระเงินสดโดยแอดมิน โดยไม่ลบข้อมูล Payment เดิม
ALTER TABLE payments
  MODIFY slip_image_path VARCHAR(255) NULL,
  MODIFY transfer_time DATETIME NULL,
  ADD COLUMN payment_method ENUM('promptpay', 'cash') NOT NULL DEFAULT 'promptpay' AFTER booking_id,
  ADD COLUMN amount DECIMAL(10, 2) NULL AFTER payment_method,
  ADD COLUMN paid_at DATETIME NULL AFTER transfer_time,
  ADD COLUMN received_by INT NULL AFTER paid_at;

UPDATE payments p
INNER JOIN bookings b ON b.id = p.booking_id
SET p.amount = b.total_price,
    p.paid_at = COALESCE(p.transfer_time, p.uploaded_at),
    p.payment_method = 'promptpay'
WHERE p.amount IS NULL OR p.paid_at IS NULL;

ALTER TABLE payments
  MODIFY amount DECIMAL(10, 2) NOT NULL,
  MODIFY paid_at DATETIME NOT NULL,
  ADD CONSTRAINT fk_payments_received_by
    FOREIGN KEY (received_by) REFERENCES users(id) ON DELETE SET NULL;
