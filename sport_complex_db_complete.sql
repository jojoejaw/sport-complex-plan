-- ============================================================================
-- SPORT COMPLEX BOOKING SYSTEM - COMPLETE DATABASE INSTALLATION
-- ใช้สำหรับติดตั้งฐานข้อมูลใหม่บน MySQL 8+ หรือ MariaDB 10.4+
-- ไม่รวมประวัติการจองและการชำระเงินจากเครื่องเดิม
-- ============================================================================

SET NAMES utf8mb4;
SET time_zone = '+07:00';

CREATE DATABASE IF NOT EXISTS `sport_complex_db`
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE `sport_complex_db`;

-- ----------------------------------------------------------------------------
-- 1. ผู้ใช้งาน
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `users` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `username` VARCHAR(50) NOT NULL,
  `email` VARCHAR(100) NOT NULL,
  `password` VARCHAR(255) NOT NULL,
  `role` ENUM('customer', 'admin') NOT NULL DEFAULT 'customer',
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_users_username` (`username`),
  UNIQUE KEY `uq_users_email` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- 2. ประเภทกีฬา
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `sports` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(50) NOT NULL,
  `image_url` VARCHAR(255) NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_sports_name` (`name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- 3. สนาม
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `courts` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `sport_id` INT NOT NULL,
  `name` VARCHAR(50) NOT NULL,
  `description` TEXT NULL,
  `price_per_hour` DECIMAL(10,2) NOT NULL,
  `status` ENUM('active', 'maintenance') NOT NULL DEFAULT 'active',
  `image_url` VARCHAR(255) NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_courts_sport_id` (`sport_id`),
  KEY `idx_courts_status` (`status`),
  CONSTRAINT `fk_courts_sport`
    FOREIGN KEY (`sport_id`) REFERENCES `sports` (`id`)
    ON UPDATE CASCADE ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- 4. รายการจอง
-- pending_approval/rejected คงไว้เพื่ออ่านข้อมูลเก่าหรือรองรับการขยายระบบ
-- Flow ปัจจุบันใช้งานหลัก: pending_payment -> approved/cancelled
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `bookings` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `user_id` INT NOT NULL,
  `court_id` INT NOT NULL,
  `booking_date` DATE NOT NULL,
  `start_time` TIME NOT NULL,
  `end_time` TIME NOT NULL,
  `total_price` DECIMAL(10,2) NOT NULL,
  `contact_phone` VARCHAR(20) NOT NULL,
  `status` ENUM('pending_payment', 'pending_approval', 'approved', 'rejected', 'cancelled')
    NOT NULL DEFAULT 'pending_payment',
  `reject_reason` VARCHAR(255) NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_bookings_user_id` (`user_id`),
  KEY `idx_bookings_court_date` (`court_id`, `booking_date`),
  KEY `idx_bookings_status_created` (`status`, `created_at`),
  CONSTRAINT `fk_bookings_user`
    FOREIGN KEY (`user_id`) REFERENCES `users` (`id`)
    ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT `fk_bookings_court`
    FOREIGN KEY (`court_id`) REFERENCES `courts` (`id`)
    ON UPDATE CASCADE ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- 5. การชำระเงิน
-- PromptPay เก็บสลิป/เลขธุรกรรม ส่วนเงินสดเก็บ received_by เป็นแอดมินผู้รับเงิน
-- หนึ่ง Booking มี Payment สำเร็จได้หนึ่งรายการ
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `payments` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `booking_id` INT NOT NULL,
  `payment_method` ENUM('promptpay', 'cash') NOT NULL DEFAULT 'promptpay',
  `amount` DECIMAL(10,2) NOT NULL,
  `slip_image_path` VARCHAR(255) NULL,
  `transfer_time` DATETIME NULL,
  `paid_at` DATETIME NOT NULL,
  `received_by` INT NULL,
  `transaction_ref` VARCHAR(100) NULL,
  `uploaded_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_payments_booking_id` (`booking_id`),
  UNIQUE KEY `uq_payments_transaction_ref` (`transaction_ref`),
  KEY `idx_payments_received_by` (`received_by`),
  KEY `idx_payments_method_paid_at` (`payment_method`, `paid_at`),
  CONSTRAINT `fk_payments_booking`
    FOREIGN KEY (`booking_id`) REFERENCES `bookings` (`id`)
    ON UPDATE CASCADE ON DELETE CASCADE,
  CONSTRAINT `fk_payments_received_by`
    FOREIGN KEY (`received_by`) REFERENCES `users` (`id`)
    ON UPDATE CASCADE ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- ข้อมูลเริ่มต้น
-- ============================================================================
START TRANSACTION;

INSERT INTO `sports` (`id`, `name`, `image_url`) VALUES
  (1, 'ฟุตบอล', NULL),
  (2, 'บาสเกตบอล', NULL),
  (3, 'แบดมินตัน', NULL),
  (4, 'วอลเลย์บอล', NULL)
ON DUPLICATE KEY UPDATE
  `name` = VALUES(`name`),
  `image_url` = VALUES(`image_url`);

INSERT INTO `courts`
  (`id`, `sport_id`, `name`, `description`, `price_per_hour`, `status`, `image_url`)
VALUES
  (1, 1, 'สนามฟุตบอล A', '', 1.00, 'active',
   'https://www.greenygrass.co.th/file_upload/t_16952783291815452288.jpg'),
  (2, 1, 'สนามฟุตบอล B (ในร่ม)', NULL, 1.00, 'active',
   'https://www.greenygrass.co.th/file_upload/t_17237923071639073755.jpg'),
  (3, 2, 'สนามบาสเกตบอล A', NULL, 1.00, 'active',
   'https://pattana.co.th/wp-content/uploads/2024/11/DJI_0256_0-768x432.jpg'),
  (4, 3, 'สนามแบดมินตัน คอร์ท A', '', 1.00, 'active',
   'https://pbsport.co.th/wp-content/uploads/2021/07/Photo-5-7-21-09-52-08-1140x680_c.jpg'),
  (5, 3, 'สนามแบดมินตัน คอร์ท B', '', 1.00, 'active',
   'https://pbsport.co.th/wp-content/uploads/2018/08/Photo-11-1-21-10-44-03.jpg'),
  (8, 4, 'สนามวอลเลย์บอล A', NULL, 1.00, 'active',
   'https://img.magnific.com/premium-photo/volleyball-net-empty-gym-with-mobile-basketball-hoop-background_1046379-1967.jpg'),
  (10, 2, 'สนามบาสเกตบอล B', 'สนามบาสเกตบอล ขนาดมาตรฐาน', 1.00, 'active',
   'https://pattana.co.th/wp-content/uploads/2024/11/DJI_0213_0-1-768x432.jpg'),
  (11, 4, 'สนามวอลเลย์บอล B', 'สนามวอลเลย์บอล ขนาดมาตรฐาน', 1.00, 'active',
   'https://png.pngtree.com/thumb_back/fh260/background/20250226/pngtree-empty-gymnasium-with-reflective-volleyball-court-image_16961791.jpg')
ON DUPLICATE KEY UPDATE
  `sport_id` = VALUES(`sport_id`),
  `name` = VALUES(`name`),
  `description` = VALUES(`description`),
  `price_per_hour` = VALUES(`price_per_hour`),
  `status` = VALUES(`status`),
  `image_url` = VALUES(`image_url`);

-- บัญชีสำหรับเริ่มใช้งานและสาธิต
-- Admin:    admin / admin1234
-- Customer: customer / customer1234
-- ควรเปลี่ยนรหัสผ่านบัญชี Admin ก่อนนำระบบขึ้นใช้งานจริง
INSERT INTO `users` (`username`, `email`, `password`, `role`) VALUES
  ('admin', 'admin@sportcomplex.com',
   '$2b$10$.Dzmg2mAjQdsjbws9xikTOmse1YEN7MGhFyJ7NQ9VFg0VnQ7zvx82', 'admin'),
  ('customer', 'customer@sportcomplex.com',
   '$2b$10$P2liKxhnMrkfjn60Q.JKwOIcO7dIxCLCnlIOkLfdn6ypLfu5e/wCu', 'customer')
ON DUPLICATE KEY UPDATE
  `email` = VALUES(`email`),
  `role` = VALUES(`role`);

COMMIT;

-- แสดงผลหลังติดตั้ง เพื่อใช้ตรวจสอบเบื้องต้น
SELECT 'Database installation completed' AS `result`;
SELECT COUNT(*) AS `sports_count` FROM `sports`;
SELECT COUNT(*) AS `courts_count` FROM `courts`;
SELECT COUNT(*) AS `starter_users_count` FROM `users`
WHERE `username` IN ('admin', 'customer');
