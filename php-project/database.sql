-- ====================================================================
-- Database Schema for City Con & Allied Health Sciences Nowshera Virkan
-- Fee Management System
-- Address: Near AL-Fatah Resturent Mutto Bahikay Road Nowshera Virkan
-- Mobile: 0302-6605216 || 0321-8420446
-- ====================================================================

CREATE DATABASE IF NOT EXISTS `citycon_fee_db` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE `citycon_fee_db`;

-- --------------------------------------------------------
-- Table structure for table `students`
-- --------------------------------------------------------
DROP TABLE IF EXISTS `fee_transactions`;
DROP TABLE IF EXISTS `students`;

CREATE TABLE `students` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `roll_no` VARCHAR(50) NOT NULL UNIQUE,
  `reg_no` VARCHAR(50) DEFAULT NULL,
  `full_name` VARCHAR(150) NOT NULL,
  `father_name` VARCHAR(150) NOT NULL,
  `phone` VARCHAR(30) NOT NULL,
  `guardian_phone` VARCHAR(30) DEFAULT NULL,
  `cnic` VARCHAR(30) DEFAULT 'Pending',
  `program` VARCHAR(150) NOT NULL,
  `session` VARCHAR(50) NOT NULL,
  `admission_date` DATE NOT NULL,
  `total_agreed_fee` DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  `discount` DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  `net_payable_fee` DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  `address` TEXT DEFAULT NULL,
  `status` ENUM('active','completed','struck_off') DEFAULT 'active',
  `photo` VARCHAR(255) DEFAULT NULL,
  `notes` TEXT DEFAULT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- Table structure for table `fee_transactions`
-- --------------------------------------------------------
CREATE TABLE `fee_transactions` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `receipt_no` VARCHAR(50) NOT NULL UNIQUE,
  `student_id` INT NOT NULL,
  `amount` DECIMAL(12,2) NOT NULL,
  `date` DATE NOT NULL,
  `payment_method` VARCHAR(50) DEFAULT 'Cash',
  `reference_no` VARCHAR(100) DEFAULT NULL,
  `remarks` VARCHAR(255) DEFAULT 'Fee Installment',
  `received_by` VARCHAR(100) DEFAULT 'Accounts Officer',
  `previous_balance` DECIMAL(12,2) NOT NULL,
  `remaining_balance` DECIMAL(12,2) NOT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT `fk_fee_student` FOREIGN KEY (`student_id`) REFERENCES `students` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- Table structure for table `expenses` (Campus Debit & Expenditure Book)
-- --------------------------------------------------------
DROP TABLE IF EXISTS `expenses`;
CREATE TABLE `expenses` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `voucher_no` VARCHAR(50) NOT NULL UNIQUE,
  `date` DATE NOT NULL,
  `category` VARCHAR(100) NOT NULL,
  `title` VARCHAR(255) NOT NULL,
  `amount` DECIMAL(12,2) NOT NULL,
  `payment_method` VARCHAR(50) DEFAULT 'Cash',
  `payee` VARCHAR(150) NOT NULL,
  `receipt_ref` VARCHAR(100) NULL,
  `recorded_by` VARCHAR(100) DEFAULT 'Accounts Office',
  `notes` TEXT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `expenses` (`id`, `voucher_no`, `date`, `category`, `title`, `amount`, `payment_method`, `payee`, `receipt_ref`, `recorded_by`, `notes`) VALUES
(1, 'EXP-24-001', '2024-08-20', 'Lab Consumables', 'Microscope Slides, Blood Cell Counters & Reagents', 18500.00, 'Cash', 'Lahore Scientific & Med Supplies', 'INV-9021', 'Accounts Office', 'For MLT & Pharmacy Practical Sessions'),
(2, 'EXP-24-002', '2024-09-02', 'Utility Bills', 'Electricity GEPCO Commercial Meter Bill (August)', 32400.00, 'Bank Transfer', 'GEPCO Nowshera Virkan Sub-division', 'GEP-24-8812', 'Accounts Office', 'Paid via Online Bank Transfer'),
(3, 'EXP-24-003', '2024-09-05', 'Marketing', 'Admission Flex Banners, Prospectus & Flyers Printing', 25000.00, 'Cash', 'Al-Madina Art Press Nowshera Virkan', 'AP-1044', 'Admission Desk', 'For 2024-2026 Batch Admissions campaign'),
(4, 'EXP-24-004', '2024-09-10', 'Generator & Fuel', 'Diesel 60 Litres for Backup Power Generator', 16800.00, 'Cash', 'Total Parco Filling Station, Gujranwala Road', 'TOT-5512', 'Admin Office', 'Emergency power backup during load shedding'),
(5, 'EXP-24-005', '2024-09-15', 'Office & Stationery', 'Paper Reams, Student File Folders, Receipt Pads & Pens', 9500.00, 'Cash', 'Bismillah Book Depot Main Bazaar', 'BBD-789', 'Accounts Office', 'Stationery for office and exam recording');

