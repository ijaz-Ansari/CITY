import React, { useMemo } from 'react';
import { Student, FeeTransaction } from '../types';
import { getStudents, getTransactions, getStudentBalance } from '../utils/storage';
import { formatPKR } from '../utils/numberToWords';
import { 
  Users, 
  TrendingUp, 
  Wallet, 
  AlertCircle, 
  CreditCard, 
  UserPlus, 
  Receipt, 
  Printer, 
  ArrowUpRight,
  Clock,
  Sparkles,
  CalendarCheck,
  FileText,
  Smartphone
} from 'lucide-react';

interface DashboardProps {
  onNavigateTab: (tab: 'add-student' | 'fee-collection' | 'student-history' | 'defaulters' | 'day-book' | 'course-vouchers') => void;
  onSelectStudentForPayment: (studentId: string) => void;
  onViewReceipt: (transaction: FeeTransaction, student: Student) => void;
  onOpenAndroidModal?: () => void;
}

export const Dashboard: React.FC<DashboardProps> = ({
  onNavigateTab,
  onSelectStudentForPayment,
  onViewReceipt,
  onOpenAndroidModal
}) => {
  const students = useMemo(() => getStudents(), []);
  const transactions = useMemo(() => getTransactions(), []);

  // Compute key stats
  const metrics = useMemo(() => {
    let totalAgreed = 0;
    let totalDiscounts = 0;
    let totalPayable = 0;
    let totalCollected = 0;
    let totalRemaining = 0;

    students.forEach((s) => {
      totalAgreed += Number(s.totalAgreedFee) || 0;
      totalDiscounts += Number(s.discount) || 0;
      totalPayable += Number(s.netPayableFee) || 0;
      const b = getStudentBalance(s.id);
      totalCollected += b.totalPaid;
      totalRemaining += b.remainingBalance;
    });

    // Today's collections
    const todayStr = new Date().toISOString().split('T')[0];
    const todayTxs = transactions.filter((t) => t.date === todayStr);
    const todayCollected = todayTxs.reduce((sum, t) => sum + Number(t.amount || 0), 0);

    // This month's collections
    const currentMonthPrefix = todayStr.substring(0, 7); // YYYY-MM
    const thisMonthTxs = transactions.filter((t) => t.date && t.date.startsWith(currentMonthPrefix));
    const thisMonthCollected = thisMonthTxs.reduce((sum, t) => sum + Number(t.amount || 0), 0);

    const pendingStudentsCount = students.filter((s) => getStudentBalance(s.id).remainingBalance > 0).length;

    return {
      totalStudents: students.length,
      totalAgreed,
      totalDiscounts,
      totalPayable,
      totalCollected,
      totalRemaining,
      todayCollected,
      thisMonthCollected,
      pendingStudentsCount
    };
  }, [students, transactions]);

  // Program Breakdown
  const programBreakdown = useMemo(() => {
    const map: { [prog: string]: { count: number; totalFee: number; collected: number; balance: number } } = {};
    students.forEach((s) => {
      const prog = s.program || 'Other';
      if (!map[prog]) {
        map[prog] = { count: 0, totalFee: 0, collected: 0, balance: 0 };
      }
      const b = getStudentBalance(s.id);
      map[prog].count += 1;
      map[prog].totalFee += s.netPayableFee;
      map[prog].collected += b.totalPaid;
      map[prog].balance += b.remainingBalance;
    });
    return Object.entries(map).sort((a, b) => b[1].count - a[1].count);
  }, [students]);

  // Top Defaulters / Pending Dues
  const topPendingStudents = useMemo(() => {
    return students
      .map((s) => ({
        student: s,
        balance: getStudentBalance(s.id)
      }))
      .filter((item) => item.balance.remainingBalance > 0)
      .sort((a, b) => b.balance.remainingBalance - a.balance.remainingBalance)
      .slice(0, 5);
  }, [students]);

  // Recent 6 transactions
  const recentTransactions = useMemo(() => {
    return [...transactions]
      .sort((a, b) => new Date(b.createdAt || b.date).getTime() - new Date(a.createdAt || a.date).getTime())
      .slice(0, 6);
  }, [transactions]);

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Welcome & Quick Action Bar */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-red-800 bg-red-50 px-2.5 py-1 rounded-md border border-red-200">
            Accounts & Bursar Overview
          </span>
          <h2 className="text-2xl font-extrabold text-slate-900 mt-2">
            City Con & Allied Health Sciences Dashboard
          </h2>
          <p className="text-sm text-slate-500">
            Nowshera Virkan · Real-time financial position, fee collection register & pending dues
          </p>
        </div>

        <div className="flex items-center flex-wrap gap-2.5">
          {onOpenAndroidModal && (
            <button
              onClick={onOpenAndroidModal}
              className="inline-flex items-center px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white text-xs sm:text-sm font-bold rounded-lg shadow-sm transition-all cursor-pointer transform hover:-translate-y-0.5"
            >
              <Smartphone className="w-4 h-4 mr-1.5" />
              📲 Android App &amp; APK
            </button>
          )}
          <button
            onClick={() => onNavigateTab('course-vouchers')}
            className="inline-flex items-center px-4 py-2.5 bg-red-50 hover:bg-red-100 text-red-900 border border-red-300 text-xs sm:text-sm font-bold rounded-lg shadow-2xs transition-colors cursor-pointer"
          >
            <FileText className="w-4 h-4 mr-1.5 text-red-700" />
            Issue Course Slips
          </button>
          <button
            onClick={() => onNavigateTab('fee-collection')}
            className="inline-flex items-center px-4 py-2.5 bg-red-700 hover:bg-red-800 active:bg-red-900 text-white text-xs sm:text-sm font-bold rounded-lg shadow-sm transition-colors cursor-pointer"
          >
            <CreditCard className="w-4 h-4 mr-1.5" />
            Quick Fee Deposit
          </button>
          <button
            onClick={() => onNavigateTab('add-student')}
            className="inline-flex items-center px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs sm:text-sm font-semibold rounded-lg shadow-sm transition-colors cursor-pointer"
          >
            <UserPlus className="w-4 h-4 mr-1.5" />
            New Admission
          </button>
        </div>
      </div>

      {/* 4 Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Total Enrolled Students
            </span>
            <span className="p-2 rounded-lg bg-slate-100 text-slate-700">
              <Users className="w-5 h-5" />
            </span>
          </div>
          <div className="text-2xl font-extrabold text-slate-900 font-mono mt-2">
            {metrics.totalStudents}
          </div>
          <div className="text-xs text-slate-500 mt-1 flex items-center justify-between">
            <span>Pending dues: <strong className="text-rose-600">{metrics.pendingStudentsCount}</strong></span>
            <span className="text-red-700 font-medium">Active</span>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Total Fee Receivable
            </span>
            <span className="p-2 rounded-lg bg-red-50 text-red-700">
              <TrendingUp className="w-5 h-5" />
            </span>
          </div>
          <div className="text-2xl font-extrabold text-slate-900 font-mono mt-2">
            {formatPKR(metrics.totalPayable)}
          </div>
          <div className="text-xs text-slate-500 mt-1">
            Concession: {formatPKR(metrics.totalDiscounts)}
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-red-900">
              Total Collected To Date
            </span>
            <span className="p-2 rounded-lg bg-red-100 text-red-900">
              <Wallet className="w-5 h-5" />
            </span>
          </div>
          <div className="text-2xl font-extrabold text-red-950 font-mono mt-2">
            {formatPKR(metrics.totalCollected)}
          </div>
          <div className="text-xs text-red-800 font-medium mt-1">
            {metrics.totalPayable > 0
              ? `${Math.round((metrics.totalCollected / metrics.totalPayable) * 100)}% of total fees recovered`
              : '0% recovered'}
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-rose-800">
              Total Outstanding Due
            </span>
            <span className="p-2 rounded-lg bg-rose-50 text-rose-700">
              <AlertCircle className="w-5 h-5" />
            </span>
          </div>
          <div className="text-2xl font-extrabold text-rose-700 font-mono mt-2">
            {formatPKR(metrics.totalRemaining)}
          </div>
          <div className="text-xs text-rose-600 font-medium mt-1">
            Across {metrics.pendingStudentsCount} students
          </div>
        </div>
      </div>

      {/* Two Column Section: Recent Transactions & Pending Dues */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Recent Fee Collections */}
        <div className="lg:col-span-7 bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center space-x-2">
              <Clock className="w-4 h-4 text-red-700" />
              <h3 className="font-bold text-slate-800 text-sm uppercase tracking-wider">
                Recent Fee Deposits
              </h3>
            </div>
            <button
              onClick={() => onNavigateTab('day-book')}
              className="text-xs text-red-700 hover:text-red-800 font-semibold cursor-pointer"
            >
              View All Day Book →
            </button>
          </div>

          <div className="divide-y divide-slate-100">
            {recentTransactions.map((tx) => {
              const student = students.find((s) => s.id === tx.studentId);
              return (
                <div key={tx.id} className="py-2.5 flex items-center justify-between hover:bg-slate-50/80 px-2 rounded-lg transition-colors">
                  <div className="flex items-center space-x-3">
                    <div className="w-9 h-9 rounded-lg bg-red-50 text-red-800 font-mono text-xs font-bold flex items-center justify-center">
                      <Receipt className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="font-mono text-xs font-bold text-slate-900">{tx.receiptNo}</span>
                        <span className="font-semibold text-xs text-slate-800">{tx.studentName}</span>
                      </div>
                      <p className="text-[11px] text-slate-400">
                        {tx.date} · {tx.paymentMethod} {tx.referenceNo ? `(${tx.referenceNo})` : ''} · {tx.remarks || 'Deposit'}
                      </p>
                    </div>
                  </div>

                  <div className="text-right flex items-center space-x-2">
                    <div>
                      <span className="text-xs font-mono font-extrabold text-red-950 block">
                        {formatPKR(tx.amount)}
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono">
                        Bal: {formatPKR(tx.remainingBalance)}
                      </span>
                    </div>
                    {student && (
                      <button
                        onClick={() => onViewReceipt(tx, student)}
                        className="p-1.5 text-slate-400 hover:text-red-700 hover:bg-red-50 rounded cursor-pointer"
                        title="View Double Copy Receipt"
                      >
                        <Printer className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right: Highest Pending Dues */}
        <div className="lg:col-span-5 bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 text-rose-600" />
              <h3 className="font-bold text-slate-800 text-sm uppercase tracking-wider">
                Top Pending Fee Balances
              </h3>
            </div>
            <button
              onClick={() => onNavigateTab('defaulters')}
              className="text-xs text-rose-700 hover:text-rose-800 font-semibold cursor-pointer"
            >
              All Dues List →
            </button>
          </div>

          <div className="space-y-2">
            {topPendingStudents.map(({ student, balance }) => (
              <div
                key={student.id}
                className="p-2.5 rounded-lg border border-slate-100 hover:border-slate-300 bg-slate-50/50 flex items-center justify-between transition-colors"
              >
                <div>
                  <div className="flex items-center space-x-1.5">
                    <span className="font-mono text-[10px] font-bold text-slate-700 bg-slate-200 px-1 py-0.5 rounded">
                      {student.rollNo}
                    </span>
                    <span className="text-xs font-bold text-slate-900">{student.fullName}</span>
                  </div>
                  <p className="text-[11px] text-slate-500 truncate max-w-[180px]">
                    {student.program}
                  </p>
                </div>

                <div className="text-right flex items-center space-x-2">
                  <div>
                    <span className="text-xs font-mono font-extrabold text-rose-700 block">
                      {formatPKR(balance.remainingBalance)}
                    </span>
                    <span className="text-[10px] text-slate-400">
                      Paid: {formatPKR(balance.totalPaid)}
                    </span>
                  </div>
                  <button
                    onClick={() => onSelectStudentForPayment(student.id)}
                    className="p-1.5 text-xs text-red-900 hover:bg-red-100 bg-red-50 rounded font-semibold cursor-pointer border border-red-200"
                    title="Deposit Fee"
                  >
                    <CreditCard className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Program-wise Enrollment & Fee Table */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
        <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-3">
          Department & Course-Wise Fee Summary
        </h3>
        <div className="border border-slate-200 rounded-lg overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-200">
              <tr>
                <th className="py-2.5 px-3">Program / Course</th>
                <th className="py-2.5 px-3 text-center">Enrolled</th>
                <th className="py-2.5 px-3 text-right">Total Net Fees</th>
                <th className="py-2.5 px-3 text-right">Fee Collected</th>
                <th className="py-2.5 px-3 text-right">Balance Outstanding</th>
                <th className="py-2.5 px-3 text-center">Recovery %</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {programBreakdown.map(([prog, data]) => {
                const recoveryPct = data.totalFee > 0 ? Math.round((data.collected / data.totalFee) * 100) : 0;
                return (
                  <tr key={prog} className="hover:bg-slate-50/60">
                    <td className="py-2.5 px-3 font-semibold text-slate-900">{prog}</td>
                    <td className="py-2.5 px-3 text-center font-mono font-medium">{data.count}</td>
                    <td className="py-2.5 px-3 text-right font-mono">{formatPKR(data.totalFee)}</td>
                    <td className="py-2.5 px-3 text-right font-mono font-bold text-red-950">
                      {formatPKR(data.collected)}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono font-bold text-rose-700">
                      {formatPKR(data.balance)}
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      <span className="inline-block px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-slate-100 text-slate-800">
                        {recoveryPct}%
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
