import { Student, FeeTransaction, User, Expense } from '../types';

const STUDENTS_KEY = 'citycon_students_data_v1';
const TRANSACTIONS_KEY = 'citycon_transactions_data_v1';
const USERS_KEY = 'citycon_users_data_v1';
const CURRENT_USER_KEY = 'citycon_current_user_v1';
const EXPENSES_KEY = 'citycon_expenses_data_v1';

const INITIAL_EXPENSES: Expense[] = [
  {
    id: 'exp-1',
    voucherNo: 'EXP-24-001',
    date: '2024-08-20',
    category: 'Lab Consumables',
    title: 'Microscope Slides, Blood Cell Counters & Reagents',
    amount: 18500,
    paymentMethod: 'Cash',
    payee: 'Lahore Scientific & Med Supplies',
    receiptRef: 'INV-9021',
    recordedBy: 'Accounts Office',
    notes: 'For MLT & Pharmacy Practical Sessions',
    createdAt: '2024-08-20T10:30:00.000Z'
  },
  {
    id: 'exp-2',
    voucherNo: 'EXP-24-002',
    date: '2024-09-02',
    category: 'Utility Bills',
    title: 'Electricity GEPCO Commercial Meter Bill (August)',
    amount: 32400,
    paymentMethod: 'Bank Transfer',
    payee: 'GEPCO Nowshera Virkan Sub-division',
    receiptRef: 'GEP-24-8812',
    recordedBy: 'Accounts Office',
    notes: 'Paid via Online Bank Transfer',
    createdAt: '2024-09-02T11:15:00.000Z'
  },
  {
    id: 'exp-3',
    voucherNo: 'EXP-24-003',
    date: '2024-09-05',
    category: 'Marketing',
    title: 'Admission Flex Banners, Prospectus & Flyers Printing',
    amount: 25000,
    paymentMethod: 'Cash',
    payee: 'Al-Madina Art Press Nowshera Virkan',
    receiptRef: 'AP-1044',
    recordedBy: 'Admission Desk',
    notes: 'For 2024-2026 Batch Admissions campaign',
    createdAt: '2024-09-05T14:20:00.000Z'
  },
  {
    id: 'exp-4',
    voucherNo: 'EXP-24-004',
    date: '2024-09-10',
    category: 'Generator & Fuel',
    title: 'Diesel 60 Litres for Backup Power Generator',
    amount: 16800,
    paymentMethod: 'Cash',
    payee: 'Total Parco Filling Station, Gujranwala Road',
    receiptRef: 'TOT-5512',
    recordedBy: 'Admin Office',
    notes: 'Emergency power backup during load shedding',
    createdAt: '2024-09-10T16:00:00.000Z'
  },
  {
    id: 'exp-5',
    voucherNo: 'EXP-24-005',
    date: '2024-09-15',
    category: 'Office & Stationery',
    title: 'Paper Reams, Student File Folders, Receipt Pads & Pens',
    amount: 9500,
    paymentMethod: 'Cash',
    payee: 'Bismillah Book Depot Main Bazaar',
    receiptRef: 'BBD-789',
    recordedBy: 'Accounts Office',
    notes: 'Stationery for office and exam recording',
    createdAt: '2024-09-15T09:45:00.000Z'
  }
];

const INITIAL_USERS: User[] = [
  {
    id: 'usr-admin-1',
    name: 'Administrator',
    email: 'admin@citycon.edu.pk',
    role: 'admin',
    password: 'admin123',
    createdAt: '2024-01-01T00:00:00.000Z'
  },
  {
    id: 'usr-staff-1',
    name: 'Accounts Staff',
    email: 'staff@citycon.edu.pk',
    role: 'staff',
    password: 'staff123',
    createdAt: '2024-01-01T00:00:00.000Z'
  }
];

