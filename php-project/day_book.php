<?php
require_once __DIR__ . '/header.php';

$date_filter = trim($_GET['date_filter'] ?? 'all');
$start_date = trim($_GET['start_date'] ?? '');
$end_date = trim($_GET['end_date'] ?? '');
$method_filter = trim($_GET['method'] ?? 'All');
$search = trim($_GET['search'] ?? '');

$where = [];
$params = [];

$today = date('Y-m-d');
$this_month = date('Y-m');

if ($date_filter === 'today') {
    $where[] = "t.date = ?";
    $params[] = $today;
} elseif ($date_filter === 'month') {
    $where[] = "t.date LIKE ?";
    $params[] = "{$this_month}%";
} elseif ($date_filter === 'custom') {
    if (!empty($start_date)) {
        $where[] = "t.date >= ?";
        $params[] = $start_date;
    }
    if (!empty($end_date)) {
        $where[] = "t.date <= ?";
        $params[] = $end_date;
    }
}

if ($method_filter !== 'All' && !empty($method_filter)) {
    $where[] = "t.payment_method = ?";
    $params[] = $method_filter;
}

if (!empty($search)) {
    $where[] = "(s.full_name LIKE ? OR s.roll_no LIKE ? OR t.receipt_no LIKE ?)";
    $term = "%{$search}%";
    $params = array_merge($params, [$term, $term, $term]);
}

$sql = "
    SELECT t.*, s.full_name, s.roll_no, s.program
    FROM fee_transactions t
    JOIN students s ON t.student_id = s.id
";

if (!empty($where)) {
    $sql .= " WHERE " . implode(" AND ", $where);
}
$sql .= " ORDER BY t.date DESC, t.id DESC";

$stmt = $pdo->prepare($sql);
$stmt->execute($params);
$transactions = $stmt->fetchAll();

$total_collected = 0;
$method_counts = [];
foreach ($transactions as $t) {
    $total_collected += (float)$t['amount'];
    $m = $t['payment_method'];
    $method_counts[$m] = ($method_counts[$m] ?? 0) + (float)$t['amount'];
}
?>

