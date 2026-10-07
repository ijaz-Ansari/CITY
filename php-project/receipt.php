<?php
require_once __DIR__ . '/config.php';

$tx_id = isset($_GET['id']) ? (int)$_GET['id'] : 0;
if ($tx_id <= 0 || !isset($pdo)) {
    die("Invalid Receipt ID or database not connected.");
}

// Fetch current transaction
$stmt = $pdo->prepare("
    SELECT t.*, s.roll_no, s.reg_no, s.full_name, s.father_name, s.phone, s.program, s.session, s.net_payable_fee, s.address, s.photo
    FROM fee_transactions t
    JOIN students s ON t.student_id = s.id
    WHERE t.id = ?
");
$stmt->execute([$tx_id]);
$current_tx = $stmt->fetch();

if (!$current_tx) {
    die("Receipt transaction not found.");
}

// Fetch ALL transactions for this student (for the history table on receipt)
$stmt_all = $pdo->prepare("
    SELECT * FROM fee_transactions 
    WHERE student_id = ? 
    ORDER BY date ASC, id ASC
");
$stmt_all->execute([$current_tx['student_id']]);
$all_history = $stmt_all->fetchAll();

$total_paid = 0;
foreach ($all_history as $h) {
    $total_paid += (float)$h['amount'];
}
$net_payable = (float)$current_tx['net_payable_fee'];
$current_balance = max(0, $net_payable - $total_paid);

if (!function_exists('renderVoucherCopy')) {
    function renderVoucherCopy($label, $tx, $history, $net_fee, $paid_total, $remaining) {
?>
    <div class="voucher-copy bg-white border border-slate-300 rounded p-4 text-xs font-sans text-slate-800 shadow-sm relative flex flex-col justify-between mb-4">
        <div>
            <!-- Header (Professional Clean Slate & Circular Logo) -->
            <div class="border-b-2 border-slate-700 pb-2 mb-2">
                <div class="flex items-start justify-between">
                    <div class="flex items-center space-x-2.5">
                        <div class="logo-emblem-wrap" style="width: 40px; height: 40px; min-width: 40px; min-height: 40px; max-width: 40px; max-height: 40px; border-radius: 9999px; overflow: hidden; padding: 2px;">
                            <img src="assets/images/logo.png" alt="Logo" width="40" height="40" style="width: 100%; height: 100%; max-width: 40px; max-height: 40px; object-fit: contain; border-radius: 9999px; display: block;" onerror="this.src='logo.png'; this.onerror=function(){this.src='logo.jpg';}" />
                        </div>
                        <div>
                            <h1 class="text-sm font-extrabold uppercase tracking-tight text-slate-900 leading-tight">
                                <?= INSTITUTE_NAME ?>
                            </h1>
                            <p class="text-[11px] font-semibold text-slate-700 leading-tight">
                                <?= INSTITUTE_SUBTITLE ?>
                            </p>
                        </div>
                    </div>

                    <div class="text-right">
                        <span class="inline-block px-2 py-0.5 bg-red-100 text-red-950 font-bold rounded text-[10px] uppercase tracking-wider border border-red-300">
                            <?= $label ?>
                        </span>
                        <p class="text-[10px] text-slate-500 font-mono mt-0.5">
                            RCP: <strong class="text-slate-900"><?= htmlspecialchars($tx['receipt_no']) ?></strong>
                        </p>
                    </div>
                </div>

                <div class="mt-1.5 flex flex-wrap justify-between items-center text-[10px] text-slate-600 bg-slate-50 px-2 py-1 rounded border border-slate-200">
                    <span>📍 <?= INSTITUTE_ADDRESS ?></span>
                    <span class="font-semibold text-slate-800">📞 <?= INSTITUTE_PHONE_1 ?> | <?= INSTITUTE_PHONE_2 ?></span>
                </div>
            </div>

            <!-- Student Particulars (with optional Student Photo) -->
            <div class="flex items-start gap-3 mb-2 bg-slate-50/80 p-2 rounded border border-slate-200 text-[11px]">
                <div class="grid grid-cols-2 gap-x-3 gap-y-1 flex-1">
                    <div>
                        <span class="text-slate-500 font-medium">Roll No:</span>
                        <strong class="text-slate-900 font-mono"><?= htmlspecialchars($tx['roll_no']) ?></strong>
                    </div>
                    <div>
                        <span class="text-slate-500 font-medium">Receipt Date:</span>
                        <strong class="text-slate-900"><?= htmlspecialchars($tx['date']) ?></strong>
                    </div>

                    <div>
                        <span class="text-slate-500 font-medium">Student Name:</span>
                        <strong class="text-slate-900 uppercase"><?= htmlspecialchars($tx['full_name']) ?></strong>
                    </div>
                    <div>
                        <span class="text-slate-500 font-medium">Father's Name:</span>
                        <span class="font-semibold text-slate-900"><?= htmlspecialchars($tx['father_name']) ?></span>
                    </div>

                    <div>
                        <span class="text-slate-500 font-medium">Program/Course:</span>
                        <strong class="text-red-950"><?= htmlspecialchars($tx['program']) ?></strong>
                    </div>
                    <div>
                        <span class="text-slate-500 font-medium">Session / Batch:</span>
                        <span class="font-semibold text-slate-900"><?= htmlspecialchars($tx['session']) ?></span>
                    </div>

                    <div>
                        <span class="text-slate-500 font-medium">Payment Mode:</span>
                        <span class="font-semibold text-slate-900">
                            <?= htmlspecialchars($tx['payment_method']) ?>
                            <?= !empty($tx['reference_no']) ? ' (' . htmlspecialchars($tx['reference_no']) . ')' : '' ?>
                        </span>
                    </div>
                    <div>
                        <span class="text-slate-500 font-medium">Contact:</span>
                        <span class="font-semibold text-slate-900"><?= htmlspecialchars($tx['phone']) ?></span>
                    </div>
                </div>

                <?php if (!empty($tx['photo'])): ?>
                    <div style="width: 50px; height: 60px; border-radius: 4px; overflow: hidden; border: 1px solid #cbd5e1; background: #fff; flex-shrink: 0;">
                        <img src="<?= htmlspecialchars($tx['photo']) ?>" alt="Photo" style="width: 100%; height: 100%; object-fit: cover;" />
                    </div>
                <?php endif; ?>
            </div>

            <!-- Current Deposited Amount (Highlighted in Red Brand) -->
            <div class="bg-red-50 border border-red-300 rounded p-2 mb-2 flex items-center justify-between">
                <div>
                    <div class="text-[10px] font-bold uppercase tracking-wider text-red-900">
                        Current Deposited Amount
                    </div>
                    <div class="text-base font-extrabold text-red-950 font-mono">
                        <?= formatPKR($tx['amount']) ?>
                    </div>
                    <div class="text-[10px] text-red-900 italic">
                        In words: <span class="font-semibold"><?= amountToWordsPKR($tx['amount']) ?></span>
                    </div>
                </div>
                <div class="text-right">
                    <span class="inline-block px-2 py-0.5 bg-red-100 text-red-900 font-bold rounded text-[10px] border border-red-200">
                        ✓ VERIFIED PAYMENT
                    </span>
                    <?php if (!empty($tx['remarks'])): ?>
                        <p class="text-[10px] text-slate-600 mt-1 max-w-[160px] truncate">
                            Note: <?= htmlspecialchars($tx['remarks']) ?>
                        </p>
                    <?php endif; ?>
                </div>
            </div>

            <!-- Full Deposit History Table -->
            <div className="mb-2">
                <div class="flex items-center justify-between mb-1">
                    <h4 class="text-[11px] font-bold text-slate-800 uppercase tracking-wider flex items-center">
                        <span class="w-1.5 h-1.5 bg-red-700 rounded-full mr-1.5"></span>
                        History of Deposited Records & Account Ledger
                    </h4>
                    <span class="text-[10px] text-slate-500">
                        Total Deposits: <?= count($history) ?>
                    </span>
                </div>

                <div class="border border-slate-300 rounded overflow-hidden">
                    <table class="w-full text-[10px] text-left border-collapse">
                        <thead>
                            <tr class="bg-slate-100 text-slate-700 border-b border-slate-300 font-bold">
                                <th class="py-1 px-1.5 w-6 text-center">#</th>
                                <th class="py-1 px-1.5">Date</th>
                                <th class="py-1 px-1.5">Receipt #</th>
                                <th class="py-1 px-1.5">Mode</th>
                                <th class="py-1 px-1.5 text-right">Deposited</th>
                                <th class="py-1 px-1.5 text-right">Balance Due</th>
                            </tr>
                        </thead>
                        <tbody class="divide-y divide-slate-200">
                            <?php foreach ($history as $idx => $rec): 
                                $isCurrent = ($rec['id'] == $tx['id']);
                            ?>
                                <tr class="<?= $isCurrent ? 'bg-red-50 font-bold text-slate-900' : 'text-slate-700' ?>">
                                    <td class="py-1 px-1.5 text-center"><?= $idx + 1 ?></td>
                                    <td class="py-1 px-1.5 whitespace-nowrap"><?= htmlspecialchars($rec['date']) ?></td>
                                    <td class="py-1 px-1.5 font-mono">
                                        <?= htmlspecialchars($rec['receipt_no']) ?>
                                        <?= $isCurrent ? '<span class="text-red-700 text-[9px]">(Current)</span>' : '' ?>
                                    </td>
                                    <td class="py-1 px-1.5"><?= htmlspecialchars($rec['payment_method']) ?></td>
                                    <td class="py-1 px-1.5 text-right font-mono font-semibold"><?= formatPKR($rec['amount']) ?></td>
                                    <td class="py-1 px-1.5 text-right font-mono"><?= formatPKR($rec['remaining_balance']) ?></td>
                                </tr>
                            <?php endforeach; ?>
                        </tbody>
                    </table>
                </div>
            </div>

            <!-- Balances Summary (TOTAL COURSE FEE EXCLUDED PER USER SPECIFICATION) -->
            <div class="grid grid-cols-2 gap-3 bg-slate-100 p-2 rounded border border-slate-300 text-center mb-2 mt-2">
                <div>
                    <span class="text-[9px] uppercase tracking-wider text-red-800 font-semibold block">Total Deposited To Date</span>
                    <strong class="text-xs font-mono text-red-950 font-bold"><?= formatPKR($paid_total) ?></strong>
                </div>
                <div class="border-l border-slate-300 pl-2">
                    <span class="text-[9px] uppercase tracking-wider text-slate-600 font-semibold block">Current Balance Due</span>
                    <strong class="text-xs font-mono text-red-700 font-bold"><?= formatPKR($remaining) ?></strong>
                </div>
            </div>
        </div>

        <!-- Footer Signatures -->
        <div class="mt-2 pt-2 border-t border-slate-200">
            <div class="grid grid-cols-3 gap-2 text-center text-[10px] text-slate-600">
                <div>
                    <div class="h-6 border-b border-dashed border-slate-400 mb-0.5"></div>
                    <span>Student / Depositor</span>
                </div>
                <div class="flex items-end justify-center">
                    <span class="text-[9px] text-slate-400 italic">Institute Stamp</span>
                </div>
                <div>
                    <div class="h-6 border-b border-dashed border-slate-400 mb-0.5"></div>
                    <span class="font-semibold text-slate-800">Accounts Officer</span>
                </div>
            </div>
            <p class="text-[9px] text-slate-400 text-center mt-1">
                * This computer generated receipt maintains full deposit history. Valid for exam clearance.
            </p>
        </div>
    </div>
<?php
    }
}
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Receipt #<?= htmlspecialchars($current_tx['receipt_no']) ?> - <?= INSTITUTE_NAME ?></title>
    <!-- Online CSS Library: Tailwind CSS CDN -->
    <script src="https://cdn.tailwindcss.com"></script>
    <style>
        img { max-width: 100%; }
        .logo-emblem-wrap, .logo-emblem-wrap img {
            width: 40px !important;
            height: 40px !important;
            max-width: 40px !important;
            max-height: 40px !important;
            min-width: 40px !important;
            min-height: 40px !important;
            object-fit: contain !important;
            border-radius: 9999px !important;
            display: block !important;
        }
        @media print {
            .no-print { display: none !important; }
            body { background: #ffffff !important; }
        }
    </style>
</head>
<body class="bg-slate-100 text-slate-900 min-h-screen">

    <!-- Top Action Controls (Hidden when printing) -->
    <div class="no-print bg-slate-900 text-white px-4 py-3 flex items-center justify-between border-b border-slate-800 sticky top-0 z-50">
        <div class="flex items-center space-x-3">
            <a href="collect_fee.php" class="text-xs text-slate-400 hover:text-white">← Back to Desk</a>
            <span class="text-slate-600">|</span>
            <div>
                <h3 class="font-bold text-sm">Official Fee Receipt Voucher (Double Copy)</h3>
                <p class="text-xs text-slate-400">Receipt #<?= htmlspecialchars($current_tx['receipt_no']) ?> · <?= htmlspecialchars($current_tx['full_name']) ?></p>
            </div>
        </div>

        <div class="flex items-center space-x-2">
            <!-- 1. Direct Download PDF -->
            <button onclick="downloadPDF()" class="px-4 py-2 bg-red-700 hover:bg-red-800 active:bg-red-900 text-white text-xs sm:text-sm font-bold rounded-lg shadow-sm flex items-center space-x-1.5 cursor-pointer">
                <span>📥 Download PDF</span>
            </button>
            <!-- 2. Direct Print -->
            <button onclick="window.print()" class="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-white text-xs sm:text-sm font-semibold rounded-lg shadow-sm flex items-center space-x-1.5 cursor-pointer border border-slate-700">
                <span>🖨️ Print Receipt</span>
            </button>
            <a href="student_history.php?student_id=<?= $current_tx['student_id'] ?>" class="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-white text-xs rounded-lg border border-slate-700">
                View Ledger
            </a>
        </div>
    </div>

    <!-- Printable Double Copy Container -->
    <div class="max-w-4xl mx-auto p-4 sm:p-6">
        <div id="printable-double-receipt" class="space-y-4 bg-white p-4 rounded-xl border border-slate-200">
            <!-- COPY 1: STUDENT COPY -->
            <?php renderVoucherCopy('STUDENT COPY', $current_tx, $all_history, $net_payable, $total_paid, $current_balance); ?>

            <!-- Perforated Divider Line -->
            <div class="relative py-2 flex items-center justify-center">
                <div class="border-t-2 border-dashed border-slate-400 w-full"></div>
                <span class="bg-white px-3 text-[10px] text-slate-500 font-mono uppercase tracking-wider absolute flex items-center space-x-1">
                    <span>✂</span>
                    <span>Cut Along Dotted Line (Student Copy Above / Institute Copy Below)</span>
                    <span>✂</span>
                </span>
            </div>

            <!-- COPY 2: OFFICE / ACCOUNTS COPY -->
            <?php renderVoucherCopy('OFFICE / ACCOUNTS COPY', $current_tx, $all_history, $net_payable, $total_paid, $current_balance); ?>
        </div>
    </div>

    <script>
    function downloadPDF() {
        window.print();
    }
    </script>

</body>
</html>
