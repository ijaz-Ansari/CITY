import React, { useState, useMemo, useRef } from 'react';
import { Student } from '../types';
import { INSTITUTE_INFO, COURSES_LIST, SESSIONS_LIST } from '../constants';
import { getStudents, getStudentBalance } from '../utils/storage';
import { formatPKR, amountInWords } from '../utils/numberToWords';
import { Logo } from './Logo';
import { 
  Printer, 
  Download, 
  FileText, 
  Calendar, 
  CreditCard, 
  Users, 
  Filter, 
  CheckSquare, 
  Square, 
  Search, 
  AlertCircle, 
  Building2, 
  Clock, 
  Sparkles,
  ChevronDown,
  CheckCircle2,
  RefreshCw
} from 'lucide-react';

interface CourseWiseVoucherGeneratorProps {
  onNavigateToCollection?: (studentId: string) => void;
}

export const CourseWiseVoucherGenerator: React.FC<CourseWiseVoucherGeneratorProps> = ({
  onNavigateToCollection
}) => {
  const allStudents = useMemo(() => getStudents(), []);

  // Form State
  const [selectedCourse, setSelectedCourse] = useState<string>(COURSES_LIST[0]);
  const [selectedSession, setSelectedSession] = useState<string>('All');
  
  // Fee Amount asked by system (Primary user requirement)
  const [feeAmount, setFeeAmount] = useState<number | ''>(10000);
  const [feeTitle, setFeeTitle] = useState<string>('Monthly Tuition Fee Voucher');
  const [billingMonth, setBillingMonth] = useState<string>(() => {
    const d = new Date();
    return d.toLocaleString('en-US', { month: 'long', year: 'numeric' });
  });

  // Dates
  const [issueDate, setIssueDate] = useState<string>(() => new Date().toISOString().split('T')[0]);
  const [dueDate, setDueDate] = useState<string>(() => {
    const d = new Date();
    d.setDate(d.getDate() + 10);
    return d.toISOString().split('T')[0];
  });
  const [lateFine, setLateFine] = useState<number | ''>(300);

  // Bank / Account Instructions
  const [bankAccountInfo, setBankAccountInfo] = useState<string>(
    'Payable at Allied Bank / Meezan Bank / BOP or at Institute Accounts Counter, Nowshera Virkan'
  );

  // Search filter inside generated batch
  const [studentSearch, setStudentSearch] = useState<string>('');
  
  // Selected student IDs for printing (defaults to all matching students)
  const [selectedStudentIds, setSelectedStudentIds] = useState<Set<string>>(new Set());

  // Distinct courses and sessions from existing students
  const availableCourses = useMemo(() => {
    const set = new Set<string>(COURSES_LIST);
    allStudents.forEach((s) => {
      if (s.program) set.add(s.program);
    });
    return Array.from(set);
  }, [allStudents]);

  const availableSessions = useMemo(() => {
    const set = new Set<string>(SESSIONS_LIST);
    allStudents.forEach((s) => {
      if (s.session) set.add(s.session);
    });
    return ['All', ...Array.from(set)];
  }, [allStudents]);

  // Filter students based on selected course and session
  const enrolledStudents = useMemo(() => {
    return allStudents.filter((s) => {
      const matchCourse = selectedCourse === 'All' || s.program === selectedCourse;
      const matchSession = selectedSession === 'All' || s.session === selectedSession;
      return matchCourse && matchSession;
    });
  }, [allStudents, selectedCourse, selectedSession]);

  // Sync selectedStudentIds when enrolledStudents change
  React.useEffect(() => {
    setSelectedStudentIds(new Set(enrolledStudents.map((s) => s.id)));
  }, [enrolledStudents]);

  // Filtered for viewing
  const displayedStudents = useMemo(() => {
    if (!studentSearch.trim()) return enrolledStudents;
    const q = studentSearch.toLowerCase().trim();
    return enrolledStudents.filter((s) => 
      s.fullName.toLowerCase().includes(q) ||
      s.rollNo.toLowerCase().includes(q) ||
      s.fatherName.toLowerCase().includes(q)
    );
  }, [enrolledStudents, studentSearch]);

  const numericFee = Math.max(0, Number(feeAmount) || 0);
  const numericFine = Math.max(0, Number(lateFine) || 0);

  // Toggle selection
  const handleToggleStudent = (id: string) => {
    const next = new Set(selectedStudentIds);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    setSelectedStudentIds(next);
  };

  const handleSelectAll = () => {
    setSelectedStudentIds(new Set(enrolledStudents.map((s) => s.id)));
  };

  const handleDeselectAll = () => {
    setSelectedStudentIds(new Set());
  };

  // Quick Amount Presets
  const PRESET_AMOUNTS = [3000, 5000, 8000, 10000, 12000, 15000, 20000];

  const handlePrintAll = () => {
    window.print();
  };

  const selectedCount = selectedStudentIds.size;
  const totalBatchBilling = selectedCount * numericFee;

  // Single slip print modal state
  const [singlePrintStudent, setSinglePrintStudent] = useState<Student | null>(null);

  const printableStudents = useMemo(() => {
    return enrolledStudents.filter((s) => selectedStudentIds.has(s.id));
  }, [enrolledStudents, selectedStudentIds]);

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Top Banner */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4 no-print">
        <div>
          <div className="flex items-center space-x-2">
            <span className="text-xs font-bold uppercase tracking-wider text-red-800 bg-red-50 px-2.5 py-1 rounded-md border border-red-200">
              Batch Fee Slip & Challan Issuance
            </span>
            <span className="text-xs font-semibold text-slate-500">
              Course-wise Automatic Generator
            </span>
          </div>
          <h2 className="text-2xl font-extrabold text-slate-900 mt-2">
            Generate Course Fee Vouchers
          </h2>
          <p className="text-sm text-slate-500">
            Select course/program, specify the fee amount, and instantly generate official printable fee slips for all enrolled students.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <button
            type="button"
            onClick={handlePrintAll}
            disabled={printableStudents.length === 0 || numericFee <= 0}
            className="inline-flex items-center px-4 py-2.5 bg-red-700 hover:bg-red-800 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs sm:text-sm font-bold rounded-lg shadow-sm transition-colors cursor-pointer"
          >
            <Printer className="w-4 h-4 mr-2" />
            Print All Vouchers / Save PDF ({selectedCount})
          </button>
        </div>
      </div>

      {/* Control Panel: Course Selection & Fee Amount Input */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs space-y-6 no-print">
        <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Filter className="w-4 h-4 text-red-700" />
            <h3 className="font-bold text-slate-900 text-sm uppercase tracking-wider">
              1. Select Course & Batch Details
            </h3>
          </div>
          <span className="text-xs text-slate-500 font-mono">
            {enrolledStudents.length} Students found in this course
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {/* Course / Program */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Select Allied Health Course / Program <span className="text-rose-500">*</span>
            </label>
            <select
              value={selectedCourse}
              onChange={(e) => setSelectedCourse(e.target.value)}
              className="w-full px-3 py-2.5 border border-slate-300 rounded-lg text-sm bg-white font-semibold text-slate-900 focus:ring-2 focus:ring-red-700 focus:outline-none cursor-pointer"
            >
              <option value="All">All Courses (Whole Institute)</option>
              {availableCourses.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
            <p className="text-[11px] text-slate-400 mt-1">
              Vouchers will be generated for all students enrolled in this program
            </p>
          </div>

          {/* Academic Session / Batch */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Session / Academic Batch
            </label>
            <select
              value={selectedSession}
              onChange={(e) => setSelectedSession(e.target.value)}
              className="w-full px-3 py-2.5 border border-slate-300 rounded-lg text-sm bg-white font-semibold text-slate-900 focus:ring-2 focus:ring-red-700 focus:outline-none cursor-pointer"
            >
              {availableSessions.map((s) => (
                <option key={s} value={s}>{s === 'All' ? 'All Batches (Active)' : s}</option>
              ))}
            </select>
            <p className="text-[11px] text-slate-400 mt-1">
              Filter by specific batch or issue to all active sessions
            </p>
          </div>

          {/* Fee Slip Purpose / Title */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Fee Voucher Title / Purpose <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={feeTitle}
              onChange={(e) => setFeeTitle(e.target.value)}
              placeholder="e.g. Monthly Tuition Fee Voucher"
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm font-semibold text-slate-900 focus:ring-2 focus:ring-red-700 focus:outline-none"
            />
            <p className="text-[11px] text-slate-400 mt-1">
              Printed on the top header of each challan copy
            </p>
          </div>
        </div>

        {/* Section 2: Fee Amount Specification (User prompt emphasis) */}
        <div className="bg-red-50/50 border border-red-200 rounded-xl p-5 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-red-200/60 pb-3">
            <div className="flex items-center space-x-2">
              <CreditCard className="w-5 h-5 text-red-800" />
              <div>
                <h4 className="font-extrabold text-red-950 text-sm uppercase tracking-wide">
                  2. Fee Amount Specification
                </h4>
                <p className="text-xs text-red-800 font-medium">
                  Enter the fee amount to be printed on all student vouchers
                </p>
              </div>
            </div>

            {/* Quick Presets */}
            <div className="flex items-center flex-wrap gap-1.5">
              <span className="text-xs font-bold text-red-900 mr-1">Presets:</span>
              {PRESET_AMOUNTS.map((amt) => (
                <button
                  key={amt}
                  type="button"
                  onClick={() => setFeeAmount(amt)}
                  className={`px-2.5 py-1 text-xs font-bold rounded-md border transition-all cursor-pointer ${
                    feeAmount === amt 
                      ? 'bg-red-800 text-white border-red-900 shadow-2xs' 
                      : 'bg-white text-red-900 border-red-300 hover:bg-red-100'
                  }`}
                >
                  {formatPKR(amt)}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Enter Fee Amount */}
            <div>
              <label className="block text-xs font-extrabold text-slate-800 mb-1">
                Fee Amount (PKR) <span className="text-rose-600">*</span>
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500 font-bold text-xs">
                  Rs.
                </span>
                <input
                  type="number"
                  min="0"
                  step="500"
                  required
                  value={feeAmount}
                  onChange={(e) => setFeeAmount(e.target.value === '' ? '' : Number(e.target.value))}
                  placeholder="Enter fee amount..."
                  className="w-full pl-10 pr-3 py-2.5 border-2 border-red-500 rounded-lg text-base font-extrabold font-mono text-red-950 bg-white focus:ring-2 focus:ring-red-700 focus:outline-none shadow-xs"
                />
              </div>
              <p className="text-[11px] text-red-900 font-semibold mt-1">
                In words: <span className="italic">{numericFee > 0 ? amountInWords(numericFee) : 'Zero'}</span>
              </p>
            </div>

            {/* Issue Date */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Issue Date <span className="text-rose-500">*</span>
              </label>
              <input
                type="date"
                value={issueDate}
                onChange={(e) => setIssueDate(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white font-semibold focus:ring-2 focus:ring-red-700 focus:outline-none"
              />
              <p className="text-[11px] text-slate-400 mt-1">Date of voucher distribution</p>
            </div>

            {/* Due Date */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Due Date <span className="text-rose-500">*</span>
              </label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white font-semibold focus:ring-2 focus:ring-red-700 focus:outline-none"
              />
              <p className="text-[11px] text-slate-400 mt-1">Last date of fee payment without surcharge</p>
            </div>

            {/* Late Fine after Due Date */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Late Fine Surcharge (PKR)
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500 font-bold text-xs">
                  Rs.
                </span>
                <input
                  type="number"
                  min="0"
                  step="100"
                  value={lateFine}
                  onChange={(e) => setLateFine(e.target.value === '' ? '' : Number(e.target.value))}
                  placeholder="300"
                  className="w-full pl-10 pr-3 py-2 border border-slate-300 rounded-lg text-sm bg-white font-bold font-mono text-slate-800 focus:ring-2 focus:ring-red-700 focus:outline-none"
                />
              </div>
              <p className="text-[11px] text-slate-400 mt-1">Added if deposited after due date</p>
            </div>
          </div>

          {/* Bank Instructions */}
          <div className="pt-2">
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Payment & Bank Counter Instructions
            </label>
            <input
              type="text"
              value={bankAccountInfo}
              onChange={(e) => setBankAccountInfo(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs bg-white text-slate-700 focus:ring-2 focus:ring-red-700 focus:outline-none font-medium"
            />
          </div>
        </div>

        {/* Batch Summary Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between">
            <div>
              <span className="text-xs text-slate-500 font-bold uppercase tracking-wider block">Target Course</span>
              <span className="text-sm font-extrabold text-slate-900 mt-0.5 block truncate max-w-[200px]" title={selectedCourse}>
                {selectedCourse}
              </span>
              <span className="text-[11px] text-slate-400">Batch: {selectedSession}</span>
            </div>
            <span className="p-2.5 rounded-lg bg-white border border-slate-200 text-slate-700">
              <Users className="w-5 h-5" />
            </span>
          </div>

          <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between">
            <div>
              <span className="text-xs text-slate-500 font-bold uppercase tracking-wider block">Students Selected</span>
              <div className="text-2xl font-extrabold text-slate-900 font-mono mt-0.5">
                {selectedCount} <span className="text-xs text-slate-400 font-sans font-normal">/ {enrolledStudents.length}</span>
              </div>
              <span className="text-[11px] text-emerald-700 font-bold">Ready to issue</span>
            </div>
            <span className="p-2.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-700">
              <CheckCircle2 className="w-5 h-5" />
            </span>
          </div>

          <div className="p-4 bg-red-50 border border-red-200 rounded-xl flex items-center justify-between">
            <div>
              <span className="text-xs text-red-900 font-bold uppercase tracking-wider block">Total Batch Billable</span>
              <div className="text-2xl font-extrabold text-red-950 font-mono mt-0.5">
                {formatPKR(totalBatchBilling)}
              </div>
              <span className="text-[11px] text-red-800 font-medium">@ {formatPKR(numericFee)} per student</span>
            </div>
            <span className="p-2.5 rounded-lg bg-red-100 border border-red-200 text-red-900">
              <CreditCard className="w-5 h-5" />
            </span>
          </div>
        </div>
      </div>

      {/* Student List & Selection Table (No Print) */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-4 no-print">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
          <div className="flex items-center space-x-3">
            <h3 className="font-bold text-slate-900 text-sm uppercase tracking-wider">
              Enrolled Students for Slip Issuance ({enrolledStudents.length})
            </h3>
            <div className="flex items-center space-x-1.5 text-xs">
              <button
                type="button"
                onClick={handleSelectAll}
                className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded font-semibold transition-colors cursor-pointer"
              >
                Select All
              </button>
              <button
                type="button"
                onClick={handleDeselectAll}
                className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded font-semibold transition-colors cursor-pointer"
              >
                Clear All
              </button>
            </div>
          </div>

          {/* Search box inside batch */}
          <div className="relative max-w-xs w-full">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
            <input
              type="text"
              value={studentSearch}
              onChange={(e) => setStudentSearch(e.target.value)}
              placeholder="Search student in batch..."
              className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:bg-white focus:ring-2 focus:ring-red-700 focus:outline-none"
            />
          </div>
        </div>

        {enrolledStudents.length === 0 ? (
          <div className="py-12 text-center text-slate-500">
            <AlertCircle className="w-8 h-8 text-amber-500 mx-auto mb-2" />
            <p className="font-bold text-slate-800 text-sm">No students currently enrolled in this course</p>
            <p className="text-xs text-slate-400 mt-1">
              Select another course or add new student admissions under "{selectedCourse}".
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200 uppercase text-[10px] tracking-wider">
                <tr>
                  <th className="py-2.5 px-3 w-10 text-center">Include</th>
                  <th className="py-2.5 px-3">Roll No</th>
                  <th className="py-2.5 px-3">Student Name</th>
                  <th className="py-2.5 px-3">Father Name</th>
                  <th className="py-2.5 px-3">Course / Session</th>
                  <th className="py-2.5 px-3 text-right">Agreed Fee</th>
                  <th className="py-2.5 px-3 text-right">Current Due</th>
                  <th className="py-2.5 px-3 text-center">Slip Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {displayedStudents.map((st) => {
                  const balance = getStudentBalance(st.id);
                  const isSelected = selectedStudentIds.has(st.id);
                  return (
                    <tr 
                      key={st.id} 
                      className={`hover:bg-slate-50/80 transition-colors ${isSelected ? 'bg-red-50/10' : 'opacity-60'}`}
                    >
                      <td className="py-2.5 px-3 text-center">
                        <button
                          type="button"
                          onClick={() => handleToggleStudent(st.id)}
                          className="cursor-pointer text-red-700"
                        >
                          {isSelected ? (
                            <CheckSquare className="w-4 h-4 text-red-700" />
                          ) : (
                            <Square className="w-4 h-4 text-slate-300" />
                          )}
                        </button>
                      </td>
                      <td className="py-2.5 px-3 font-mono font-bold text-slate-900">
                        {st.rollNo}
                      </td>
                      <td className="py-2.5 px-3 font-bold text-slate-900">
                        {st.fullName}
                      </td>
                      <td className="py-2.5 px-3 text-slate-600">
                        {st.fatherName}
                      </td>
                      <td className="py-2.5 px-3">
                        <span className="font-semibold text-slate-800">{st.program}</span>
                        <span className="text-[10px] text-slate-400 block">{st.session}</span>
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono font-semibold text-slate-700">
                        {formatPKR(st.netPayableFee)}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono font-bold text-rose-700">
                        {formatPKR(balance.remainingBalance)}
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        <button
                          type="button"
                          onClick={() => setSinglePrintStudent(st)}
                          className="px-2 py-1 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded font-semibold text-[11px] inline-flex items-center space-x-1 cursor-pointer"
                        >
                          <Printer className="w-3 h-3 text-slate-500" />
                          <span>View Slip</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Screen Preview & Printable All Vouchers Section */}
      <div className="space-y-6">
        <div className="flex items-center justify-between no-print">
          <div>
            <h3 className="font-extrabold text-slate-900 text-base">
              Generated Student Fee Slips ({printableStudents.length} Vouchers)
            </h3>
            <p className="text-xs text-slate-500">
              Standard double copy challan (Bank / Accounts Copy & Student Copy) ready for direct printing & PDF export.
            </p>
          </div>

          <button
            type="button"
            onClick={handlePrintAll}
            disabled={printableStudents.length === 0 || numericFee <= 0}
            className="px-4 py-2 bg-red-700 hover:bg-red-800 text-white font-bold text-xs rounded-lg shadow-sm flex items-center space-x-2 cursor-pointer disabled:opacity-50"
          >
            <Printer className="w-4 h-4" />
            <span>Print All ({printableStudents.length})</span>
          </button>
        </div>

        {/* Printable Container for All Vouchers */}
        <div id="course-batch-vouchers-container" className="space-y-6">
          {printableStudents.map((st, idx) => (
            <div 
              key={st.id} 
              className="course-slip-card bg-white border border-slate-300 rounded-xl p-5 shadow-xs page-break-always"
              data-slip-index={idx}
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* 1. BANK / INSTITUTE ACCOUNTS COPY */}
                {renderChallanCopy({
                  copyType: 'BANK / INSTITUTE COPY',
                  student: st,
                  feeTitle,
                  feeAmount: numericFee,
                  lateFine: numericFine,
                  issueDate,
                  dueDate,
                  bankInfo: bankAccountInfo,
                  slipIndex: idx + 1
                })}

                {/* 2. STUDENT COPY */}
                {renderChallanCopy({
                  copyType: 'STUDENT COPY',
                  student: st,
                  feeTitle,
                  feeAmount: numericFee,
                  lateFine: numericFine,
                  issueDate,
                  dueDate,
                  bankInfo: bankAccountInfo,
                  slipIndex: idx + 1
                })}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Single Voucher Preview Modal */}
      {singlePrintStudent && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto no-print">
          <div className="bg-white rounded-2xl max-w-4xl w-full p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div>
                <span className="text-xs font-bold text-red-800 uppercase tracking-wider">Fee Slip Preview</span>
                <h3 className="text-lg font-bold text-slate-900">
                  {singlePrintStudent.fullName} ({singlePrintStudent.rollNo})
                </h3>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="px-3 py-1.5 bg-red-700 hover:bg-red-800 text-white text-xs font-bold rounded-lg flex items-center space-x-1 cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print Slip</span>
                </button>
                <button
                  type="button"
                  onClick={() => setSinglePrintStudent(null)}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-lg cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {renderChallanCopy({
                copyType: 'BANK / INSTITUTE COPY',
                student: singlePrintStudent,
                feeTitle,
                feeAmount: numericFee,
                lateFine: numericFine,
                issueDate,
                dueDate,
                bankInfo: bankAccountInfo,
                slipIndex: 1
              })}

              {renderChallanCopy({
                copyType: 'STUDENT COPY',
                student: singlePrintStudent,
                feeTitle,
                feeAmount: numericFee,
                lateFine: numericFine,
                issueDate,
                dueDate,
                bankInfo: bankAccountInfo,
                slipIndex: 1
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

interface RenderChallanProps {
  copyType: 'BANK / INSTITUTE COPY' | 'STUDENT COPY';
  student: Student;
  feeTitle: string;
  feeAmount: number;
  lateFine: number;
  issueDate: string;
  dueDate: string;
  bankInfo: string;
  slipIndex: number;
}

function renderChallanCopy({
  copyType,
  student,
  feeTitle,
  feeAmount,
  lateFine,
  issueDate,
  dueDate,
  bankInfo,
  slipIndex
}: RenderChallanProps) {
  const challanNo = `CCN-SLIP-${new Date(issueDate).getFullYear()}-${student.rollNo.replace(/[^a-zA-Z0-9]/g, '')}`;
  const totalPayableBeforeDue = feeAmount;
  const totalPayableAfterDue = feeAmount + lateFine;

  return (
    <div className="challan-copy border-2 border-slate-700 rounded-lg p-3.5 text-xs text-slate-800 bg-white flex flex-col justify-between relative shadow-2xs">
      <div>
        {/* Header */}
        <div className="border-b-2 border-slate-700 pb-2 mb-2">
          <div className="flex items-start justify-between">
            <div className="flex items-center space-x-2">
              <div className="p-0.5 rounded-full bg-slate-50 border border-slate-300 shrink-0">
                <Logo size="sm" />
              </div>
              <div>
                <h4 className="text-xs font-extrabold uppercase tracking-tight text-slate-900 leading-tight">
                  {INSTITUTE_INFO.name}
                </h4>
                <p className="text-[10px] font-semibold text-slate-600 leading-tight">
                  {INSTITUTE_INFO.subtitle}
                </p>
              </div>
            </div>

            <div className="text-right">
              <span className={`inline-block px-1.5 py-0.5 font-bold rounded text-[9px] uppercase tracking-wider border ${
                copyType === 'STUDENT COPY' 
                  ? 'bg-emerald-50 text-emerald-900 border-emerald-300' 
                  : 'bg-red-50 text-red-950 border-red-300'
              }`}>
                {copyType}
              </span>
              <p className="text-[9px] text-slate-500 font-mono mt-0.5">
                Challan: <strong className="text-slate-900">{challanNo}</strong>
              </p>
            </div>
          </div>

          <div className="mt-1 flex justify-between items-center text-[9px] text-slate-500 bg-slate-50 px-1.5 py-0.5 rounded border border-slate-200">
            <span>📍 Mutto Bahikay Road, Nowshera Virkan</span>
            <span>📞 {INSTITUTE_INFO.phones[0]}</span>
          </div>
        </div>

        {/* Voucher Title */}
        <div className="text-center bg-slate-100 py-1 px-2 rounded mb-2 border border-slate-200">
          <span className="font-extrabold text-[11px] uppercase tracking-wide text-slate-900">
            {feeTitle}
          </span>
        </div>

        {/* Student Particulars Grid */}
        <div className="bg-slate-50/80 p-2 rounded border border-slate-200 mb-2 text-[10px]">
          <div className="grid grid-cols-2 gap-x-2 gap-y-1">
            <div>
              <span className="text-slate-500 font-medium">Roll No:</span>{' '}
              <strong className="text-slate-900 font-mono">{student.rollNo}</strong>
            </div>
            <div>
              <span className="text-slate-500 font-medium">Issue Date:</span>{' '}
              <strong className="text-slate-900">{issueDate}</strong>
            </div>

            <div>
              <span className="text-slate-500 font-medium">Student:</span>{' '}
              <strong className="text-slate-900 uppercase">{student.fullName}</strong>
            </div>
            <div>
              <span className="text-slate-500 font-medium text-rose-700">Due Date:</span>{' '}
              <strong className="text-rose-700 font-bold">{dueDate}</strong>
            </div>

            <div>
              <span className="text-slate-500 font-medium">Father:</span>{' '}
              <span className="text-slate-800 font-semibold">{student.fatherName}</span>
            </div>
            <div>
              <span className="text-slate-500 font-medium">Batch:</span>{' '}
              <span className="text-slate-800 font-semibold">{student.session}</span>
            </div>

            <div className="col-span-2">
              <span className="text-slate-500 font-medium">Program:</span>{' '}
              <strong className="text-red-950 font-bold">{student.program}</strong>
            </div>
          </div>
        </div>

        {/* Fee Breakdown Table */}
        <table className="w-full text-[10px] mb-2 border border-slate-300">
          <thead className="bg-slate-100 font-bold text-slate-800 border-b border-slate-300">
            <tr>
              <th className="py-1 px-2 text-left">Fee Particulars</th>
              <th className="py-1 px-2 text-right w-24">Amount (PKR)</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            <tr>
              <td className="py-1 px-2 font-medium">{feeTitle}</td>
              <td className="py-1 px-2 text-right font-mono font-bold">{formatPKR(feeAmount)}</td>
            </tr>
            {lateFine > 0 && (
              <tr className="text-slate-500">
                <td className="py-1 px-2">Late Surcharge (After {dueDate})</td>
                <td className="py-1 px-2 text-right font-mono">+{formatPKR(lateFine)}</td>
              </tr>
            )}
            <tr className="bg-slate-50 font-bold text-slate-900 border-t-2 border-slate-400">
              <td className="py-1.5 px-2">TOTAL PAYABLE (WITHIN DUE DATE):</td>
              <td className="py-1.5 px-2 text-right font-mono text-xs text-red-900">
                {formatPKR(totalPayableBeforeDue)}
              </td>
            </tr>
            {lateFine > 0 && (
              <tr className="bg-rose-50 font-bold text-rose-900">
                <td className="py-1 px-2">TOTAL PAYABLE (AFTER DUE DATE):</td>
                <td className="py-1 px-2 text-right font-mono text-xs">
                  {formatPKR(totalPayableAfterDue)}
                </td>
              </tr>
            )}
          </tbody>
        </table>

        {/* Amount in words */}
        <div className="bg-slate-50 p-1.5 rounded border border-slate-200 text-[9px] mb-2">
          <span className="text-slate-500 font-medium">Amount in Words: </span>
          <strong className="text-slate-900 italic">{amountInWords(totalPayableBeforeDue)}</strong>
        </div>

        {/* Instructions */}
        <div className="text-[9px] text-slate-500 mb-2 leading-tight">
          <p>• {bankInfo}</p>
          <p>• Retain this receipt for institute clearance and slip verification.</p>
        </div>
      </div>

      {/* Signature lines */}
      <div className="pt-4 border-t border-slate-200 grid grid-cols-2 gap-4 text-[9px] text-center text-slate-600 mt-2">
        <div>
          <div className="border-t border-slate-400 pt-1">
            <span>Depositor / Student Sign</span>
          </div>
        </div>
        <div>
          <div className="border-t border-slate-400 pt-1">
            <span className="font-bold">Cashier / Authorized Sign</span>
          </div>
        </div>
      </div>
    </div>
  );
}