<div class="max-w-7xl mx-auto space-y-6">
    <div class="bg-white border border-slate-200 rounded-xl p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
            <span class="text-xs font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-200">
                Audit Ledger & Collection Day Book
            </span>
            <h2 class="text-2xl font-bold text-slate-900 mt-2">
                Day Book & Deposit Register
            </h2>
            <p class="text-sm text-slate-500">
                <?= INSTITUTE_NAME ?> · Cashier log and daily balance reconcile
            </p>
        </div>

        <button onclick="window.print()" class="px-4 py-2.5 text-xs sm:text-sm font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg">
            🖨️ Print Day Book
        </button>
    </div>

    <!-- Filters & Summary -->
    <div class="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-4">
        <form method="GET" action="day_book.php" class="flex flex-wrap items-center justify-between gap-3">
            <div class="flex items-center space-x-2 text-xs">
                <span class="text-slate-500 font-semibold">Filter:</span>
                <a href="day_book.php?date_filter=all" class="px-3 py-1.5 rounded-md font-semibold <?= $date_filter === 'all' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-700' ?>">All</a>
                <a href="day_book.php?date_filter=today" class="px-3 py-1.5 rounded-md font-semibold <?= $date_filter === 'today' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-700' ?>">Today</a>
                <a href="day_book.php?date_filter=month" class="px-3 py-1.5 rounded-md font-semibold <?= $date_filter === 'month' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-700' ?>">This Month</a>
            </div>

            <div class="flex items-center space-x-2">
                <select name="method" onchange="this.form.submit()" class="px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs bg-white focus:outline-none">
                    <option value="All">All Modes</option>
                    <?php foreach ($PAYMENT_METHODS as $m): ?>
                        <option value="<?= $m ?>" <?= $method_filter === $m ? 'selected' : '' ?>><?= $m ?></option>
                    <?php endforeach; ?>
                </select>
                <input type="text" name="search" value="<?= htmlspecialchars($search) ?>" placeholder="Search..." class="px-3 py-1.5 border border-slate-300 rounded-lg text-xs" />
                <button type="submit" class="px-3 py-1.5 bg-slate-800 text-white rounded-lg text-xs">Filter</button>
            </div>
        </form>

        <div class="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2 border-t border-slate-100">
            <div class="bg-emerald-50 p-3 rounded-lg border border-emerald-200">
                <span class="text-[10px] uppercase font-bold text-emerald-800 block">Total Collected in View</span>
                <span class="text-xl font-extrabold font-mono text-emerald-950"><?= formatPKR($total_collected) ?></span>
                <span class="text-[11px] text-emerald-700 block mt-0.5"><?= count($transactions) ?> Receipts Issued</span>
            </div>
            <div class="sm:col-span-2 bg-slate-50 p-3 rounded-lg border border-slate-200 flex flex-wrap items-center gap-2">
                <span class="text-xs font-bold text-slate-600 block w-full sm:w-auto">Mode Breakdown:</span>
                <?php foreach ($method_counts as $m => $amt): ?>
                    <div class="bg-white px-2.5 py-1 rounded border border-slate-200 text-xs">
                        <span class="text-slate-500"><?= $m ?>:</span> <strong class="font-mono text-slate-800"><?= formatPKR($amt) ?></strong>
                    </div>
                <?php endforeach; ?>
            </div>
        </div>
    </div>

    <!-- Table -->
    <div class="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden">
        <div class="overflow-x-auto">
            <table class="w-full text-xs text-left">
                <thead class="bg-slate-50 text-slate-700 font-bold border-b border-slate-200 uppercase text-[10.5px]">
                    <tr>
                        <th class="py-2.5 px-3">Receipt No</th>
                        <th class="py-2.5 px-3">Date</th>
                        <th class="py-2.5 px-3">Student Name (Roll)</th>
                        <th class="py-2.5 px-3">Course</th>
                        <th class="py-2.5 px-3">Mode & Ref</th>
                        <th class="py-2.5 px-3">Remarks</th>
                        <th class="py-2.5 px-3 text-right">Deposited</th>
                        <th class="py-2.5 px-3 text-right">Balance Due</th>
                        <th class="py-2.5 px-3 text-center">Receipt</th>
                    </tr>
                </thead>
                <tbody class="divide-y divide-slate-100">
                    <?php if (empty($transactions)): ?>
                        <tr><td colspan="9" class="py-8 text-center text-slate-400">No transactions recorded for this filter.</td></tr>
                    <?php else: ?>
                        <?php foreach ($transactions as $t): ?>
                            <tr class="hover:bg-slate-50">
                                <td class="py-2.5 px-3 font-mono font-bold text-slate-900"><?= htmlspecialchars($t['receipt_no']) ?></td>
                                <td class="py-2.5 px-3 whitespace-nowrap text-slate-600"><?= htmlspecialchars($t['date']) ?></td>
                                <td class="py-2.5 px-3">
                                    <div class="font-semibold text-slate-900"><?= htmlspecialchars($t['full_name']) ?></div>
                                    <div class="font-mono text-[10px] text-slate-400"><?= htmlspecialchars($t['roll_no']) ?></div>
                                </td>
                                <td class="py-2.5 px-3 text-emerald-900 font-medium"><?= htmlspecialchars($t['program']) ?></td>
                                <td class="py-2.5 px-3 text-slate-700">
                                    <span><?= htmlspecialchars($t['payment_method']) ?></span>
                                    <?php if (!empty($t['reference_no'])): ?>
                                        <span class="block text-[10px] text-slate-400 font-mono"><?= htmlspecialchars($t['reference_no']) ?></span>
                                    <?php endif; ?>
                                </td>
                                <td class="py-2.5 px-3 text-slate-500 max-w-[140px] truncate"><?= htmlspecialchars($t['remarks']) ?></td>
                                <td class="py-2.5 px-3 text-right font-mono font-extrabold text-emerald-800"><?= formatPKR($t['amount']) ?></td>
                                <td class="py-2.5 px-3 text-right font-mono text-slate-600"><?= formatPKR($t['remaining_balance']) ?></td>
                                <td class="py-2.5 px-3 text-center">
                                    <a href="receipt.php?id=<?= $t['id'] ?>" class="text-[11px] font-semibold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 px-2 py-1 rounded border border-emerald-200">
                                        Double Copy
                                    </a>
                                </td>
                            </tr>
                        <?php endforeach; ?>
                    <?php endif; ?>
                </tbody>
            </table>
        </div>
    </div>
</div>

<?php require_once __DIR__ . '/footer.php'; ?>
