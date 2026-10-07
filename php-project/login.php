<?php
require_once __DIR__ . '/config.php';

if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

// If already logged in, redirect based on role
if (isset($_SESSION['user'])) {
    if ($_SESSION['user']['role'] === 'admin') {
        safeRedirect("index.php");
    } else {
        safeRedirect("collect_fee.php");
    }
}

$error = '';
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $email = trim($_POST['email'] ?? '');
    $password = trim($_POST['password'] ?? '');

    if (empty($email) || empty($password)) {
        $error = "Please enter both email and password.";
    } elseif (isset($pdo)) {
        $stmt = $pdo->prepare("SELECT * FROM users WHERE email = ? LIMIT 1");
        $stmt->execute([$email]);
        $user = $stmt->fetch();

        // Support plain text match or password_verify
        $valid = false;
        if ($user) {
            if ($user['password'] === $password || (password_needs_rehash($user['password'], PASSWORD_DEFAULT) === false && password_verify($password, $user['password']))) {
                $valid = true;
            }
        }

        if ($valid) {
            $_SESSION['user'] = [
                'id' => $user['id'],
                'name' => $user['name'],
                'email' => $user['email'],
                'role' => $user['role']
            ];

            if ($user['role'] === 'admin') {
                safeRedirect("index.php");
            } else {
                safeRedirect("collect_fee.php");
            }
        } else {
            $error = "Invalid credentials. Use Quick Demo Login or check your password.";
        }
    } else {
        $error = "Database not connected. Please check config.php!";
    }
}
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Sign In - <?= INSTITUTE_NAME ?></title>
    <!-- Online CSS Library: Tailwind CSS CDN -->
    <script src="https://cdn.tailwindcss.com"></script>
    <style>
        input[type="text"], input[type="email"], input[type="password"] {
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
            <?= INSTITUTE_NAME ?>
        </h2>
        <p class="text-xs text-slate-300 font-semibold uppercase tracking-wider mt-1">
            <?= INSTITUTE_SUBTITLE ?> · Fee Portal Sign In
        </p>
    </div>

    <div class="mt-6 sm:mx-auto sm:w-full sm:max-w-md">
        <div class="bg-white py-8 px-6 shadow-2xl rounded-2xl sm:px-10 border border-slate-100">
            <!-- Quick Demo 1-Click Role Login Box -->
            <div class="mb-6 bg-slate-50 border border-slate-200 rounded-xl p-3.5">
                <div class="flex items-center justify-between mb-2">
                    <span class="text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                        ⚡ Quick Demo 1-Click Login
                    </span>
                    <span class="text-[10px] text-slate-400">WAMP / Local</span>
                </div>
                <div class="grid grid-cols-2 gap-2">
                    <button type="button" onclick="fillDemo('admin@citycon.edu.pk', 'admin123')" class="p-2.5 bg-red-800 hover:bg-red-900 text-white rounded-lg text-left transition-colors cursor-pointer shadow-xs">
                        <div class="font-bold text-xs">Admin Role</div>
                        <div class="text-[10px] text-red-200">Full System Access</div>
                    </button>
                    <button type="button" onclick="fillDemo('staff@citycon.edu.pk', 'staff123')" class="p-2.5 bg-slate-800 hover:bg-slate-900 text-white rounded-lg text-left transition-colors cursor-pointer shadow-xs">
                        <div class="font-bold text-xs">Staff Role</div>
                        <div class="text-[10px] text-slate-300">Deposit & Add Only</div>
                    </button>
                </div>
            </div>

            <?php if (!empty($error)): ?>
                <div class="mb-4 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-lg p-3">
                    <?= htmlspecialchars($error) ?>
                </div>
            <?php endif; ?>

            <form method="POST" action="login.php" class="space-y-4">
                <div>
                    <label class="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                        Email Address
                    </label>
                    <input type="email" id="email_input" name="email" required placeholder="admin@citycon.edu.pk" class="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs sm:text-sm focus:ring-2 focus:ring-red-600 focus:outline-none" />
                </div>

                <div>
                    <label class="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                        Password
                    </label>
                    <input type="password" id="password_input" name="password" required placeholder="••••••••" class="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs sm:text-sm focus:ring-2 focus:ring-red-600 focus:outline-none" />
                </div>

                <button type="submit" class="w-full py-2.5 px-4 bg-red-700 hover:bg-red-800 active:bg-red-900 text-white font-bold rounded-lg text-sm shadow-md transition-colors cursor-pointer mt-2">
                    Sign In to Portal →
                </button>
            </form>

            <div class="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                <span>Need a new account?</span>
                <a href="signup.php" class="text-red-700 hover:text-red-800 font-bold">Create Account (Sign Up) →</a>
            </div>
        </div>
    </div>

    <script>
    function fillDemo(email, pass) {
        document.getElementById('email_input').value = email;
        document.getElementById('password_input').value = pass;
    }
    </script>
</body>
</html>
