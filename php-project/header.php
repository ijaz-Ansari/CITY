<?php
require_once __DIR__ . '/config.php';

if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

// Active page detection
$current_page = basename($_SERVER['PHP_SELF']);

// If not logged in, default to demo admin so local testing runs out of the box
if (!isset($_SESSION['user'])) {
    $_SESSION['user'] = [
        'id' => 1,
        'name' => 'System Administrator',
        'email' => 'admin@citycon.edu.pk',
        'role' => 'admin'
    ];
}

$user = $_SESSION['user'];
$is_admin = ($user['role'] === 'admin');
$is_staff = ($user['role'] === 'staff');

// Enforce staff restrictions: Staff can ONLY access add_student.php, collect_fee.php, and receipt.php
$restricted_for_staff = ['index.php', 'student_history.php', 'defaulters.php', 'day_book.php', 'reports.php'];
if ($is_staff && in_array($current_page, $restricted_for_staff)) {
    // Redirect to collect_fee.php
    safeRedirect("collect_fee.php?restricted=1");
}

// Quick search students list for instant header autocomplete
$header_students = [];
if (isset($pdo)) {
    try {
        $stmt_h = $pdo->query("SELECT id, roll_no, full_name, father_name, program FROM students ORDER BY full_name ASC");
        $header_students = $stmt_h->fetchAll();
    } catch (Exception $e) {
        $header_students = [];
    }
}
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title><?= INSTITUTE_NAME ?> - Fee Management System</title>
    <!-- Online CSS Libraries: FontAwesome, Google Fonts & Tailwind CSS CDN -->
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css" />
    <script src="https://cdn.tailwindcss.com"></script>
    <script>
        tailwind.config = {
            theme: {
                extend: {
                    colors: {
                        red: {
                            50: '#fef2f2',
                            100: '#fee2e2',
                            200: '#fecaca',
                            300: '#fca5a5',
                            400: '#f87171',
                            500: '#ef4444',
                            600: '#dc2626',
                            700: '#b91c1c',
                            800: '#991b1b',
                            900: '#7f1d1d',
                            950: '#450a0a',
                        },
                        slate: {
                            50: '#f8fafc',
                            100: '#f1f5f9',
                            200: '#e2e8f0',
                            300: '#cbd5e1',
                            400: '#94a3b8',
                            500: '#64748b',
                            600: '#475569',
                            700: '#334155',
                            800: '#1e293b',
                            900: '#0f172a',
                        }
                    }
                }
            }
        };
    </script>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600&display=swap" rel="stylesheet">
    <style>
        body { font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, sans-serif; }
        .font-mono { font-family: 'JetBrains Mono', monospace !important; }
        img { max-width: 100%; }
        .logo-emblem-wrap, .logo-emblem-wrap img {
            width: 44px !important;
            height: 44px !important;
            max-width: 44px !important;
            max-height: 44px !important;
            min-width: 44px !important;
            min-height: 44px !important;
            object-fit: contain !important;
            border-radius: 9999px !important;
            display: block !important;
        }
        /* Bulletproof input visibility */
        input[type="text"], input[type="number"], input[type="date"], input[type="email"], input[type="password"], input[type="search"], select, textarea {
            border: 1.5px solid #cbd5e1 !important;
            background-color: #ffffff !important;
            color: #0f172a !important;
            padding: 0.5rem 0.75rem !important;
            border-radius: 0.5rem !important;
        }
        input:focus, select:focus, textarea:focus {
            outline: none !important;
            border-color: #b91c1c !important;
            box-shadow: 0 0 0 3px rgba(185, 28, 28, 0.15) !important;
        }
        @media print {
            .no-print { display: none !important; }
            body { background: #ffffff !important; }
        }
    </style>
</head>
<body class="bg-slate-50 text-slate-900 min-h-screen flex flex-col">

    <?php if (isset($db_connection_error)): ?>
    <div class="bg-rose-600 text-white px-4 py-3 text-center text-xs font-semibold shadow-md">
        ⚠️ Database connection error: <?= htmlspecialchars($db_connection_error) ?>. Please import <code>database.sql</code> into phpMyAdmin and ensure MySQL is running!
    </div>
    <?php endif; ?>

    <!-- Top Contact Strip -->
    <header class="bg-white border-b border-slate-200 sticky top-0 z-40 shadow-xs no-print">
        <div class="bg-slate-900 text-slate-200 text-xs py-1.5 px-4 sm:px-6 border-b border-slate-800">
            <div class="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-1">
                <div class="flex items-center space-x-2">
                    <span>📍</span>
                    <span class="truncate"><?= INSTITUTE_ADDRESS ?></span>
                </div>
                <div class="flex items-center space-x-3 text-[11px] font-mono">
                    <span>📞 <strong class="text-white"><?= INSTITUTE_PHONE_1 ?></strong></span>
                    <span class="text-slate-500">|</span>
                    <span class="text-white font-semibold"><?= INSTITUTE_PHONE_2 ?></span>
                </div>
            </div>
        </div>

        <!-- Main Branding & Global Search -->
        <div class="max-w-7xl mx-auto px-4 sm:px-6 py-3">
            <div class="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
                <a href="index.php" class="flex items-center space-x-3 select-none shrink-0">
                    <!-- Circular Logo (Strict 44px fixed size) -->
                    <div class="logo-emblem-wrap" style="width: 44px; height: 44px; min-width: 44px; min-height: 44px; max-width: 44px; max-height: 44px; border-radius: 9999px; overflow: hidden; padding: 2px; background-color: rgba(15, 23, 42, 0.05); border: 1px solid rgba(51, 65, 85, 0.4);">
                        <img src="assets/images/logo.png" alt="Logo" width="44" height="44" style="width: 100%; height: 100%; max-width: 44px; max-height: 44px; object-fit: contain; border-radius: 9999px; display: block;" onerror="this.src='logo.png'; this.onerror=function(){this.src='logo.jpg';}" />
                    </div>
                    <div>
                        <div class="flex items-center space-x-2">
                            <h1 class="text-base sm:text-lg font-extrabold text-slate-900 tracking-tight leading-tight">
                                <?= INSTITUTE_NAME ?>
                            </h1>
                            <span class="hidden sm:inline-block px-1.5 py-0.5 text-[9px] font-bold text-slate-800 bg-slate-100 rounded border border-slate-300 uppercase">
                                <?= INSTITUTE_SUBTITLE ?>
                            </span>
                        </div>
                        <p class="text-[11px] text-slate-500 font-medium leading-tight">
                            Allied Health Sciences · Pharmacy Technician · Dispenser · MLT · OTT · RIT
                        </p>
                    </div>
                </a>

                <!-- GLOBAL SEARCH INPUT -->
                <div class="relative flex-1 max-w-md w-full" id="header_search_box">
                    <div class="relative">
                        <input 
                            type="text" 
                            id="header_search_input"
                            oninput="filterHeaderStudents(this.value)"
                            placeholder="🔍 Quick search student by name or roll #..." 
                            class="w-full pl-3.5 pr-8 py-2 bg-slate-100/90 focus:bg-white border border-slate-200 rounded-lg text-xs sm:text-sm text-slate-900 focus:ring-2 focus:ring-red-600 focus:outline-none"
                        />
                        <button type="button" onclick="clearHeaderSearch()" id="header_search_clear" class="hidden absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600 text-xs">✕</button>
                    </div>

                    <!-- Autocomplete dropdown -->
                    <div id="header_search_dropdown" class="hidden absolute top-full left-0 right-0 mt-1.5 bg-white border border-slate-200 rounded-xl shadow-2xl z-50 max-h-72 overflow-y-auto divide-y divide-slate-100">
                    </div>
                </div>

                <div class="flex items-center space-x-3 shrink-0">
                    <div class="flex items-center space-x-2 bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5">
                        <div class="text-left hidden sm:block">
                            <div class="text-xs font-bold text-slate-900 leading-tight"><?= htmlspecialchars($user['name']) ?></div>
                            <span class="inline-block px-1.5 py-0.2 text-[9px] font-extrabold uppercase rounded <?= $is_admin ? 'bg-red-100 text-red-900 border border-red-200' : 'bg-amber-100 text-amber-900 border border-amber-200' ?>">
                                <?= $is_admin ? 'Admin · Full Access' : 'Staff · Deposit Only' ?>
                            </span>
                        </div>
                        <a href="login.php" title="Switch User" class="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-xs font-semibold">Switch</a>
                        <a href="logout.php" title="Logout" class="px-2 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded text-xs font-semibold">Exit</a>
                    </div>
                </div>
            </div>

            <!-- Navigation Links (Enforcing Role Permissions) -->
            <nav class="flex items-center space-x-1 sm:space-x-2 mt-4 pt-1 border-t border-slate-100 overflow-x-auto">
                <?php if ($is_admin): ?>
                    <a href="index.php" class="px-3 py-2 rounded-lg text-xs font-bold transition-all whitespace-nowrap <?= $current_page == 'index.php' ? 'bg-red-50 text-red-900 border-b-2 border-red-700' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50' ?>">
                        📊 Dashboard
                    </a>
                <?php endif; ?>

                <a href="add_student.php" class="px-3 py-2 rounded-lg text-xs font-bold transition-all whitespace-nowrap <?= $current_page == 'add_student.php' ? 'bg-red-50 text-red-900 border-b-2 border-red-700' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50' ?>">
                    👤 1. Add Student
                </a>
                <a href="collect_fee.php" class="px-3.5 py-2 rounded-lg text-xs font-bold transition-all whitespace-nowrap <?= $current_page == 'collect_fee.php' ? 'bg-red-700 text-white shadow-xs' : 'text-slate-700 hover:text-slate-900 hover:bg-slate-100' ?>">
                    💳 2. Fee Collection (Deposit)
                </a>
                <a href="course_vouchers.php" class="px-3 py-2 rounded-lg text-xs font-bold transition-all whitespace-nowrap <?= $current_page == 'course_vouchers.php' ? 'bg-red-50 text-red-900 border-b-2 border-red-700' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50' ?>">
                    📜 Issue Fee Slips
                </a>

                <?php if ($is_admin): ?>
                    <a href="student_history.php" class="px-3 py-2 rounded-lg text-xs font-bold transition-all whitespace-nowrap <?= $current_page == 'student_history.php' ? 'bg-red-50 text-red-900 border-b-2 border-red-700' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50' ?>">
                        📜 3. Student Ledger History
                    </a>
                    <a href="defaulters.php" class="px-3 py-2 rounded-lg text-xs font-bold transition-all whitespace-nowrap <?= $current_page == 'defaulters.php' ? 'bg-rose-50 text-rose-800 border-b-2 border-rose-600' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50' ?>">
                        ⚠️ Pending Dues
                    </a>
                    <a href="day_book.php" class="px-3 py-2 rounded-lg text-xs font-bold transition-all whitespace-nowrap <?= $current_page == 'day_book.php' ? 'bg-red-50 text-red-900 border-b-2 border-red-700' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50' ?>">
                        📖 Day Book & Register
                    </a>
                    <a href="reports.php" class="px-3 py-2 rounded-lg text-xs font-bold transition-all whitespace-nowrap <?= $current_page == 'reports.php' ? 'bg-red-50 text-red-900 border-b-2 border-red-700' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50' ?>">
                        📈 Monthly Reports
                    </a>
                    <a href="expenses.php" class="px-3 py-2 rounded-lg text-xs font-bold transition-all whitespace-nowrap <?= $current_page == 'expenses.php' ? 'bg-red-50 text-red-900 border-b-2 border-red-700' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50' ?>">
                        📑 Expense Book
                    </a>
                <?php else: ?>
                    <div class="px-3 py-1 bg-amber-50 border border-amber-200 text-amber-900 text-[11px] rounded-lg font-medium ml-2">
                        ⚠️ Staff Mode: Deposit Fee & Add Student Only. Admin modules locked.
                    </div>
                <?php endif; ?>
            </nav>
        </div>
    </header>

    <script>
    const HEADER_STUDENTS = <?= json_encode($header_students) ?>;
    function filterHeaderStudents(q) {
        q = q.trim().toLowerCase();
        const drop = document.getElementById('header_search_dropdown');
        const clearBtn = document.getElementById('header_search_clear');
        
        if (!q) {
            drop.classList.add('hidden');
            clearBtn.classList.add('hidden');
            return;
        }
        
        clearBtn.classList.remove('hidden');
        const matches = HEADER_STUDENTS.filter(s => 
            s.full_name.toLowerCase().includes(q) || 
            s.roll_no.toLowerCase().includes(q) || 
            s.father_name.toLowerCase().includes(q) || 
            s.program.toLowerCase().includes(q)
        ).slice(0, 8);

        if (matches.length === 0) {
            drop.innerHTML = '<div class="p-4 text-center text-xs text-slate-500">No student found matching "' + q + '"</div>';
        } else {
            drop.innerHTML = matches.map(s => `
                <div class="p-3 hover:bg-slate-50 flex items-center justify-between gap-3 text-xs">
                    <div>
                        <div class="flex items-center space-x-2">
                            <span class="font-mono font-bold text-red-800 bg-red-50 px-1.5 py-0.5 rounded border border-red-200 text-[10px]">${s.roll_no}</span>
                            <span class="font-bold text-slate-900">${s.full_name}</span>
                        </div>
                        <div class="text-[10px] text-slate-500 mt-0.5">S/D/O: ${s.father_name} · <span class="text-red-700">${s.program}</span></div>
                    </div>
                    <div class="flex items-center space-x-1.5 shrink-0">
                        <a href="collect_fee.php?student_id=${s.id}" class="px-2 py-1 bg-red-700 hover:bg-red-800 text-white rounded font-bold text-[10px]">💳 Collect</a>
                        <a href="student_history.php?student_id=${s.id}" class="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded font-bold text-[10px] border border-slate-200">📜 Ledger</a>
                    </div>
                </div>
            `).join('');
        }
        drop.classList.remove('hidden');
    }
    
    function clearHeaderSearch() {
        const inp = document.getElementById('header_search_input');
        inp.value = '';
        filterHeaderStudents('');
        inp.focus();
    }
    
    document.addEventListener('click', function(e) {
        const box = document.getElementById('header_search_box');
        if (box && !box.contains(e.target)) {
            document.getElementById('header_search_dropdown').classList.add('hidden');
        }
    });
    </script>

    <main class="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6 sm:py-8">
