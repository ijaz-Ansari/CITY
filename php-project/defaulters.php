<?php
require_once __DIR__ . '/header.php';

$search = trim($_GET['search'] ?? '');
$course_filter = trim($_GET['program'] ?? 'All');

// Fetch all students and compute balances
$all_students = $pdo->query("SELECT * FROM students ORDER BY roll_no ASC")->fetchAll();
$defaulters = [];
$total_outstanding = 0;

foreach ($all_students as $st) {
    $bal = getStudentBalances($pdo, $st['id']);
    if ($bal['remaining_balance'] > 0) {
        if ($course_filter !== 'All' && $st['program'] !== $course_filter) {
            continue;
        }
        if ($search !== '') {
            $term = strtolower($search);
            $full = strtolower($st['roll_no'] . ' ' . $st['full_name'] . ' ' . $st['phone'] . ' ' . $st['father_name']);
            if (strpos($full, $term) === false) {
                continue;
            }
        }
        $defaulters[] = [
            'student' => $st,
            'net_payable' => $bal['net_payable'],
            'total_paid' => $bal['total_paid'],
            'remaining_balance' => $bal['remaining_balance']
        ];
        $total_outstanding += $bal['remaining_balance'];
    }
}

// Sort by highest balance
usort($defaulters, function($a, $b) {
    return $b['remaining_balance'] <=> $a['remaining_balance'];
});
?>

<div class="max-w-7xl mx-auto space-y-6">
    <div class="bg-white border border-slate-200 rounded-xl p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
            <span class="text-xs font-bold uppercase tracking-wider text-rose-700 bg-rose-50 px-2.5 py-1 rounded-md border border-rose-200">
                Fee Dues & Recovery Management
            </span>
            <h2 class="text-2xl font-bold text-slate-900 mt-2">
                Pending Fee & Defaulters Registry
            </h2>
            <p class="text-sm text-slate-500">
                Filter and contact students with unpaid or partial fee balances.
            </p>
        </div>

        <div class="flex items-center space-x-3">
            <div class="bg-rose-50 border border-rose-200 px-4 py-2 rounded-lg text-right">
                <span class="text-[10px] uppercase font-bold text-rose-800 block">Total Due Amount</span>
                <span class="text-lg font-extrabold font-mono text-rose-700"><?= formatPKR($total_outstanding) ?></span>
            </div>
            <button onclick="window.print()" class="px-4 py-2.5 text-xs sm:text-sm font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg">
                🖨️ Print Dues Report
            </button>
        </div>
    </div>

    <!-- Filter Bar -->
    <div class="bg-white border border-slate-200 rounded-xl p-4 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <form method="GET" action="defaulters.php" class="flex flex-col sm:flex-row items-center gap-3 w-full">
            <input type="text" name="search" value="<?= htmlspecialchars($search) ?>" placeholder="Search Roll No, Name, Phone..." class="w-full sm:w-80 px-3 py-2 border border-slate-300 rounded-lg text-xs focus:outline-none" />
            <select name="program" onchange="this.form.submit()" class="w-full sm:w-auto px-3 py-2 border border-slate-300 rounded-lg text-xs bg-white focus:outline-none">
                <option value="All">All Allied Health Courses</option>
                <?php foreach ($COURSES_LIST as $c): ?>
                    <option value="<?= $c ?>" <?= $course_filter === $c ? 'selected' : '' ?>><?= $c ?></option>
                <?php endforeach; ?>
            </select>
            <span class="text-xs text-slate-500 ml-auto"><?= count($defaulters) ?> Students with Dues</span>
        </form>
    </div>

    <!-- Table -->
    <div class="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden">
        <div class="overflow-x-auto">
            <table class="w-full text-xs text-left">
                <thead class="bg-slate-50 text-slate-700 font-bold border-b border-slate-200 uppercase text-[10.5px]">
                    <tr>
                        <th class="py-3 px-3.5">Roll No</th>
                        <th class="py-3 px-3.5">Student & Father Name</th>
                        <th class="py-3 px-3.5">Course & Session</th>
                        <th class="py-3 px-3.5">Contact Number</th>
                        <th class="py-3 px-3.5 text-right">Agreed Fee</th>
                        <th class="py-3 px-3.5 text-right">Paid So Far</th>
                        <th class="py-3 px-3.5 text-right">Remaining Due</th>
                        <th class="py-3 px-3.5 text-center">WhatsApp Reminder</th>
                        <th class="py-3 px-3.5 text-center">Action</th>
                    </tr>
                </thead>
                <tbody class="divide-y divide-slate-100">
                    <?php if (empty($defaulters)): ?>
                        <tr><td colspan="9" class="py-8 text-center text-slate-400">No pending dues found matching criteria.</td></tr>
                    <?php else: ?>
                        <?php foreach ($defaulters as $d): 
                            $st = $d['student'];
                            // WhatsApp message text
                            $wa_text = "City Con & Allied Health Sciences Nowshera Virkan%0A"
                                . "FEE REMINDER NOTICE%0A"
                                . "Student: {$st['full_name']} ({$st['roll_no']})%0A"
                                . "Course: {$st['program']}%0A"
                                . "Total Fee: Rs. " . number_format($d['net_payable']) . "%0A"
                                . "Total Paid: Rs. " . number_format($d['total_paid']) . "%0A"
                                . "*Remaining Due: Rs. " . number_format($d['remaining_balance']) . "*%0A"
                                . "Please clear your fee dues at accounts counter.%0A"
                                . "Phone: " . INSTITUTE_PHONE_1;
                            $clean_phone = preg_replace('/[^0-9]/', '', $st['phone']);
                            if (substr($clean_phone, 0, 2) === '03') {
                                $clean_phone = '92' . substr($clean_phone, 1);
                            }
                            $wa_url = "https://wa.me/{$clean_phone}?text={$wa_text}";
                        ?>
                            <tr class="hover:bg-slate-50">
                                <td class="py-3 px-3.5 font-mono font-bold text-slate-900"><?= htmlspecialchars($st['roll_no']) ?></td>
                                <td class="py-3 px-3.5">
                                    <div class="font-bold text-slate-900"><?= htmlspecialchars($st['full_name']) ?></div>
                                    <div class="text-[11px] text-slate-500">S/O <?= htmlspecialchars($st['father_name']) ?></div>
                                </td>
                                <td class="py-3 px-3.5">
                                    <div class="font-medium text-emerald-900"><?= htmlspecialchars($st['program']) ?></div>
                                    <div class="text-[11px] text-slate-400"><?= htmlspecialchars($st['session']) ?></div>
                                </td>
                                <td class="py-3 px-3.5">
                                    <div>📱 <?= htmlspecialchars($st['phone']) ?></div>
                                </td>
                                <td class="py-3 px-3.5 text-right font-mono"><?= formatPKR($d['net_payable']) ?></td>
                                <td class="py-3 px-3.5 text-right font-mono font-bold text-emerald-800"><?= formatPKR($d['total_paid']) ?></td>
                                <td class="py-3 px-3.5 text-right font-mono font-extrabold text-rose-700 text-sm"><?= formatPKR($d['remaining_balance']) ?></td>
                                <td class="py-3 px-3.5 text-center">
                                    <a href="<?= $wa_url ?>" target="_blank" class="inline-flex items-center px-2 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-[10px] font-bold">
                                        💬 WhatsApp
                                    </a>
                                </td>
                                <td class="py-3 px-3.5 text-center">
                                    <a href="collect_fee.php?student_id=<?= $st['id'] ?>" class="inline-flex items-center px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-lg text-xs">
                                        💳 Deposit
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
