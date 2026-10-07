<?php
require_once __DIR__ . '/header.php';

// Default parameters
$selected_course = isset($_GET['course']) ? trim($_GET['course']) : 'All';
$selected_session = isset($_GET['session']) ? trim($_GET['session']) : 'All';
$fee_amount = isset($_GET['amount']) ? (float)$_GET['amount'] : 10000;
$fee_title = isset($_GET['title']) && trim($_GET['title']) !== '' ? trim($_GET['title']) : 'Monthly Tuition Fee Voucher';
$issue_date = isset($_GET['issue_date']) ? trim($_GET['issue_date']) : date('Y-m-d');
$due_date = isset($_GET['due_date']) ? trim($_GET['due_date']) : date('Y-m-d', strtotime('+10 days'));
$late_fine = isset($_GET['late_fine']) ? (float)$_GET['late_fine'] : 300;
$bank_info = isset($_GET['bank_info']) ? trim($_GET['bank_info']) : 'Payable at Allied Bank / Meezan Bank / BOP or at Institute Accounts Counter, Nowshera Virkan';

// Fetch distinct courses and sessions
$available_courses = $COURSES_LIST;
$available_sessions = $SESSIONS_LIST;
$enrolled_students = [];

if (isset($pdo)) {
    try {
        $db_courses = $pdo->query("SELECT DISTINCT program FROM students WHERE program IS NOT NULL AND program != ''")->fetchAll(PDO::FETCH_COLUMN);
        foreach ($db_courses as $c) {
            if (!in_array($c, $available_courses)) {
                $available_courses[] = $c;
            }
        }

        $db_sessions = $pdo->query("SELECT DISTINCT session FROM students WHERE session IS NOT NULL AND session != ''")->fetchAll(PDO::FETCH_COLUMN);
        foreach ($db_sessions as $s) {
            if (!in_array($s, $available_sessions)) {
                $available_sessions[] = $s;
            }
        }

        // Query matching students
        $sql = "SELECT * FROM students WHERE 1=1";
        $params = [];

        if ($selected_course !== 'All') {
            $sql .= " AND program = ?";
            $params[] = $selected_course;
        }

        if ($selected_session !== 'All') {
            $sql .= " AND session = ?";
            $params[] = $selected_session;
        }

        $sql .= " ORDER BY roll_no ASC";
        $stmt = $pdo->prepare($sql);
        $stmt->execute($params);
        $enrolled_students = $stmt->fetchAll();
    } catch (Exception $e) {
        $enrolled_students = [];
    }
}

$total_students = count($enrolled_students);
$total_batch_billing = $total_students * $fee_amount;
?>