const INITIAL_STUDENTS: Student[] = [
  {
    id: 'std-001',
    rollNo: 'CCN-2024-001',
    regNo: 'PB-PC-2401',
    fullName: 'Muhammad Usman Ali',
    fatherName: 'Tariq Mehmood',
    phone: '0300-7412589',
    guardianPhone: '0321-7412589',
    cnic: '34101-7894561-1',
    program: 'Pharmacy Technician (Category-B)',
    session: '2024-2026',
    admissionDate: '2024-08-15',
    totalAgreedFee: 160000,
    discount: 10000,
    netPayableFee: 150000,
    address: 'Mohallah Farooq Nagar, Nowshera Virkan',
    status: 'active',
    createdAt: '2024-08-15T10:00:00.000Z',
    notes: 'Merit scholarship of Rs. 10,000 granted on matric marks'
  },
  {
    id: 'std-002',
    rollNo: 'CCN-2024-002',
    regNo: 'PB-MF-2402',
    fullName: 'Ayesha Bibi',
    fatherName: 'Muhammad Aslam',
    phone: '0304-9876543',
    guardianPhone: '0301-4455667',
    cnic: '34101-4567890-2',
    program: 'Medical Laboratory Technology (MLT)',
    session: '2024-2026',
    admissionDate: '2024-08-18',
    totalAgreedFee: 140000,
    discount: 5000,
    netPayableFee: 135000,
    address: 'Near Old Bus Stand, Mutto Bahikay Road, Nowshera Virkan',
    status: 'active',
    createdAt: '2024-08-18T11:30:00.000Z',
    notes: 'Special concession'
  },
  {
    id: 'std-003',
    rollNo: 'CCN-2024-003',
    regNo: 'PB-DP-2403',
    fullName: 'Hamza Farooq',
    fatherName: 'Farooq Ahmad Cheema',
    phone: '0312-5566778',
    guardianPhone: '0302-6605216',
    cnic: '34101-1234567-3',
    program: 'Dispenser Course',
    session: '2024-2025',
    admissionDate: '2024-09-01',
    totalAgreedFee: 80000,
    discount: 0,
    netPayableFee: 80000,
    address: 'Village Dera Gujran, Tehsil Nowshera Virkan, Distt Gujranwala',
    status: 'active',
    createdAt: '2024-09-01T09:15:00.000Z',
    notes: 'Regular admission'
  },
  {
    id: 'std-004',
    rollNo: 'CCN-2024-004',
    regNo: 'PB-OT-2404',
    fullName: 'Zainab Fatima',
    fatherName: 'Liaqat Ali Virk',
    phone: '0322-8899001',
    guardianPhone: '0321-8420446',
    cnic: '34101-8901234-4',
    program: 'Operation Theater Technology (OTT)',
    session: '2024-2026',
    admissionDate: '2024-09-05',
    totalAgreedFee: 150000,
    discount: 15000,
    netPayableFee: 135000,
    address: 'Katchi Abadi, Al-Fatah Road, Nowshera Virkan',
    status: 'active',
    createdAt: '2024-09-05T14:20:00.000Z'
  },
  {
    id: 'std-005',
    rollNo: 'CCN-2024-005',
    regNo: 'PB-RIT-2405',
    fullName: 'Bilal Hassan',
    fatherName: 'Hassan Raza',
    phone: '0345-1122334',
    guardianPhone: '0300-3344556',
    cnic: '34101-9988776-5',
    program: 'Radiography & Imaging Technology (RIT)',
    session: '2024-2026',
    admissionDate: '2024-09-10',
    totalAgreedFee: 145000,
    discount: 0,
    netPayableFee: 145000,
    address: 'Main Bazaar, Qila Didar Singh Road, Nowshera Virkan',
    status: 'active',
    createdAt: '2024-09-10T16:00:00.000Z'
  }
];

