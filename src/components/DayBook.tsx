import React, { useState, useMemo } from 'react';
import { FeeTransaction, Student } from '../types';
import { getTransactions, getStudents, exportBackupJSON, importBackupJSON, resetDemoData } from '../utils/storage';
import { formatPKR } from '../utils/numberToWords';
import { INSTITUTE_INFO } from '../constants';
import { 
  Calendar, 
  Printer, 
  Download, 
  Upload, 
  RotateCcw, 
  Receipt, 
  Search, 
  Filter, 
  CheckCircle,
  Clock
} from 'lucide-react';

interface DayBookProps {
  onViewReceipt: (transaction: FeeTransaction, student: Student) => void;
  onRefreshData: () => void;
}

export const DayBook: React.FC<DayBookProps> = ({
  onViewReceipt,
  onRefreshData
}) => {
  const transactions = useMemo(() => getTransactions(), []);
  const students = useMemo(() => getStudents(), []);

  const [dateFilter, setDateFilter] = useState<'all' | 'today' | 'month' | 'custom'>('all');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');
  const [methodFilter, setMethodFilter] = useState<string>('All');
  const [search, setSearch] = useState('');

  const todayStr = new Date().toISOString().split('T')[0];
  const thisMonthStr = todayStr.substring(0, 7);

  const filteredTransactions = useMemo(() => {
    return transactions.filter((tx) => {
      // Date filter
      if (dateFilter === 'today' && tx.date !== todayStr) return false;
      if (dateFilter === 'month' && !tx.date.startsWith(thisMonthStr)) return false;
      if (dateFilter === 'custom') {
        if (customStartDate && tx.date < customStartDate) return false;
        if (customEndDate && tx.date > customEndDate) return false;
      }

      // Method filter
      if (methodFilter !== 'All' && tx.paymentMethod !== methodFilter) return false;

      // Search
      if (search.trim()) {
        const q = search.toLowerCase().trim();
        return (
          tx.studentName.toLowerCase().includes(q) ||
          tx.studentRollNo.toLowerCase().includes(q) ||
          tx.receiptNo.toLowerCase().includes(q) ||
          (tx.remarks && tx.remarks.toLowerCase().includes(q))
        );
      }

      return true;
    });
  }, [transactions, dateFilter, methodFilter, search, customStartDate, customEndDate, todayStr, thisMonthStr]);

  const totalCollectedInView = filteredTransactions.reduce(
    (sum, t) => sum + Number(t.amount || 0),
    0
  );

  // Breakdown by mode
  const modeBreakdown = useMemo(() => {
    const map: { [key: string]: number } = {};
    filteredTransactions.forEach((t) => {
      map[t.paymentMethod] = (map[t.paymentMethod] || 0) + Number(t.amount || 0);
    });
    return map;
  }, [filteredTransactions]);

  const handlePrint = () => {
    window.print();
  };

  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      const success = importBackupJSON(content);
      if (success) {
        alert('Database restored successfully from backup file!');
        onRefreshData();
      } else {
        alert('Invalid backup file format.');
      }
    };
    reader.readAsText(file);
  };

  const handleReset = () => {
    const conf = window.confirm('Reset all students and fee records to initial sample data?');
    if (conf) {
      resetDemoData();
      onRefreshData();
      alert('Data reset to initial records.');
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header Banner */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-200">
            Audit Ledger & Collection Day Book
          </span>
          <h2 className="text-2xl font-bold text-slate-900 mt-2">
            Day Book & Deposit Register
          </h2>
          <p className="text-sm text-slate-500">
            City Con & Allied Health Sciences Nowshera Virkan · Cashier log and daily balance reconcile
          </p>
        </div>

        {/* Right Tools: Print, Export JSON, Import JSON */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handlePrint}
            className="inline-flex items-center px-3.5 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg cursor-pointer"
          >
            <Printer className="w-4 h-4 mr-1.5" />
            Print Day Book
          </button>
          <button
            onClick={exportBackupJSON}
            className="inline-flex items-center px-3.5 py-2 text-xs font-semibold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 rounded-lg cursor-pointer"
            title="Download JSON file of all students & transactions"
          >
            <Download className="w-4 h-4 mr-1.5" />
            Export Backup (JSON)
          </button>
          <label className="inline-flex items-center px-3.5 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-lg cursor-pointer">
            <Upload className="w-4 h-4 mr-1.5" />
            Restore Backup
            <input type="file" accept=".json" onChange={handleImportFile} className="hidden" />
          </label>
        </div>
      </div>

      {/* Filter and Metrics Row */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          {/* Quick Date Presets */}
          <div className="flex items-center space-x-1.5 bg-slate-100 p-1 rounded-lg text-xs font-semibold text-slate-700">
            <button
              onClick={() => setDateFilter('all')}
              className={`px-3 py-1.5 rounded-md cursor-pointer transition-colors ${
                dateFilter === 'all' ? 'bg-white shadow-xs text-slate-900 font-bold' : 'hover:bg-slate-200'
              }`}
            >
              All Records
            </button>
            <button
              onClick={() => setDateFilter('today')}
              className={`px-3 py-1.5 rounded-md cursor-pointer transition-colors ${
                dateFilter === 'today' ? 'bg-white shadow-xs text-slate-900 font-bold' : 'hover:bg-slate-200'
              }`}
            >
              Today's Deposits
            </button>
            <button
              onClick={() => setDateFilter('month')}
              className={`px-3 py-1.5 rounded-md cursor-pointer transition-colors ${
                dateFilter === 'month' ? 'bg-white shadow-xs text-slate-900 font-bold' : 'hover:bg-slate-200'
              }`}
            >
              This Month
            </button>
            <button
              onClick={() => setDateFilter('custom')}
              className={`px-3 py-1.5 rounded-md cursor-pointer transition-colors ${
                dateFilter === 'custom' ? 'bg-white shadow-xs text-slate-900 font-bold' : 'hover:bg-slate-200'
              }`}
            >
              Custom Date Range
            </button>
          </div>

          {/* Payment Method filter */}
          <div className="flex items-center space-x-2">
            <span className="text-xs text-slate-400 font-medium">Mode:</span>
            <select
              value={methodFilter}
              onChange={(e) => setMethodFilter(e.target.value)}
              className="px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs bg-white focus:outline-none text-slate-800"
            >
              <option value="All">All Modes</option>
              <option value="Cash">Cash</option>
              <option value="EasyPaisa">EasyPaisa</option>
              <option value="JazzCash">JazzCash</option>
              <option value="Bank Transfer">Bank Transfer</option>
              <option value="Cheque">Cheque</option>
            </select>
          </div>
        </div>

        {/* Custom Date Inputs if selected */}
        {dateFilter === 'custom' && (
          <div className="flex items-center space-x-3 pt-2 text-xs">
            <span className="text-slate-500">From:</span>
            <input
              type="date"
              value={customStartDate}
              onChange={(e) => setCustomStartDate(e.target.value)}
              className="px-2.5 py-1 border border-slate-300 rounded-md focus:outline-none"
            />
            <span className="text-slate-500">To:</span>
            <input
              type="date"
              value={customEndDate}
              onChange={(e) => setCustomEndDate(e.target.value)}
              className="px-2.5 py-1 border border-slate-300 rounded-md focus:outline-none"
            />
          </div>
        )}

        {/* Summary Card for Selected Period */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2 border-t border-slate-100">
          <div className="bg-emerald-50/70 p-3 rounded-lg border border-emerald-200">
            <span className="text-[10px] uppercase font-bold text-emerald-800 block">
              Total Collected In Period
            </span>
            <span className="text-xl font-extrabold font-mono text-emerald-950">
              {formatPKR(totalCollectedInView)}
            </span>
            <span className="text-[11px] text-emerald-700 block mt-0.5">
              {filteredTransactions.length} Total Receipts Issued
            </span>
          </div>

          <div className="sm:col-span-2 bg-slate-50 p-3 rounded-lg border border-slate-200 flex flex-wrap items-center gap-3">
            <span className="text-xs font-bold text-slate-600 block w-full sm:w-auto">
              Mode Breakdown:
            </span>
            {Object.entries(modeBreakdown).map(([mode, amt]) => (
              <div key={mode} className="bg-white px-2.5 py-1 rounded border border-slate-200 text-xs">
                <span className="text-slate-500">{mode}:</span>{' '}
                <strong className="font-mono text-slate-800">{formatPKR(amt)}</strong>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Transactions Register Table */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-200 flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">
            Transactions Register ({filteredTransactions.length} records)
          </h3>

          <div className="relative w-64">
            <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search receipt, roll, name..."
              className="w-full pl-8 pr-3 py-1.5 border border-slate-300 rounded-lg text-xs focus:outline-none"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200 uppercase text-[10.5px]">
              <tr>
                <th className="py-2.5 px-3">Receipt No</th>
                <th className="py-2.5 px-3">Date</th>
                <th className="py-2.5 px-3">Student Name (Roll)</th>
                <th className="py-2.5 px-3">Course / Discipline</th>
                <th className="py-2.5 px-3">Mode & Ref</th>
                <th className="py-2.5 px-3">Remarks</th>
                <th className="py-2.5 px-3 text-right">Deposited Amount</th>
                <th className="py-2.5 px-3 text-right">Balance Due</th>
                <th className="py-2.5 px-3 text-center">Receipt</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredTransactions.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-slate-400">
                    No transactions match your filter criteria.
                  </td>
                </tr>
              ) : (
                filteredTransactions.map((tx) => {
                  const student = students.find((s) => s.id === tx.studentId);
                  return (
                    <tr key={tx.id} className="hover:bg-slate-50">
                      <td className="py-2.5 px-3 font-mono font-bold text-slate-900">{tx.receiptNo}</td>
                      <td className="py-2.5 px-3 whitespace-nowrap text-slate-600">{tx.date}</td>
                      <td className="py-2.5 px-3">
                        <div className="font-semibold text-slate-900">{tx.studentName}</div>
                        <div className="font-mono text-[10.5px] text-slate-400">{tx.studentRollNo}</div>
                      </td>
                      <td className="py-2.5 px-3 text-emerald-900 font-medium">{tx.program}</td>
                      <td className="py-2.5 px-3 text-slate-700">
                        <span>{tx.paymentMethod}</span>
                        {tx.referenceNo && (
                          <span className="block text-[10px] text-slate-400 font-mono">
                            {tx.referenceNo}
                          </span>
                        )}
                      </td>
                      <td className="py-2.5 px-3 text-slate-500 max-w-[140px] truncate">{tx.remarks}</td>
                      <td className="py-2.5 px-3 text-right font-mono font-extrabold text-emerald-800">
                        {formatPKR(tx.amount)}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono text-slate-600">
                        {formatPKR(tx.remainingBalance)}
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        {student && (
                          <button
                            onClick={() => onViewReceipt(tx, student)}
                            className="inline-flex items-center px-2 py-1 text-[11px] font-semibold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 rounded cursor-pointer"
                          >
                            <Printer className="w-3 h-3 mr-1" />
                            Double Copy
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Demo Data Reset link */}
      <div className="text-right pt-4">
        <button
          onClick={handleReset}
          className="text-xs text-slate-400 hover:text-rose-600 underline cursor-pointer"
        >
          Reset all data to default demo records
        </button>
      </div>
    </div>
  );
};
