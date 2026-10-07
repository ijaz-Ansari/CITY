<?php
require_once __DIR__ . '/config.php';

if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

$error = '';
$success = '';

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $name = trim($_POST['name'] ?? '');
    $email = trim($_POST['email'] ?? '');
    $role = trim($_POST['role'] ?? 'staff');
    $password = trim($_POST['password'] ?? '');
    $confirm_password = trim($_POST['confirm_password'] ?? '');

    if (empty($name) || empty($email) || empty($password)) {
        $error = "Please fill in all required fields.";
    } elseif ($password !== $confirm_password) {
        $error = "Passwords do not match.";
    } elseif (strlen($password) < 6) {
        $error = "Password must be at least 6 characters long.";
    } elseif (!in_array($role, ['admin', 'staff'])) {
        $error = "Invalid role selected.";
    } elseif (isset($pdo)) {
        // Check if email already exists
        $stmt_check = $pdo->prepare("SELECT id FROM users WHERE email = ? LIMIT 1");
        $stmt_check->execute([$email]);
        if ($stmt_check->fetch()) {
            $error = "An account with this email address already exists. Please sign in.";
        } else {
            // Insert user
            $hashed = password_hash($password, PASSWORD_DEFAULT);
            $stmt_ins = $pdo->prepare("INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)");
            $stmt_ins->execute([$name, $email, $password, $role]);

            $new_id = (int)$pdo->lastInsertId();
            $_SESSION['user'] = [
                'id' => $new_id,
                'name' => $name,
                'email' => $email,
                'role' => $role
            ];

            if ($role === 'admin') {
                safeRedirect("index.php");
            } else {
                safeRedirect("collect_fee.php");
            }
        }
    } else {
        $error = "Database connection error.";
    }
}
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Create Account (Sign Up) - <?= INSTITUTE_NAME ?></title>
    <!-- Online CSS Library: Tailwind CSS CDN -->
    <script src="https://cdn.tailwindcss.com"></script>
    <style>
        input[type="text"], input[type="email"], input[type="password"], select {
            border: 1.5px solid #cbd5e1 !important;
            background-color: #ffffff !important;
            color: #0f172a !important;
            padding: 0.5rem 0.75rem !important;
            border-radius: 0.5rem !important;
        }
    </style>
</head>
<body class="bg-slate-900 min-h-screen flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">

    <div class="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <!-- Circular Logo (Bounded size) -->
        <div class="logo-emblem-lg mx-auto mb-2" style="width: 80px; height: 80px; min-width: 80px; min-height: 80px; max-width: 80px; max-height: 80px; border-radius: 9999px; overflow: hidden; padding: 3px; background-color: rgba(255, 255, 255, 0.05); border: 2px solid rgba(255, 255, 255, 0.2);">
            <img src="assets/images/logo.png" alt="Logo" width="80" height="80" style="width: 100%; height: 100%; max-width: 80px; max-height: 80px; object-fit: contain; border-radius: 9999px; display: block;" onerror="this.src='logo.png'; this.onerror=function(){this.src='logo.jpg';}" />
        </div>
        <h2 class="mt-4 text-2xl font-extrabold text-white">
            Register New Staff / Admin
        </h2>
        <p class="text-xs text-slate-300 font-semibold uppercase tracking-wider mt-1">
            <?= INSTITUTE_NAME ?> · Role Access Portal
        </p>
    </div>

    <div class="mt-6 sm:mx-auto sm:w-full sm:max-w-md">
        <div class="bg-white py-8 px-6 shadow-2xl rounded-2xl sm:px-10 border border-slate-100">
            <?php if (!empty($error)): ?>
                <div class="mb-4 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-lg p-3">
                    <?= htmlspecialchars($error) ?>
                </div>
            <?php endif; ?>

            <form method="POST" action="signup.php" class="space-y-4">
                <div>
                    <label class="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                        Full Name
                    </label>
                    <input type="text" name="name" required placeholder="e.g. Tariq Mehmood" class="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs sm:text-sm focus:ring-2 focus:ring-red-600 focus:outline-none" />
                </div>

                <div>
                    <label class="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                        Email Address
                    </label>
                    <input type="email" name="email" required placeholder="user@citycon.edu.pk" class="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs sm:text-sm focus:ring-2 focus:ring-red-600 focus:outline-none" />
                </div>

                <div>
                    <label class="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                        Select Assigned Role
                    </label>
                    <div class="grid grid-cols-2 gap-2 mt-1">
                        <label class="border border-slate-300 rounded-lg p-2.5 cursor-pointer hover:bg-slate-50 flex flex-col justify-between">
                            <div class="flex items-center justify-between">
                                <span class="font-bold text-xs text-slate-900">Admin</span>
                                <input type="radio" name="role" value="admin" class="text-red-600" />
                            </div>
                            <span class="text-[10px] text-slate-500 mt-1">Full access (Dashboard, Reports, Ledgers, Backup)</span>
                        </label>

                        <label class="border border-slate-300 rounded-lg p-2.5 cursor-pointer hover:bg-slate-50 flex flex-col justify-between">
                            <div class="flex items-center justify-between">
                                <span class="font-bold text-xs text-slate-900">Staff</span>
                                <input type="radio" name="role" value="staff" checked class="text-red-600" />
                            </div>
                            <span class="text-[10px] text-slate-500 mt-1">Restricted to Deposit Fee & Add Student Only</span>
                        </label>
                    </div>
                </div>

                <div>
                    <label class="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                        Password (min 6 chars)
                    </label>
                    <input type="password" name="password" required placeholder="••••••••" class="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs sm:text-sm focus:ring-2 focus:ring-red-600 focus:outline-none" />
                </div>

                <div>
                    <label class="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                        Confirm Password
                    </label>
                    <input type="password" name="confirm_password" required placeholder="••••••••" class="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs sm:text-sm focus:ring-2 focus:ring-red-600 focus:outline-none" />
                </div>

                <button type="submit" class="w-full py-2.5 px-4 bg-red-700 hover:bg-red-800 active:bg-red-900 text-white font-bold rounded-lg text-sm shadow-md transition-colors cursor-pointer mt-2">
                    Create Account & Login →
                </button>
            </form>

            <div class="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                <span>Already have an account?</span>
                <a href="login.php" class="text-red-700 hover:text-red-800 font-bold">Sign In here →</a>
            </div>
        </div>
    </div>
</body>
</html>
