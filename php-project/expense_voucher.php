<?php
require_once __DIR__ . '/config.php';

$id = isset($_GET['id']) ? (int)$_GET['id'] : 0;
if ($id <= 0 || !isset($pdo)) {
    die("Invalid Expense Voucher ID.");
}

$stmt = $pdo->prepare("SELECT * FROM expenses WHERE id = ?");
$stmt->execute([$id]);
$exp = $stmt->fetch();

if (!$exp) {
    die("Expense record not found.");
}
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Expense Voucher - <?= htmlspecialchars($exp['voucher_no']) ?></title>
    <!-- Online CSS Library: Tailwind CSS CDN -->
    <script src="https://cdn.tailwindcss.com"></script>
    <style>
        body { background: #f8fafc; padding: 20px; }
        .voucher-box {
            max-width: 650px;
            margin: 0 auto;
            background: #ffffff;
            border: 2px solid #1e293b;
            border-radius: 8px;
            padding: 24px;
            box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1);
        }
        @media print {
            body { background: #ffffff; padding: 0; }
            .voucher-box { border: 2px solid #000; box-shadow: none; max-width: 100%; }
            .no-print { display: none !important; }
        }
    </style>
</head>
<body>

    <div class="no-print max-w-xl mx-auto mb-4 flex justify-between items-center">
        <a href="expenses.php" class="px-3 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded text-xs font-bold">
            ← Back to Expense Book
        </a>
        <button onclick="window.print()" class="px-4 py-1.5 bg-red-700 hover:bg-red-800 text-white rounded text-xs font-bold shadow-xs">
            🖨️ Print Voucher
        </button>
    </div>

    <div class="voucher-box">
        <!-- Header with Circular Logo on White/Neutral Area -->
        <div class="border-b-2 border-slate-700 pb-3 mb-4 flex justify-between items-start">
            <div class="flex items-center space-x-3">
                <div class="logo-emblem-wrap" style="width: 52px; height: 52px; min-width: 52px; min-height: 52px; max-width: 52px; max-height: 52px; border-radius: 9999px; overflow: hidden; padding: 2px;">
                    <img src="assets/images/logo.png" alt="Logo" width="52" height="52" style="width: 100%; height: 100%; max-width: 52px; max-height: 52px; object-fit: contain; border-radius: 9999px; display: block;" onerror="this.src='logo.png'; this.onerror=function(){this.src='logo.jpg';}" />
                </div>
                <div>
                    <h1 class="text-base font-extrabold uppercase text-slate-900 leading-tight">
                        <?= INSTITUTE_NAME ?>
                    </h1>
                    <p class="text-xs font-semibold text-slate-700">
                        <?= INSTITUTE_SUBTITLE ?>
                    </p>
                    <p class="text-[10px] text-slate-500 mt-0.5">
                        <?= INSTITUTE_ADDRESS ?> · <?= INSTITUTE_PHONE_1 ?> | <?= INSTITUTE_PHONE_2 ?>
                    </p>
                </div>
            </div>

            <div class="text-right">
                <span class="inline-block px-2 py-0.5 bg-red-800 text-white text-[10px] font-bold rounded uppercase">
                    EXPENSE VOUCHER
                </span>
                <div class="font-mono font-bold text-xs text-red-900 mt-1">
                    <?= htmlspecialchars($exp['voucher_no']) ?>
                </div>
            </div>
        </div>

        <!-- Meta Details Grid -->
        <div class="grid grid-cols-2 gap-2 text-xs bg-slate-50 p-3 rounded border border-slate-200 mb-4">
            <div>
                <span class="text-slate-500">Voucher Date:</span>{' '}
                <strong class="font-mono"><?= htmlspecialchars($exp['date']) ?></strong>
            </div>
            <div>
                <span class="text-slate-500">Payment Mode:</span>{' '}
                <strong><?= htmlspecialchars($exp['payment_method']) ?></strong>
            </div>
            <div>
                <span class="text-slate-500">Category:</span>{' '}
                <strong><?= htmlspecialchars($exp['category']) ?></strong>
            </div>
            <div>
                <span class="text-slate-500">Bill/Ref #:</span>{' '}
                <strong class="font-mono"><?= htmlspecialchars($exp['receipt_ref'] ?: 'N/A') ?></strong>
            </div>
        </div>

        <!-- Payee & Particulars -->
        <div class="border border-slate-200 rounded p-3 text-xs space-y-2 mb-4">
            <div class="flex justify-between border-b border-slate-100 pb-1.5">
                <span class="text-slate-500">Paid To (Payee / Vendor):</span>
                <span class="font-bold text-slate-900"><?= htmlspecialchars($exp['payee']) ?></span>
            </div>
            <div class="flex justify-between border-b border-slate-100 pb-1.5">
                <span class="text-slate-500">On Account Of (Purpose):</span>
                <span class="font-semibold text-slate-900"><?= htmlspecialchars($exp['title']) ?></span>
            </div>
            <?php if (!empty($exp['notes'])): ?>
                <div class="text-[11px] text-slate-600 pt-1">
                    <span class="text-slate-400">Notes:</span> <?= htmlspecialchars($exp['notes']) ?>
                </div>
            <?php endif; ?>
        </div>

        <!-- Amount Box -->
        <div class="bg-red-50 border border-red-200 rounded-lg p-3 flex items-center justify-between mb-8">
            <div>
                <span class="text-[10px] uppercase font-bold text-red-800 block">Total Amount Paid</span>
                <span class="text-xs font-semibold text-red-950 mt-0.5 block">
                    <?= amountToWordsPKR($exp['amount']) ?>
                </span>
            </div>
            <div class="text-xl font-extrabold font-mono text-red-900">
                <?= formatPKR($exp['amount']) ?>
            </div>
        </div>

        <!-- Signatures -->
        <div class="grid grid-cols-3 gap-4 text-center text-[10px] text-slate-600 pt-6">
            <div class="border-t border-slate-400 pt-1">
                Receiver's Signature
            </div>
            <div class="border-t border-slate-400 pt-1">
                Prepared By (<?= htmlspecialchars($exp['recorded_by']) ?>)
            </div>
            <div class="border-t border-slate-400 pt-1 font-bold text-slate-900">
                Principal / Authorized Sign
            </div>
        </div>
    </div>

</body>
</html>
