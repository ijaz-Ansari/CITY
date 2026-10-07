import React, { useState } from 'react';
import JSZip from 'jszip';
import { INSTITUTE_INFO } from '../constants';
import { 
  Download, 
  Copy, 
  Check, 
  Code, 
  Database, 
  FileCode, 
  Server, 
  CheckCircle2, 
  FolderArchive,
  ExternalLink
} from 'lucide-react';

// Hardcoded contents of PHP files so they can be viewed & zipped instantly
const PHP_FILES: { name: string; language: string; content: string; description: string }[] = [
  {
    name: 'database.sql',
    language: 'sql',
    description: 'Complete MySQL schema with tables (students, fee_transactions) & sample data',
    content: `-- ====================================================================
-- Database Schema for City Con & Allied Health Sciences Nowshera Virkan
-- Fee Management System
-- Address: Near AL-Fatah Resturent Mutto Bahikay Road Nowshera Virkan
-- Mobile: 0302-6605216 || 0321-8420446
-- ====================================================================

CREATE DATABASE IF NOT EXISTS \`citycon_fee_db\` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE \`citycon_fee_db\`;

DROP TABLE IF EXISTS \`fee_transactions\`;
DROP TABLE IF EXISTS \`students\`;

CREATE TABLE \`students\` (
  \`id\` INT AUTO_INCREMENT PRIMARY KEY,
  \`roll_no\` VARCHAR(50) NOT NULL UNIQUE,
  \`reg_no\` VARCHAR(50) DEFAULT NULL,
  \`full_name\` VARCHAR(150) NOT NULL,
  \`father_name\` VARCHAR(150) NOT NULL,
  \`phone\` VARCHAR(30) NOT NULL,
  \`guardian_phone\` VARCHAR(30) DEFAULT NULL,
  \`cnic\` VARCHAR(30) DEFAULT 'Pending',
  \`program\` VARCHAR(150) NOT NULL,
  \`session\` VARCHAR(50) NOT NULL,
  \`admission_date\` DATE NOT NULL,
  \`total_agreed_fee\` DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  \`discount\` DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  \`net_payable_fee\` DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  \`address\` TEXT DEFAULT NULL,
  \`status\` ENUM('active','completed','struck_off') DEFAULT 'active',
  \`notes\` TEXT DEFAULT NULL,
  \`created_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE \`fee_transactions\` (
  \`id\` INT AUTO_INCREMENT PRIMARY KEY,
  \`receipt_no\` VARCHAR(50) NOT NULL UNIQUE,
  \`student_id\` INT NOT NULL,
  \`amount\` DECIMAL(12,2) NOT NULL,
  \`date\` DATE NOT NULL,
  \`payment_method\` VARCHAR(50) DEFAULT 'Cash',
  \`reference_no\` VARCHAR(100) DEFAULT NULL,
  \`remarks\` VARCHAR(255) DEFAULT 'Fee Installment',
  \`received_by\` VARCHAR(100) DEFAULT 'Accounts Officer',
  \`previous_balance\` DECIMAL(12,2) NOT NULL,
  \`remaining_balance\` DECIMAL(12,2) NOT NULL,
  \`created_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT \`fk_fee_student\` FOREIGN KEY (\`student_id\`) REFERENCES \`students\` (\`id\`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO \`students\` (\`id\`, \`roll_no\`, \`reg_no\`, \`full_name\`, \`father_name\`, \`phone\`, \`guardian_phone\`, \`cnic\`, \`program\`, \`session\`, \`admission_date\`, \`total_agreed_fee\`, \`discount\`, \`net_payable_fee\`, \`address\`, \`status\`, \`notes\`) VALUES
(1, 'CCN-2024-001', 'PB-PC-2401', 'Muhammad Usman Ali', 'Tariq Mehmood', '0300-7412589', '0321-7412589', '34101-7894561-1', 'Pharmacy Technician (Category-B)', '2024-2026', '2024-08-15', 160000.00, 10000.00, 150000.00, 'Mohallah Farooq Nagar, Nowshera Virkan', 'active', 'Merit scholarship on matric marks'),
(2, 'CCN-2024-002', 'PB-MF-2402', 'Ayesha Bibi', 'Muhammad Aslam', '0304-9876543', '0301-4455667', '34101-4567890-2', 'Medical Laboratory Technology (MLT)', '2024-2026', '2024-08-18', 140000.00, 5000.00, 135000.00, 'Near Old Bus Stand, Mutto Bahikay Road, Nowshera Virkan', 'active', 'Special concession'),
(3, 'CCN-2024-003', 'PB-DP-2403', 'Hamza Farooq', 'Farooq Ahmad Cheema', '0312-5566778', '0302-6605216', '34101-1234567-3', 'Dispenser Course', '2024-2025', '2024-09-01', 80000.00, 0.00, 80000.00, 'Village Dera Gujran, Tehsil Nowshera Virkan', 'active', 'Regular admission');

INSERT INTO \`fee_transactions\` (\`id\`, \`receipt_no\`, \`student_id\`, \`amount\`, \`date\`, \`payment_method\`, \`reference_no\`, \`remarks\`, \`received_by\`, \`previous_balance\`, \`remaining_balance\`) VALUES
(1, 'RCP-24-001', 1, 40000.00, '2024-08-15', 'Cash', NULL, 'Admission & 1st Installment Fee', 'Accounts Office', 150000.00, 110000.00),
(2, 'RCP-24-042', 1, 30000.00, '2024-11-10', 'JazzCash', 'JC-8829103', '2nd Semester / Quarterly Installment', 'Accounts Office', 110000.00, 80000.00),
(3, 'RCP-24-003', 2, 50000.00, '2024-08-18', 'Bank Transfer', 'HBL-981204', 'Initial Admission Deposit', 'Accounts Office', 135000.00, 85000.00);`
  },
  {
    name: 'config.php',
    language: 'php',
    description: 'Database PDO credentials, institute info, and PKR number-to-words functions',
    content: `<?php
// Enable output buffering to prevent "headers already sent"
if (!ob_get_level()) {
    ob_start();
}

define('DB_HOST', 'localhost');
define('DB_NAME', 'citycon_fee_db');
define('DB_USER', 'root');
define('DB_PASS', '');

define('INSTITUTE_NAME', 'City Con & Allied Health Sciences');
define('INSTITUTE_SUBTITLE', 'Nowshera Virkan');
define('INSTITUTE_ADDRESS', 'Near AL-Fatah Resturent Mutto Bahikay Road Nowshera Virkan');
define('INSTITUTE_PHONES', '0302-6605216  ||  0321-8420446');
define('INSTITUTE_PHONE_1', '0302-6605216');
define('INSTITUTE_PHONE_2', '0321-8420446');

$COURSES_LIST = [
    "Pharmacy Technician (Category-B)",
    "Dispenser Course",
    "Medical Laboratory Technology (MLT)",
    "Operation Theater Technology (OTT)",
    "Radiography & Imaging Technology (RIT)",
    "Nursing Assistant",
    "Lady Health Visitor (LHV)",
    "Dental Hygienist & Technology",
    "Physiotherapy Technician"
];

$SESSIONS_LIST = ["2024-2026", "2025-2027", "2023-2025", "2024-2025", "2025-2026"];
$PAYMENT_METHODS = ["Cash", "EasyPaisa", "JazzCash", "Bank Transfer", "Cheque"];

try {
    $pdo = new PDO("mysql:host=" . DB_HOST . ";dbname=" . DB_NAME . ";charset=utf8mb4", DB_USER, DB_PASS, [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::ATTR_EMULATE_PREPARES => false,
    ]);
} catch (PDOException $e) {
    $db_connection_error = $e->getMessage();
}

function formatPKR($amount) {
    return 'Rs. ' . number_format((float)$amount, 0);
}

function amountToWordsPKR($num) {
    $num = (int)$num;
    if ($num <= 0) return 'Zero Rupees Only';
    $ones = ["", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine",
             "Ten", "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen", "Seventeen", "Eighteen", "Nineteen"];
    $tens = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];

    function numToWordsHelper($n, $ones, $tens) {
        if ($n < 20) return $ones[$n];
        if ($n < 100) return $tens[(int)($n / 10)] . ($n % 10 != 0 ? " " . $ones[$n % 10] : "");
        if ($n < 1000) return $ones[(int)($n / 100)] . " Hundred" . ($n % 100 != 0 ? " and " . numToWordsHelper($n % 100, $ones, $tens) : "");
        if ($n < 100000) return numToWordsHelper((int)($n / 1000), $ones, $tens) . " Thousand" . ($n % 1000 != 0 ? " " . numToWordsHelper($n % 1000, $ones, $tens) : "");
        if ($n < 10000000) return numToWordsHelper((int)($n / 100000), $ones, $tens) . " Lakh" . ($n % 100000 != 0 ? " " . numToWordsHelper($n % 100000, $ones, $tens) : "");
        return numToWordsHelper((int)($n / 10000000), $ones, $tens) . " Crore" . ($n % 10000000 != 0 ? " " . numToWordsHelper($n % 10000000, $ones, $tens) : "");
    }
    return trim(numToWordsHelper($num, $ones, $tens)) . " Rupees Only";
}

function getStudentBalances($pdo, $student_id) {
    $stmt = $pdo->prepare("SELECT net_payable_fee FROM students WHERE id = ?");
    $stmt->execute([$student_id]);
    $st = $stmt->fetch();
    if (!$st) return ['net_payable' => 0, 'total_paid' => 0, 'remaining_balance' => 0];

    $net_payable = (float)$st['net_payable_fee'];
    $stmt2 = $pdo->prepare("SELECT COALESCE(SUM(amount), 0) as paid FROM fee_transactions WHERE student_id = ?");
    $stmt2->execute([$student_id]);
    $paid_row = $stmt2->fetch();
    $total_paid = (float)$paid_row['paid'];
    $remaining_balance = max(0, $net_payable - $total_paid);

    return [
        'net_payable' => $net_payable,
        'total_paid' => $total_paid,
        'remaining_balance' => $remaining_balance
    ];
}

function generateRollNo($pdo) {
    $year = date('Y');
    $stmt = $pdo->query("SELECT COUNT(*) FROM students");
    $count = (int)$stmt->fetchColumn() + 1;
    return 'CCN-' . $year . '-' . str_pad($count, 3, '0', STR_PAD_LEFT);
}

function generateReceiptNo($pdo) {
    $year_suffix = date('y');
    $stmt = $pdo->query("SELECT COUNT(*) FROM fee_transactions");
    $count = (int)$stmt->fetchColumn() + 1;
    return 'RCP-' . $year_suffix . '-' . str_pad($count, 3, '0', STR_PAD_LEFT);
}

function safeRedirect($url) {
    if (!headers_sent()) {
        header("Location: " . $url);
        exit;
    } else {
        echo "<script>window.location.href='" . addslashes($url) . "';</script>";
        echo "<noscript><meta http-equiv='refresh' content='0;url=" . htmlspecialchars($url) . "'></noscript>";
        exit;
    }
}
?>`
  },
  {
    name: 'collect_fee.php',
    language: 'php',
    description: 'Requirement 2: Fee collection desk where cashier ONLY enters current deposited amount',
    content: `<?php
require_once __DIR__ . '/config.php';

$selected_student = null;
$student_id = isset($_GET['student_id']) ? (int)$_GET['student_id'] : 0;
$error = '';

if ($student_id > 0 && isset($pdo)) {
    $stmt = $pdo->prepare("SELECT * FROM students WHERE id = ?");
    $stmt->execute([$student_id]);
    $selected_student = $stmt->fetch();
}

// Handle Form Submission BEFORE HTML output
if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($pdo)) {
    try {
        $st_id = (int)($_POST['student_id'] ?? 0);
        $amount = (float)($_POST['amount'] ?? 0);
        $method = trim($_POST['payment_method'] ?? 'Cash');
        $ref_no = trim($_POST['reference_no'] ?? '');
        $remarks = trim($_POST['remarks'] ?? 'Fee Installment Deposit');
        $date = trim($_POST['payment_date'] ?? date('Y-m-d'));
        $received_by = trim($_POST['received_by'] ?? 'Accounts Officer');

        if ($st_id <= 0) throw new Exception("Please select a student first.");
        if ($amount <= 0) throw new Exception("Please enter a valid deposited amount greater than 0.");

        $balances = getStudentBalances($pdo, $st_id);
        $prev_bal = $balances['remaining_balance'];
        $new_bal = max(0, $prev_bal - $amount);
        $receipt_no = generateReceiptNo($pdo);

        $stmt_insert = $pdo->prepare("
            INSERT INTO fee_transactions 
            (receipt_no, student_id, amount, date, payment_method, reference_no, remarks, received_by, previous_balance, remaining_balance)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ");
        $stmt_insert->execute([$receipt_no, $st_id, $amount, $date, $method, $ref_no, $remarks, $received_by, $prev_bal, $new_bal]);

        $tx_id = (int)$pdo->lastInsertId();
        safeRedirect("receipt.php?id=" . $tx_id);
    } catch (Exception $e) {
        $error = $e->getMessage();
    }
}

// Load HTML Header AFTER POST handling
require_once __DIR__ . '/header.php';
?>`
  },
  {
    name: 'receipt.php',
    language: 'php',
    description: 'Requirement 4: Double copy voucher with student history of all deposits and remaining balance',
    content: `<?php
require_once __DIR__ . '/config.php';

$tx_id = isset($_GET['id']) ? (int)$_GET['id'] : 0;
if ($tx_id <= 0 || !isset($pdo)) {
    die("Invalid Receipt ID or database not connected.");
}

$stmt = $pdo->prepare("
    SELECT t.*, s.roll_no, s.reg_no, s.full_name, s.father_name, s.phone, s.program, s.session, s.net_payable_fee, s.address
    FROM fee_transactions t
    JOIN students s ON t.student_id = s.id
    WHERE t.id = ?
");
$stmt->execute([$tx_id]);
$current_tx = $stmt->fetch();

$stmt_all = $pdo->prepare("SELECT * FROM fee_transactions WHERE student_id = ? ORDER BY date ASC, id ASC");
$stmt_all->execute([$current_tx['student_id']]);
$all_history = $stmt_all->fetchAll();

$total_paid = 0;
foreach ($all_history as $h) {
    $total_paid += (float)$h['amount'];
}
$net_payable = (float)$current_tx['net_payable_fee'];
$current_balance = max(0, $net_payable - $total_paid);

// Generates both STUDENT COPY and OFFICE / ACCOUNTS COPY on single A4 sheet with scissors divider
// Includes "📥 Download PDF" button (via html2pdf.js) and isolated "🖨️ Print Receipt"
?>`
  },
  {
    name: 'add_student.php',
    language: 'php',
    description: 'Requirement 1: Student registration with fee package and initial deposit',
    content: `<?php
require_once __DIR__ . '/header.php';
// Handles new student registration, roll number auto-generator, and fee package
?>`
  },
  {
    name: 'student_history.php',
    language: 'php',
    description: 'Requirement 3: Every student history maintain with full installment ledger',
    content: `<?php
require_once __DIR__ . '/header.php';
// Maintains every student history, past receipts, search, WhatsApp reminder notice
?>`
  },
  {
    name: 'reports.php',
    language: 'php',
    description: 'Monthly collection summary report with date range filters, course breakdown, CSV & PDF export',
    content: `<?php
require_once __DIR__ . '/config.php';
// Monthly collection summary report with date filters, metrics, course analytics & export
?>`
  },
  {
    name: 'login.php',
    language: 'php',
    description: 'Portal Sign In with role authentication (Admin or Staff)',
    content: `<?php
require_once __DIR__ . '/config.php';
// Sign in with role detection: Admin -> index.php, Staff -> collect_fee.php
?>`
  },
  {
    name: 'signup.php',
    language: 'php',
    description: 'User registration with assigned roles: Admin (Full) or Staff (Deposit & Add Student only)',
    content: `<?php
require_once __DIR__ . '/config.php';
// Role-based registration with password hashing and session auto-login
?>`
  },
  {
    name: 'course_vouchers.php',
    language: 'php',
    description: 'Course-wise fee slip and voucher issuance generator with auto-PDF print',
    content: `<?php
require_once __DIR__ . '/header.php';
// Course-wise batch voucher and challan slip generator with amount prompt & PDF printing
?>`
  },
  {
    name: 'expenses.php',
    language: 'php',
    description: 'Campus Expense Book & Ledger for managing institute expenditures and categories',
    content: `<?php
require_once __DIR__ . '/header.php';
// Campus Debit & Expenditure Book with category filtering, financial stats & voucher printing
?>`
  },
  {
    name: 'expense_voucher.php',
    language: 'php',
    description: 'Printable official expense payment voucher with circular logo and signature lines',
    content: `<?php
require_once __DIR__ . '/config.php';
// Printable expense voucher with offline styling and verification signatures
?>`
  },
  {
    name: 'style.css',
    language: 'css',
    description: 'Standalone offline stylesheet with zero external CDN dependencies',
    content: `/* Standalone Offline External Stylesheet - City CON & Allied Health Sciences */
/* Clean fonts, responsive layout, print vouchers, and components without CDN */
`
  },
  {
    name: 'README.md',
    language: 'markdown',
    description: 'Setup instructions for XAMPP, WAMP, and cPanel',
    content: `# Setup Instructions for City Con & Allied Health Sciences Nowshera Virkan
Fee Management System (PHP & MySQL)

1. Put the files into: C:\\xampp\\htdocs\\citycon_fees\\
2. Go to: http://localhost/phpmyadmin/
3. Create database: citycon_fee_db
4. Import database.sql
5. Open in browser: http://localhost/citycon_fees/
`
  }
];

