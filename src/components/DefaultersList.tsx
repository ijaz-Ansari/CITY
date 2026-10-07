import React, { useState, useMemo } from 'react';
import { Student } from '../types';
import { getStudents, getStudentBalance } from '../utils/storage';
import { formatPKR } from '../utils/numberToWords';
import { INSTITUTE_INFO, COURSES_LIST } from '../constants';
import { 
  AlertCircle, 
  Search, 
  Printer, 
  CreditCard, 
  MessageCircle, 
  Copy, 
  ExternalLink, 
  CheckCircle2, 
  Filter
} from 'lucide-react';

interface DefaultersListProps {
  onCollectFee: (studentId: string) => void;
  onViewStudentHistory: (studentId: string) => void;
}

export const DefaultersList: React.FC<DefaultersListProps> = ({
  onCollectFee,
  onViewStudentHistory
}) => {
  const students = useMemo(() => getStudents(), []);
  const [search, setSearch] = useState('');
  const [selectedCourse, setSelectedCourse] = useState('All');
  const [copiedNotice, setCopiedNotice] = useState<string | null>(null);

  // Filter only students with remainingBalance > 0
  const defaulters = useMemo(() => {
    return students
      .map((st) => {
        const bal = getStudentBalance(st.id);
        return {
          student: st,
          netPayable: bal.netPayable,
          totalPaid: bal.totalPaid,
          remainingBalance: bal.remainingBalance
        };
      })
      .filter((item) => item.remainingBalance > 0)
      .filter((item) => {
        if (selectedCourse !== 'All' && item.student.program !== selectedCourse) {
          return false;
        }
        if (search.trim()) {
          const q = search.toLowerCase().trim();
          return (
            item.student.fullName.toLowerCase().includes(q) ||
            item.student.rollNo.toLowerCase().includes(q) ||
            item.student.fatherName.toLowerCase().includes(q) ||
            item.student.phone.toLowerCase().includes(q)
          );
        }
        return true;
      })
      .sort((a, b) => b.remainingBalance - a.remainingBalance);
  }, [students, search, selectedCourse]);

  const totalOutstanding = defaulters.reduce((sum, d) => sum + d.remainingBalance, 0);

  const generateWhatsAppMessage = (st: Student, remaining: number, paid: number) => {
    return `*City Con & Allied Health Sciences Nowshera Virkan*\n` +
      `FEE REMINDER NOTICE\n` +
      `---------------------------------\n` +
      `Student: ${st.fullName}\n` +
      `Roll No: ${st.rollNo}\n` +
      `Course: ${st.program}\n` +
      `Total Fee: Rs. ${st.netPayableFee.toLocaleString()}\n` +
      `Total Paid: Rs. ${paid.toLocaleString()}\n` +
      `*Current Balance Due: Rs. ${remaining.toLocaleString()}*\n` +
      `---------------------------------\n` +
      `Dear Student/Guardian, please deposit your remaining fee installment at the earliest.\n` +
      `Address: ${INSTITUTE_INFO.address}\n` +
      `Help Desk: ${INSTITUTE_INFO.phones.join(' / ')}`;
  };

  const handleCopyNotice = (st: Student, remaining: number, paid: number) => {
    const text = generateWhatsAppMessage(st, remaining, paid);
    navigator.clipboard.writeText(text);
    setCopiedNotice(`Notice copied for ${st.fullName} (${st.rollNo})`);
    setTimeout(() => setCopiedNotice(null), 3000);
  };

  const handleOpenWhatsApp = (st: Student, remaining: number, paid: number) => {
    const raw = st.phone.replace(/[^0-9]/g, '');
    let formatted = raw.startsWith('03') ? '92' + raw.slice(1) : raw;
    const msg = encodeURIComponent(generateWhatsAppMessage(st, remaining, paid));
    window.open(`https://wa.me/${formatted}?text=${msg}`, '_blank');
  };

  const handlePrintList = () => {
    window.print();
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Top Banner */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-rose-700 bg-rose-50 px-2.5 py-1 rounded-md border border-rose-200">
            Fee Dues & Recovery Management
          </span>
          <h2 className="text-2xl font-bold text-slate-900 mt-2">
            Pending Fee & Defaulters Registry
          </h2>
          <p className="text-sm text-slate-500">
            Filter and contact students with unpaid or partial fee balances.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <div className="bg-rose-50 border border-rose-200 px-4 py-2 rounded-lg text-right">
            <span className="text-[10px] uppercase font-bold text-rose-800 block">Total Due Amount</span>
            <span className="text-lg font-extrabold font-mono text-rose-700">{formatPKR(totalOutstanding)}</span>
          </div>

          <button
            onClick={handlePrintList}
            className="inline-flex items-center px-4 py-2.5 text-xs sm:text-sm font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg cursor-pointer"
          >
            <Printer className="w-4 h-4 mr-1.5" />
            Print Dues Report
          </button>
        </div>
      </div>

      {copiedNotice && (
        <div className="bg-emerald-50 border border-emerald-300 text-emerald-900 px-4 py-3 rounded-xl text-sm font-medium flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>{copiedNotice}</span>
          </div>
          <span className="text-xs text-emerald-700">Ready to paste in WhatsApp</span>
        </div>
      )}

      {/* Filter Bar */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search Roll No, Name, Phone..."
            className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-emerald-600 focus:outline-none"
          />
        </div>

        <div className="flex items-center space-x-2 w-full sm:w-auto">
          <Filter className="w-4 h-4 text-slate-400" />
          <select
            value={selectedCourse}
            onChange={(e) => setSelectedCourse(e.target.value)}
            className="w-full sm:w-auto px-3 py-2 border border-slate-300 rounded-lg text-xs bg-white focus:outline-none"
          >
            <option value="All">All Allied Health Courses</option>
            {COURSES_LIST.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
          <span className="text-xs text-slate-500 whitespace-nowrap">
            {defaulters.length} Students with Dues
          </span>
        </div>
      </div>

      {/* Defaulters Table */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200 uppercase text-[10.5px]">
              <tr>
                <th className="py-3 px-3.5">Roll No</th>
                <th className="py-3 px-3.5">Student & Father Name</th>
                <th className="py-3 px-3.5">Course & Session</th>
                <th className="py-3 px-3.5">Contact Number</th>
                <th className="py-3 px-3.5 text-right">Agreed Fee</th>
                <th className="py-3 px-3.5 text-right">Paid So Far</th>
                <th className="py-3 px-3.5 text-right">Remaining Due</th>
                <th className="py-3 px-3.5 text-center">WhatsApp Reminder</th>
                <th className="py-3 px-3.5 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {defaulters.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-10 text-center text-slate-400">
                    No pending dues found matching criteria. Excellent fee recovery!
                  </td>
                </tr>
              ) : (
                defaulters.map(({ student, netPayable, totalPaid, remainingBalance }) => (
                  <tr key={student.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3 px-3.5 font-mono font-bold text-slate-900">
                      {student.rollNo}
                    </td>
                    <td className="py-3 px-3.5">
                      <div className="font-bold text-slate-900">{student.fullName}</div>
                      <div className="text-[11px] text-slate-500">S/O: {student.fatherName}</div>
                    </td>
                    <td className="py-3 px-3.5">
                      <div className="font-medium text-emerald-900">{student.program}</div>
                      <div className="text-[11px] text-slate-400">{student.session}</div>
                    </td>
                    <td className="py-3 px-3.5 whitespace-nowrap text-slate-700">
                      <div>📱 {student.phone}</div>
                      {student.guardianPhone && (
                        <div className="text-[10px] text-slate-400">G: {student.guardianPhone}</div>
                      )}
                    </td>
                    <td className="py-3 px-3.5 text-right font-mono text-slate-700">
                      {formatPKR(netPayable)}
                    </td>
                    <td className="py-3 px-3.5 text-right font-mono font-semibold text-emerald-800">
                      {formatPKR(totalPaid)}
                    </td>
                    <td className="py-3 px-3.5 text-right font-mono font-extrabold text-rose-700 text-sm">
                      {formatPKR(remainingBalance)}
                    </td>
                    <td className="py-3 px-3.5 text-center">
                      <div className="flex items-center justify-center space-x-1">
                        <button
                          onClick={() => handleCopyNotice(student, remainingBalance, totalPaid)}
                          className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded cursor-pointer"
                          title="Copy Reminder Notice"
                        >
                          <Copy className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleOpenWhatsApp(student, remainingBalance, totalPaid)}
                          className="inline-flex items-center px-2 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-[10px] font-bold cursor-pointer"
                          title="Send directly on WhatsApp"
                        >
                          <MessageCircle className="w-3 h-3 mr-1" />
                          WhatsApp
                        </button>
                      </div>
                    </td>
                    <td className="py-3 px-3.5 text-center">
                      <button
                        onClick={() => onCollectFee(student.id)}
                        className="inline-flex items-center px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-lg text-xs cursor-pointer shadow-xs"
                      >
                        <CreditCard className="w-3 h-3 mr-1" />
                        Deposit
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
