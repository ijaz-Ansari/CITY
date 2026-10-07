<?php
require_once __DIR__ . '/header.php';

$selected_id = isset($_GET['student_id']) ? (int)$_GET['student_id'] : 0;
$search = trim($_GET['search'] ?? '');
$program_filter = trim($_GET['program'] ?? 'All');

// Fetch students
$where_clauses = [];
$params = [];

if ($search !== '') {
    $where_clauses[] = "(full_name LIKE ? OR roll_no LIKE ? OR phone LIKE ? OR father_name LIKE ?)";
    $term = "%{$search}%";
    $params = array_merge($params, [$term, $term, $term, $term]);
}

if ($program_filter !== 'All' && !empty($program_filter)) {
    $where_clauses[] = "program = ?";
    $params[] = $program_filter;
}

$sql = "SELECT * FROM students";
if (!empty($where_clauses)) {
    $sql .= " WHERE " . implode(" AND ", $where_clauses);
}
$sql .= " ORDER BY roll_no ASC";

$stmt = $pdo->prepare($sql);
$stmt->execute($params);
$students = $stmt->fetchAll();

if ($selected_id <= 0 && !empty($students)) {
    $selected_id = $students[0]['id'];
}

$active_student = null;
$active_history = [];
$active_balances = ['net_payable' => 0, 'total_paid' => 0, 'remaining_balance' => 0];

if ($selected_id > 0) {
    $stmt_st = $pdo->prepare("SELECT * FROM students WHERE id = ?");
    $stmt_st->execute([$selected_id]);
    $active_student = $stmt_st->fetch();

    if ($active_student) {
        $active_balances = getStudentBalances($pdo, $active_student['id']);

        $stmt_hist = $pdo->prepare("SELECT * FROM fee_transactions WHERE student_id = ? ORDER BY date ASC, id ASC");
        $stmt_hist->execute([$active_student['id']]);
        $active_history = $stmt_hist->fetchAll();
    }
}
?>

