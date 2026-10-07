<?php
require_once __DIR__ . '/header.php';

// Safe queries if DB connected
$total_students = 0;
$total_agreed = 0;
$total_collected = 0;
$total_remaining = 0;
$today_collected = 0;
$recent_txs = [];
$program_breakdown = [];

if (isset($pdo)) {
    // Total Students
    $total_students = (int)$pdo->query("SELECT COUNT(*) FROM students")->fetchColumn();

    // Total Net Payable
    $total_agreed = (float)$pdo->query("SELECT COALESCE(SUM(net_payable_fee), 0) FROM students")->fetchColumn();

    // Total Fee Collected
    $total_collected = (float)$pdo->query("SELECT COALESCE(SUM(amount), 0) FROM fee_transactions")->fetchColumn();

    // Total Remaining Due
    $total_remaining = max(0, $total_agreed - $total_collected);

    // Today's Collection
    $today_date = date('Y-m-d');
    $stmt_today = $pdo->prepare("SELECT COALESCE(SUM(amount), 0) FROM fee_transactions WHERE date = ?");
    $stmt_today->execute([$today_date]);
    $today_collected = (float)$stmt_today->fetchColumn();

    // Recent 6 Transactions
    $recent_txs = $pdo->query("
        SELECT t.*, s.full_name, s.roll_no, s.program 
        FROM fee_transactions t 
        JOIN students s ON t.student_id = s.id 
        ORDER BY t.id DESC LIMIT 6
    ")->fetchAll();

    // Department Breakdown
    $program_breakdown = $pdo->query("
        SELECT 
            s.program,
            COUNT(s.id) as student_count,
            COALESCE(SUM(s.net_payable_fee), 0) as total_fee,
            COALESCE((SELECT SUM(t.amount) FROM fee_transactions t JOIN students s2 ON t.student_id = s2.id WHERE s2.program = s.program), 0) as collected_fee
        FROM students s
        GROUP BY s.program
        ORDER BY student_count DESC
    ")->fetchAll();
}
?>

<div class="max-w-7xl mx-auto space-y-6">
    <!-- Top Banner -->
    <div class="bg-white border border-slate-200 rounded-xl p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
            <span class="text-xs font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-200">
                Accounts & Fee Registry Dashboard
            </span>
            <h2 class="text-2xl font-extrabold text-slate-900 mt-2">
                <?= INSTITUTE_NAME ?>
            </h2>
            <p class="text-sm text-slate-500">
                <?= INSTITUTE_ADDRESS ?> · Real-time financial position & fee collection desk
            </p>
        </div>

        <div class="flex items-center flex-wrap gap-2.5">
            <a href="course_vouchers.php" class="inline-flex items-center px-4 py-2.5 bg-red-50 hover:bg-red-100 text-red-900 border border-red-300 text-xs sm:text-sm font-bold rounded-lg shadow-2xs">
                📜 Issue Course Slips
            </a>
            <a href="collect_fee.php" class="inline-flex items-center px-4 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white text-xs sm:text-sm font-bold rounded-lg shadow-sm">
                💳 Quick Fee Deposit
            </a>
            <a href="add_student.php" class="inline-flex items-center px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs sm:text-sm font-semibold rounded-lg shadow-sm">
                ➕ New Student Admission
            </a>
        </div>
    </div>

    <!-- 4 Metric Cards -->
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div class="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
            <span class="text-xs font-bold uppercase tracking-wider text-slate-500 block">Total Enrolled Students</span>
            <div class="text-2xl font-extrabold text-slate-900 font-mono mt-2"><?= $total_students ?></div>
            <div class="text-xs text-slate-500 mt-1 flex items-center justify-between">
                <span>Active Admissions</span>
                <span class="text-emerald-700 font-medium">Allied Health</span>
            </div>
        </div>

        <div class="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
            <span class="text-xs font-bold uppercase tracking-wider text-slate-500 block">Total Fee Receivable</span>
            <div class="text-2xl font-extrabold text-slate-900 font-mono mt-2"><?= formatPKR($total_agreed) ?></div>
            <div class="text-xs text-slate-500 mt-1">Net Agreed Course Fees</div>
        </div>

        <div class="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
            <span class="text-xs font-bold uppercase tracking-wider text-emerald-800 block">Total Fee Collected</span>
            <div class="text-2xl font-extrabold text-emerald-900 font-mono mt-2"><?= formatPKR($total_collected) ?></div>
            <div class="text-xs text-emerald-700 font-medium mt-1">
                <?= $total_agreed > 0 ? round(($total_collected / $total_agreed) * 100) : 0 ?>% recovered
            </div>
        </div>

        <div class="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
            <span class="text-xs font-bold uppercase tracking-wider text-rose-800 block">Outstanding Fee Dues</span>
            <div class="text-2xl font-extrabold text-rose-700 font-mono mt-2"><?= formatPKR($total_remaining) ?></div>
            <div class="text-xs text-rose-600 font-medium mt-1">Pending balance across students</div>
        </div>
    </div>

    <!-- Recent Transactions & Quick Ledger Table -->
    <div class="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div class="lg:col-span-7 bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-4">
            <div class="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 class="font-bold text-slate-800 text-sm uppercase tracking-wider">
                    🕒 Recent Fee Deposits
                </h3>
                <a href="day_book.php" class="text-xs text-emerald-700 hover:text-emerald-800 font-semibold">
                    View Full Day Book →
                </a>
            </div>

            <div class="divide-y divide-slate-100">
                <?php if (empty($recent_txs)): ?>
                    <p class="text-center py-6 text-xs text-slate-400">No fee deposits recorded yet.</p>
                <?php else: ?>
                    <?php foreach ($recent_txs as $tx): ?>
                        <div class="py-2.5 flex items-center justify-between hover:bg-slate-50/80 px-2 rounded-lg">
                            <div>
                                <div class="flex items-center space-x-2">
                                    <span class="font-mono text-xs font-bold text-slate-900"><?= htmlspecialchars($tx['receipt_no']) ?></span>
                                    <span class="font-semibold text-xs text-slate-800"><?= htmlspecialchars($tx['full_name']) ?> (<?= htmlspecialchars($tx['roll_no']) ?>)</span>
                                </div>
                                <p class="text-[11px] text-slate-400">
                                    <?= htmlspecialchars($tx['date']) ?> · <?= htmlspecialchars($tx['payment_method']) ?> · <?= htmlspecialchars($tx['remarks']) ?>
                                </p>
                            </div>
                            <div class="text-right flex items-center space-x-3">
                                <div>
                                    <span class="text-xs font-mono font-extrabold text-emerald-900 block"><?= formatPKR($tx['amount']) ?></span>
                                    <span class="text-[10px] text-slate-400 font-mono">Bal: <?= formatPKR($tx['remaining_balance']) ?></span>
                                </div>
                                <a href="receipt.php?id=<?= $tx['id'] ?>" class="p-1.5 text-xs text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded font-semibold" title="Double Copy Receipt">
                                    🖨️ Receipt
                                </a>
                            </div>
                        </div>
                    <?php endforeach; ?>
                <?php endif; ?>
            </div>
        </div>

        <div class="lg:col-span-5 bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-4">
            <div class="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 class="font-bold text-slate-800 text-sm uppercase tracking-wider">
                    📚 Course Summary
                </h3>
                <a href="defaulters.php" class="text-xs text-rose-700 font-semibold">
                    View Defaulters →
                </a>
            </div>

            <div class="space-y-2">
                <?php foreach ($program_breakdown as $pb): 
                    $bal = max(0, (float)$pb['total_fee'] - (float)$pb['collected_fee']);
                ?>
                    <div class="p-2.5 rounded-lg border border-slate-100 bg-slate-50/50 flex items-center justify-between text-xs">
                        <div>
                            <span class="font-bold text-slate-900 block"><?= htmlspecialchars($pb['program']) ?></span>
                            <span class="text-[11px] text-slate-500"><?= $pb['student_count'] ?> Students enrolled</span>
                        </div>
                        <div class="text-right">
                            <span class="font-bold text-emerald-800 font-mono block"><?= formatPKR($pb['collected_fee']) ?></span>
                            <span class="text-[10px] text-rose-600 font-mono">Due: <?= formatPKR($bal) ?></span>
                        </div>
                    </div>
                <?php endforeach; ?>
            </div>
        </div>
    </div>
</div>

<?php require_once __DIR__ . '/footer.php'; ?>