const INITIAL_TRANSACTIONS: FeeTransaction[] = [
  // Student 1 (Usman Ali): Total 150,000. Paid 40,000 + 30,000 = 70,000. Balance = 80,000
  {
    id: 'tx-001',
    receiptNo: 'RCP-24-001',
    studentId: 'std-001',
    studentRollNo: 'CCN-2024-001',
    studentName: 'Muhammad Usman Ali',
    program: 'Pharmacy Technician (Category-B)',
    amount: 40000,
    date: '2024-08-15',
    paymentMethod: 'Cash',
    remarks: 'Admission & 1st Installment Fee',
    receivedBy: 'Accounts Office',
    previousBalance: 150000,
    remainingBalance: 110000,
    createdAt: '2024-08-15T10:30:00.000Z'
  },
  {
    id: 'tx-002',
    receiptNo: 'RCP-24-042',
    studentId: 'std-001',
    studentRollNo: 'CCN-2024-001',
    studentName: 'Muhammad Usman Ali',
    program: 'Pharmacy Technician (Category-B)',
    amount: 30000,
    date: '2024-11-10',
    paymentMethod: 'JazzCash',
    referenceNo: 'JC-8829103',
    remarks: '2nd Semester / Quarterly Installment',
    receivedBy: 'Accounts Office',
    previousBalance: 110000,
    remainingBalance: 80000,
    createdAt: '2024-11-10T11:15:00.000Z'
  },
  // Student 2 (Ayesha Bibi): Total 135,000. Paid 50,000 + 35,000 = 85,000. Balance = 50,000
  {
    id: 'tx-003',
    receiptNo: 'RCP-24-003',
    studentId: 'std-002',
    studentRollNo: 'CCN-2024-002',
    studentName: 'Ayesha Bibi',
    program: 'Medical Laboratory Technology (MLT)',
    amount: 50000,
    date: '2024-08-18',
    paymentMethod: 'Bank Transfer',
    referenceNo: 'HBL-981204',
    remarks: 'Initial Admission Deposit',
    receivedBy: 'Accounts Office',
    previousBalance: 135000,
    remainingBalance: 85000,
    createdAt: '2024-08-18T12:00:00.000Z'
  },
  {
    id: 'tx-004',
    receiptNo: 'RCP-24-055',
    studentId: 'std-002',
    studentRollNo: 'CCN-2024-002',
    studentName: 'Ayesha Bibi',
    program: 'Medical Laboratory Technology (MLT)',
    amount: 35000,
    date: '2024-12-05',
    paymentMethod: 'Cash',
    remarks: 'Term 2 Fee Deposit',
    receivedBy: 'Accounts Office',
    previousBalance: 85000,
    remainingBalance: 50000,
    createdAt: '2024-12-05T10:45:00.000Z'
  },
  // Student 3 (Hamza Farooq): Total 80,000. Paid 40,000. Balance = 40,000
  {
    id: 'tx-005',
    receiptNo: 'RCP-24-012',
    studentId: 'std-003',
    studentRollNo: 'CCN-2024-003',
    studentName: 'Hamza Farooq',
    program: 'Dispenser Course',
    amount: 40000,
    date: '2024-09-01',
    paymentMethod: 'Cash',
    remarks: '50% Initial Payment at Admission',
    receivedBy: 'Accounts Office',
    previousBalance: 80000,
    remainingBalance: 40000,
    createdAt: '2024-09-01T10:00:00.000Z'
  },
  // Student 4 (Zainab Fatima): Total 135,000. Paid 70,000. Balance = 65,000
  {
    id: 'tx-006',
    receiptNo: 'RCP-24-018',
    studentId: 'std-004',
    studentRollNo: 'CCN-2024-004',
    studentName: 'Zainab Fatima',
    program: 'Operation Theater Technology (OTT)',
    amount: 70000,
    date: '2024-09-05',
    paymentMethod: 'EasyPaisa',
    referenceNo: 'EP-4411902',
    remarks: 'Semester 1 Tuition & Lab Charges',
    receivedBy: 'Accounts Office',
    previousBalance: 135000,
    remainingBalance: 65000,
    createdAt: '2024-09-05T15:00:00.000Z'
  }
];

