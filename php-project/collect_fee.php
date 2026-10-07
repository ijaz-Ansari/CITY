<?php
require_once __DIR__ . '/config.php';

$selected_student = null;
$student_id = isset($_GET['student_id']) ? (int)$_GET['student_id'] : 0;
$error = '';

if ($student_id > 0 && isset($pdo)) {
    $stmt = $pdo->prepare("SELECT * FROM students WHERE id = ?");
    $stmt->execute([$student_id]);
    $selected_student = $stmt->fetch();
}

// Handle Form Submission (Before any HTML output to avoid 'headers already sent')
if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($pdo)) {
    try {
        $st_id = (int)($_POST['student_id'] ?? 0);
        $amount = (float)($_POST['amount'] ?? 0);
        $method = trim($_POST['payment_method'] ?? 'Cash');
        $ref_no = trim($_POST['reference_no'] ?? '');
        $remarks = trim($_POST['remarks'] ?? 'Fee Installment Deposit');
        $date = trim($_POST['payment_date'] ?? date('Y-m-d'));
        $received_by = trim($_POST['received_by'] ?? 'Accounts Officer');

        if ($st_id <= 0) {
            throw new Exception("Please select a student first.");
        }

        if ($amount <= 0) {
            throw new Exception("Please enter a valid deposited amount greater than 0.");
        }

        // Fetch student current balances
        $balances = getStudentBalances($pdo, $st_id);
        $prev_bal = $balances['remaining_balance'];
        $new_bal = max(0, $prev_bal - $amount);
        $receipt_no = generateReceiptNo($pdo);

        $stmt_insert = $pdo->prepare("
            INSERT INTO fee_transactions 
            (receipt_no, student_id, amount, date, payment_method, reference_no, remarks, received_by, previous_balance, remaining_balance)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ");
        $stmt_insert->execute([
            $receipt_no, $st_id, $amount, $date, $method, $ref_no, $remarks, $received_by, $prev_bal, $new_bal
        ]);

        $tx_id = (int)$pdo->lastInsertId();
        safeRedirect("receipt.php?id=" . $tx_id);
    } catch (Exception $e) {
        $error = $e->getMessage();
    }
}

// Fetch all students for search list
$all_students = [];
if (isset($pdo)) {
    $all_students = $pdo->query("SELECT id, roll_no, full_name, father_name, program, phone, net_payable_fee FROM students ORDER BY roll_no ASC")->fetchAll();
}

// Include HTML Header AFTER POST handling is completed
require_once __DIR__ . '/header.php';
?>

<div class="max-w-6xl mx-auto space-y-6">
    <div class="bg-white border border-slate-200 rounded-xl p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
            <span class="text-xs font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-200">
                Cashier & Fee Deposit Counter
            </span>
            <h2 class="text-2xl font-bold text-slate-900 mt-2">
                Fee Collection Desk
            </h2>
            <p class="text-sm text-slate-500">
                <?= INSTITUTE_NAME ?> · Fast deposit entry and double copy receipt generator
            </p>
        </div>

        <?php if ($selected_student): ?>
            <a href="collect_fee.php" class="text-xs text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 font-semibold px-3 py-2 rounded-lg">
                Switch Student
            </a>
        <?php endif; ?>
    </div>

    <?php if ($error): ?>
        <div class="bg-rose-50 border border-rose-300 text-rose-900 p-4 rounded-xl text-sm font-semibold">
            ❌ <?= htmlspecialchars($error) ?>
        </div>
    <?php endif; ?>

    <div class="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <!-- Left: Student Selector -->
        <div class="lg:col-span-5 space-y-4">
            <div class="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
                <h3 class="text-sm font-bold text-slate-800 uppercase tracking-wider mb-3">
                    🔍 Select Student
                </h3>

                <input type="text" id="student_search_input" onkeyup="filterStudents()" placeholder="Search Roll No, Name, Mobile..." class="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm mb-3 focus:outline-none focus:ring-2 focus:ring-emerald-600" />

                <div id="student_list_container" class="space-y-1.5 max-h-[420px] overflow-y-auto pr-1 divide-y divide-slate-100">
                    <?php foreach ($all_students as $st): 
                        $b = getStudentBalances($pdo, $st['id']);
                        $isSelected = ($selected_student && $selected_student['id'] == $st['id']);
                    ?>
                        <a href="collect_fee.php?student_id=<?= $st['id'] ?>" class="student-item block pt-2 pb-2 px-2.5 rounded-lg border transition-all <?= $isSelected ? 'bg-emerald-50 border-emerald-500 font-bold' : 'hover:bg-slate-50 border-transparent' ?>" data-search="<?= strtolower($st['roll_no'] . ' ' . $st['full_name'] . ' ' . $st['phone'] . ' ' . $st['father_name']) ?>">
                            <div class="flex items-start justify-between">
                                <div>
                                    <div class="flex items-center space-x-1.5">
                                        <span class="font-mono text-xs text-slate-900 bg-slate-100 px-1.5 py-0.5 rounded"><?= htmlspecialchars($st['roll_no']) ?></span>
                                        <span class="text-sm text-slate-900 font-semibold"><?= htmlspecialchars($st['full_name']) ?></span>
                                    </div>
                                    <p class="text-xs text-slate-500 mt-0.5">
                                        S/O <?= htmlspecialchars($st['father_name']) ?> · <?= htmlspecialchars($st['program']) ?>
                                    </p>
                                    <p class="text-[11px] text-slate-400">📱 <?= htmlspecialchars($st['phone']) ?></p>
                                </div>
                                <div class="text-right">
                                    <span class="text-[10px] text-slate-400 block uppercase font-bold">Due</span>
                                    <span class="text-xs font-mono font-bold <?= $b['remaining_balance'] == 0 ? 'text-emerald-600' : 'text-rose-600' ?>">
                                        <?= $b['remaining_balance'] == 0 ? 'CLEARED' : formatPKR($b['remaining_balance']) ?>
                                    </span>
                                </div>
                            </div>
                        </a>
                    <?php endforeach; ?>
                </div>
            </div>

            <div class="bg-slate-50 border border-slate-200 rounded-xl p-4 text-xs text-slate-600 space-y-1">
                <span class="font-bold text-slate-800 block">💡 Instruction for Cashier:</span>
                <p>Only enter the <strong>Current Deposited Amount</strong>. The system calculates the remaining balance and generates the double copy receipt voucher automatically.</p>
            </div>
        </div>

        <!-- Right: The Fee Collection Form (Only Amount Enter) -->
        <div class="lg:col-span-7 space-y-5">
            <?php if ($selected_student): 
                $balances = getStudentBalances($pdo, $selected_student['id']);
                
                // Fetch past transactions for this student
                $stmt_past = $pdo->prepare("SELECT * FROM fee_transactions WHERE student_id = ? ORDER BY date ASC, id ASC");
                $stmt_past->execute([$selected_student['id']]);
                $past_txs = $stmt_past->fetchAll();
            ?>
                <!-- Student Profile Card -->
                <div class="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
                    <div class="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 gap-2">
                        <div class="flex items-center space-x-3">
                            <div class="w-12 h-12 rounded-xl bg-emerald-800 text-white font-bold flex items-center justify-center text-lg">
                                <?= substr($selected_student['full_name'], 0, 1) ?>
                            </div>
                            <div>
                                <div class="flex items-center space-x-2">
                                    <span class="font-mono text-xs font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded">
                                        <?= htmlspecialchars($selected_student['roll_no']) ?>
                                    </span>
                                    <h3 class="text-lg font-bold text-slate-900"><?= htmlspecialchars($selected_student['full_name']) ?></h3>
                                </div>
                                <p class="text-xs text-slate-500">
                                    Father: <strong class="text-slate-800"><?= htmlspecialchars($selected_student['father_name']) ?></strong> · <?= htmlspecialchars($selected_student['program']) ?>
                                </p>
                            </div>
                        </div>
                        <div class="text-left sm:text-right text-xs">
                            <span class="text-slate-400">Session: <?= htmlspecialchars($selected_student['session']) ?></span>
                            <p class="font-semibold text-slate-700">📱 <?= htmlspecialchars($selected_student['phone']) ?></p>
                        </div>
                    </div>

                    <!-- 3 Financial Balance Boxes -->
                    <div class="grid grid-cols-3 gap-3 mt-4 text-center">
                        <div class="bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                            <span class="text-[10px] uppercase font-bold text-slate-500 block">Total Agreed Fee</span>
                            <span class="text-sm font-extrabold font-mono text-slate-900"><?= formatPKR($balances['net_payable']) ?></span>
                        </div>
                        <div class="bg-emerald-50 p-2.5 rounded-lg border border-emerald-200">
                            <span class="text-[10px] uppercase font-bold text-emerald-800 block">Already Paid</span>
                            <span class="text-sm font-extrabold font-mono text-emerald-900"><?= formatPKR($balances['total_paid']) ?></span>
                        </div>
                        <div class="bg-rose-50 p-2.5 rounded-lg border border-rose-200">
                            <span class="text-[10px] uppercase font-bold text-rose-800 block">Current Balance Due</span>
                            <span class="text-sm font-extrabold font-mono text-rose-700" id="current_due_display"><?= formatPKR($balances['remaining_balance']) ?></span>
                        </div>
                    </div>
                </div>

                <!-- MAIN FORM: ONLY ENTER CURRENT DEPOSITED AMOUNT -->
                <form method="POST" action="collect_fee.php" novalidate class="bg-white border-2 border-emerald-500 rounded-xl p-6 shadow-md space-y-5">
                    <input type="hidden" name="student_id" value="<?= $selected_student['id'] ?>" />

                    <div class="flex items-center justify-between border-b border-slate-200 pb-3">
                        <h3 class="font-extrabold text-slate-900 text-base flex items-center">
                            <span class="mr-2">💳</span> Deposit Current Payment
                        </h3>
                        <span class="text-xs text-slate-500 font-medium">Date: <strong class="text-slate-800"><?= date('Y-m-d') ?></strong></span>
                    </div>

                    <!-- THE CORE INPUT: Current Deposited Amount -->
                    <div>
                        <label class="block text-sm font-extrabold text-slate-800 mb-1.5">
                            Enter Current Deposited Amount (PKR) <span class="text-rose-600">*</span>
                        </label>
                        <div class="relative">
                            <div class="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                                <span class="text-lg font-bold text-emerald-700 font-mono">Rs.</span>
                            </div>
                            <input type="number" name="amount" id="deposit_amount" required min="1" step="any" inputmode="numeric" autofocus placeholder="e.g. 15000" oninput="updateLiveBalances()" class="w-full pl-14 pr-4 py-3.5 text-2xl font-mono font-extrabold text-slate-900 bg-emerald-50/30 border-2 border-emerald-500 rounded-xl focus:ring-4 focus:ring-emerald-500/20 focus:outline-none" />
                        </div>

                        <!-- Live math & words -->
                        <div id="live_math_box" class="mt-2.5 p-3 bg-emerald-50 rounded-lg border border-emerald-200 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                            <div>
                                <span class="text-emerald-800 font-semibold block">Remaining Balance after this payment:</span>
                                <span class="text-sm font-extrabold font-mono text-emerald-950" id="live_remaining_display"><?= formatPKR($balances['remaining_balance']) ?></span>
                            </div>
                            <div class="sm:text-right">
                                <button type="button" onclick="setFullBalance(<?= $balances['remaining_balance'] ?>)" class="px-2.5 py-1 text-xs font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-md">
                                    Quick Fill Full Due (<?= formatPKR($balances['remaining_balance']) ?>)
                                </button>
                            </div>
                        </div>
                    </div>

                    <!-- Secondary Payment Mode & Remarks -->
                    <div class="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2 border-t border-slate-100">
                        <div>
                            <label class="block text-xs font-semibold text-slate-700 mb-1">Payment Mode</label>
                            <select name="payment_method" class="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white focus:outline-none">
                                <?php foreach ($PAYMENT_METHODS as $m): ?>
                                    <option value="<?= $m ?>"><?= $m ?></option>
                                <?php endforeach; ?>
                            </select>
                        </div>

                        <div>
                            <label class="block text-xs font-semibold text-slate-700 mb-1">Reference / Trx ID / Cheque #</label>
                            <input type="text" name="reference_no" placeholder="e.g. Slip #, JazzCash ID" class="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none" />
                        </div>

                        <div>
                            <label class="block text-xs font-semibold text-slate-700 mb-1">Payment Date</label>
                            <input type="date" name="payment_date" value="<?= date('Y-m-d') ?>" class="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none" />
                        </div>
                    </div>

                    <div>
                        <label class="block text-xs font-semibold text-slate-700 mb-1">Remarks / Installment Description</label>
                        <input type="text" name="remarks" value="Fee Installment Deposit" class="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none" />
                    </div>

                    <!-- Submit Button -->
                    <button type="submit" class="w-full py-3.5 px-6 text-base font-extrabold text-white bg-emerald-700 hover:bg-emerald-800 rounded-xl shadow-md transition-all flex items-center justify-center space-x-2">
                        <span>🖨️ Collect Amount & Print Double Copy Receipt</span>
                    </button>
                </form>

                <!-- Past Deposited Records Preview -->
                <?php if (!empty($past_txs)): ?>
                    <div class="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
                        <div class="flex items-center justify-between mb-3">
                            <h4 class="text-xs font-bold uppercase tracking-wider text-slate-700">
                                📜 Past Deposited Records (<?= count($past_txs) ?> installments)
                            </h4>
                            <span class="text-xs text-slate-500 font-mono">Total Paid: <?= formatPKR($balances['total_paid']) ?></span>
                        </div>

                        <div class="border border-slate-200 rounded-lg overflow-x-auto">
                            <table class="w-full text-xs text-left">
                                <thead class="bg-slate-50 text-slate-700 font-semibold border-b border-slate-200">
                                    <tr>
                                        <th class="py-2 px-3">Receipt #</th>
                                        <th class="py-2 px-3">Date</th>
                                        <th class="py-2 px-3">Mode</th>
                                        <th class="py-2 px-3 text-right">Deposited</th>
                                        <th class="py-2 px-3 text-right">Balance Due</th>
                                        <th class="py-2 px-3 text-center">Receipt</th>
                                    </tr>
                                </thead>
                                <tbody class="divide-y divide-slate-100">
                                    <?php foreach ($past_txs as $pt): ?>
                                        <tr class="hover:bg-slate-50">
                                            <td class="py-2 px-3 font-mono font-bold text-slate-900"><?= htmlspecialchars($pt['receipt_no']) ?></td>
                                            <td class="py-2 px-3 text-slate-600"><?= htmlspecialchars($pt['date']) ?></td>
                                            <td class="py-2 px-3 text-slate-600"><?= htmlspecialchars($pt['payment_method']) ?></td>
                                            <td class="py-2 px-3 text-right font-mono font-bold text-emerald-700"><?= formatPKR($pt['amount']) ?></td>
                                            <td class="py-2 px-3 text-right font-mono text-slate-700"><?= formatPKR($pt['remaining_balance']) ?></td>
                                            <td class="py-2 px-3 text-center">
                                                <a href="receipt.php?id=<?= $pt['id'] ?>" class="text-[10px] text-emerald-800 bg-emerald-50 px-2 py-1 rounded font-semibold border border-emerald-200">
                                                    Print
                                                </a>
                                            </td>
                                        </tr>
                                    <?php endforeach; ?>
                                </tbody>
                            </table>
                        </div>
                    </div>
                <?php endif; ?>

            <?php else: ?>
                <div class="bg-white border border-dashed border-slate-300 rounded-xl p-12 text-center shadow-xs">
                    <div class="w-16 h-16 rounded-full bg-emerald-50 text-emerald-700 flex items-center justify-center mx-auto mb-4 text-2xl">
                        👤
                    </div>
                    <h3 class="text-lg font-bold text-slate-800">No Student Selected</h3>
                    <p class="text-sm text-slate-500 max-w-md mx-auto mt-1">
                        Please search and select a student from the left panel to deposit their fee and generate a double copy receipt voucher.
                    </p>
                </div>
            <?php endif; ?>
        </div>
    </div>
</div>

<script>
const currentDue = <?= isset($balances) ? $balances['remaining_balance'] : 0 ?>;

function filterStudents() {
    const q = document.getElementById('student_search_input').value.toLowerCase().trim();
    const items = document.querySelectorAll('.student-item');
    items.forEach(el => {
        const text = el.getAttribute('data-search');
        if (text.includes(q)) {
            el.style.display = 'block';
        } else {
            el.style.display = 'none';
        }
    });
}

function updateLiveBalances() {
    const inputVal = parseFloat(document.getElementById('deposit_amount').value) || 0;
    const remaining = Math.max(0, currentDue - inputVal);
    document.getElementById('live_remaining_display').innerText = 'Rs. ' + remaining.toLocaleString();
}

function setFullBalance(val) {
    document.getElementById('deposit_amount').value = val;
    updateLiveBalances();
}
</script>

<?php require_once __DIR__ . '/footer.php'; ?>
