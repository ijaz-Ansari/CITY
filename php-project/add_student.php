<?php
require_once __DIR__ . '/config.php';

$message = '';
$error = '';
$auto_roll = isset($pdo) ? generateRollNo($pdo) : 'CCN-' . date('Y') . '-001';

// Handle Student Registration (Before HTML output to avoid 'headers already sent')
if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($pdo)) {
    try {
        $roll_no = trim($_POST['roll_no'] ?? '');
        $reg_no = trim($_POST['reg_no'] ?? '');
        $full_name = trim($_POST['full_name'] ?? '');
        $father_name = trim($_POST['father_name'] ?? '');
        $phone = trim($_POST['phone'] ?? '');
        $guardian_phone = trim($_POST['guardian_phone'] ?? '');
        $cnic = trim($_POST['cnic'] ?? 'Pending');
        $program = trim($_POST['program'] ?? '');
        if ($program === 'Other') {
            $program = trim($_POST['custom_program'] ?? '');
            if (empty($program)) {
                throw new Exception("Please specify the manual/custom Course / Program name.");
            }
        }
        $session = trim($_POST['session'] ?? '');
        if ($session === 'Other') {
            $session = trim($_POST['custom_session'] ?? '');
            if (empty($session)) {
                throw new Exception("Please specify the manual/custom Session / Academic Batch name.");
            }
        }
        $admission_date = trim($_POST['admission_date'] ?? date('Y-m-d'));
        $total_fee = (float)($_POST['total_agreed_fee'] ?? 0);
        $discount = (float)($_POST['discount'] ?? 0);
        $net_payable = max(0, $total_fee - $discount);
        $address = trim($_POST['address'] ?? '');
        $notes = trim($_POST['notes'] ?? '');

        if (empty($full_name) || empty($father_name) || empty($phone) || empty($roll_no)) {
            throw new Exception("Please fill in all required fields (Name, Father Name, Phone, Roll No).");
        }

        // Optional Student Photo Upload
        $photo_path = null;
        if (!empty($_FILES['photo']['name']) && $_FILES['photo']['error'] === UPLOAD_ERR_OK) {
            $tmp = $_FILES['photo']['tmp_name'];
            $ext = strtolower(pathinfo($_FILES['photo']['name'], PATHINFO_EXTENSION));
            if (in_array($ext, ['jpg', 'jpeg', 'png', 'webp'])) {
                $dir = __DIR__ . '/uploads/students/';
                if (!is_dir($dir)) {
                    mkdir($dir, 0777, true);
                }
                $filename = 'student_' . time() . '_' . rand(100, 999) . '.' . $ext;
                if (move_uploaded_file($tmp, $dir . $filename)) {
                    $photo_path = 'uploads/students/' . $filename;
                }
            }
        }

        // Insert student
        $stmt = $pdo->prepare("
            INSERT INTO students 
            (roll_no, reg_no, full_name, father_name, phone, guardian_phone, cnic, program, session, admission_date, total_agreed_fee, discount, net_payable_fee, address, photo, notes)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ");
        $stmt->execute([
            $roll_no, $reg_no, $full_name, $father_name, $phone, $guardian_phone, $cnic, $program, $session, $admission_date, $total_fee, $discount, $net_payable, $address, $photo_path, $notes
        ]);

        $student_id = (int)$pdo->lastInsertId();

        // Check if initial deposit provided
        if (!empty($_POST['initial_deposit']) && (float)$_POST['initial_amount'] > 0) {
            $init_amount = (float)$_POST['initial_amount'];
            $method = $_POST['initial_method'] ?? 'Cash';
            $ref = $_POST['initial_reference'] ?? '';
            $rcp_no = generateReceiptNo($pdo);
            $new_bal = max(0, $net_payable - $init_amount);

            $stmt_tx = $pdo->prepare("
                INSERT INTO fee_transactions 
                (receipt_no, student_id, amount, date, payment_method, reference_no, remarks, received_by, previous_balance, remaining_balance)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ");
            $stmt_tx->execute([
                $rcp_no, $student_id, $init_amount, $admission_date, $method, $ref, 'Admission & Initial Fee Deposit', 'Admission Desk', $net_payable, $new_bal
            ]);

            $tx_id = (int)$pdo->lastInsertId();
            safeRedirect("receipt.php?id=" . $tx_id);
        }

        $message = "Student {$full_name} ({$roll_no}) registered successfully!";
        $auto_roll = generateRollNo($pdo);
    } catch (Exception $e) {
        $error = $e->getMessage();
    }
}

// Include HTML Header AFTER POST handling is completed
require_once __DIR__ . '/header.php';
?>

<div class="max-w-5xl mx-auto space-y-6">
    <div class="bg-white border border-slate-200 rounded-xl p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
            <span class="text-xs font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-200">
                Student Admissions & Registration
            </span>
            <h2 class="text-2xl font-bold text-slate-900 mt-2">
                Add New Student
            </h2>
            <p class="text-sm text-slate-500">
                <?= INSTITUTE_NAME ?> · <?= INSTITUTE_ADDRESS ?>
            </p>
        </div>
    </div>

    <?php if ($message): ?>
        <div class="bg-emerald-50 border border-emerald-300 text-emerald-900 p-4 rounded-xl text-sm font-semibold flex items-center justify-between">
            <span>✅ <?= htmlspecialchars($message) ?></span>
            <a href="collect_fee.php" class="text-xs bg-emerald-700 text-white px-3 py-1.5 rounded-lg">Go to Fee Collection →</a>
        </div>
    <?php endif; ?>

    <?php if ($error): ?>
        <div class="bg-rose-50 border border-rose-300 text-rose-900 p-4 rounded-xl text-sm font-semibold">
            ❌ <?= htmlspecialchars($error) ?>
        </div>
    <?php endif; ?>

    <form method="POST" action="add_student.php" enctype="multipart/form-data" novalidate class="space-y-6">
        <!-- 1. Academic Details -->
        <div class="bg-white border border-slate-200 rounded-xl p-6 shadow-xs">
            <h3 class="font-bold text-slate-800 text-base border-b border-slate-100 pb-3 mb-4 flex items-center">
                <span class="mr-2">📖</span> Academic & Program Details
            </h3>

            <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                    <label class="block text-xs font-semibold text-slate-700 mb-1">Roll Number *</label>
                    <input type="text" name="roll_no" required value="<?= htmlspecialchars($auto_roll) ?>" class="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm font-mono font-bold focus:ring-2 focus:ring-emerald-600 focus:outline-none" />
                </div>

                <div>
                    <label class="block text-xs font-semibold text-slate-700 mb-1">Registration / Council No. (Optional)</label>
                    <input type="text" name="reg_no" placeholder="e.g. PB-PC-2401" class="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm font-mono focus:ring-2 focus:ring-emerald-600 focus:outline-none" />
                </div>

                <div>
                    <div class="flex items-center justify-between mb-1">
                        <label class="block text-xs font-semibold text-slate-700">Session / Academic Batch *</label>
                        <button type="button" onclick="setManualSession()" id="manual_session_btn" class="text-[11px] text-red-700 hover:text-red-900 font-semibold cursor-pointer">+ Manual Entry</button>
                    </div>
                    <select name="session" id="session_select" onchange="toggleSessionInput(this.value)" class="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-red-700 focus:outline-none">
                        <?php foreach ($SESSIONS_LIST as $s): ?>
                            <option value="<?= $s ?>"><?= $s ?></option>
                        <?php endforeach; ?>
                        <option value="Other">✏️ Other / Manual Entry (Not in list)</option>
                    </select>
                    <div id="custom_session_wrap" class="hidden mt-2">
                        <input type="text" name="custom_session" id="custom_session_input" placeholder="Enter Custom Session (e.g. 2026-2029)..." class="w-full px-3 py-2 border border-red-400 bg-red-50/20 rounded-lg text-sm focus:ring-2 focus:ring-red-700 focus:outline-none font-medium" />
                        <span class="text-[10px] text-slate-500 mt-0.5 block">Format: Year-Year (e.g., 2026-2029)</span>
                    </div>
                </div>

                <div class="md:col-span-2">
                    <div class="flex items-center justify-between mb-1">
                        <label class="block text-xs font-semibold text-slate-700">Allied Health Course / Program *</label>
                        <button type="button" onclick="setManualProgram()" id="manual_program_btn" class="text-[11px] text-red-700 hover:text-red-900 font-semibold cursor-pointer">+ Manual Entry</button>
                    </div>
                    <select name="program" id="program_select" onchange="toggleProgramInput(this.value)" class="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-red-700 focus:outline-none">
                        <?php foreach ($COURSES_LIST as $c): ?>
                            <option value="<?= $c ?>"><?= $c ?></option>
                        <?php endforeach; ?>
                        <option value="Other">✏️ Other / Manual Entry (Not in list)</option>
                    </select>
                    <div id="custom_program_wrap" class="hidden mt-2">
                        <input type="text" name="custom_program" id="custom_program_input" placeholder="Enter Custom Program Name (e.g. Doctor of Physical Therapy)..." class="w-full px-3 py-2 border border-red-400 bg-red-50/20 rounded-lg text-sm focus:ring-2 focus:ring-red-700 focus:outline-none font-medium" />
                        <span class="text-[10px] text-slate-500 mt-0.5 block">Custom program title will appear on vouchers & ledgers</span>
                    </div>
                </div>

                <div>
                    <label class="block text-xs font-semibold text-slate-700 mb-1">Admission Date *</label>
                    <input type="date" name="admission_date" required value="<?= date('Y-m-d') ?>" class="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none" />
                </div>
            </div>
        </div>

        <!-- 2. Personal Particulars -->
        <div class="bg-white border border-slate-200 rounded-xl p-6 shadow-xs">
            <h3 class="font-bold text-slate-800 text-base border-b border-slate-100 pb-3 mb-4 flex items-center">
                <span class="mr-2">👤</span> Student Personal Details & Photo
            </h3>

            <!-- Optional Student Picture Option -->
            <div class="mb-5 p-3.5 bg-slate-50 border border-slate-200 rounded-xl flex flex-col sm:flex-row items-center gap-4">
                <div class="w-20 h-24 rounded-lg border-2 border-dashed border-slate-300 bg-white flex items-center justify-center overflow-hidden shrink-0 shadow-2xs" id="photo_preview_wrap">
                    <span id="photo_placeholder" class="text-xs text-slate-400 text-center px-1">📷 Photo</span>
                    <img id="photo_preview" class="hidden w-full h-full object-cover" alt="Preview" />
                </div>
                <div class="flex-1 text-center sm:text-left">
                    <div class="flex items-center justify-center sm:justify-start space-x-2">
                        <label class="text-xs font-bold text-slate-800">Student Picture</label>
                        <span class="px-1.5 py-0.5 bg-slate-200 text-slate-700 text-[10px] font-bold rounded">Optional</span>
                    </div>
                    <p class="text-[11px] text-slate-500 mt-0.5">
                        Passport-size picture for student ID card and official voucher copy (JPG, PNG, max 2MB).
                    </p>
                    <div class="mt-2">
                        <input 
                            type="file" 
                            name="photo" 
                            id="photo_input"
                            accept="image/*" 
                            class="text-xs text-slate-600 file:mr-2 file:py-1.5 file:px-3 file:rounded-lg file:border file:border-slate-300 file:text-xs file:font-semibold file:bg-white hover:file:bg-slate-100 cursor-pointer"
                            onchange="previewStudentPhoto(this)"
                        />
                    </div>
                </div>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                    <label class="block text-xs font-semibold text-slate-700 mb-1">Full Name *</label>
                    <input type="text" name="full_name" required placeholder="e.g. Muhammad Usman Ali" class="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none" />
                </div>

                <div>
                    <label class="block text-xs font-semibold text-slate-700 mb-1">Father's Name *</label>
                    <input type="text" name="father_name" required placeholder="e.g. Tariq Mehmood" class="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none" />
                </div>

                <div>
                    <label class="block text-xs font-semibold text-slate-700 mb-1">CNIC / B-Form</label>
                    <input type="text" name="cnic" placeholder="e.g. 34101-1234567-1" class="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm font-mono focus:outline-none" />
                </div>

                <div>
                    <label class="block text-xs font-semibold text-slate-700 mb-1">Student Mobile Number *</label>
                    <input type="text" name="phone" required placeholder="e.g. 0300-1234567" class="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none" />
                </div>

                <div>
                    <label class="block text-xs font-semibold text-slate-700 mb-1">Father / Guardian Mobile</label>
                    <input type="text" name="guardian_phone" placeholder="e.g. 0321-8420446" class="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none" />
                </div>

                <div>
                    <label class="block text-xs font-semibold text-slate-700 mb-1">Residential Address</label>
                    <input type="text" name="address" placeholder="e.g. Mutto Bahikay Road, Nowshera Virkan" class="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none" />
                </div>
            </div>
        </div>

        <!-- 3. Course Fee Structure -->
        <div class="bg-white border border-slate-200 rounded-xl p-6 shadow-xs">
            <h3 class="font-bold text-slate-800 text-base border-b border-slate-100 pb-3 mb-4 flex items-center">
                <span class="mr-2">💰</span> Course Fee Package & Concession
            </h3>

            <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                    <label class="block text-xs font-semibold text-slate-700 mb-1">Total Agreed Course Fee (PKR) *</label>
                    <input type="number" name="total_agreed_fee" id="total_fee" required min="0" step="any" inputmode="numeric" value="150000" class="w-full px-3 py-2 border border-slate-300 rounded-lg text-base font-mono font-bold focus:outline-none" oninput="calculateNet()" />
                </div>

                <div>
                    <label class="block text-xs font-semibold text-slate-700 mb-1">Discount / Concession (PKR)</label>
                    <input type="number" name="discount" id="discount" min="0" step="any" inputmode="numeric" value="0" class="w-full px-3 py-2 border border-slate-300 rounded-lg text-base font-mono focus:outline-none" oninput="calculateNet()" />
                </div>

                <div class="bg-emerald-50 border border-emerald-200 rounded-xl p-4">
                    <span class="text-xs uppercase tracking-wider text-emerald-800 font-bold block">Net Final Payable Fee</span>
                    <div id="net_display" class="text-2xl font-extrabold text-emerald-950 font-mono mt-1">Rs. 150,000</div>
                </div>
            </div>
        </div>

        <!-- 4. Initial Fee Deposit Option -->
        <div class="bg-white border border-slate-200 rounded-xl p-6 shadow-xs">
            <div class="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
                <h3 class="font-bold text-slate-800 text-base flex items-center">
                    <span class="mr-2">🧾</span> Initial Fee Deposit at Admission Time
                </h3>
                <label class="flex items-center space-x-2 text-xs font-semibold text-slate-700 cursor-pointer">
                    <input type="checkbox" name="initial_deposit" id="initial_toggle" value="1" onchange="toggleInitialDeposit()" class="rounded text-emerald-600 focus:ring-emerald-500 w-4 h-4">
                    <span>Deposit fee now (Auto-generates double receipt voucher)</span>
                </label>
            </div>

            <div id="initial_deposit_fields" class="hidden bg-emerald-50/50 border border-emerald-200 rounded-xl p-4 grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                    <label class="block text-xs font-semibold text-slate-800 mb-1">Deposited Amount Now (PKR)</label>
                    <input type="number" name="initial_amount" value="40000" min="0" step="any" inputmode="numeric" class="w-full px-3 py-2 border border-emerald-400 rounded-lg text-base font-mono font-bold bg-white focus:outline-none" />
                </div>
                <div>
                    <label class="block text-xs font-semibold text-slate-800 mb-1">Payment Mode</label>
                    <select name="initial_method" class="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white focus:outline-none">
                        <?php foreach ($PAYMENT_METHODS as $m): ?>
                            <option value="<?= $m ?>"><?= $m ?></option>
                        <?php endforeach; ?>
                    </select>
                </div>
                <div>
                    <label class="block text-xs font-semibold text-slate-800 mb-1">Reference / Trx No.</label>
                    <input type="text" name="initial_reference" placeholder="e.g. JazzCash ID or Slip #" class="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white focus:outline-none" />
                </div>
            </div>
        </div>

        <div class="flex items-center justify-end space-x-3">
            <button type="reset" class="px-5 py-2.5 text-sm font-semibold text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50">
                Clear
            </button>
            <button type="submit" class="px-6 py-2.5 text-sm font-bold text-white bg-emerald-700 hover:bg-emerald-800 rounded-lg shadow-sm">
                ➕ Save Student & Register
            </button>
        </div>
    </form>
</div>

<script>
function calculateNet() {
    const total = parseFloat(document.getElementById('total_fee').value) || 0;
    const disc = parseFloat(document.getElementById('discount').value) || 0;
    const net = Math.max(0, total - disc);
    document.getElementById('net_display').innerText = 'Rs. ' + net.toLocaleString();
}
function toggleInitialDeposit() {
    const isChecked = document.getElementById('initial_toggle').checked;
    const fields = document.getElementById('initial_deposit_fields');
    if (isChecked) {
        fields.classList.remove('hidden');
    } else {
        fields.classList.add('hidden');
    }
}
function previewStudentPhoto(input) {
    if (input.files && input.files[0]) {
        const reader = new FileReader();
        reader.onload = function(e) {
            const preview = document.getElementById('photo_preview');
            const placeholder = document.getElementById('photo_placeholder');
            preview.src = e.target.result;
            preview.classList.remove('hidden');
            if (placeholder) placeholder.classList.add('hidden');
        };
        reader.readAsDataURL(input.files[0]);
    }
}

function toggleSessionInput(val) {
    const wrap = document.getElementById('custom_session_wrap');
    const input = document.getElementById('custom_session_input');
    const btn = document.getElementById('manual_session_btn');
    if (val === 'Other') {
        wrap.classList.remove('hidden');
        input.focus();
        if (btn) btn.innerText = 'Choose from list';
    } else {
        wrap.classList.add('hidden');
        if (btn) btn.innerText = '+ Manual Entry';
    }
}

function setManualSession() {
    const select = document.getElementById('session_select');
    if (select.value === 'Other') {
        select.value = '<?= $SESSIONS_LIST[0] ?>';
        toggleSessionInput(select.value);
    } else {
        select.value = 'Other';
        toggleSessionInput('Other');
    }
}

function toggleProgramInput(val) {
    const wrap = document.getElementById('custom_program_wrap');
    const input = document.getElementById('custom_program_input');
    const btn = document.getElementById('manual_program_btn');
    if (val === 'Other') {
        wrap.classList.remove('hidden');
        input.focus();
        if (btn) btn.innerText = 'Choose from list';
    } else {
        wrap.classList.add('hidden');
        if (btn) btn.innerText = '+ Manual Entry';
    }
}

function setManualProgram() {
    const select = document.getElementById('program_select');
    if (select.value === 'Other') {
        select.value = '<?= $COURSES_LIST[0] ?>';
        toggleProgramInput(select.value);
    } else {
        select.value = 'Other';
        toggleProgramInput('Other');
    }
}
</script>

<?php require_once __DIR__ . '/footer.php'; ?>
