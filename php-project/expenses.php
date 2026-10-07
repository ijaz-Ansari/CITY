<?php
require_once __DIR__ . '/header.php';

// Expenses module is for Administrators
if ($is_staff) {
    safeRedirect("collect_fee.php?restricted=1");
    exit;
}

$success_msg = '';
$error_msg = '';

// Generate next voucher #
function getNextExpenseVoucherNo($pdo) {
    $year_suffix = date('y');
    $prefix = "EXP-{$year_suffix}-";
    try {
        $stmt = $pdo->prepare("SELECT voucher_no FROM expenses WHERE voucher_no LIKE ? ORDER BY id DESC LIMIT 1");
        $stmt->execute([$prefix . "%"]);
        $last = $stmt->fetch();
        if ($last && preg_match('/EXP-\d{2}-(\d+)/', $last['voucher_no'], $m)) {
            $seq = (int)$m[1] + 1;
        } else {
            $seq = 1;
        }
        return $prefix . str_pad($seq, 3, '0', STR_PAD_LEFT);
    } catch (Exception $e) {
        return $prefix . '001';
    }
}

// Handle Add Expense Form
if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['action']) && $_POST['action'] === 'add_expense') {
    $date = trim($_POST['date'] ?? date('Y-m-d'));
    $category = trim($_POST['category'] ?? 'Miscellaneous');
    $title = trim($_POST['title'] ?? '');
    $amount = (float)($_POST['amount'] ?? 0);
    $payment_method = trim($_POST['payment_method'] ?? 'Cash');
    $payee = trim($_POST['payee'] ?? '');
    $receipt_ref = trim($_POST['receipt_ref'] ?? '');
    $notes = trim($_POST['notes'] ?? '');
    $recorded_by = $user['name'] ?? 'Accounts Office';

    if (empty($title) || $amount <= 0 || empty($payee)) {
        $error_msg = "Please fill in title, amount (> 0) and payee name.";
    } elseif (isset($pdo)) {
        try {
            $voucher_no = getNextExpenseVoucherNo($pdo);
            $stmt = $pdo->prepare("
                INSERT INTO expenses (voucher_no, date, category, title, amount, payment_method, payee, receipt_ref, recorded_by, notes)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ");
            $stmt->execute([$voucher_no, $date, $category, $title, $amount, $payment_method, $payee, $receipt_ref, $recorded_by, $notes]);
            $new_id = $pdo->lastInsertId();
            $success_msg = "Expense voucher #{$voucher_no} recorded successfully!";
        } catch (Exception $e) {
            $error_msg = "Database error: " . $e->getMessage();
        }
    }
}

// Handle Delete Expense
if (isset($_GET['delete_id']) && is_numeric($_GET['delete_id'])) {
    $del_id = (int)$_GET['delete_id'];
    if (isset($pdo)) {
        try {
            $stmt = $pdo->prepare("DELETE FROM expenses WHERE id = ?");
            $stmt->execute([$del_id]);
            $success_msg = "Expense voucher removed.";
        } catch (Exception $e) {
            $error_msg = "Delete error: " . $e->getMessage();
        }
    }
}

// Filters
$category_filter = trim($_GET['category'] ?? '');
$date_filter = trim($_GET['date_filter'] ?? 'all');
$search_q = trim($_GET['q'] ?? '');

$where_clauses = ["1=1"];
$params = [];

if (!empty($category_filter) && $category_filter !== 'all') {
    $where_clauses[] = "category = ?";
    $params[] = $category_filter;
}

$today = date('Y-m-d');
$month_prefix = date('Y-m');

if ($date_filter === 'today') {
    $where_clauses[] = "date = ?";
    $params[] = $today;
} elseif ($date_filter === 'month') {
    $where_clauses[] = "date LIKE ?";
    $params[] = "{$month_prefix}%";
}

if (!empty($search_q)) {
    $where_clauses[] = "(title LIKE ? OR payee LIKE ? OR voucher_no LIKE ? OR receipt_ref LIKE ?)";
    $like = "%{$search_q}%";
    $params[] = $like;
    $params[] = $like;
    $params[] = $like;
    $params[] = $like;
}

$expenses_list = [];
$total_expense_sum = 0;
$today_expense_sum = 0;
$month_expense_sum = 0;
$total_fees_collected = 0;

if (isset($pdo)) {
    try {
        // Overall Analytics
        $total_expense_sum = (float)$pdo->query("SELECT COALESCE(SUM(amount), 0) FROM expenses")->fetchColumn();
        $today_expense_sum = (float)$pdo->query("SELECT COALESCE(SUM(amount), 0) FROM expenses WHERE date = '{$today}'")->fetchColumn();
        $month_expense_sum = (float)$pdo->query("SELECT COALESCE(SUM(amount), 0) FROM expenses WHERE date LIKE '{$month_prefix}%'")->fetchColumn();
        $total_fees_collected = (float)$pdo->query("SELECT COALESCE(SUM(amount), 0) FROM fee_transactions")->fetchColumn();

        // Filtered List
        $sql = "SELECT * FROM expenses WHERE " . implode(" AND ", $where_clauses) . " ORDER BY date DESC, id DESC";
        $stmt = $pdo->prepare($sql);
        $stmt->execute($params);
        $expenses_list = $stmt->fetchAll();
    } catch (Exception $e) {
        $expenses_list = [];
    }
}

$net_cash_balance = $total_fees_collected - $total_expense_sum;

$categories = [
    'Salary',
    'Utility Bills',
    'Generator & Fuel',
    'Lab Consumables',
    'Office & Stationery',
    'Building Rent',
    'Internet & IT',
    'Refreshment',
    'Maintenance',
    'Marketing',
    'Miscellaneous'
];
?>

<div class="space-y-6">
    <!-- Header Banner -->
    <div class="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
            <span class="inline-block px-2.5 py-0.5 bg-red-100 text-red-900 text-[10px] font-bold uppercase rounded border border-red-200">
                Expenditures & Petty Cash Outflows
            </span>
            <h2 class="text-xl font-extrabold text-slate-900 mt-1">
                Institute Expense Book
            </h2>
            <p class="text-xs text-slate-500">
                Log utility bills, faculty/staff salaries, generator fuel, lab chemicals and maintenance
            </p>
        </div>

        <button type="button" onclick="document.getElementById('add_expense_modal').classList.remove('hidden')" class="px-4 py-2.5 bg-red-700 hover:bg-red-800 text-white font-bold rounded-xl text-xs sm:text-sm shadow-sm transition-all cursor-pointer">
            + Record New Expense Voucher
        </button>
    </div>

    <?php if ($success_msg): ?>
        <div class="bg-emerald-50 border border-emerald-300 text-emerald-900 px-4 py-3 rounded-xl text-xs font-semibold">
            ✓ <?= htmlspecialchars($success_msg) ?>
        </div>
    <?php endif; ?>

    <?php if ($error_msg): ?>
        <div class="bg-rose-50 border border-rose-300 text-rose-900 px-4 py-3 rounded-xl text-xs font-semibold">
            ⚠️ <?= htmlspecialchars($error_msg) ?>
        </div>
    <?php endif; ?>

    <!-- KPI Summary Grid -->
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div class="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
            <span class="text-xs font-bold text-slate-500 uppercase tracking-wider block">Total Expenses To Date</span>
            <div class="text-xl font-extrabold text-slate-900 font-mono mt-1">
                <?= formatPKR($total_expense_sum) ?>
            </div>
            <span class="text-[11px] text-slate-400 mt-0.5 block">Official expenditures</span>
        </div>

        <div class="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
            <span class="text-xs font-bold text-slate-500 uppercase tracking-wider block">This Month's Outflows</span>
            <div class="text-xl font-extrabold text-amber-900 font-mono mt-1">
                <?= formatPKR($month_expense_sum) ?>
            </div>
            <span class="text-[11px] text-slate-400 mt-0.5 block">Current month (<?= date('F Y') ?>)</span>
        </div>

        <div class="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
            <span class="text-xs font-bold text-slate-500 uppercase tracking-wider block">Total Fees Collected</span>
            <div class="text-xl font-extrabold text-emerald-800 font-mono mt-1">
                <?= formatPKR($total_fees_collected) ?>
            </div>
            <span class="text-[11px] text-slate-400 mt-0.5 block">Student tuition deposits</span>
        </div>

        <div class="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
            <span class="text-xs font-bold text-slate-500 uppercase tracking-wider block">Net Operating Cash</span>
            <div class="text-xl font-extrabold font-mono mt-1 <?= $net_cash_balance >= 0 ? 'text-emerald-700' : 'text-rose-700' ?>">
                <?= formatPKR($net_cash_balance) ?>
            </div>
            <span class="text-[11px] text-slate-400 mt-0.5 block">Fee Revenue - All Expenses</span>
        </div>
    </div>

    <!-- Filter Bar -->
    <form method="GET" action="expenses.php" class="bg-white p-4 rounded-xl border border-slate-200 shadow-xs grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
        <div class="sm:col-span-2">
            <input type="text" name="q" value="<?= htmlspecialchars($search_q) ?>" placeholder="🔍 Search title, payee, voucher # or ref..." class="w-full" />
        </div>
        <div>
            <select name="category" onchange="this.form.submit()">
                <option value="all">All Categories</option>
                <?php foreach ($categories as $cat): ?>
                    <option value="<?= htmlspecialchars($cat) ?>" <?= $category_filter === $cat ? 'selected' : '' ?>><?= htmlspecialchars($cat) ?></option>
                <?php endforeach; ?>
            </select>
        </div>
        <div>
            <select name="date_filter" onchange="this.form.submit()">
                <option value="all" <?= $date_filter === 'all' ? 'selected' : '' ?>>All Time</option>
                <option value="today" <?= $date_filter === 'today' ? 'selected' : '' ?>>Today Only</option>
                <option value="month" <?= $date_filter === 'month' ? 'selected' : '' ?>>This Month</option>
            </select>
        </div>
    </form>

    <!-- Expenses Table -->
    <div class="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div class="px-4 py-3 bg-slate-50 border-b border-slate-200 flex justify-between items-center text-xs">
            <span class="font-bold text-slate-700 uppercase">Expense Records (<?= count($expenses_list) ?>)</span>
            <span class="font-mono font-bold text-red-900">
                Filtered Outflow: <?= formatPKR(array_sum(array_column($expenses_list, 'amount'))) ?>
            </span>
        </div>

        <?php if (empty($expenses_list)): ?>
            <div class="p-8 text-center text-slate-400 text-xs">
                No expense vouchers found matching the filter criteria.
            </div>
        <?php else: ?>
            <div class="overflow-x-auto">
                <table>
                    <thead>
                        <tr>
                            <th>Voucher #</th>
                            <th>Date</th>
                            <th>Category</th>
                            <th>Description</th>
                            <th>Payee</th>
                            <th>Mode</th>
                            <th class="text-right">Amount (PKR)</th>
                            <th class="text-center">Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        <?php foreach ($expenses_list as $exp): ?>
                            <tr>
                                <td class="font-mono font-bold text-red-800 whitespace-nowrap">
                                    <?= htmlspecialchars($exp['voucher_no']) ?>
                                </td>
                                <td class="font-mono text-slate-600 whitespace-nowrap">
                                    <?= htmlspecialchars($exp['date']) ?>
                                </td>
                                <td class="whitespace-nowrap">
                                    <span class="inline-block px-2 py-0.5 bg-slate-100 text-slate-800 font-semibold rounded text-[10px] border border-slate-200">
                                        <?= htmlspecialchars($exp['category']) ?>
                                    </span>
                                </td>
                                <td>
                                    <div class="font-semibold text-slate-900"><?= htmlspecialchars($exp['title']) ?></div>
                                    <?php if (!empty($exp['receipt_ref'])): ?>
                                        <span class="text-[10px] text-slate-400 font-mono">Ref: <?= htmlspecialchars($exp['receipt_ref']) ?></span>
                                    <?php endif; ?>
                                </td>
                                <td class="text-slate-700 font-medium whitespace-nowrap">
                                    <?= htmlspecialchars($exp['payee']) ?>
                                </td>
                                <td class="whitespace-nowrap">
                                    <span class="inline-block px-1.5 py-0.5 bg-emerald-50 text-emerald-800 rounded text-[10px] font-semibold border border-emerald-200">
                                        <?= htmlspecialchars($exp['payment_method']) ?>
                                    </span>
                                </td>
                                <td class="text-right font-mono font-bold text-slate-900 whitespace-nowrap">
                                    <?= formatPKR($exp['amount']) ?>
                                </td>
                                <td class="text-center whitespace-nowrap">
                                    <div class="inline-flex space-x-1">
                                        <a href="expense_voucher.php?id=<?= $exp['id'] ?>" target="_blank" title="Print Payment Voucher" class="px-2 py-1 bg-red-50 hover:bg-red-100 text-red-800 rounded font-semibold text-[10px] border border-red-200">
                                            🖨️ Voucher
                                        </a>
                                        <a href="expenses.php?delete_id=<?= $exp['id'] ?>" onclick="return confirm('Delete expense voucher <?= htmlspecialchars($exp['voucher_no']) ?>?')" title="Delete" class="px-2 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded font-semibold text-[10px] border border-rose-200">
                                            ✕
                                        </a>
                                    </div>
                                </td>
                            </tr>
                        <?php endforeach; ?>
                    </tbody>
                </table>
            </div>
        <?php endif; ?>
    </div>
</div>

<!-- Modal: Record New Expense Voucher -->
<div id="add_expense_modal" class="hidden fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
    <div class="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 relative my-6">
        <button type="button" onclick="document.getElementById('add_expense_modal').classList.add('hidden')" class="absolute right-4 top-4 text-slate-400 hover:text-slate-600 font-bold text-base cursor-pointer">✕</button>

        <h3 class="text-base font-bold text-slate-900 mb-1">Record Expense Payment</h3>
        <p class="text-xs text-slate-500 mb-4">Official institute debit entry & voucher</p>

        <form method="POST" action="expenses.php" class="space-y-3 text-xs">
            <input type="hidden" name="action" value="add_expense" />

            <div class="grid grid-cols-2 gap-2">
                <div>
                    <label class="block font-bold text-slate-700 mb-1">Expense Date</label>
                    <input type="date" name="date" required value="<?= date('Y-m-d') ?>" />
                </div>
                <div>
                    <label class="block font-bold text-slate-700 mb-1">Category</label>
                    <select name="category">
                        <?php foreach ($categories as $c): ?>
                            <option value="<?= htmlspecialchars($c) ?>"><?= htmlspecialchars($c) ?></option>
                        <?php endforeach; ?>
                    </select>
                </div>
            </div>

            <div>
                <label class="block font-bold text-slate-700 mb-1">Expense Title / Purpose *</label>
                <input type="text" name="title" required placeholder="e.g. Generator Diesel or Electricity Bill" />
            </div>

            <div class="grid grid-cols-2 gap-2">
                <div>
                    <label class="block font-bold text-slate-700 mb-1">Amount Paid (PKR) *</label>
                    <input type="number" min="1" step="any" name="amount" required placeholder="e.g. 15000" class="font-mono font-bold" />
                </div>
                <div>
                    <label class="block font-bold text-slate-700 mb-1">Payment Method</label>
                    <select name="payment_method">
                        <option value="Cash">Cash</option>
                        <option value="Bank Transfer">Bank Transfer</option>
                        <option value="JazzCash">JazzCash</option>
                        <option value="EasyPaisa">EasyPaisa</option>
                        <option value="Cheque">Cheque</option>
                    </select>
                </div>
            </div>

            <div class="grid grid-cols-2 gap-2">
                <div>
                    <label class="block font-bold text-slate-700 mb-1">Paid To (Payee / Vendor) *</label>
                    <input type="text" name="payee" required placeholder="e.g. GEPCO Sub-division" />
                </div>
                <div>
                    <label class="block font-bold text-slate-700 mb-1">Invoice / Bill Ref #</label>
                    <input type="text" name="receipt_ref" placeholder="Optional" />
                </div>
            </div>

            <div>
                <label class="block font-bold text-slate-700 mb-1">Notes / Remarks</label>
                <textarea name="notes" rows="2" placeholder="Optional notes..."></textarea>
            </div>

            <div class="flex justify-end space-x-2 pt-2">
                <button type="button" onclick="document.getElementById('add_expense_modal').classList.add('hidden')" class="px-4 py-2 border border-slate-300 rounded-lg text-slate-700 font-semibold hover:bg-slate-50">
                    Cancel
                </button>
                <button type="submit" class="px-5 py-2 bg-red-700 hover:bg-red-800 text-white font-bold rounded-lg shadow-sm">
                    Save Voucher →
                </button>
            </div>
        </form>
    </div>
</div>

<?php require_once __DIR__ . '/footer.php'; ?>
