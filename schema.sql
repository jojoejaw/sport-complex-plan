-- -------------------------------------------------------------
-- SQL Schema for Sport Complex Booking System
-- -------------------------------------------------------------

CREATE DATABASE IF NOT EXISTS `sport_complex_db` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE `sport_complex_db`;

-- 1. Table: users
CREATE TABLE IF NOT EXISTS `users` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `username` VARCHAR(50) NOT NULL UNIQUE,
  `email` VARCHAR(100) NOT NULL UNIQUE,
  `password` VARCHAR(255) NOT NULL,
  `role` ENUM('customer', 'admin') NOT NULL DEFAULT 'customer',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. Table: sports
CREATE TABLE IF NOT EXISTS `sports` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `name` VARCHAR(50) NOT NULL UNIQUE,
  `image_url` VARCHAR(255) NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. Table: courts
CREATE TABLE IF NOT EXISTS `courts` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `sport_id` INT NOT NULL,
  `name` VARCHAR(50) NOT NULL,
  `price_per_hour` DECIMAL(10, 2) NOT NULL,
  `status` ENUM('active', 'maintenance') NOT NULL DEFAULT 'active',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`sport_id`) REFERENCES `sports` (`id`) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. Table: bookings
CREATE TABLE IF NOT EXISTS `bookings` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `user_id` INT NOT NULL,
  `court_id` INT NOT NULL,
  `booking_date` DATE NOT NULL,
  `start_time` TIME NOT NULL,
  `end_time` TIME NOT NULL,
  `total_price` DECIMAL(10, 2) NOT NULL,
  `contact_phone` VARCHAR(20) NOT NULL,
  `status` ENUM('pending_payment', 'pending_approval', 'approved', 'rejected', 'cancelled') NOT NULL DEFAULT 'pending_payment',
  `reject_reason` VARCHAR(255) NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE RESTRICT,
  FOREIGN KEY (`court_id`) REFERENCES `courts` (`id`) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 5. Table: payments
CREATE TABLE IF NOT EXISTS `payments` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `booking_id` INT NOT NULL UNIQUE,
  `slip_image_path` VARCHAR(255) NOT NULL,
  `transfer_time` DATETIME NOT NULL,
  `uploaded_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`booking_id`) REFERENCES `bookings` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -------------------------------------------------------------
-- Mock Data (Optional: Run these lines to seed initial data)
-- -------------------------------------------------------------

-- Insert Sports
INSERT INTO `sports` (`id`, `name`, `image_url`) VALUES
(1, 'ฟุตบอล', NULL),
(2, 'บาสเกตบอล', NULL),
(3, 'แบดมินตัน', NULL),
(4, 'วอลเลย์บอล', NULL)
ON DUPLICATE KEY UPDATE `name`=`name`;

-- Insert Initial Courts (Football 2 fields, Basketball 1 field, Badminton 4 fields, Volleyball 1 field)
INSERT INTO `courts` (`sport_id`, `name`, `price_per_hour`) VALUES
(1, 'สนามฟุตบอล A (ในร่ม)', 600.00),
(1, 'สนามฟุตบอล B (กลางแจ้ง)', 400.00),
(2, 'สนามบาสเกตบอล 1', 300.00),
(3, 'สนามแบดมินตัน คอร์ท 1', 150.00),
(3, 'สนามแบดมินตัน คอร์ท 2', 150.00),
(3, 'สนามแบดมินตัน คอร์ท 3', 150.00),
(3, 'สนามแบดมินตัน คอร์ท 4', 150.00),
(4, 'สนามวอลเลย์บอล 1', 250.00);