export function getStudents(): Student[] {
  try {
    const raw = localStorage.getItem(STUDENTS_KEY);
    if (!raw) {
      localStorage.setItem(STUDENTS_KEY, JSON.stringify(INITIAL_STUDENTS));
      return INITIAL_STUDENTS;
    }
    return JSON.parse(raw);
  } catch (err) {
    console.error('Failed to read students from localStorage:', err);
    return INITIAL_STUDENTS;
  }
}

export function saveStudents(students: Student[]): void {
  try {
    localStorage.setItem(STUDENTS_KEY, JSON.stringify(students));
  } catch (err) {
    console.error('Failed to save students to localStorage:', err);
  }
}

export function getTransactions(): FeeTransaction[] {
  try {
    const raw = localStorage.getItem(TRANSACTIONS_KEY);
    if (!raw) {
      localStorage.setItem(TRANSACTIONS_KEY, JSON.stringify(INITIAL_TRANSACTIONS));
      return INITIAL_TRANSACTIONS;
    }
    return JSON.parse(raw);
  } catch (err) {
    console.error('Failed to read transactions from localStorage:', err);
    return INITIAL_TRANSACTIONS;
  }
}

export function saveTransactions(txs: FeeTransaction[]): void {
  try {
    localStorage.setItem(TRANSACTIONS_KEY, JSON.stringify(txs));
  } catch (err) {
    console.error('Failed to save transactions to localStorage:', err);
  }
}

export function getStudentBalance(studentId: string): {
  netPayable: number;
  totalPaid: number;
  remainingBalance: number;
} {
  const students = getStudents();
  const student = students.find((s) => s.id === studentId);
  if (!student) {
    return { netPayable: 0, totalPaid: 0, remainingBalance: 0 };
  }

  const txs = getTransactions().filter((t) => t.studentId === studentId);
  const totalPaid = txs.reduce((sum, t) => sum + (Number(t.amount) || 0), 0);
  const netPayable = Number(student.netPayableFee) || 0;
  const remainingBalance = Math.max(0, netPayable - totalPaid);

  return { netPayable, totalPaid, remainingBalance };
}

export function getStudentPaymentHistory(studentId: string): FeeTransaction[] {
  const txs = getTransactions();
  return txs
    .filter((t) => t.studentId === studentId)
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
}

export function generateNextReceiptNo(): string {
  const txs = getTransactions();
  const yearSuffix = new Date().getFullYear().toString().slice(-2);
  const currentCount = txs.length + 1;
  const padded = String(currentCount).padStart(3, '0');
  return `RCP-${yearSuffix}-${padded}`;
}

export function generateNextRollNo(program: string): string {
  const students = getStudents();
  const year = new Date().getFullYear();
  const count = students.length + 1;
  return `CCN-${year}-${String(count).padStart(3, '0')}`;
}

export function addStudent(newStudent: Omit<Student, 'id' | 'createdAt'>): Student {
  const students = getStudents();
  const id = 'std-' + Date.now() + '-' + Math.random().toString(36).substring(2, 7);
  const created: Student = {
    ...newStudent,
    id,
    createdAt: new Date().toISOString()
  };
  const updated = [created, ...students];
  saveStudents(updated);
  return created;
}

export function updateStudent(id: string, updates: Partial<Student>): Student | null {
  const students = getStudents();
  const idx = students.findIndex((s) => s.id === id);
  if (idx === -1) return null;
  students[idx] = { ...students[idx], ...updates };
  saveStudents(students);
  return students[idx];
}

export function deleteStudent(id: string): boolean {
  const students = getStudents();
  const filtered = students.filter((s) => s.id !== id);
  if (filtered.length === students.length) return false;
  saveStudents(filtered);
  // Also clean up transactions
  const txs = getTransactions().filter((t) => t.studentId !== id);
  saveTransactions(txs);
  return true;
}