<div class="max-w-7xl mx-auto space-y-6">
    <!-- Top Header & Banner -->
    <div class="bg-white border border-slate-200 rounded-xl p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4 no-print">
        <div>
            <div class="flex items-center space-x-2">
                <span class="text-xs font-bold uppercase tracking-wider text-red-800 bg-red-50 px-2.5 py-1 rounded-md border border-red-200">
                    Course-wise Challan Issuance
                </span>
                <span class="text-xs font-semibold text-slate-500">
                    Batch Fee Slips & Voucher Generator
                </span>
            </div>
            <h2 class="text-2xl font-extrabold text-slate-900 mt-2">
                Generate Course Fee Vouchers
            </h2>
            <p class="text-sm text-slate-500">
                Select course/program, specify fee amount, and instantly generate official printable challan slips for all enrolled students in PDF.
            </p>
        </div>

        <div class="flex items-center space-x-3">
            <button
                type="button"
                onclick="window.print()"
                <?= empty($enrolled_students) ? 'disabled' : '' ?>
                class="inline-flex items-center px-4 py-2.5 bg-red-700 hover:bg-red-800 disabled:opacity-50 text-white text-xs sm:text-sm font-bold rounded-lg shadow-sm transition-colors cursor-pointer"
            >
                🖨️ Print All Vouchers / Save as PDF (<?= $total_students ?>)
            </button>
        </div>
    </div>

    <!-- Filter & Fee Amount Form (No Print) -->
    <div class="bg-white border border-slate-200 rounded-xl p-6 shadow-xs space-y-6 no-print">
        <form method="GET" action="course_vouchers.php" class="space-y-6">
            <div class="border-b border-slate-100 pb-3 flex items-center justify-between">
                <h3 class="font-bold text-slate-900 text-sm uppercase tracking-wider">
                    1. Select Allied Health Course & Academic Batch
                </h3>
                <span class="text-xs text-slate-500 font-mono">
                    <?= $total_students ?> Students enrolled in selection
                </span>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-3 gap-5">
                <!-- Course Selector -->
                <div>
                    <label class="block text-xs font-bold text-slate-700 mb-1.5">
                        Select Allied Health Course / Program *
                    </label>
                    <select name="course" onchange="this.form.submit()" class="w-full px-3 py-2.5 border border-slate-300 rounded-lg text-sm bg-white font-semibold text-slate-900 focus:ring-2 focus:ring-red-700 focus:outline-none">
                        <option value="All" <?= $selected_course === 'All' ? 'selected' : '' ?>>All Courses (Whole Institute)</option>
                        <?php foreach ($available_courses as $c): ?>
                            <option value="<?= htmlspecialchars($c) ?>" <?= $selected_course === $c ? 'selected' : '' ?>>
                                <?= htmlspecialchars($c) ?>
                            </option>
                        <?php endforeach; ?>
                    </select>
                </div>

                <!-- Session Selector -->
                <div>
                    <label class="block text-xs font-bold text-slate-700 mb-1.5">
                        Session / Academic Batch
                    </label>
                    <select name="session" onchange="this.form.submit()" class="w-full px-3 py-2.5 border border-slate-300 rounded-lg text-sm bg-white font-semibold text-slate-900 focus:ring-2 focus:ring-red-700 focus:outline-none">
                        <option value="All" <?= $selected_session === 'All' ? 'selected' : '' ?>>All Batches (Active)</option>
                        <?php foreach ($available_sessions as $s): ?>
                            <option value="<?= htmlspecialchars($s) ?>" <?= $selected_session === $s ? 'selected' : '' ?>>
                                <?= htmlspecialchars($s) ?>
                            </option>
                        <?php endforeach; ?>
                    </select>
                </div>

                <!-- Fee Title / Purpose -->
                <div>
                    <label class="block text-xs font-bold text-slate-700 mb-1.5">
                        Fee Voucher Title / Purpose *
                    </label>
                    <input 
                        type="text" 
                        name="title" 
                        value="<?= htmlspecialchars($fee_title) ?>" 
                        placeholder="e.g. Monthly Tuition Fee Voucher"
                        class="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm font-semibold text-slate-900 focus:ring-2 focus:ring-red-700 focus:outline-none"
                    />
                </div>
            </div>

            <!-- Fee Amount Specification Box -->
            <div class="bg-red-50/50 border border-red-200 rounded-xl p-5 space-y-4">
                <div class="border-b border-red-200/60 pb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                        <h4 class="font-extrabold text-red-950 text-sm uppercase tracking-wide">
                            2. Fee Amount Specification
                        </h4>
                        <p class="text-xs text-red-800 font-medium">
                            Enter the fee amount to be printed on all student vouchers
                        </p>
                    </div>

                    <!-- Presets -->
                    <div class="flex items-center flex-wrap gap-1.5 text-xs">
                        <span class="font-bold text-red-900 mr-1">Presets:</span>
                        <?php foreach ([3000, 5000, 8000, 10000, 15000, 20000] as $preset): ?>
                            <button 
                                type="button" 
                                onclick="document.getElementById('fee_amt_input').value='<?= $preset ?>'; this.form.submit();"
                                class="px-2.5 py-1 bg-white hover:bg-red-100 text-red-900 border border-red-300 rounded font-bold cursor-pointer <?= $fee_amount == $preset ? 'bg-red-800 text-white border-red-900' : '' ?>"
                            >
                                <?= formatPKR($preset) ?>
                            </button>
                        <?php endforeach; ?>
                    </div>
                </div>

                <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div>
                        <label class="block text-xs font-extrabold text-slate-800 mb-1">
                            Fee Amount (PKR) *
                        </label>
                        <div class="relative">
                            <span class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500 font-bold text-xs">
                                Rs.
                            </span>
                            <input 
                                type="number" 
                                id="fee_amt_input"
                                name="amount" 
                                min="0" 
                                step="500" 
                                required
                                value="<?= htmlspecialchars($fee_amount) ?>" 
                                class="w-full pl-10 pr-3 py-2.5 border-2 border-red-500 rounded-lg text-base font-extrabold font-mono text-red-950 bg-white focus:ring-2 focus:ring-red-700 focus:outline-none"
                            />
                        </div>
                        <p class="text-[11px] text-red-900 font-semibold mt-1">
                            In words: <span class="italic"><?= amountToWordsPKR($fee_amount) ?></span>
                        </p>
                    </div>

                    <div>
                        <label class="block text-xs font-bold text-slate-700 mb-1">Issue Date *</label>
                        <input type="date" name="issue_date" value="<?= htmlspecialchars($issue_date) ?>" class="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white font-semibold focus:outline-none" />
                    </div>

                    <div>
                        <label class="block text-xs font-bold text-slate-700 mb-1">Due Date *</label>
                        <input type="date" name="due_date" value="<?= htmlspecialchars($due_date) ?>" class="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white font-semibold focus:outline-none" />
                    </div>

                    <div>
                        <label class="block text-xs font-bold text-slate-700 mb-1">Late Fine Surcharge (PKR)</label>
                        <input type="number" name="late_fine" min="0" step="100" value="<?= htmlspecialchars($late_fine) ?>" class="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white font-bold font-mono text-slate-800 focus:outline-none" />
                    </div>
                </div>

                <div class="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3">
                    <div class="flex-1 w-full">
                        <label class="block text-xs font-bold text-slate-700 mb-1">Payment & Bank Counter Instructions</label>
                        <input type="text" name="bank_info" value="<?= htmlspecialchars($bank_info) ?>" class="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs bg-white text-slate-700 focus:outline-none" />
                    </div>
                    <button type="submit" class="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-lg shrink-0 mt-5 sm:mt-0 cursor-pointer">
                        🔄 Update & Generate Slips
                    </button>
                </div>
            </div>
        </form>

        <!-- Summary Cards -->
        <div class="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
            <div class="p-4 bg-slate-50 border border-slate-200 rounded-xl">
                <span class="text-xs text-slate-500 font-bold uppercase tracking-wider block">Course Filter</span>
                <span class="text-sm font-extrabold text-slate-900 mt-0.5 block truncate"><?= htmlspecialchars($selected_course) ?></span>
                <span class="text-[11px] text-slate-400">Batch: <?= htmlspecialchars($selected_session) ?></span>
            </div>

            <div class="p-4 bg-slate-50 border border-slate-200 rounded-xl">
                <span class="text-xs text-slate-500 font-bold uppercase tracking-wider block">Total Students Found</span>
                <div class="text-2xl font-extrabold text-slate-900 font-mono mt-0.5"><?= $total_students ?></div>
                <span class="text-[11px] text-emerald-700 font-bold">Ready for slip issuance</span>
            </div>

            <div class="p-4 bg-red-50 border border-red-200 rounded-xl">
                <span class="text-xs text-red-900 font-bold uppercase tracking-wider block">Total Batch Billable</span>
                <div class="text-2xl font-extrabold text-red-950 font-mono mt-0.5"><?= formatPKR($total_batch_billing) ?></div>
                <span class="text-[11px] text-red-800 font-medium">@ <?= formatPKR($fee_amount) ?> per student</span>
            </div>
        </div>
    </div>

    <!-- Student Slips Output (Visible on Screen and Print) -->
    <div class="space-y-6">
        <div class="flex items-center justify-between no-print">
            <h3 class="font-extrabold text-slate-900 text-base">
                Generated Student Fee Slips (<?= $total_students ?> Vouchers)
            </h3>
            <button
                type="button"
                onclick="window.print()"
                <?= empty($enrolled_students) ? 'disabled' : '' ?>
                class="px-4 py-2 bg-red-700 hover:bg-red-800 text-white font-bold text-xs rounded-lg shadow-sm flex items-center space-x-2 cursor-pointer disabled:opacity-50"
            >
                <span>🖨️ Print All Slips / PDF</span>
            </button>
        </div>

        <?php if (empty($enrolled_students)): ?>
            <div class="bg-white border border-slate-200 rounded-xl p-12 text-center text-slate-500 no-print">
                <p class="font-bold text-slate-800 text-base">No students found matching the selected course and batch.</p>
                <p class="text-xs text-slate-400 mt-1">Please select "All Courses" or enroll students under "<?= htmlspecialchars($selected_course) ?>".</p>
            </div>
        <?php else: ?>
            <div id="course-batch-vouchers-container" class="space-y-6">
                <?php foreach ($enrolled_students as $idx => $st): ?>
                    <?php
                    $challan_no = 'CCN-SLIP-' . date('Y', strtotime($issue_date)) . '-' . preg_replace('/[^a-zA-Z0-9]/', '', $st['roll_no']);
                    $total_before_due = $fee_amount;
                    $total_after_due = $fee_amount + $late_fine;
                    ?>
                    <div class="course-slip-card bg-white border border-slate-300 rounded-xl p-5 shadow-xs page-break-always">
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <!-- 1. BANK / INSTITUTE COPY -->
                            <div class="challan-copy border-2 border-slate-700 rounded-lg p-3.5 text-xs text-slate-800 bg-white flex flex-col justify-between relative shadow-2xs">
                                <div>
                                    <!-- Header -->
                                    <div class="border-b-2 border-slate-700 pb-2 mb-2">
                                        <div class="flex items-start justify-between">
                                            <!-- Bank Copy Logo -->
                                            <div class="flex items-center space-x-2">
                                                <div class="w-8 h-8 rounded-full bg-slate-50 border border-slate-300 p-0.5 shrink-0 overflow-hidden" style="width: 32px; height: 32px; min-width: 32px; min-height: 32px; max-width: 32px; max-height: 32px;">
                                                    <img src="assets/images/logo.png" alt="Logo" width="32" height="32" class="w-full h-full object-contain rounded-full" style="width: 100%; height: 100%; max-width: 32px; max-height: 32px; object-fit: contain; display: block;" onerror="this.src='logo.png'; this.onerror=function(){this.src='logo.jpg';}" />
                                                </div>
                                                <div>
                                                    <h4 class="text-xs font-extrabold uppercase tracking-tight text-slate-900 leading-tight">
                                                        <?= INSTITUTE_NAME ?>
                                                    </h4>
                                                    <p class="text-[10px] font-semibold text-slate-600 leading-tight">
                                                        <?= INSTITUTE_SUBTITLE ?>
                                                    </p>
                                                </div>
                                            </div>
                                            <div class="text-right">
                                                <span class="inline-block px-1.5 py-0.5 font-bold rounded text-[9px] uppercase tracking-wider bg-red-50 text-red-950 border border-red-300">
                                                    BANK / INSTITUTE COPY
                                                </span>
                                                <p class="text-[9px] text-slate-500 font-mono mt-0.5">
                                                    Challan: <strong class="text-slate-900"><?= htmlspecialchars($challan_no) ?></strong>
                                                </p>
                                            </div>
                                        </div>
                                        <div class="mt-1 flex justify-between items-center text-[9px] text-slate-500 bg-slate-50 px-1.5 py-0.5 rounded border border-slate-200">
                                            <span>📍 Mutto Bahikay Road, Nowshera Virkan</span>
                                            <span>📞 <?= INSTITUTE_PHONE_1 ?></span>
                                        </div>
                                    </div>

                                    <!-- Slip Title -->
                                    <div class="text-center bg-slate-100 py-1 px-2 rounded mb-2 border border-slate-200">
                                        <span class="font-extrabold text-[11px] uppercase tracking-wide text-slate-900">
                                            <?= htmlspecialchars($fee_title) ?>
                                        </span>
                                    </div>

                                    <!-- Particulars -->
                                    <div class="bg-slate-50/80 p-2 rounded border border-slate-200 mb-2 text-[10px]">
                                        <div class="grid grid-cols-2 gap-x-2 gap-y-1">
                                            <div><span class="text-slate-500">Roll No:</span> <strong class="text-slate-900 font-mono"><?= htmlspecialchars($st['roll_no']) ?></strong></div>
                                            <div><span class="text-slate-500">Issue Date:</span> <strong class="text-slate-900"><?= htmlspecialchars($issue_date) ?></strong></div>
                                            <div><span class="text-slate-500">Student:</span> <strong class="text-slate-900 uppercase"><?= htmlspecialchars($st['full_name']) ?></strong></div>
                                            <div><span class="text-slate-500 text-rose-700">Due Date:</span> <strong class="text-rose-700 font-bold"><?= htmlspecialchars($due_date) ?></strong></div>
                                            <div><span class="text-slate-500">Father:</span> <span class="text-slate-800 font-semibold"><?= htmlspecialchars($st['father_name']) ?></span></div>
                                            <div><span class="text-slate-500">Batch:</span> <span class="text-slate-800 font-semibold"><?= htmlspecialchars($st['session']) ?></span></div>
                                            <div class="col-span-2"><span class="text-slate-500">Program:</span> <strong class="text-red-950"><?= htmlspecialchars($st['program']) ?></strong></div>
                                        </div>
                                    </div>

                                    <!-- Fee Table -->
                                    <table class="w-full text-[10px] mb-2 border border-slate-300">
                                        <thead class="bg-slate-100 font-bold text-slate-800 border-b border-slate-300">
                                            <tr>
                                                <th class="py-1 px-2 text-left">Fee Particulars</th>
                                                <th class="py-1 px-2 text-right w-24">Amount (PKR)</th>
                                            </tr>
                                        </thead>
                                        <tbody class="divide-y divide-slate-200">
                                            <tr>
                                                <td class="py-1 px-2 font-medium"><?= htmlspecialchars($fee_title) ?></td>
                                                <td class="py-1 px-2 text-right font-mono font-bold"><?= formatPKR($fee_amount) ?></td>
                                            </tr>
                                            <?php if ($late_fine > 0): ?>
                                                <tr class="text-slate-500">
                                                    <td class="py-1 px-2">Late Surcharge (After <?= htmlspecialchars($due_date) ?>)</td>
                                                    <td class="py-1 px-2 text-right font-mono">+<?= formatPKR($late_fine) ?></td>
                                                </tr>
                                            <?php endif; ?>
                                            <tr class="bg-slate-50 font-bold text-slate-900 border-t-2 border-slate-400">
                                                <td class="py-1.5 px-2">TOTAL PAYABLE (WITHIN DUE DATE):</td>
                                                <td class="py-1.5 px-2 text-right font-mono text-xs text-red-900"><?= formatPKR($total_before_due) ?></td>
                                            </tr>
                                            <?php if ($late_fine > 0): ?>
                                                <tr class="bg-rose-50 font-bold text-rose-900">
                                                    <td class="py-1 px-2">TOTAL PAYABLE (AFTER DUE DATE):</td>
                                                    <td class="py-1 px-2 text-right font-mono text-xs"><?= formatPKR($total_after_due) ?></td>
                                                </tr>
                                            <?php endif; ?>
                                        </tbody>
                                    </table>

                                    <div class="bg-slate-50 p-1.5 rounded border border-slate-200 text-[9px] mb-2">
                                        <span class="text-slate-500 font-medium">In Words: </span>
                                        <strong class="text-slate-900 italic"><?= amountToWordsPKR($total_before_due) ?></strong>
                                    </div>

                                    <div class="text-[9px] text-slate-500 leading-tight">
                                        <p>• <?= htmlspecialchars($bank_info) ?></p>
                                    </div>
                                </div>

                                <div class="pt-4 border-t border-slate-200 grid grid-cols-2 gap-4 text-[9px] text-center text-slate-600 mt-2">
                                    <div class="border-t border-slate-400 pt-1">Depositor / Student Sign</div>
                                    <div class="border-t border-slate-400 pt-1 font-bold">Cashier / Authorized Sign</div>
                                </div>
                            </div>

                            <!-- 2. STUDENT COPY -->
                            <div class="challan-copy border-2 border-slate-700 rounded-lg p-3.5 text-xs text-slate-800 bg-white flex flex-col justify-between relative shadow-2xs">
                                <div>
                                    <!-- Header -->
                                    <div class="border-b-2 border-slate-700 pb-2 mb-2">
                                        <div class="flex items-start justify-between">
                                            <!-- Student Copy Logo -->
                                            <div class="flex items-center space-x-2">
                                                <div class="w-8 h-8 rounded-full bg-slate-50 border border-slate-300 p-0.5 shrink-0 overflow-hidden" style="width: 32px; height: 32px; min-width: 32px; min-height: 32px; max-width: 32px; max-height: 32px;">
                                                    <img src="assets/images/logo.png" alt="Logo" width="32" height="32" class="w-full h-full object-contain rounded-full" style="width: 100%; height: 100%; max-width: 32px; max-height: 32px; object-fit: contain; display: block;" onerror="this.src='logo.png'; this.onerror=function(){this.src='logo.jpg';}" />
                                                </div>
                                                <div>
                                                    <h4 class="text-xs font-extrabold uppercase tracking-tight text-slate-900 leading-tight">
                                                        <?= INSTITUTE_NAME ?>
                                                    </h4>
                                                    <p class="text-[10px] font-semibold text-slate-600 leading-tight">
                                                        <?= INSTITUTE_SUBTITLE ?>
                                                    </p>
                                                </div>
                                            </div>
                                            <div class="text-right">
                                                <span class="inline-block px-1.5 py-0.5 font-bold rounded text-[9px] uppercase tracking-wider bg-emerald-50 text-emerald-900 border border-emerald-300">
                                                    STUDENT COPY
                                                </span>
                                                <p class="text-[9px] text-slate-500 font-mono mt-0.5">
                                                    Challan: <strong class="text-slate-900"><?= htmlspecialchars($challan_no) ?></strong>
                                                </p>
                                            </div>
                                        </div>
                                        <div class="mt-1 flex justify-between items-center text-[9px] text-slate-500 bg-slate-50 px-1.5 py-0.5 rounded border border-slate-200">
                                            <span>📍 Mutto Bahikay Road, Nowshera Virkan</span>
                                            <span>📞 <?= INSTITUTE_PHONE_1 ?></span>
                                        </div>
                                    </div>

                                    <!-- Slip Title -->
                                    <div class="text-center bg-slate-100 py-1 px-2 rounded mb-2 border border-slate-200">
                                        <span class="font-extrabold text-[11px] uppercase tracking-wide text-slate-900">
                                            <?= htmlspecialchars($fee_title) ?>
                                        </span>
                                    </div>

                                    <!-- Particulars -->
                                    <div class="bg-slate-50/80 p-2 rounded border border-slate-200 mb-2 text-[10px]">
                                        <div class="grid grid-cols-2 gap-x-2 gap-y-1">
                                            <div><span class="text-slate-500">Roll No:</span> <strong class="text-slate-900 font-mono"><?= htmlspecialchars($st['roll_no']) ?></strong></div>
                                            <div><span class="text-slate-500">Issue Date:</span> <strong class="text-slate-900"><?= htmlspecialchars($issue_date) ?></strong></div>
                                            <div><span class="text-slate-500">Student:</span> <strong class="text-slate-900 uppercase"><?= htmlspecialchars($st['full_name']) ?></strong></div>
                                            <div><span class="text-slate-500 text-rose-700">Due Date:</span> <strong class="text-rose-700 font-bold"><?= htmlspecialchars($due_date) ?></strong></div>
                                            <div><span class="text-slate-500">Father:</span> <span class="text-slate-800 font-semibold"><?= htmlspecialchars($st['father_name']) ?></span></div>
                                            <div><span class="text-slate-500">Batch:</span> <span class="text-slate-800 font-semibold"><?= htmlspecialchars($st['session']) ?></span></div>
                                            <div class="col-span-2"><span class="text-slate-500">Program:</span> <strong class="text-red-950"><?= htmlspecialchars($st['program']) ?></strong></div>
                                        </div>
                                    </div>

                                    <!-- Fee Table -->
                                    <table class="w-full text-[10px] mb-2 border border-slate-300">
                                        <thead class="bg-slate-100 font-bold text-slate-800 border-b border-slate-300">
                                            <tr>
                                                <th class="py-1 px-2 text-left">Fee Particulars</th>
                                                <th class="py-1 px-2 text-right w-24">Amount (PKR)</th>
                                            </tr>
                                        </thead>
                                        <tbody class="divide-y divide-slate-200">
                                            <tr>
                                                <td class="py-1 px-2 font-medium"><?= htmlspecialchars($fee_title) ?></td>
                                                <td class="py-1 px-2 text-right font-mono font-bold"><?= formatPKR($fee_amount) ?></td>
                                            </tr>
                                            <?php if ($late_fine > 0): ?>
                                                <tr class="text-slate-500">
                                                    <td class="py-1 px-2">Late Surcharge (After <?= htmlspecialchars($due_date) ?>)</td>
                                                    <td class="py-1 px-2 text-right font-mono">+<?= formatPKR($late_fine) ?></td>
                                                </tr>
                                            <?php endif; ?>
                                            <tr class="bg-slate-50 font-bold text-slate-900 border-t-2 border-slate-400">
                                                <td class="py-1.5 px-2">TOTAL PAYABLE (WITHIN DUE DATE):</td>
                                                <td class="py-1.5 px-2 text-right font-mono text-xs text-red-900"><?= formatPKR($total_before_due) ?></td>
                                            </tr>
                                            <?php if ($late_fine > 0): ?>
                                                <tr class="bg-rose-50 font-bold text-rose-900">
                                                    <td class="py-1 px-2">TOTAL PAYABLE (AFTER DUE DATE):</td>
                                                    <td class="py-1 px-2 text-right font-mono text-xs"><?= formatPKR($total_after_due) ?></td>
                                                </tr>
                                            <?php endif; ?>
                                        </tbody>
                                    </table>

                                    <div class="bg-slate-50 p-1.5 rounded border border-slate-200 text-[9px] mb-2">
                                        <span class="text-slate-500 font-medium">In Words: </span>
                                        <strong class="text-slate-900 italic"><?= amountToWordsPKR($total_before_due) ?></strong>
                                    </div>

                                    <div class="text-[9px] text-slate-500 leading-tight">
                                        <p>• <?= htmlspecialchars($bank_info) ?></p>
                                        <p>• Retain this student copy for institute record & examination verification.</p>
                                    </div>
                                </div>

                                <div class="pt-4 border-t border-slate-200 grid grid-cols-2 gap-4 text-[9px] text-center text-slate-600 mt-2">
                                    <div class="border-t border-slate-400 pt-1">Depositor / Student Sign</div>
                                    <div class="border-t border-slate-400 pt-1 font-bold">Cashier / Authorized Sign</div>
                                </div>
                            </div>
                        </div>
                    </div>
                <?php endforeach; ?>
            </div>
        <?php endif; ?>
    </div>
</div>

<?php require_once __DIR__ . '/footer.php'; ?>
