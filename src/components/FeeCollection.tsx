import React, { useState, useEffect, useMemo } from 'react';
import { Student, FeeTransaction } from '../types';
import { getStudents, getStudentBalance, recordPayment, getTransactions, getStudentPaymentHistory } from '../utils/storage';
import { formatPKR, amountInWords } from '../utils/numberToWords';
import { PAYMENT_METHODS } from '../constants';
import { 
  Search, 
  CreditCard, 
  CheckCircle, 
  Printer, 
  UserCheck, 
  AlertCircle, 
  History,
  Calendar,
  Sparkles,
  ArrowRight
} from 'lucide-react';

interface FeeCollectionProps {
  initialStudentId?: string;
  onPaymentSuccess: (transaction: FeeTransaction, student: Student) => void;
  onViewStudentHistory: (studentId: string) => void;
}

export const FeeCollection: React.FC<FeeCollectionProps> = ({
  initialStudentId,
  onPaymentSuccess,
  onViewStudentHistory
}) => {
  const [students, setStudents] = useState<Student[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);

  // Fee input: "in fee collection page only Amount enter which is current deposited Amount"
  const [amount, setAmount] = useState<number | ''>('');
  const [paymentMethod, setPaymentMethod] = useState<FeeTransaction['paymentMethod']>('Cash');
  const [referenceNo, setReferenceNo] = useState('');
  const [remarks, setRemarks] = useState('Fee Installment Deposit');
  const [paymentDate, setPaymentDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [receivedBy, setReceivedBy] = useState('Accounts Officer');

  const [isProcessing, setIsProcessing] = useState(false);
  const [recentTransaction, setRecentTransaction] = useState<FeeTransaction | null>(null);

  useEffect(() => {
    const list = getStudents();
    setStudents(list);

    if (initialStudentId) {
      const match = list.find((s) => s.id === initialStudentId);
      if (match) {
        setSelectedStudent(match);
      }
    }
  }, [initialStudentId]);

  // Filter students based on search query
  const filteredStudents = useMemo(() => {
    if (!searchQuery.trim()) return students.slice(0, 8);
    const q = searchQuery.toLowerCase().trim();
    return students.filter(
      (s) =>
        s.fullName.toLowerCase().includes(q) ||
        s.rollNo.toLowerCase().includes(q) ||
        s.phone.toLowerCase().includes(q) ||
        s.program.toLowerCase().includes(q) ||
        s.fatherName.toLowerCase().includes(q)
    );
  }, [students, searchQuery]);

  // Current selected student balances
  const balanceInfo = useMemo(() => {
    if (!selectedStudent) return { netPayable: 0, totalPaid: 0, remainingBalance: 0 };
    return getStudentBalance(selectedStudent.id);
  }, [selectedStudent]);

  // Past payment history for the selected student
  const studentHistory = useMemo(() => {
    if (!selectedStudent) return [];
    return getStudentPaymentHistory(selectedStudent.id);
  }, [selectedStudent]);

  const depositNum = Number(amount) || 0;
  const newRemainingBalance = Math.max(0, balanceInfo.remainingBalance - depositNum);

  const [formError, setFormError] = useState<string | null>(null);

  const handleSelectStudent = (st: Student) => {
    setSelectedStudent(st);
    setAmount('');
    setReferenceNo('');
    setRecentTransaction(null);
    setFormError(null);
  };

  const handleQuickAmount = (val: number) => {
    setAmount(val);
    setFormError(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!selectedStudent) {
      setFormError('Please select a student first.');
      return;
    }

    if (!amount || depositNum <= 0) {
      setFormError('Please enter a valid deposited amount greater than 0.');
      return;
    }

    setIsProcessing(true);

    try {
      const tx = recordPayment({
        studentId: selectedStudent.id,
        amount: depositNum,
        paymentMethod,
        referenceNo: referenceNo.trim() || undefined,
        remarks: remarks.trim() || 'Monthly Fee Installment',
        date: paymentDate,
        receivedBy: receivedBy.trim() || 'Accounts Officer'
      });

      setRecentTransaction(tx);
      setAmount('');
      setReferenceNo('');
      setFormError(null);

      // Refresh student data & trigger callback
      const refreshedList = getStudents();
      setStudents(refreshedList);
      const updatedStudent = refreshedList.find((s) => s.id === selectedStudent.id) || selectedStudent;
      setSelectedStudent(updatedStudent);

      onPaymentSuccess(tx, updatedStudent);
    } catch (err: any) {
      setFormError(err.message || 'Error processing fee deposit');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Top Banner */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-200">
            Cashier & Fee Deposit Counter
          </span>
          <h2 className="text-2xl font-bold text-slate-900 mt-2">
            Fee Collection Desk
          </h2>
          <p className="text-sm text-slate-500">
            City Con & Allied Health Sciences Nowshera Virkan · Quick Deposit Entry
          </p>
        </div>

        {selectedStudent && (
          <div className="flex items-center space-x-2">
            <button
              onClick={() => onViewStudentHistory(selectedStudent.id)}
              className="inline-flex items-center px-3.5 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
            >
              <History className="w-4 h-4 mr-1.5 text-slate-600" />
              View Full Student Ledger
            </button>
            <button
              onClick={() => setSelectedStudent(null)}
              className="px-3.5 py-2 text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-lg transition-colors cursor-pointer"
            >
              Switch Student
            </button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Student Search & Selection */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
            <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-3 flex items-center">
              <Search className="w-4 h-4 mr-1.5 text-emerald-700" />
              Select Student by Roll No, Name or Phone
            </h3>

            <div className="relative mb-3">
              <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search Roll No (e.g. CCN-2024), Name, Mobile..."
                className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-600 focus:outline-none"
              />
            </div>

            <div className="space-y-2 max-h-[380px] overflow-y-auto pr-1 divide-y divide-slate-100">
              {filteredStudents.length === 0 ? (
                <div className="text-center py-6 text-slate-400 text-xs">
                  No matching student found for "{searchQuery}".
                </div>
              ) : (
                filteredStudents.map((st) => {
                  const bal = getStudentBalance(st.id);
                  const isSelected = selectedStudent?.id === st.id;
                  return (
                    <div
                      key={st.id}
                      onClick={() => handleSelectStudent(st)}
                      className={`pt-2 pb-2 px-2.5 rounded-lg cursor-pointer transition-all border ${
                        isSelected
                          ? 'bg-red-50/90 border-red-500 shadow-xs'
                          : 'hover:bg-slate-50 border-transparent'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="flex items-center space-x-2">
                            <span className="font-mono text-xs font-bold text-slate-900 bg-slate-100 px-1.5 py-0.5 rounded">
                              {st.rollNo}
                            </span>
                            <span className="font-semibold text-sm text-slate-900">
                              {st.fullName}
                            </span>
                          </div>
                          <p className="text-xs text-slate-500 mt-0.5">
                            S/O: <span className="font-medium text-slate-700">{st.fatherName}</span> · {st.program}
                          </p>
                          <p className="text-[11px] text-slate-400">
                            📱 {st.phone}
                          </p>
                        </div>

                        <div className="text-right">
                          <span className="text-[10px] uppercase font-bold text-slate-400 block">
                            Remaining Due
                          </span>
                          <span
                            className={`text-xs font-mono font-bold ${
                              bal.remainingBalance === 0 ? 'text-emerald-700' : 'text-red-700'
                            }`}
                          >
                            {bal.remainingBalance === 0 ? 'CLEARED' : formatPKR(bal.remainingBalance)}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Quick Info Box */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-xs text-slate-600 space-y-1.5">
            <div className="font-bold text-slate-800 flex items-center">
              <span className="w-2 h-2 rounded-full bg-emerald-600 mr-2"></span>
              Fee Desk Instruction:
            </div>
            <p className="text-slate-600">
              Only enter the <strong>Current Deposited Amount</strong> that the student is paying right now.
            </p>
            <p className="text-slate-500 text-[11px]">
              The system automatically calculates the balance, preserves chronological transaction history, and prints the double copy receipt (Student & Office copy).
            </p>
          </div>
        </div>

        {/* Right Column: Fee Collection Input ("in fee collection page only Amount enter which is current deposited Amount") */}
        <div className="lg:col-span-7 space-y-5">
          {selectedStudent ? (
            <>
              {/* Selected Student Profile Banner */}
              <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 gap-2">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 rounded-xl bg-red-800 text-white font-bold flex items-center justify-center text-lg shadow-sm">
                      {selectedStudent.fullName.charAt(0)}
                    </div>
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="font-mono text-xs font-extrabold text-red-900 bg-red-100 px-2 py-0.5 rounded border border-red-200">
                          {selectedStudent.rollNo}
                        </span>
                        <h3 className="text-lg font-bold text-slate-900">
                          {selectedStudent.fullName}
                        </h3>
                      </div>
                      <p className="text-xs text-slate-500">
                        Father: <span className="font-semibold text-slate-800">{selectedStudent.fatherName}</span> · Program: <span className="font-semibold text-red-900">{selectedStudent.program}</span>
                      </p>
                    </div>
                  </div>

                  <div className="text-left sm:text-right">
                    <span className="text-xs text-slate-400 font-mono">Session: {selectedStudent.session}</span>
                    <p className="text-xs font-semibold text-slate-700">📱 {selectedStudent.phone}</p>
                  </div>
                </div>

                {/* 3 Metric Cards: Total Agreed, Already Paid, Remaining Balance */}
                <div className="grid grid-cols-3 gap-3 mt-4">
                  <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 text-center">
                    <div className="text-[10px] uppercase font-bold text-slate-500">
                      Total Course Fee
                    </div>
                    <div className="text-sm sm:text-base font-extrabold font-mono text-slate-900 mt-0.5">
                      {formatPKR(balanceInfo.netPayable)}
                    </div>
                  </div>

                  <div className="bg-emerald-50/70 p-3 rounded-lg border border-emerald-200 text-center">
                    <div className="text-[10px] uppercase font-bold text-emerald-700">
                      Already Paid
                    </div>
                    <div className="text-sm sm:text-base font-extrabold font-mono text-emerald-800 mt-0.5">
                      {formatPKR(balanceInfo.totalPaid)}
                    </div>
                  </div>

                  <div className="bg-rose-50/80 p-3 rounded-lg border border-rose-200 text-center">
                    <div className="text-[10px] uppercase font-bold text-rose-700">
                      Current Remaining Due
                    </div>
                    <div className="text-sm sm:text-base font-extrabold font-mono text-rose-700 mt-0.5">
                      {formatPKR(balanceInfo.remainingBalance)}
                    </div>
                  </div>
                </div>
              </div>

              {/* CORE FORM: Amount Enter which is Current Deposited Amount */}
              <form onSubmit={handleSubmit} noValidate className="bg-white border-2 border-red-600/80 rounded-xl p-6 shadow-md space-y-5">
                <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                  <div className="flex items-center space-x-2">
                    <CreditCard className="w-5 h-5 text-red-700" />
                    <h3 className="font-extrabold text-slate-900 text-base">
                      Deposit Current Payment
                    </h3>
                  </div>
                  <span className="text-xs text-slate-500 font-medium">
                    Date: <span className="font-semibold text-slate-800">{paymentDate}</span>
                  </span>
                </div>

                {formError && (
                  <div className="bg-rose-50 border border-rose-300 text-rose-800 px-4 py-3 rounded-lg text-xs font-semibold flex items-center space-x-2">
                    <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                    <span>{formError}</span>
                  </div>
                )}

                {/* THE MAIN INPUT: CURRENT DEPOSITED AMOUNT */}
                <div>
                  <label className="block text-sm font-extrabold text-slate-800 mb-1.5">
                    Enter Current Deposited Amount (PKR) <span className="text-rose-600">*</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                      <span className="text-lg font-bold text-red-700 font-mono">Rs.</span>
                    </div>
                    <input
                      type="number"
                      required
                      autoFocus
                      min="1"
                      step="any"
                      inputMode="numeric"
                      value={amount}
                      onChange={(e) => {
                        setFormError(null);
                        setAmount(e.target.value === '' ? '' : Number(e.target.value));
                      }}
                      placeholder="e.g. 15000"
                      className="w-full pl-14 pr-4 py-3.5 text-2xl font-mono font-extrabold text-slate-900 bg-red-50/30 border-2 border-red-600 rounded-xl focus:ring-4 focus:ring-red-600/20 focus:outline-none"
                    />
                  </div>

                  {/* Amount in words & live math */}
                  {depositNum > 0 && (
                    <div className="mt-2.5 p-3 bg-red-50 rounded-lg border border-red-200 flex flex-col sm:flex-row sm:items-center justify-between text-xs gap-2">
                      <div>
                        <span className="text-red-900 font-semibold block">Amount in words:</span>
                        <span className="text-red-950 font-bold italic">
                          {amountInWords(depositNum)}
                        </span>
                      </div>
                      <div className="sm:text-right border-t sm:border-t-0 sm:border-l border-red-200 pt-1.5 sm:pt-0 sm:pl-3">
                        <span className="text-slate-600 block">Remaining Balance after this payment:</span>
                        <span className="text-sm font-extrabold font-mono text-red-950">
                          {formatPKR(newRemainingBalance)}
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Quick preset buttons */}
                  <div className="mt-3 flex flex-wrap items-center gap-1.5">
                    <span className="text-[11px] font-semibold text-slate-400 mr-1">Quick Fill:</span>
                    {balanceInfo.remainingBalance > 0 && (
                      <button
                        type="button"
                        onClick={() => handleQuickAmount(balanceInfo.remainingBalance)}
                        className="px-2.5 py-1 text-xs font-bold text-red-800 bg-red-50 hover:bg-red-100 border border-red-200 rounded-md transition-colors cursor-pointer"
                      >
                        Full Balance ({formatPKR(balanceInfo.remainingBalance)})
                      </button>
                    )}
                    {[5000, 10000, 15000, 20000, 25000, 30000].map((val) => (
                      <button
                        key={val}
                        type="button"
                        onClick={() => handleQuickAmount(val)}
                        className="px-2.5 py-1 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-md transition-colors cursor-pointer"
                      >
                        {val.toLocaleString()}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Additional Payment Metadata */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2 border-t border-slate-100">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Payment Mode
                    </label>
                    <select
                      value={paymentMethod}
                      onChange={(e) => setPaymentMethod(e.target.value as any)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-red-600 focus:outline-none"
                    >
                      {PAYMENT_METHODS.map((m) => (
                        <option key={m} value={m}>{m}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Reference / Trx ID / Cheque # (Optional)
                    </label>
                    <input
                      type="text"
                      value={referenceNo}
                      onChange={(e) => setReferenceNo(e.target.value)}
                      placeholder="e.g. JazzCash ID, Slip #"
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-red-600 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Payment Date
                    </label>
                    <input
                      type="date"
                      value={paymentDate}
                      onChange={(e) => setPaymentDate(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-red-600 focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Remarks / Installment Description
                  </label>
                  <input
                    type="text"
                    value={remarks}
                    onChange={(e) => setRemarks(e.target.value)}
                    placeholder="e.g. 2nd Installment, Exam Fee & Lab, March Fee"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-red-600 focus:outline-none"
                  />
                </div>

                {/* Submit Action */}
                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={isProcessing || depositNum <= 0}
                    className="w-full py-3.5 px-6 text-base font-extrabold text-white bg-red-700 hover:bg-red-800 active:bg-red-900 rounded-xl shadow-md transition-all flex items-center justify-center space-x-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Printer className="w-5 h-5" />
                    <span>
                      {isProcessing
                        ? 'Recording Deposit...'
                        : `Collect ${depositNum > 0 ? formatPKR(depositNum) : ''} & Generate Double Copy Receipt`}
                    </span>
                  </button>
                </div>
              </form>

              {/* Past Deposited Records Preview for Selected Student */}
              {studentHistory.length > 0 && (
                <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center">
                      <History className="w-3.5 h-3.5 mr-1 text-red-700" />
                      Past Deposited Records ({studentHistory.length} installments)
                    </h4>
                    <span className="text-xs text-slate-500 font-mono">
                      Total Paid: {formatPKR(balanceInfo.totalPaid)}
                    </span>
                  </div>

                  <div className="border border-slate-200 rounded-lg overflow-x-auto">
                    <table className="w-full text-xs text-left">
                      <thead className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-200">
                        <tr>
                          <th className="py-2 px-3">Receipt #</th>
                          <th className="py-2 px-3">Date</th>
                          <th className="py-2 px-3">Mode</th>
                          <th className="py-2 px-3 text-right">Deposited</th>
                          <th className="py-2 px-3 text-right">Balance Due</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {studentHistory.map((rec) => (
                          <tr key={rec.id} className="hover:bg-slate-50/70">
                            <td className="py-2 px-3 font-mono font-bold text-slate-800">{rec.receiptNo}</td>
                            <td className="py-2 px-3 whitespace-nowrap text-slate-600">{rec.date}</td>
                            <td className="py-2 px-3 text-slate-600">{rec.paymentMethod}</td>
                            <td className="py-2 px-3 text-right font-mono font-bold text-red-800">
                              {formatPKR(rec.amount)}
                            </td>
                            <td className="py-2 px-3 text-right font-mono text-slate-700">
                              {formatPKR(rec.remainingBalance)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="bg-white border border-dashed border-slate-300 rounded-xl p-12 text-center shadow-xs">
              <div className="w-16 h-16 rounded-full bg-red-50 text-red-700 flex items-center justify-center mx-auto mb-4">
                <UserCheck className="w-8 h-8" />
              </div>
              <h3 className="text-lg font-bold text-slate-800">
                No Student Selected
              </h3>
              <p className="text-sm text-slate-500 max-w-md mx-auto mt-1 mb-4">
                Please search and select a student from the left panel to deposit their fee and generate a double copy receipt.
              </p>
              <div className="text-xs text-slate-400 font-medium">
                💡 Tip: You can search by Roll No (e.g. CCN-2024-001), full name, or phone number.
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