export function recordPayment(payment: {
  studentId: string;
  amount: number;
  paymentMethod: FeeTransaction['paymentMethod'];
  referenceNo?: string;
  remarks?: string;
  date?: string;
  receivedBy?: string;
}): FeeTransaction {
  const students = getStudents();
  const student = students.find((s) => s.id === payment.studentId);
  if (!student) {
    throw new Error('Student not found');
  }

  const { remainingBalance: prevBal } = getStudentBalance(payment.studentId);
  const depositAmount = Number(payment.amount);
  const newBal = Math.max(0, prevBal - depositAmount);

  const receiptNo = generateNextReceiptNo();
  const tx: FeeTransaction = {
    id: 'tx-' + Date.now() + '-' + Math.random().toString(36).substring(2, 7),
    receiptNo,
    studentId: student.id,
    studentRollNo: student.rollNo,
    studentName: student.fullName,
    program: student.program,
    amount: depositAmount,
    date: payment.date || new Date().toISOString().split('T')[0],
    paymentMethod: payment.paymentMethod || 'Cash',
    referenceNo: payment.referenceNo || '',
    remarks: payment.remarks || 'Fee Installment Deposit',
    receivedBy: payment.receivedBy || 'Accounts Officer',
    previousBalance: prevBal,
    remainingBalance: newBal,
    createdAt: new Date().toISOString()
  };

  const txs = getTransactions();
  saveTransactions([tx, ...txs]);
  return tx;
}

export function exportBackupJSON(): void {
  const data = {
    institute: 'City Con & Allied Health Sciences Nowshera Virkan',
    exportedAt: new Date().toISOString(),
    students: getStudents(),
    transactions: getTransactions(),
    expenses: getExpenses()
  };
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `CityCon_FeeSystem_Backup_${new Date().toISOString().split('T')[0]}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

export function importBackupJSON(jsonData: string): boolean {
  try {
    const parsed = JSON.parse(jsonData);
    if (Array.isArray(parsed.students) && Array.isArray(parsed.transactions)) {
      saveStudents(parsed.students);
      saveTransactions(parsed.transactions);
      if (Array.isArray(parsed.expenses)) {
        saveExpenses(parsed.expenses);
      }
      return true;
    }
    return false;
  } catch (e) {
    console.error('Import error:', e);
    return false;
  }
}

export function resetDemoData(): void {
  localStorage.setItem(STUDENTS_KEY, JSON.stringify(INITIAL_STUDENTS));
  localStorage.setItem(TRANSACTIONS_KEY, JSON.stringify(INITIAL_TRANSACTIONS));
  localStorage.setItem(USERS_KEY, JSON.stringify(INITIAL_USERS));
  localStorage.setItem(EXPENSES_KEY, JSON.stringify(INITIAL_EXPENSES));
}

// ----------------------------------------------------
// EXPENSE BOOK STORAGE & MANAGEMENT
// ----------------------------------------------------

export function getExpenses(): Expense[] {
  try {
    const raw = localStorage.getItem(EXPENSES_KEY);
    if (!raw) {
      localStorage.setItem(EXPENSES_KEY, JSON.stringify(INITIAL_EXPENSES));
      return INITIAL_EXPENSES;
    }
    return JSON.parse(raw);
  } catch (e) {
    console.error('Error reading expenses from storage:', e);
    return INITIAL_EXPENSES;
  }
}

export function saveExpenses(expenses: Expense[]): void {
  try {
    localStorage.setItem(EXPENSES_KEY, JSON.stringify(expenses));
  } catch (e) {
    console.error('Error saving expenses:', e);
  }
}

export function generateNextExpenseVoucherNo(): string {
  const expenses = getExpenses();
  const yearSuffix = new Date().getFullYear().toString().slice(-2);
  const prefix = `EXP-${yearSuffix}-`;
  
  let maxSeq = 0;
  for (const exp of expenses) {
    if (exp.voucherNo && exp.voucherNo.startsWith(prefix)) {
      const part = parseInt(exp.voucherNo.replace(prefix, ''), 10);
      if (!isNaN(part) && part > maxSeq) {
        maxSeq = part;
      }
    }
  }
  return `${prefix}${String(maxSeq + 1).padStart(3, '0')}`;
}

export function saveExpense(expenseData: Omit<Expense, 'id' | 'voucherNo' | 'createdAt'> & { id?: string; voucherNo?: string }): Expense {
  const expenses = getExpenses();
  const voucherNo = expenseData.voucherNo || generateNextExpenseVoucherNo();
  const id = expenseData.id || `exp-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;
  
  const newExpense: Expense = {
    ...expenseData,
    id,
    voucherNo,
    createdAt: new Date().toISOString()
  };

  const existingIdx = expenses.findIndex(e => e.id === id);
  let updated: Expense[];
  if (existingIdx >= 0) {
    updated = [...expenses];
    updated[existingIdx] = newExpense;
  } else {
    updated = [newExpense, ...expenses];
  }

  saveExpenses(updated);
  return newExpense;
}

