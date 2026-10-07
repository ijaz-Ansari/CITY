export interface Student {
  id: string;
  rollNo: string;
  regNo?: string;
  fullName: string;
  fatherName: string;
  phone: string;
  guardianPhone?: string;
  cnic: string;
  program: string;
  session: string;
  admissionDate: string;
  totalAgreedFee: number;
  discount: number;
  netPayableFee: number;
  address: string;
  status: 'active' | 'completed' | 'struck_off';
  createdAt: string;
  notes?: string;
  photo?: string; // Optional student picture base64 data URI
}

export type ExpenseCategory = 
  | 'Salary' 
  | 'Utility Bills' 
  | 'Generator & Fuel' 
  | 'Lab Consumables' 
  | 'Office & Stationery' 
  | 'Building Rent' 
  | 'Internet & IT' 
  | 'Refreshment' 
  | 'Maintenance' 
  | 'Marketing' 
  | 'Miscellaneous';

export interface Expense {
  id: string;
  voucherNo: string;
  date: string;
  category: ExpenseCategory | string;
  title: string;
  amount: number;
  paymentMethod: 'Cash' | 'Bank Transfer' | 'JazzCash' | 'EasyPaisa' | 'Cheque';
  payee: string;
  receiptRef?: string;
  recordedBy: string;
  notes?: string;
  createdAt: string;
}

export interface FeeTransaction {
  id: string;
  receiptNo: string;
  studentId: string;
  studentRollNo: string;
  studentName: string;
  program: string;
  amount: number; // Current deposited amount
  date: string;
  paymentMethod: 'Cash' | 'EasyPaisa' | 'JazzCash' | 'Bank Transfer' | 'Cheque';
  referenceNo?: string;
  remarks?: string; // e.g. "Monthly Installment", "Admission fee installment"
  receivedBy: string;
  previousBalance: number;
  remainingBalance: number;
  createdAt: string;
}

export interface InstituteInfo {
  name: string;
  subtitle: string;
  address: string;
  phones: string[];
  email: string;
  regNote: string;
}

export type UserRole = 'admin' | 'staff';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  password?: string;
  createdAt: string;
}
