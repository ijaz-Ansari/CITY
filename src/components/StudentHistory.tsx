import React, { useState, useMemo } from 'react';
import { Student, FeeTransaction } from '../types';
import { getStudents, getTransactions, getStudentBalance, getStudentPaymentHistory, updateStudent, deleteStudent } from '../utils/storage';
import { formatPKR, amountInWords } from '../utils/numberToWords';
import { INSTITUTE_INFO, COURSES_LIST } from '../constants';
import { 
  Search, 
  History, 
  FileText, 
  Printer, 
  CreditCard, 
  Share2, 
  User, 
  Phone, 
  Filter, 
  CheckCircle2, 
  AlertTriangle,
  ChevronRight,
  Edit2,
  Trash2,
  X,
  ExternalLink,
  MessageCircle,
  Copy
} from 'lucide-react';

interface StudentHistoryProps {
  initialSelectedStudentId?: string;
  onSelectStudentForPayment: (studentId: string) => void;
  onViewReceipt: (transaction: FeeTransaction, student: Student) => void;
}

export const StudentHistory: React.FC<StudentHistoryProps> = ({
  initialSelectedStudentId,
  onSelectStudentForPayment,
  onViewReceipt
}) => {
  const [students, setStudents] = useState<Student[]>(() => getStudents());
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProgram, setSelectedProgram] = useState<string>('All');
  const [balanceFilter, setBalanceFilter] = useState<'All' | 'WithBalance' | 'Cleared'>('All');

  // Currently focused student for ledger
  const [activeStudentId, setActiveStudentId] = useState<string | null>(
    initialSelectedStudentId || (students.length > 0 ? students[0].id : null)
  );

  // Edit Student Modal state
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [editForm, setEditForm] = useState<Partial<Student>>({});

  // WhatsApp copy toast state
  const [copiedNotice, setCopiedNotice] = useState<string | null>(null);

  // Filter list of students
  const filteredStudents = useMemo(() => {
    let list = [...students];

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(
        (s) =>
          s.fullName.toLowerCase().includes(q) ||
          s.rollNo.toLowerCase().includes(q) ||
          s.phone.toLowerCase().includes(q) ||
          s.fatherName.toLowerCase().includes(q) ||
          s.cnic.toLowerCase().includes(q)
      );
    }

    if (selectedProgram !== 'All') {
      list = list.filter((s) => s.program === selectedProgram);
    }

    if (balanceFilter === 'WithBalance') {
      list = list.filter((s) => {
        const bal = getStudentBalance(s.id);
        return bal.remainingBalance > 0;
      });
    } else if (balanceFilter === 'Cleared') {
      list = list.filter((s) => {
        const bal = getStudentBalance(s.id);
        return bal.remainingBalance === 0;
      });
    }

    return list;
  }, [students, searchQuery, selectedProgram, balanceFilter]);

  const activeStudent = useMemo(() => {
    if (!activeStudentId) return null;
    return students.find((s) => s.id === activeStudentId) || null;
  }, [students, activeStudentId]);

  const activeStudentHistory = useMemo(() => {
    if (!activeStudentId) return [];
    return getStudentPaymentHistory(activeStudentId);
  }, [activeStudentId]);

  const activeStudentBalance = useMemo(() => {
    if (!activeStudentId) return { netPayable: 0, totalPaid: 0, remainingBalance: 0 };
    return getStudentBalance(activeStudentId);
  }, [activeStudentId]);

  const handleEditClick = (st: Student) => {
    setEditingStudent(st);
    setEditForm({
      fullName: st.fullName,
      fatherName: st.fatherName,
      phone: st.phone,
      guardianPhone: st.guardianPhone || '',
      cnic: st.cnic,
      address: st.address,
      notes: st.notes || '',
      totalAgreedFee: st.totalAgreedFee,
      discount: st.discount,
      netPayableFee: st.netPayableFee
    });
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingStudent) return;

    const total = Number(editForm.totalAgreedFee) || 0;
    const disc = Number(editForm.discount) || 0;
    const net = Math.max(0, total - disc);

    const updated = updateStudent(editingStudent.id, {
      fullName: editForm.fullName?.trim() || editingStudent.fullName,
      fatherName: editForm.fatherName?.trim() || editingStudent.fatherName,
      phone: editForm.phone?.trim() || editingStudent.phone,
      guardianPhone: editForm.guardianPhone?.trim(),
      cnic: editForm.cnic?.trim() || editingStudent.cnic,
      address: editForm.address?.trim() || editingStudent.address,
      notes: editForm.notes?.trim(),
      totalAgreedFee: total,
      discount: disc,
      netPayableFee: net
    });

    if (updated) {
      const refreshed = getStudents();
      setStudents(refreshed);
      setEditingStudent(null);
    }
  };

  const handleDelete = (id: string, name: string) => {
    const confirm = window.confirm(
      `Are you sure you want to delete ${name}'s record and all associated payment transactions? This action cannot be undone.`
    );
    if (!confirm) return;

    deleteStudent(id);
    const refreshed = getStudents();
    setStudents(refreshed);
    if (activeStudentId === id) {
      setActiveStudentId(refreshed.length > 0 ? refreshed[0].id : null);
    }
  };

  // WhatsApp Reminder Message Generator
  const generateWhatsAppMessage = (st: Student) => {
    const bal = getStudentBalance(st.id);
    const text = `*City Con & Allied Health Sciences Nowshera Virkan*\n` +
      `Fee Reminder & Statement\n` +
      `---------------------------------\n` +
      `Student Name: ${st.fullName}\n` +
      `Roll No: ${st.rollNo}\n` +
      `Program: ${st.program}\n` +
      `Total Course Fee: Rs. ${st.netPayableFee.toLocaleString()}\n` +
      `Total Deposited: Rs. ${bal.totalPaid.toLocaleString()}\n` +
      `*Remaining Balance Due: Rs. ${bal.remainingBalance.toLocaleString()}*\n` +
      `---------------------------------\n` +
      `Kindly clear your remaining dues at the accounts office.\n` +
      `Address: ${INSTITUTE_INFO.address}\n` +
      `Contact: ${INSTITUTE_INFO.phones.join(' / ')}`;
    return text;
  };

  const handleCopyWhatsApp = (st: Student) => {
    const msg = generateWhatsAppMessage(st);
    navigator.clipboard.writeText(msg);
    setCopiedNotice(`Fee notice copied for ${st.fullName}!`);
    setTimeout(() => setCopiedNotice(null), 3000);
  };

  const handleOpenWhatsApp = (st: Student) => {
    const rawPhone = st.phone.replace(/[^0-9]/g, '');
    let formatted = rawPhone;
    if (formatted.startsWith('03')) {
      formatted = '92' + formatted.slice(1);
    }
    const msg = encodeURIComponent(generateWhatsAppMessage(st));
    const url = `https://wa.me/${formatted}?text=${msg}`;
    window.open(url, '_blank');
  };

  const handlePrintFullLedger = () => {
    window.print();
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Top Banner */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-red-800 bg-red-50 px-2.5 py-1 rounded-md border border-red-200">
            Student Ledger & Complete Payment Records
          </span>
          <h2 className="text-2xl font-bold text-slate-900 mt-2">
            Student Payment History & Account Statements
          </h2>
          <p className="text-sm text-slate-500">
            Audit trail of every deposited installment, receipts, and balance for all enrolled students.
          </p>
        </div>

        {activeStudent && (
          <div className="flex items-center space-x-2">
            <button
              onClick={() => onSelectStudentForPayment(activeStudent.id)}
              className="inline-flex items-center px-4 py-2 text-xs sm:text-sm font-bold text-white bg-red-700 hover:bg-red-800 active:bg-red-900 rounded-lg shadow-sm transition-colors cursor-pointer"
            >
              <CreditCard className="w-4 h-4 mr-1.5" />
              Collect Fee For {activeStudent.fullName.split(' ')[0]}
            </button>
            <button
              onClick={handlePrintFullLedger}
              className="inline-flex items-center px-3.5 py-2 text-xs sm:text-sm font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
            >
              <Printer className="w-4 h-4 mr-1.5" />
              Print Ledger
            </button>
          </div>
        )}
      </div>

      {copiedNotice && (
        <div className="bg-emerald-50 border border-emerald-300 text-emerald-900 px-4 py-3 rounded-xl text-sm font-medium flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>{copiedNotice}</span>
          </div>
          <span className="text-xs text-emerald-700">Paste in WhatsApp (Ctrl+V)</span>
        </div>
      )}

      {/* Main Grid: Student List on Left, Active Student Ledger on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Student Browser */}
        <div className="lg:col-span-4 bg-white border border-slate-200 rounded-xl p-4 shadow-xs space-y-3">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by Roll No, Name, CNIC..."
              className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-emerald-600 focus:outline-none"
            />
          </div>

          {/* Quick Filters */}
          <div className="grid grid-cols-2 gap-2 text-xs">
            <select
              value={selectedProgram}
              onChange={(e) => setSelectedProgram(e.target.value)}
              className="px-2 py-1.5 border border-slate-300 rounded-md bg-white focus:outline-none text-slate-700"
            >
              <option value="All">All Programs</option>
              {COURSES_LIST.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>

            <select
              value={balanceFilter}
              onChange={(e) => setBalanceFilter(e.target.value as any)}
              className="px-2 py-1.5 border border-slate-300 rounded-md bg-white focus:outline-none text-slate-700"
            >
              <option value="All">All Statuses</option>
              <option value="WithBalance">Pending Dues Only</option>
              <option value="Cleared">Cleared (0 Due)</option>
            </select>
          </div>

          <div className="text-[11px] text-slate-400 font-semibold px-1">
            Found {filteredStudents.length} student records
          </div>

          {/* Students Scrollable List */}
          <div className="space-y-1.5 max-h-[550px] overflow-y-auto pr-1">
            {filteredStudents.length === 0 ? (
              <div className="text-center py-8 text-xs text-slate-400">
                No students match your criteria.
              </div>
            ) : (
              filteredStudents.map((st) => {
                const bal = getStudentBalance(st.id);
                const isActive = st.id === activeStudentId;
                return (
                  <div
                    key={st.id}
                    onClick={() => setActiveStudentId(st.id)}
                    className={`p-3 rounded-lg border cursor-pointer transition-all ${
                      isActive
                        ? 'bg-red-50/90 border-red-500 shadow-xs'
                        : 'bg-white hover:bg-slate-50 border-slate-200'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center space-x-1.5">
                          <span className="font-mono text-[11px] font-bold text-slate-900 bg-slate-100 px-1.5 py-0.5 rounded">
                            {st.rollNo}
                          </span>
                          <span className="text-xs font-bold text-slate-900">
                            {st.fullName}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 truncate max-w-[190px] mt-0.5">
                          {st.program}
                        </p>
                      </div>

                      <div className="text-right">
                        <span
                          className={`text-xs font-mono font-bold block ${
                            bal.remainingBalance === 0 ? 'text-emerald-700' : 'text-red-700'
                          }`}
                        >
                          {bal.remainingBalance === 0 ? 'CLEARED' : formatPKR(bal.remainingBalance)}
                        </span>
                        <span className="text-[10px] text-slate-400">
                          Paid: {formatPKR(bal.totalPaid)}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Column: Full Student Ledger & Timeline */}
        <div className="lg:col-span-8 space-y-5">
          {activeStudent ? (
            <>
              {/* Detailed Student Header Card */}
              <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
                <div className="flex flex-col sm:flex-row sm:items-start justify-between pb-4 border-b border-slate-100 gap-3">
                  <div className="flex items-start space-x-3">
                    <div className="w-14 h-14 rounded-xl bg-red-800 text-white font-extrabold flex items-center justify-center text-xl shadow-sm overflow-hidden shrink-0">
                      {activeStudent.photo ? (
                        <img src={activeStudent.photo} alt={activeStudent.fullName} className="w-full h-full object-cover" />
                      ) : (
                        activeStudent.fullName.charAt(0)
                      )}
                    </div>
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="font-mono text-xs font-bold text-red-900 bg-red-100 px-2 py-0.5 rounded border border-red-200">
                          {activeStudent.rollNo}
                        </span>
                        {activeStudent.regNo && (
                          <span className="font-mono text-xs text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                            Reg: {activeStudent.regNo}
                          </span>
                        )}
                        <h3 className="text-xl font-bold text-slate-900">
                          {activeStudent.fullName}
                        </h3>
                      </div>
                      <p className="text-xs text-slate-600 mt-1">
                        S/O: <span className="font-semibold text-slate-800">{activeStudent.fatherName}</span> · CNIC: <span className="font-mono">{activeStudent.cnic}</span>
                      </p>
                      <p className="text-xs text-red-900 font-semibold mt-0.5">
                        {activeStudent.program} ({activeStudent.session})
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap sm:flex-col items-end gap-1.5">
                    <button
                      onClick={() => handleEditClick(activeStudent)}
                      className="inline-flex items-center px-2.5 py-1 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-md transition-colors cursor-pointer"
                    >
                      <Edit2 className="w-3 h-3 mr-1 text-slate-500" />
                      Edit Student
                    </button>
                    <button
                      onClick={() => handleDelete(activeStudent.id, activeStudent.fullName)}
                      className="inline-flex items-center px-2.5 py-1 text-xs font-medium text-rose-700 bg-rose-50 hover:bg-rose-100 rounded-md transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-3 h-3 mr-1 text-rose-500" />
                      Delete
                    </button>
                  </div>
                </div>

                {/* Contact & Address Bar */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 py-2.5 text-xs text-slate-600 border-b border-slate-100">
                  <div>
                    <span className="text-slate-400">Student Phone:</span>{' '}
                    <span className="font-semibold text-slate-800">{activeStudent.phone}</span>
                  </div>
                  <div>
                    <span className="text-slate-400">Father/Guardian:</span>{' '}
                    <span className="font-semibold text-slate-800">{activeStudent.guardianPhone || activeStudent.phone}</span>
                  </div>
                  <div>
                    <span className="text-slate-400">Address:</span>{' '}
                    <span className="text-slate-700 truncate">{activeStudent.address}</span>
                  </div>
                </div>

                {/* 4 Financial Balances summary */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4 text-center">
                  <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                    <span className="text-[10px] uppercase font-bold text-slate-500 block">Total Agreed</span>
                    <span className="text-sm font-bold font-mono text-slate-800">{formatPKR(activeStudent.totalAgreedFee)}</span>
                  </div>
                  <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                    <span className="text-[10px] uppercase font-bold text-slate-500 block">Scholarship/Disc</span>
                    <span className="text-sm font-bold font-mono text-slate-800">{formatPKR(activeStudent.discount)}</span>
                  </div>
                  <div className="bg-red-50/80 p-2.5 rounded-lg border border-red-200">
                    <span className="text-[10px] uppercase font-bold text-red-900 block">Total Paid To Date</span>
                    <span className="text-sm font-extrabold font-mono text-red-950">{formatPKR(activeStudentBalance.totalPaid)}</span>
                  </div>
                  <div className="bg-rose-50/80 p-2.5 rounded-lg border border-rose-200">
                    <span className="text-[10px] uppercase font-bold text-rose-800 block">Remaining Due</span>
                    <span className="text-sm font-extrabold font-mono text-rose-800">
                      {formatPKR(activeStudentBalance.remainingBalance)}
                    </span>
                  </div>
                </div>

                {/* Quick WhatsApp Reminder Actions */}
                <div className="mt-4 pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2">
                  <div className="text-xs text-slate-500 flex items-center space-x-1">
                    <MessageCircle className="w-4 h-4 text-emerald-600" />
                    <span>Send fee status to student or parent:</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => handleCopyWhatsApp(activeStudent)}
                      className="inline-flex items-center px-2.5 py-1 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-md transition-colors cursor-pointer"
                    >
                      <Copy className="w-3 h-3 mr-1" />
                      Copy Notice
                    </button>
                    <button
                      onClick={() => handleOpenWhatsApp(activeStudent)}
                      className="inline-flex items-center px-3 py-1 text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-800 rounded-md transition-colors cursor-pointer"
                    >
                      <ExternalLink className="w-3 h-3 mr-1" />
                      Open WhatsApp
                    </button>
                  </div>
                </div>
              </div>

              {/* Complete Chronological Deposit History */}
              <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-2">
                    <History className="w-5 h-5 text-red-700" />
                    <h3 className="font-bold text-slate-800 text-base">
                      Complete Deposited History & Receipts Ledger
                    </h3>
                  </div>
                  <span className="text-xs font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                    {activeStudentHistory.length} Total Installments
                  </span>
                </div>

                {activeStudentHistory.length === 0 ? (
                  <div className="text-center py-10 border border-dashed border-slate-200 rounded-lg">
                    <p className="text-sm font-semibold text-slate-600">
                      No fee payments deposited yet for this student.
                    </p>
                    <p className="text-xs text-slate-400 mt-1 mb-3">
                      Remaining full balance is {formatPKR(activeStudentBalance.remainingBalance)}.
                    </p>
                    <button
                      onClick={() => onSelectStudentForPayment(activeStudent.id)}
                      className="inline-flex items-center px-4 py-2 text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-800 rounded-lg cursor-pointer"
                    >
                      <CreditCard className="w-3.5 h-3.5 mr-1.5" />
                      Record First Deposit Now
                    </button>
                  </div>
                ) : (
                  <div className="border border-slate-200 rounded-lg overflow-x-auto">
                    <table className="w-full text-xs text-left">
                      <thead className="bg-slate-100 text-slate-700 uppercase font-bold border-b border-slate-200 text-[10.5px]">
                        <tr>
                          <th className="py-2.5 px-3">Receipt No</th>
                          <th className="py-2.5 px-3">Date</th>
                          <th className="py-2.5 px-3">Installment Remarks</th>
                          <th className="py-2.5 px-3">Payment Mode</th>
                          <th className="py-2.5 px-3 text-right">Deposited</th>
                          <th className="py-2.5 px-3 text-right">Balance Due</th>
                          <th className="py-2.5 px-3 text-center">Double Copy</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {activeStudentHistory.map((tx) => (
                          <tr key={tx.id} className="hover:bg-slate-50 transition-colors">
                            <td className="py-2.5 px-3 font-mono font-bold text-slate-900">
                              {tx.receiptNo}
                            </td>
                            <td className="py-2.5 px-3 whitespace-nowrap text-slate-600">
                              {tx.date}
                            </td>
                            <td className="py-2.5 px-3 text-slate-700">
                              <span className="font-medium">{tx.remarks}</span>
                              {tx.referenceNo && (
                                <span className="block text-[10px] text-slate-400 font-mono">
                                  Ref: {tx.referenceNo}
                                </span>
                              )}
                            </td>
                            <td className="py-2.5 px-3 text-slate-600">
                              {tx.paymentMethod}
                            </td>
                            <td className="py-2.5 px-3 text-right font-mono font-bold text-red-950">
                              {formatPKR(tx.amount)}
                            </td>
                            <td className="py-2.5 px-3 text-right font-mono font-semibold text-slate-700">
                              {formatPKR(tx.remainingBalance)}
                            </td>
                            <td className="py-2.5 px-3 text-center">
                              <button
                                onClick={() => onViewReceipt(tx, activeStudent)}
                                className="inline-flex items-center px-2 py-1 text-[11px] font-semibold text-red-900 bg-red-50 hover:bg-red-100 border border-red-200 rounded cursor-pointer transition-colors"
                                title="View & Print Double Copy Receipt"
                              >
                                <Printer className="w-3 h-3 mr-1" />
                                Receipt
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="bg-white border border-slate-200 rounded-xl p-12 text-center text-slate-400">
              Select a student to view full history and ledger.
            </div>
          )}
        </div>
      </div>

      {/* Edit Student Modal */}
      {editingStudent && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full p-6 space-y-4 border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-900 text-lg">
                Edit Student Details: {editingStudent.fullName}
              </h3>
              <button
                onClick={() => setEditingStudent(null)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Full Name</label>
                  <input
                    type="text"
                    required
                    value={editForm.fullName || ''}
                    onChange={(e) => setEditForm({ ...editForm, fullName: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Father's Name</label>
                  <input
                    type="text"
                    required
                    value={editForm.fatherName || ''}
                    onChange={(e) => setEditForm({ ...editForm, fatherName: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Student Phone</label>
                  <input
                    type="text"
                    required
                    value={editForm.phone || ''}
                    onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Guardian Phone</label>
                  <input
                    type="text"
                    value={editForm.guardianPhone || ''}
                    onChange={(e) => setEditForm({ ...editForm, guardianPhone: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Session / Academic Batch</label>
                  <input
                    type="text"
                    value={editForm.session || ''}
                    onChange={(e) => setEditForm({ ...editForm, session: e.target.value })}
                    placeholder="e.g. 2024-2026 or custom"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-600 font-medium"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Course / Program</label>
                  <input
                    type="text"
                    value={editForm.program || ''}
                    onChange={(e) => setEditForm({ ...editForm, program: e.target.value })}
                    placeholder="e.g. Pharmacy Technician or custom"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-600 font-medium"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Total Agreed Fee</label>
                  <input
                    type="number"
                    value={editForm.totalAgreedFee || 0}
                    onChange={(e) => setEditForm({ ...editForm, totalAgreedFee: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-emerald-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Scholarship / Discount</label>
                  <input
                    type="number"
                    value={editForm.discount || 0}
                    onChange={(e) => setEditForm({ ...editForm, discount: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-emerald-600"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Residential Address</label>
                  <input
                    type="text"
                    value={editForm.address || ''}
                    onChange={(e) => setEditForm({ ...editForm, address: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-600"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end space-x-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingStudent(null)}
                  className="px-4 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-800 rounded-lg cursor-pointer"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