export function deleteExpense(id: string): boolean {
  const expenses = getExpenses();
  const filtered = expenses.filter(e => e.id !== id);
  if (filtered.length === expenses.length) return false;
  saveExpenses(filtered);
  return true;
}

// User Authentication and Role Management
export function getUsers(): User[] {
  try {
    const raw = localStorage.getItem(USERS_KEY);
    if (!raw) {
      localStorage.setItem(USERS_KEY, JSON.stringify(INITIAL_USERS));
      return INITIAL_USERS;
    }
    return JSON.parse(raw);
  } catch (e) {
    console.error('Error reading users from storage:', e);
    return INITIAL_USERS;
  }
}

export function saveUsers(users: User[]): void {
  try {
    localStorage.setItem(USERS_KEY, JSON.stringify(users));
  } catch (e) {
    console.error('Error saving users to storage:', e);
  }
}

export function getCurrentUser(): User | null {
  try {
    const raw = localStorage.getItem(CURRENT_USER_KEY);
    if (!raw) {
      // Default to initial admin for smooth development preview
      const defaultUser = INITIAL_USERS[0];
      localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(defaultUser));
      return defaultUser;
    }
    return JSON.parse(raw);
  } catch (e) {
    return INITIAL_USERS[0];
  }
}

export function setCurrentUser(user: User | null): void {
  if (!user) {
    localStorage.removeItem(CURRENT_USER_KEY);
  } else {
    localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user));
  }
}

export function registerUser(newUser: Omit<User, 'id' | 'createdAt'>): { success: boolean; error?: string; user?: User } {
  const users = getUsers();
  const emailNorm = newUser.email.trim().toLowerCase();
  
  if (users.some(u => u.email.toLowerCase() === emailNorm)) {
    return { success: false, error: 'An account with this email address already exists.' };
  }

  const user: User = {
    ...newUser,
    email: emailNorm,
    id: `usr-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
    createdAt: new Date().toISOString()
  };

  users.push(user);
  saveUsers(users);
  setCurrentUser(user);
  return { success: true, user };
}

export function loginUser(emailOrUsername: string, password: string): { success: boolean; error?: string; user?: User } {
  const users = getUsers();
  const search = emailOrUsername.trim().toLowerCase();
  
  const user = users.find(u => 
    u.email.toLowerCase() === search || 
    u.name.toLowerCase() === search
  );

  if (!user) {
    return { success: false, error: 'User account not found. Please check your email or sign up.' };
  }

  if (user.password !== password) {
    return { success: false, error: 'Invalid password. Please try again.' };
  }

  setCurrentUser(user);
  return { success: true, user };
}

export function logoutUser(): void {
  setCurrentUser(null);
}

