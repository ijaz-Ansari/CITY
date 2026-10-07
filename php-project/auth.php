<?php
require_once __DIR__ . '/config.php';

if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

function isLoggedIn() {
    return isset($_SESSION['user']) && !empty($_SESSION['user']['id']);
}

function getCurrentUser() {
    return $_SESSION['user'] ?? null;
}

function isAdmin() {
    return isset($_SESSION['user']) && $_SESSION['user']['role'] === 'admin';
}

function isStaff() {
    return isset($_SESSION['user']) && $_SESSION['user']['role'] === 'staff';
}

function requireLogin() {
    if (!isLoggedIn()) {
        header("Location: login.php");
        exit;
    }
}

function requireAdmin() {
    requireLogin();
    if (!isAdmin()) {
        // Staff has access ONLY to deposit fee (collect_fee.php) and add new student (add_student.php)
        ?>
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Access Restricted - <?= INSTITUTE_NAME ?></title>
            <!-- Online CSS Library: Tailwind CSS CDN -->
            <script src="https://cdn.tailwindcss.com"></script>
        </head>
        <body class="bg-slate-100 min-h-screen flex items-center justify-center p-4">
            <div class="max-w-md w-full bg-white rounded-2xl p-8 border border-slate-200 shadow-xl text-center space-y-5">
                <div class="w-16 h-16 bg-amber-50 border border-amber-200 text-amber-700 rounded-2xl flex items-center justify-center mx-auto text-2xl font-bold">
                    ⚠️
                </div>
                <div>
                    <span class="px-2.5 py-0.5 bg-amber-100 text-amber-900 font-extrabold rounded-full text-xs uppercase tracking-wider">
                        Staff Restriction
                    </span>
                    <h2 class="text-xl font-extrabold text-slate-900 mt-2">
                        Administrator Access Only
                    </h2>
                    <p class="text-xs text-slate-500 mt-1">
                        Your account has the <strong>Staff Role</strong>. You only have permission to collect/deposit fees and register new students.
                    </p>
                </div>
                <div class="flex flex-col gap-2 pt-2">
                    <a href="collect_fee.php" class="w-full py-2.5 px-4 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-lg text-xs">
                        💳 Go to Fee Collection Desk
                    </a>
                    <a href="add_student.php" class="w-full py-2.5 px-4 bg-slate-800 hover:bg-slate-900 text-white font-semibold rounded-lg text-xs">
                        ➕ Add New Student
                    </a>
                    <a href="logout.php" class="text-xs text-slate-500 hover:text-rose-700 font-semibold mt-2">
                        Log out or switch to Admin account →
                    </a>
                </div>
            </div>
        </body>
        </html>
        <?php
        exit;
    }
}