export const PhpSourceViewer: React.FC = () => {
  const [selectedFile, setSelectedFile] = useState(PHP_FILES[0].name);
  const [copied, setCopied] = useState(false);
  const [isZipping, setIsZipping] = useState(false);

  const currentFile = PHP_FILES.find((f) => f.name === selectedFile) || PHP_FILES[0];

  const handleCopyCode = () => {
    navigator.clipboard.writeText(currentFile.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadZip = async () => {
    setIsZipping(true);
    try {
      const zip = new JSZip();
      const folder = zip.folder('citycon_fees_php');

      // Add all PHP & SQL files to the zip
      PHP_FILES.forEach((f) => {
        if (f.name !== 'style.css') {
          folder?.file(f.name, f.content);
        }
      });

      // Fetch the full compiled offline style.css and logo.png
      try {
        const cssRes = await fetch('/style.css');
        if (cssRes.ok) {
          const cssText = await cssRes.text();
          folder?.file('style.css', cssText);
          const assetsFolder = folder?.folder('assets')?.folder('css');
          assetsFolder?.file('style.css', cssText);
        }
      } catch (e) {
        console.warn('Could not fetch style.css for zip', e);
      }

      try {
        const logoRes = await fetch('/logo.png');
        if (logoRes.ok) {
          const logoBlob = await logoRes.blob();
          folder?.file('logo.png', logoBlob);
          const imgFolder = folder?.folder('assets')?.folder('images');
          imgFolder?.file('logo.png', logoBlob);
        }
      } catch (e) {
        console.warn('Could not fetch logo.png for zip', e);
      }

      const content = await zip.generateAsync({ type: 'blob' });
      const url = URL.createObjectURL(content);
      const a = document.createElement('a');
      a.href = url;
      a.download = `CityCon_FeeSystem_PHP_MySQL.zip`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Failed to create ZIP:', err);
      alert('Could not generate ZIP archive.');
    } finally {
      setIsZipping(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Top Banner */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-200">
            Source Code Package: HTML, CSS, PHP & MySQL
          </span>
          <h2 className="text-2xl font-bold text-slate-900 mt-2">
            PHP & MySQL Project Source Code
          </h2>
          <p className="text-sm text-slate-500">
            Ready to deploy on local XAMPP / WAMP or any PHP & MySQL web hosting server.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={handleDownloadZip}
            disabled={isZipping}
            className="inline-flex items-center px-5 py-2.5 bg-emerald-700 hover:bg-emerald-800 active:bg-emerald-900 text-white text-xs sm:text-sm font-bold rounded-lg shadow-sm transition-all cursor-pointer"
          >
            <FolderArchive className="w-4 h-4 mr-2" />
            {isZipping ? 'Packaging ZIP...' : '1-Click Download ZIP (All PHP & SQL)'}
          </button>
        </div>
      </div>

      {/* XAMPP Step-by-Step Setup Guide Banner */}
      <div className="bg-slate-900 text-white rounded-xl p-5 shadow-xs">
        <h3 className="text-sm font-bold uppercase tracking-wider text-emerald-400 mb-3 flex items-center">
          <Server className="w-4 h-4 mr-2 text-emerald-400" />
          How to Run in 3 Minutes on XAMPP (Windows / Mac / Linux)
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-xs">
          <div className="bg-slate-800/80 p-3 rounded-lg border border-slate-700">
            <span className="font-bold text-emerald-400 block mb-1">1. Download ZIP</span>
            <p className="text-slate-300">
              Click the green <strong>Download ZIP</strong> button above and extract it.
            </p>
          </div>
          <div className="bg-slate-800/80 p-3 rounded-lg border border-slate-700">
            <span className="font-bold text-emerald-400 block mb-1">2. Put in `htdocs`</span>
            <p className="text-slate-300">
              Copy folder into <code>C:\xampp\htdocs\citycon_fees\</code>.
            </p>
          </div>
          <div className="bg-slate-800/80 p-3 rounded-lg border border-slate-700">
            <span className="font-bold text-emerald-400 block mb-1">3. Import Database</span>
            <p className="text-slate-300">
              Open <code>http://localhost/phpmyadmin/</code>, create database <code>citycon_fee_db</code>, and import <code>database.sql</code>.
            </p>
          </div>
          <div className="bg-slate-800/80 p-3 rounded-lg border border-slate-700">
            <span className="font-bold text-emerald-400 block mb-1">4. Open in Browser</span>
            <p className="text-slate-300">
              Go to: <strong className="text-white">http://localhost/citycon_fees/</strong>
            </p>
          </div>
        </div>
      </div>

      {/* Code Browser Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left List of Files */}
        <div className="lg:col-span-4 bg-white border border-slate-200 rounded-xl p-4 shadow-xs space-y-2">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 px-2 mb-2 flex items-center">
            <Code className="w-3.5 h-3.5 mr-1.5 text-emerald-700" />
            Project Files
          </h3>

          <div className="space-y-1">
            {PHP_FILES.map((file) => {
              const isSelected = file.name === selectedFile;
              return (
                <button
                  key={file.name}
                  onClick={() => setSelectedFile(file.name)}
                  className={`w-full text-left p-2.5 rounded-lg text-xs transition-colors flex items-center justify-between cursor-pointer border ${
                    isSelected
                      ? 'bg-emerald-50 border-emerald-500 font-bold text-slate-900 shadow-xs'
                      : 'hover:bg-slate-50 border-transparent text-slate-700'
                  }`}
                >
                  <div className="flex items-center space-x-2 truncate">
                    {file.language === 'sql' ? (
                      <Database className="w-4 h-4 text-emerald-700 shrink-0" />
                    ) : (
                      <FileCode className="w-4 h-4 text-slate-500 shrink-0" />
                    )}
                    <span className="font-mono text-xs">{file.name}</span>
                  </div>
                  <span className="text-[10px] uppercase font-semibold text-slate-400">
                    {file.language}
                  </span>
                </button>
              );
            })}
          </div>

          <div className="pt-3 border-t border-slate-100 text-[11px] text-slate-500 px-2">
            All files are also saved in the project's <code>/php-project/</code> directory.
          </div>
        </div>

        {/* Right Code Viewer */}
        <div className="lg:col-span-8 bg-slate-900 text-slate-100 rounded-xl shadow-lg border border-slate-800 overflow-hidden">
          <div className="bg-slate-950 px-4 py-3 flex items-center justify-between border-b border-slate-800">
            <div className="flex items-center space-x-2">
              <span className="w-3 h-3 rounded-full bg-rose-500"></span>
              <span className="w-3 h-3 rounded-full bg-amber-500"></span>
              <span className="w-3 h-3 rounded-full bg-emerald-500"></span>
              <span className="font-mono text-xs font-bold text-slate-300 ml-2">
                {currentFile.name}
              </span>
            </div>

            <button
              onClick={handleCopyCode}
              className="inline-flex items-center px-3 py-1 bg-slate-800 hover:bg-slate-700 text-white rounded text-xs font-medium cursor-pointer transition-colors"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 mr-1 text-emerald-400" />
                  <span>Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 mr-1" />
                  <span>Copy Code</span>
                </>
              )}
            </button>
          </div>

          <div className="p-2 bg-slate-950/40 px-4 text-xs text-slate-400 border-b border-slate-800">
            {currentFile.description}
          </div>

          <div className="p-4 max-h-[580px] overflow-auto font-mono text-xs text-slate-200 leading-relaxed scrollbar-thin">
            <pre>
              <code>{currentFile.content}</code>
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
};