-- --------------------------------------------------------
-- Table structure for table `users` (Role-based access: admin / staff)
-- --------------------------------------------------------
DROP TABLE IF EXISTS `users`;
CREATE TABLE `users` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `name` VARCHAR(150) NOT NULL,
  `email` VARCHAR(150) NOT NULL UNIQUE,
  `password` VARCHAR(255) NOT NULL,
  `role` ENUM('admin','staff') NOT NULL DEFAULT 'staff',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Default Users:
-- Admin: admin@citycon.edu.pk / admin123
-- Staff: staff@citycon.edu.pk / staff123
INSERT INTO `users` (`id`, `name`, `email`, `password`, `role`) VALUES
(1, 'System Administrator', 'admin@citycon.edu.pk', 'admin123', 'admin'),
(2, 'Counter Cashier Staff', 'staff@citycon.edu.pk', 'staff123', 'staff');

-- --------------------------------------------------------
-- Sample Data Seeding
-- --------------------------------------------------------
INSERT INTO `students` (`id`, `roll_no`, `reg_no`, `full_name`, `father_name`, `phone`, `guardian_phone`, `cnic`, `program`, `session`, `admission_date`, `total_agreed_fee`, `discount`, `net_payable_fee`, `address`, `status`, `notes`) VALUES
(1, 'CCN-2024-001', 'PB-PC-2401', 'Muhammad Usman Ali', 'Tariq Mehmood', '0300-7412589', '0321-7412589', '34101-7894561-1', 'Pharmacy Technician (Category-B)', '2024-2026', '2024-08-15', 160000.00, 10000.00, 150000.00, 'Mohallah Farooq Nagar, Nowshera Virkan', 'active', 'Merit scholarship granted on matric marks'),
(2, 'CCN-2024-002', 'PB-MF-2402', 'Ayesha Bibi', 'Muhammad Aslam', '0304-9876543', '0301-4455667', '34101-4567890-2', 'Medical Laboratory Technology (MLT)', '2024-2026', '2024-08-18', 140000.00, 5000.00, 135000.00, 'Near Old Bus Stand, Mutto Bahikay Road, Nowshera Virkan', 'active', 'Special concession'),
(3, 'CCN-2024-003', 'PB-DP-2403', 'Hamza Farooq', 'Farooq Ahmad Cheema', '0312-5566778', '0302-6605216', '34101-1234567-3', 'Dispenser Course', '2024-2025', '2024-09-01', 80000.00, 0.00, 80000.00, 'Village Dera Gujran, Tehsil Nowshera Virkan', 'active', 'Regular admission'),
(4, 'CCN-2024-004', 'PB-OT-2404', 'Zainab Fatima', 'Liaqat Ali Virk', '0322-8899001', '0321-8420446', '34101-8901234-4', 'Operation Theater Technology (OTT)', '2024-2026', '2024-09-05', 150000.00, 15000.00, 135000.00, 'Katchi Abadi, Al-Fatah Road, Nowshera Virkan', 'active', 'Scholarship granted'),
(5, 'CCN-2024-005', 'PB-RIT-2405', 'Bilal Hassan', 'Hassan Raza', '0345-1122334', '0300-3344556', '34101-9988776-5', 'Radiography & Imaging Technology (RIT)', '2024-2026', '2024-09-10', 145000.00, 0.00, 145000.00, 'Main Bazaar, Qila Didar Singh Road, Nowshera Virkan', 'active', 'Regular admission');

INSERT INTO `fee_transactions` (`id`, `receipt_no`, `student_id`, `amount`, `date`, `payment_method`, `reference_no`, `remarks`, `received_by`, `previous_balance`, `remaining_balance`) VALUES
(1, 'RCP-24-001', 1, 40000.00, '2024-08-15', 'Cash', NULL, 'Admission & 1st Installment Fee', 'Accounts Office', 150000.00, 110000.00),
(2, 'RCP-24-042', 1, 30000.00, '2024-11-10', 'JazzCash', 'JC-8829103', '2nd Semester / Quarterly Installment', 'Accounts Office', 110000.00, 80000.00),
(3, 'RCP-24-003', 2, 50000.00, '2024-08-18', 'Bank Transfer', 'HBL-981204', 'Initial Admission Deposit', 'Accounts Office', 135000.00, 85000.00),
(4, 'RCP-24-055', 2, 35000.00, '2024-12-05', 'Cash', NULL, 'Term 2 Fee Deposit', 'Accounts Office', 85000.00, 50000.00),
(5, 'RCP-24-012', 3, 40000.00, '2024-09-01', 'Cash', NULL, '50% Initial Payment at Admission', 'Accounts Office', 80000.00, 40000.00),
(6, 'RCP-24-018', 4, 70000.00, '2024-09-05', 'EasyPaisa', 'EP-4411902', 'Semester 1 Tuition & Lab Charges', 'Accounts Office', 135000.00, 65000.00);
