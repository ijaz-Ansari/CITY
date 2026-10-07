<?php
/**
 * Database & Configuration File
 * City Con & Allied Health Sciences Nowshera Virkan
 * Address: Near AL-Fatah Resturent Mutto Bahikay Road Nowshera Virkan
 * Mobile: 0302-6605216 || 0321-8420446
 */

// Enable Output Buffering to prevent "headers already sent" warnings
if (!ob_get_level()) {
    ob_start();
}

// Database Credentials
define('DB_HOST', 'localhost');
define('DB_NAME', 'citycon_fee_db');
define('DB_USER', 'root');
define('DB_PASS', '');

// Institute Constants
define('INSTITUTE_NAME', 'City Con & Allied Health Sciences');
define('INSTITUTE_SUBTITLE', 'Nowshera Virkan');
define('INSTITUTE_ADDRESS', 'Near AL-Fatah Resturent Mutto Bahikay Road Nowshera Virkan');
define('INSTITUTE_PHONES', '0302-6605216  ||  0321-8420446');
define('INSTITUTE_PHONE_1', '0302-6605216');
define('INSTITUTE_PHONE_2', '0321-8420446');

// Standard Allied Health Courses
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

$SESSIONS_LIST = [
    "2024-2026",
    "2025-2027",
    "2023-2025",
    "2024-2025",
    "2025-2026",
    "2026-2028"
];

$PAYMENT_METHODS = [
    "Cash",
    "EasyPaisa",
    "JazzCash",
    "Bank Transfer",
    "Cheque"
];

// Establish PDO Connection
try {
    $pdo = new PDO("mysql:host=" . DB_HOST . ";dbname=" . DB_NAME . ";charset=utf8mb4", DB_USER, DB_PASS, [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::ATTR_EMULATE_PREPARES => false,
    ]);
} catch (PDOException $e) {
    // If running without database installed yet, show friendly setup instructions
    $db_connection_error = $e->getMessage();
}

/**
 * Format Currency in Pakistani Rupees (PKR)
 */
if (!function_exists('formatPKR')) {
    function formatPKR($amount) {
        return 'Rs. ' . number_format((float)$amount, 0);
    }
}

/**
 * Top-level helper function for number to words conversion (protected by function_exists)
 */
if (!function_exists('numToWordsPKRHelper')) {
    function numToWordsPKRHelper($n, $ones, $tens) {
        if ($n < 20) return $ones[$n];
        if ($n < 100) return $tens[(int)($n / 10)] . ($n % 10 != 0 ? " " . $ones[$n % 10] : "");
        if ($n < 1000) return $ones[(int)($n / 100)] . " Hundred" . ($n % 100 != 0 ? " and " . numToWordsPKRHelper($n % 100, $ones, $tens) : "");
        if ($n < 100000) return numToWordsPKRHelper((int)($n / 1000), $ones, $tens) . " Thousand" . ($n % 1000 != 0 ? " " . numToWordsPKRHelper($n % 1000, $ones, $tens) : "");
        if ($n < 10000000) return numToWordsPKRHelper((int)($n / 100000), $ones, $tens) . " Lakh" . ($n % 100000 != 0 ? " " . numToWordsPKRHelper($n % 100000, $ones, $tens) : "");
        return numToWordsPKRHelper((int)($n / 10000000), $ones, $tens) . " Crore" . ($n % 10000000 != 0 ? " " . numToWordsPKRHelper($n % 10000000, $ones, $tens) : "");
    }
}

if (!function_exists('numToWordsHelper')) {
    function numToWordsHelper($n, $ones, $tens) {
        return numToWordsPKRHelper($n, $ones, $tens);
    }
}

/**
 * Convert numerical amount into words (Urdu/English PKR) - safe against multiple calls
 */
if (!function_exists('amountToWordsPKR')) {
    function amountToWordsPKR($num) {
        $num = (int)$num;
        if ($num <= 0) return 'Zero Rupees Only';

        $ones = [
            "", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine",
            "Ten", "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen",
            "Seventeen", "Eighteen", "Nineteen"
        ];
        $tens = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];

        return trim(numToWordsPKRHelper($num, $ones, $tens)) . " Rupees Only";
    }
}

/**
 * Fetch Student Balance (Agreed, Paid, Remaining)
 */
if (!function_exists('getStudentBalances')) {
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
}

/**
 * Generate Next Roll Number
 */
if (!function_exists('generateRollNo')) {
    function generateRollNo($pdo) {
        $year = date('Y');
        $stmt = $pdo->query("SELECT COUNT(*) FROM students");
        $count = (int)$stmt->fetchColumn() + 1;
        return 'CCN-' . $year . '-' . str_pad($count, 3, '0', STR_PAD_LEFT);
    }
}

/**
 * Generate Next Receipt Number
 */
if (!function_exists('generateReceiptNo')) {
    function generateReceiptNo($pdo) {
        $year_suffix = date('y');
        $stmt = $pdo->query("SELECT COUNT(*) FROM fee_transactions");
        $count = (int)$stmt->fetchColumn() + 1;
        return 'RCP-' . $year_suffix . '-' . str_pad($count, 3, '0', STR_PAD_LEFT);
    }
}

/**
 * Safe HTTP Redirect (Works even if headers or whitespace were partially sent)
 */
if (!function_exists('safeRedirect')) {
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
}
?>
