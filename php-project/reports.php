<?php
require_once __DIR__ . '/config.php';

// Handle CSV export action before header output
if (isset($_GET['action']) && $_GET['action'] === 'export_csv') {
    $s_date = trim($_GET['start_date'] ?? '2024-01-01');
    $e_date = trim($_GET['end_date'] ?? date('Y-m-d'));
    
    header('Content-Type: text/csv; charset=utf-8');
    header('Content-Disposition: attachment; filename=CityCon_MonthlyCollectionReport_' . $s_date . '_to_' . $e_date . '.csv');
    
    $output = fopen('php://output', 'w');
    fputcsv($output, ['Receipt No', 'Date', 'Student Name', 'Roll No', 'Program', 'Payment Method', 'Reference No', 'Amount (PKR)', 'Remarks', 'Remaining Balance']);
    
    $stmt_csv = $pdo->prepare("
        SELECT t.receipt_no, t.date, s.full_name, s.roll_no, s.program, t.payment_method, t.reference_no, t.amount, t.remarks, t.remaining_balance
        FROM fee_transactions t
        JOIN students s ON t.student_id = s.id
        WHERE t.date >= ? AND t.date <= ?
        ORDER BY t.date DESC, t.id DESC
    ");
    $stmt_csv->execute([$s_date, $e_date]);
    while ($row = $stmt_csv->fetch()) {
        fputcsv($output, [
            $row['receipt_no'],
            $row['date'],
            $row['full_name'],
            $row['roll_no'],
            $row['program'],
            $row['payment_method'],
            $row['reference_no'] ?? '',
            $row['amount'],
            $row['remarks'] ?? '',
            $row['remaining_balance']
        ]);
    }
    fclose($output);
    exit;
}

// Default dates: This month
$first_day_this_month = date('Y-m-01');
$today = date('Y-m-d');

$preset = trim($_GET['preset'] ?? 'this_month');
$start_date = trim($_GET['start_date'] ?? '');
$end_date = trim($_GET['end_date'] ?? '');
$selected_program = trim($_GET['program'] ?? 'All');
$selected_method = trim($_GET['method'] ?? 'All');

if ($preset === 'this_month' && empty($start_date)) {
    $start_date = $first_day_this_month;
    $end_date = $today;
} elseif ($preset === 'last_month' && empty($start_date)) {
    $start_date = date('Y-m-01', strtotime('first day of last month'));
    $end_date = date('Y-m-t', strtotime('last day of last month'));
} elseif ($preset === 'last_3_months' && empty($start_date)) {
    $start_date = date('Y-m-01', strtotime('-2 months'));
    $end_date = $today;
} elseif ($preset === 'this_year' && empty($start_date)) {
    $start_date = date('Y-01-01');
    $end_date = $today;
} elseif ($preset === 'all' && empty($start_date)) {
    $start_date = '2020-01-01';
    $end_date = $today;
}

if (empty($start_date)) $start_date = $first_day_this_month;
if (empty($end_date)) $end_date = $today;

// Build query conditions
$where = ["t.date >= ? AND t.date <= ?"];
$params = [$start_date, $end_date];

if ($selected_program !== 'All' && !empty($selected_program)) {
    $where[] = "s.program = ?";
    $params[] = $selected_program;
}

if ($selected_method !== 'All' && !empty($selected_method)) {
    $where[] = "t.payment_method = ?";
    $params[] = $selected_method;
}

$where_sql = implode(" AND ", $where);

// 1. Overall Metrics
$stmt_metrics = $pdo->prepare("
    SELECT 
        COUNT(t.id) as total_receipts,
        COALESCE(SUM(t.amount), 0) as total_collected,
        COALESCE(AVG(t.amount), 0) as avg_amount
    FROM fee_transactions t
    JOIN students s ON t.student_id = s.id
    WHERE $where_sql
");
$stmt_metrics->execute($params);
$metrics = $stmt_metrics->fetch();

$total_collected = (float)$metrics['total_collected'];
$total_receipts = (int)$metrics['total_receipts'];
$avg_per_receipt = (float)$metrics['avg_amount'];

// 2. Month-by-Month Summary Breakdown
$stmt_monthly = $pdo->prepare("
    SELECT 
        DATE_FORMAT(t.date, '%Y-%m') as month_key,
        DATE_FORMAT(t.date, '%M %Y') as month_label,
        COUNT(t.id) as receipt_count,
        SUM(t.amount) as month_total,
        AVG(t.amount) as month_avg
    FROM fee_transactions t
    JOIN students s ON t.student_id = s.id
    WHERE $where_sql
    GROUP BY month_key, month_label
    ORDER BY month_key DESC
");
$stmt_monthly->execute($params);
$monthly_records = $stmt_monthly->fetchAll();

// 3. Course Breakdown
$stmt_course = $pdo->prepare("
    SELECT 
        s.program,
        COUNT(t.id) as receipt_count,
        SUM(t.amount) as program_total
    FROM fee_transactions t
    JOIN students s ON t.student_id = s.id
    WHERE $where_sql
    GROUP BY s.program
    ORDER BY program_total DESC
");
$stmt_course->execute($params);
$course_records = $stmt_course->fetchAll();

// 4. Payment Method Breakdown
$stmt_methods = $pdo->prepare("
    SELECT 
        t.payment_method,
        COUNT(t.id) as tx_count,
        SUM(t.amount) as method_total
    FROM fee_transactions t
    JOIN students s ON t.student_id = s.id
    WHERE $where_sql
    GROUP BY t.payment_method
    ORDER BY method_total DESC
");
$stmt_methods->execute($params);
$method_records = $stmt_methods->fetchAll();

require_once __DIR__ . '/header.php';
?>

<div class="max-w-7xl mx-auto space-y-6">
    <!-- Top Action Banner -->
    <div class="bg-white border border-slate-200 rounded-xl p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4 no-print">
        <div>
            <span class="text-xs font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-200">
                Financial Audit & Analytics
            </span>
            <h2 class="text-2xl font-bold text-slate-900 mt-2">
                Monthly Collection Summary Report
            </h2>
            <p class="text-sm text-slate-500">
                <?= INSTITUTE_NAME ?> · Filter by date range and analyze monthly fee collections
            </p>
        </div>

        <div class="flex flex-wrap items-center gap-2">
            <a href="reports.php?action=export_csv&start_date=<?= urlencode($start_date) ?>&end_date=<?= urlencode($end_date) ?>" class="inline-flex items-center px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs sm:text-sm font-semibold rounded-lg border border-slate-200">
                📊 Export CSV (Excel)
            </a>
            <button onclick="downloadReportPDF()" class="inline-flex items-center px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white text-xs sm:text-sm font-bold rounded-lg shadow-sm">
                📥 Download Report PDF
            </button>
            <button onclick="window.print()" class="inline-flex items-center px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs sm:text-sm font-semibold rounded-lg">
                🖨️ Print Report
            </button>
        </div>
    </div>

    <!-- Filter Form & Presets -->
    <div class="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-4 no-print">
        <form method="GET" action="reports.php" class="space-y-4">
            <div class="flex items-center justify-between flex-wrap gap-2 border-b border-slate-100 pb-3">
                <span class="text-xs font-bold text-slate-700 uppercase tracking-wider">⚡ Quick Period Presets</span>
                <div class="flex items-center flex-wrap gap-1.5 text-xs">
                    <a href="reports.php?preset=this_month" class="px-2.5 py-1 rounded-md font-semibold <?= $preset === 'this_month' ? 'bg-emerald-700 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200' ?>">This Month</a>
                    <a href="reports.php?preset=last_month" class="px-2.5 py-1 rounded-md font-semibold <?= $preset === 'last_month' ? 'bg-emerald-700 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200' ?>">Last Month</a>
                    <a href="reports.php?preset=last_3_months" class="px-2.5 py-1 rounded-md font-semibold <?= $preset === 'last_3_months' ? 'bg-emerald-700 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200' ?>">Last 3 Months</a>
                    <a href="reports.php?preset=this_year" class="px-2.5 py-1 rounded-md font-semibold <?= $preset === 'this_year' ? 'bg-emerald-700 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200' ?>">This Year</a>
                    <a href="reports.php?preset=all" class="px-2.5 py-1 rounded-md font-semibold <?= $preset === 'all' ? 'bg-emerald-700 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200' ?>">All Time</a>
                </div>
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3 text-xs">
                <div>
                    <label class="block text-slate-600 font-semibold mb-1">From Date (Start):</label>
                    <input type="date" name="start_date" value="<?= htmlspecialchars($start_date) ?>" class="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs" />
                </div>
                <div>
                    <label class="block text-slate-600 font-semibold mb-1">To Date (End):</label>
                    <input type="date" name="end_date" value="<?= htmlspecialchars($end_date) ?>" class="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs" />
                </div>
                <div>
                    <label class="block text-slate-600 font-semibold mb-1">Course / Program:</label>
                    <select name="program" class="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs bg-white">
                        <option value="All">All Courses</option>
                        <?php foreach ($COURSES_LIST as $c): ?>
                            <option value="<?= $c ?>" <?= $selected_program === $c ? 'selected' : '' ?>><?= $c ?></option>
                        <?php endforeach; ?>
                    </select>
                </div>
                <div>
                    <label class="block text-slate-600 font-semibold mb-1">Payment Mode:</label>
                    <select name="method" class="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs bg-white">
                        <option value="All">All Modes</option>
                        <?php foreach ($PAYMENT_METHODS as $m): ?>
                            <option value="<?= $m ?>" <?= $selected_method === $m ? 'selected' : '' ?>><?= $m ?></option>
                        <?php endforeach; ?>
                    </select>
                </div>
                <div class="flex items-end">
                    <button type="submit" class="w-full py-2 px-4 bg-slate-800 hover:bg-slate-900 text-white font-bold rounded-lg text-xs">
                        Filter Report
                    </button>
                </div>
            </div>
        </form>
    </div>

    <!-- Printable Report Container -->
    <div id="printable-report-container" class="space-y-6 bg-white p-6 rounded-xl border border-slate-200 shadow-xs">
        <!-- Institute Header -->
        <div class="border-b-2 border-emerald-800 pb-4">
            <div class="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                <div class="flex items-start space-x-3">
                    <div class="w-12 h-12 rounded-xl bg-emerald-900 text-white font-extrabold flex flex-col items-center justify-center border border-emerald-950 shadow-xs">
                        <span class="text-xs text-emerald-300">CITY</span>
                        <span class="text-[10px]">CON</span>
                    </div>
                    <div>
                        <h1 class="text-xl sm:text-2xl font-extrabold text-slate-900 uppercase tracking-tight">
                            <?= INSTITUTE_NAME ?>
                        </h1>
                        <p class="text-xs font-bold text-emerald-800 uppercase tracking-wide">
                            <?= INSTITUTE_SUBTITLE ?> · Accounts & Finance Department
                        </p>
                        <p class="text-[11px] text-slate-500 mt-0.5">
                            📍 <?= INSTITUTE_ADDRESS ?> · 📞 <?= INSTITUTE_PHONES ?>
                        </p>
                    </div>
                </div>

                <div class="text-left sm:text-right">
                    <span class="inline-block px-3 py-1 bg-emerald-100 text-emerald-900 font-extrabold rounded-md text-xs uppercase tracking-wider border border-emerald-300">
                        Monthly Collection Report
                    </span>
                    <p class="text-xs text-slate-600 mt-1 font-mono">
                        Period: <strong class="text-slate-900"><?= htmlspecialchars($start_date) ?></strong> to <strong class="text-slate-900"><?= htmlspecialchars($end_date) ?></strong>
                    </p>
                    <p class="text-[10px] text-slate-400">
                        Generated: <?= date('d M Y, h:i A') ?>
                    </p>
                </div>
            </div>
        </div>

        <!-- 4 Metric Cards -->
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div class="bg-emerald-50/80 border border-emerald-200 rounded-xl p-4">
                <span class="text-xs font-bold uppercase tracking-wider text-emerald-800 block">Total Fees Collected</span>
                <div class="text-2xl font-extrabold font-mono text-emerald-950 mt-1.5"><?= formatPKR($total_collected) ?></div>
                <span class="text-[11px] text-emerald-700 block mt-1">In selected date range</span>
            </div>

            <div class="bg-slate-50 border border-slate-200 rounded-xl p-4">
                <span class="text-xs font-bold uppercase tracking-wider text-slate-600 block">Receipts Issued</span>
                <div class="text-2xl font-extrabold font-mono text-slate-900 mt-1.5"><?= $total_receipts ?></div>
                <span class="text-[11px] text-slate-500 block mt-1">Fee transactions recorded</span>
            </div>

            <div class="bg-slate-50 border border-slate-200 rounded-xl p-4">
                <span class="text-xs font-bold uppercase tracking-wider text-slate-600 block">Average Per Receipt</span>
                <div class="text-2xl font-extrabold font-mono text-slate-900 mt-1.5"><?= formatPKR($avg_per_receipt) ?></div>
                <span class="text-[11px] text-slate-500 block mt-1">Average deposit installment</span>
            </div>

            <div class="bg-slate-50 border border-slate-200 rounded-xl p-4">
                <span class="text-xs font-bold uppercase tracking-wider text-slate-600 block">Active Months</span>
                <div class="text-2xl font-extrabold font-mono text-slate-900 mt-1.5"><?= count($monthly_records) ?></div>
                <span class="text-[11px] text-slate-500 block mt-1">Months with collections</span>
            </div>
        </div>

        <!-- Monthly Breakdown Table -->
        <div class="space-y-3">
            <div class="flex items-center justify-between">
                <h3 class="text-sm font-extrabold text-slate-900 uppercase tracking-wider">
                    📅 Monthly Collection Breakdown (<?= count($monthly_records) ?> Months)
                </h3>
                <span class="text-xs text-slate-500 font-mono">
                    Net Total: <strong class="text-emerald-900"><?= formatPKR($total_collected) ?></strong>
                </span>
            </div>

            <div class="border border-slate-200 rounded-xl overflow-hidden shadow-xs">
                <table class="w-full text-xs text-left border-collapse">
                    <thead class="bg-slate-100 text-slate-800 font-bold border-b border-slate-200 text-[11px]">
                        <tr>
                            <th class="py-2.5 px-4 w-12 text-center">#</th>
                            <th class="py-2.5 px-4">Month & Year</th>
                            <th class="py-2.5 px-4 text-center">Receipts Count</th>
                            <th class="py-2.5 px-4 text-right">Average / Trx</th>
                            <th class="py-2.5 px-4 text-right font-extrabold">Total Fee Collected</th>
                            <th class="py-2.5 px-4 text-right w-24">% Share</th>
                        </tr>
                    </thead>
                    <tbody class="divide-y divide-slate-100">
                        <?php if (empty($monthly_records)): ?>
                            <tr>
                                <td colspan="6" class="py-8 text-center text-slate-400">
                                    No fee collections found for the selected period (<?= htmlspecialchars($start_date) ?> to <?= htmlspecialchars($end_date) ?>).
                                </td>
                            </tr>
                        <?php else: ?>
                            <?php foreach ($monthly_records as $idx => $m): 
                                $share = $total_collected > 0 ? ($m['month_total'] / $total_collected) * 100 : 0;
                            ?>
                                <tr class="hover:bg-slate-50">
                                    <td class="py-3 px-4 text-center font-mono text-slate-400"><?= $idx + 1 ?></td>
                                    <td class="py-3 px-4 font-bold text-slate-900">
                                        <?= htmlspecialchars($m['month_label']) ?>
                                        <span class="block text-[10px] text-slate-400 font-mono font-normal">Period: <?= htmlspecialchars($m['month_key']) ?></span>
                                    </td>
                                    <td class="py-3 px-4 text-center font-mono font-semibold">
                                        <span class="bg-slate-100 px-2 py-0.5 rounded text-[11px]"><?= $m['receipt_count'] ?> receipts</span>
                                    </td>
                                    <td class="py-3 px-4 text-right font-mono text-slate-600"><?= formatPKR($m['month_avg']) ?></td>
                                    <td class="py-3 px-4 text-right font-mono font-extrabold text-emerald-900 text-sm"><?= formatPKR($m['month_total']) ?></td>
                                    <td class="py-3 px-4 text-right font-mono text-slate-500"><?= number_format($share, 1) ?>%</td>
                                </tr>
                            <?php endforeach; ?>
                        <?php endif; ?>
                    </tbody>
                    <?php if (!empty($monthly_records)): ?>
                        <tfoot class="bg-emerald-900 text-white font-bold text-xs">
                            <tr>
                                <td colspan="2" class="py-3 px-4 uppercase tracking-wider">Grand Total in Period</td>
                                <td class="py-3 px-4 text-center font-mono"><?= $total_receipts ?> Receipts</td>
                                <td class="py-3 px-4 text-right font-mono"><?= formatPKR($avg_per_receipt) ?></td>
                                <td class="py-3 px-4 text-right font-mono text-sm font-extrabold text-emerald-300"><?= formatPKR($total_collected) ?></td>
                                <td class="py-3 px-4 text-right font-mono">100.0%</td>
                            </tr>
                        </tfoot>
                    <?php endif; ?>
                </table>
            </div>
        </div>

        <!-- Course & Mode Distribution -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
            <!-- Course Breakdown -->
            <div class="border border-slate-200 rounded-xl p-4 bg-slate-50/50 space-y-3">
                <h4 class="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center justify-between">
                    <span>📚 Course-Wise Collections</span>
                    <span class="text-[11px] text-slate-500"><?= count($course_records) ?> Programs</span>
                </h4>
                <div class="space-y-2">
                    <?php foreach ($course_records as $c): 
                        $pct = $total_collected > 0 ? ($c['program_total'] / $total_collected) * 100 : 0;
                    ?>
                        <div class="bg-white p-2.5 rounded-lg border border-slate-200 text-xs">
                            <div class="flex items-center justify-between mb-1">
                                <span class="font-bold text-slate-900"><?= htmlspecialchars($c['program']) ?></span>
                                <span class="font-mono font-extrabold text-emerald-900"><?= formatPKR($c['program_total']) ?></span>
                            </div>
                            <div class="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                                <div class="bg-emerald-600 h-1.5 rounded-full" style="width: <?= $pct ?>%"></div>
                            </div>
                            <div class="flex items-center justify-between text-[10px] text-slate-400 mt-1">
                                <span><?= $c['receipt_count'] ?> Receipts</span>
                                <span class="font-mono"><?= number_format($pct, 1) ?>%</span>
                            </div>
                        </div>
                    <?php endforeach; ?>
                </div>
            </div>

            <!-- Payment Method Breakdown -->
            <div class="border border-slate-200 rounded-xl p-4 bg-slate-50/50 space-y-3">
                <h4 class="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center justify-between">
                    <span>💳 Payment Mode Breakdown</span>
                    <span class="text-[11px] text-slate-500"><?= count($method_records) ?> Modes</span>
                </h4>
                <div class="space-y-2">
                    <?php foreach ($method_records as $m): 
                        $pct = $total_collected > 0 ? ($m['method_total'] / $total_collected) * 100 : 0;
                    ?>
                        <div class="bg-white p-2.5 rounded-lg border border-slate-200 text-xs">
                            <div class="flex items-center justify-between mb-1">
                                <span class="font-bold text-slate-900"><?= htmlspecialchars($m['payment_method']) ?></span>
                                <span class="font-mono font-extrabold text-emerald-900"><?= formatPKR($m['method_total']) ?></span>
                            </div>
                            <div class="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                                <div class="bg-emerald-600 h-1.5 rounded-full" style="width: <?= $pct ?>%"></div>
                            </div>
                            <div class="flex items-center justify-between text-[10px] text-slate-400 mt-1">
                                <span><?= $m['tx_count'] ?> Transactions</span>
                                <span class="font-mono"><?= number_format($pct, 1) ?>%</span>
                            </div>
                        </div>
                    <?php endforeach; ?>
                </div>
            </div>
        </div>

        <!-- Report Sign-off & Audit Stamp -->
        <div class="pt-6 border-t border-slate-200 grid grid-cols-3 gap-4 text-center text-xs text-slate-600">
            <div>
                <div class="h-8 border-b border-dashed border-slate-400 mb-1"></div>
                <span class="font-medium text-slate-700">Prepared by (Accounts)</span>
            </div>
            <div class="flex flex-col items-center justify-end">
                <span class="text-[10px] text-slate-400 italic">Institute Official Seal</span>
            </div>
            <div>
                <div class="h-8 border-b border-dashed border-slate-400 mb-1"></div>
                <span class="font-bold text-slate-900">Principal / Director Approval</span>
            </div>
        </div>
    </div>
</div>

<script>
function downloadReportPDF() {
    window.print();
}
</script>

<?php require_once __DIR__ . '/footer.php'; ?>