<div class="max-w-7xl mx-auto space-y-6">
    <!-- Top Banner -->
    <div class="bg-white border border-slate-200 rounded-xl p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
            <span class="text-xs font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-200">
                Student Ledger & Audit Register
            </span>
            <h2 class="text-2xl font-bold text-slate-900 mt-2">
                Student Payment History & Account Statements
            </h2>
            <p class="text-sm text-slate-500">
                <?= INSTITUTE_NAME ?> · Complete chronological records of all fee installments
            </p>
        </div>

        <?php if ($active_student): ?>
            <div class="flex items-center space-x-2">
                <a href="collect_fee.php?student_id=<?= $active_student['id'] ?>" class="inline-flex items-center px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white text-xs sm:text-sm font-bold rounded-lg shadow-sm">
                    💳 Collect Fee for <?= htmlspecialchars(explode(' ', $active_student['full_name'])[0]) ?>
                </a>
                <button onclick="window.print()" class="px-3.5 py-2 text-xs sm:text-sm font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg">
                    🖨️ Print Statement
                </button>
            </div>
        <?php endif; ?>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <!-- Left: Student List -->
        <div class="lg:col-span-4 bg-white border border-slate-200 rounded-xl p-4 shadow-xs space-y-3">
            <form method="GET" action="student_history.php" class="space-y-2">
                <input type="text" name="search" value="<?= htmlspecialchars($search) ?>" placeholder="Search by Roll No, Name..." class="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:outline-none" />
                <select name="program" onchange="this.form.submit()" class="w-full px-2 py-1.5 border border-slate-300 rounded-md text-xs bg-white focus:outline-none">
                    <option value="All">All Programs</option>
                    <?php foreach ($COURSES_LIST as $c): ?>
                        <option value="<?= $c ?>" <?= $program_filter === $c ? 'selected' : '' ?>><?= $c ?></option>
                    <?php endforeach; ?>
                </select>
            </form>

            <div class="text-[11px] text-slate-400 font-semibold px-1">
                <?= count($students) ?> Students Listed
            </div>

            <div class="space-y-1.5 max-h-[550px] overflow-y-auto pr-1">
                <?php foreach ($students as $st): 
                    $b = getStudentBalances($pdo, $st['id']);
                    $isActive = ($st['id'] == $selected_id);
                ?>
                    <a href="student_history.php?student_id=<?= $st['id'] ?>" class="block p-3 rounded-lg border transition-all <?= $isActive ? 'bg-emerald-50 border-emerald-500 font-bold shadow-xs' : 'bg-white hover:bg-slate-50 border-slate-200' ?>">
                        <div class="flex items-start justify-between">
                            <div>
                                <div class="flex items-center space-x-1.5">
                                    <span class="font-mono text-[11px] text-slate-900 bg-slate-100 px-1.5 py-0.5 rounded"><?= htmlspecialchars($st['roll_no']) ?></span>
                                    <span class="text-xs text-slate-900 font-bold"><?= htmlspecialchars($st['full_name']) ?></span>
                                </div>
                                <p class="text-[11px] text-slate-500 truncate max-w-[190px] mt-0.5">
                                    <?= htmlspecialchars($st['program']) ?>
                                </p>
                            </div>
                            <div class="text-right">
                                <span class="text-xs font-mono font-bold block <?= $b['remaining_balance'] == 0 ? 'text-emerald-600' : 'text-rose-600' ?>">
                                    <?= $b['remaining_balance'] == 0 ? 'CLEARED' : formatPKR($b['remaining_balance']) ?>
                                </span>
                                <span class="text-[10px] text-slate-400">Paid: <?= formatPKR($b['total_paid']) ?></span>
                            </div>
                        </div>
                    </a>
                <?php endforeach; ?>
            </div>
        </div>

        <!-- Right: Active Student Ledger -->
        <div class="lg:col-span-8 space-y-5">
            <?php if ($active_student): ?>
                <!-- Student Particulars Card -->
                <div class="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
                    <div class="flex flex-col sm:flex-row sm:items-start justify-between pb-4 border-b border-slate-100 gap-3">
                        <div class="flex items-start space-x-3">
                            <div class="w-14 h-14 rounded-xl bg-emerald-800 text-white font-extrabold flex items-center justify-center text-xl">
                                <?= substr($active_student['full_name'], 0, 1) ?>
                            </div>
                            <div>
                                <div class="flex items-center space-x-2">
                                    <span class="font-mono text-xs font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded">
                                        <?= htmlspecialchars($active_student['roll_no']) ?>
                                    </span>
                                    <?php if (!empty($active_student['reg_no'])): ?>
                                        <span class="font-mono text-xs text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                                            Reg: <?= htmlspecialchars($active_student['reg_no']) ?>
                                        </span>
                                    <?php endif; ?>
                                    <h3 class="text-xl font-bold text-slate-900"><?= htmlspecialchars($active_student['full_name']) ?></h3>
                                </div>
                                <p class="text-xs text-slate-600 mt-1">
                                    Father: <strong class="text-slate-800"><?= htmlspecialchars($active_student['father_name']) ?></strong> · CNIC: <span class="font-mono"><?= htmlspecialchars($active_student['cnic']) ?></span>
                                </p>
                                <p class="text-xs text-emerald-800 font-semibold mt-0.5">
                                    <?= htmlspecialchars($active_student['program']) ?> (<?= htmlspecialchars($active_student['session']) ?>)
                                </p>
                            </div>
                        </div>
                    </div>

                    <div class="grid grid-cols-1 sm:grid-cols-3 gap-2 py-2.5 text-xs text-slate-600 border-b border-slate-100">
                        <div><span class="text-slate-400">Mobile:</span> <strong><?= htmlspecialchars($active_student['phone']) ?></strong></div>
                        <div><span class="text-slate-400">Guardian:</span> <strong><?= htmlspecialchars($active_student['guardian_phone'] ?? $active_student['phone']) ?></strong></div>
                        <div><span class="text-slate-400">Address:</span> <span class="truncate"><?= htmlspecialchars($active_student['address']) ?></span></div>
                    </div>

                    <!-- 4 Financial Summary Boxes -->
                    <div class="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4 text-center">
                        <div class="bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                            <span class="text-[10px] uppercase font-bold text-slate-500 block">Total Agreed</span>
                            <span class="text-sm font-bold font-mono text-slate-800"><?= formatPKR($active_student['total_agreed_fee']) ?></span>
                        </div>
                        <div class="bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                            <span class="text-[10px] uppercase font-bold text-slate-500 block">Scholarship</span>
                            <span class="text-sm font-bold font-mono text-slate-800"><?= formatPKR($active_student['discount']) ?></span>
                        </div>
                        <div class="bg-emerald-50 p-2.5 rounded-lg border border-emerald-200">
                            <span class="text-[10px] uppercase font-bold text-emerald-800 block">Total Deposited</span>
                            <span class="text-sm font-extrabold font-mono text-emerald-900"><?= formatPKR($active_balances['total_paid']) ?></span>
                        </div>
                        <div class="bg-rose-50 p-2.5 rounded-lg border border-rose-200">
                            <span class="text-[10px] uppercase font-bold text-rose-800 block">Remaining Due</span>
                            <span class="text-sm font-extrabold font-mono text-rose-800"><?= formatPKR($active_balances['remaining_balance']) ?></span>
                        </div>
                    </div>
                </div>

                <!-- Complete Chronological Deposit History -->
                <div class="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
                    <div class="flex items-center justify-between mb-4">
                        <h3 class="font-bold text-slate-800 text-base flex items-center">
                            <span class="mr-2">📜</span> Complete Deposited History & Receipts Ledger
                        </h3>
                        <span class="text-xs font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                            <?= count($active_history) ?> Total Installments
                        </span>
                    </div>

                    <?php if (empty($active_history)): ?>
                        <div class="text-center py-8 border border-dashed border-slate-200 rounded-lg text-xs text-slate-400">
                            No fee payments deposited yet for this student.
                        </div>
                    <?php else: ?>
                        <div class="border border-slate-200 rounded-lg overflow-x-auto">
                            <table class="w-full text-xs text-left">
                                <thead class="bg-slate-100 text-slate-700 uppercase font-bold border-b border-slate-200 text-[10.5px]">
                                    <tr>
                                        <th class="py-2.5 px-3">Receipt No</th>
                                        <th class="py-2.5 px-3">Date</th>
                                        <th class="py-2.5 px-3">Installment Remarks</th>
                                        <th class="py-2.5 px-3">Payment Mode</th>
                                        <th class="py-2.5 px-3 text-right">Deposited</th>
                                        <th class="py-2.5 px-3 text-right">Balance Due</th>
                                        <th class="py-2.5 px-3 text-center">Double Copy</th>
                                    </tr>
                                </thead>
                                <tbody class="divide-y divide-slate-100">
                                    <?php foreach ($active_history as $tx): ?>
                                        <tr class="hover:bg-slate-50">
                                            <td class="py-2.5 px-3 font-mono font-bold text-slate-900"><?= htmlspecialchars($tx['receipt_no']) ?></td>
                                            <td class="py-2.5 px-3 whitespace-nowrap text-slate-600"><?= htmlspecialchars($tx['date']) ?></td>
                                            <td class="py-2.5 px-3 text-slate-700">
                                                <span><?= htmlspecialchars($tx['remarks']) ?></span>
                                                <?php if (!empty($tx['reference_no'])): ?>
                                                    <span class="block text-[10px] text-slate-400 font-mono">Ref: <?= htmlspecialchars($tx['reference_no']) ?></span>
                                                <?php endif; ?>
                                            </td>
                                            <td class="py-2.5 px-3 text-slate-600"><?= htmlspecialchars($tx['payment_method']) ?></td>
                                            <td class="py-2.5 px-3 text-right font-mono font-bold text-emerald-800"><?= formatPKR($tx['amount']) ?></td>
                                            <td class="py-2.5 px-3 text-right font-mono font-semibold text-slate-700"><?= formatPKR($tx['remaining_balance']) ?></td>
                                            <td class="py-2.5 px-3 text-center">
                                                <a href="receipt.php?id=<?= $tx['id'] ?>" class="inline-block px-2 py-1 text-[11px] font-semibold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 rounded">
                                                    🖨️ Receipt
                                                </a>
                                            </td>
                                        </tr>
                                    <?php endforeach; ?>
                                </tbody>
                            </table>
                        </div>
                    <?php endif; ?>
                </div>

            <?php else: ?>
                <div class="bg-white border border-slate-200 rounded-xl p-12 text-center text-slate-400">
                    Select a student to view full history and ledger.
                </div>
            <?php endif; ?>
        </div>
    </div>
</div>

<?php require_once __DIR__ . '/footer.php'; ?>
