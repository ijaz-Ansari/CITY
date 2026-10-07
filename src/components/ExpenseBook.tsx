import React, { useState, useMemo } from 'react';
import { Expense, ExpenseCategory, User } from '../types';
import { getExpenses, saveExpense, deleteExpense, getTransactions } from '../utils/storage';
import { formatPKR, amountToWords } from '../utils/numberToWords';
import { INSTITUTE_INFO } from '../constants';
import { Logo } from './Logo';
import { 
  ReceiptText, 
  PlusCircle, 
  Search, 
  Filter, 
  Trash2, 
  Printer, 
  DollarSign, 
  TrendingDown, 
  Calendar, 
  Tag, 
  FileText, 
  CheckCircle2, 
  AlertCircle,
  X,
  CreditCard,
  Building,
  Wallet,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react';

interface ExpenseBookProps {
  currentUser: User | null;
}

const CATEGORIES: ExpenseCategory[] = [
  'Salary',
  'Utility Bills',
  'Generator & Fuel',
  'Lab Consumables',
  'Office & Stationery',
  'Building Rent',
  'Internet & IT',
  'Refreshment',
  'Maintenance',
  'Marketing',
  'Miscellaneous'
];

export const ExpenseBook: React.FC<ExpenseBookProps> = ({ currentUser }) => {
  const [expenses, setExpenses] = useState<Expense[]>(() => getExpenses());
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [dateRange, setDateRange] = useState<'all' | 'today' | 'month' | 'custom'>('all');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');

  // Add Expense Modal
  const [showAddModal, setShowAddModal] = useState(false);
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    category: 'Lab Consumables' as ExpenseCategory,
    title: '',
    amount: '',
    paymentMethod: 'Cash' as Expense['paymentMethod'],
    payee: '',
    receiptRef: '',
    notes: ''
  });
  const [formError, setFormError] = useState('');

  // Printable Voucher Modal
  const [selectedVoucher, setSelectedVoucher] = useState<Expense | null>(null);

  const refreshExpenses = () => {
    setExpenses(getExpenses());
  };

  // Financial Analytics
  const totalExpenses = useMemo(() => {
    return expenses.reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
  }, [expenses]);

  const todayStr = new Date().toISOString().split('T')[0];
  const currentMonthStr = todayStr.substring(0, 7);

  const todayExpenses = useMemo(() => {
    return expenses
      .filter(e => e.date === todayStr)
      .reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
  }, [expenses, todayStr]);

  const thisMonthExpenses = useMemo(() => {
    return expenses
      .filter(e => e.date.startsWith(currentMonthStr))
      .reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
  }, [expenses, currentMonthStr]);

  // Fee collection revenue for cash flow comparison
  const totalFeeCollected = useMemo(() => {
    return getTransactions().reduce((sum, t) => sum + (Number(t.amount) || 0), 0);
  }, []);

  const netCashBalance = totalFeeCollected - totalExpenses;

  // Filtered expenses
  const filteredExpenses = useMemo(() => {
    return expenses.filter(exp => {
      // Category filter
      if (selectedCategory !== 'all' && exp.category !== selectedCategory) {
        return false;
      }

      // Date filter
      if (dateRange === 'today' && exp.date !== todayStr) {
        return false;
      }
      if (dateRange === 'month' && !exp.date.startsWith(currentMonthStr)) {
        return false;
      }
      if (dateRange === 'custom') {
        if (customStartDate && exp.date < customStartDate) return false;
        if (customEndDate && exp.date > customEndDate) return false;
      }

      // Text search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchTitle = exp.title.toLowerCase().includes(q);
        const matchPayee = exp.payee.toLowerCase().includes(q);
        const matchVoucher = exp.voucherNo.toLowerCase().includes(q);
        const matchRef = (exp.receiptRef || '').toLowerCase().includes(q);
        if (!matchTitle && !matchPayee && !matchVoucher && !matchRef) {
          return false;
        }
      }

      return true;
    });
  }, [expenses, selectedCategory, dateRange, todayStr, currentMonthStr, customStartDate, customEndDate, searchQuery]);

  const handleCreateExpense = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    const amt = parseFloat(formData.amount);
    if (isNaN(amt) || amt <= 0) {
      setFormError('Please enter a valid expense amount greater than 0.');
      return;
    }

    if (!formData.title.trim()) {
      setFormError('Please enter expense purpose / title.');
      return;
    }

    if (!formData.payee.trim()) {
      setFormError('Please enter payee / vendor name.');
      return;
    }

    const created = saveExpense({
      date: formData.date,
      category: formData.category,
      title: formData.title.trim(),
      amount: amt,
      paymentMethod: formData.paymentMethod,
      payee: formData.payee.trim(),
      receiptRef: formData.receiptRef.trim() || undefined,
      notes: formData.notes.trim() || undefined,
      recordedBy: currentUser ? currentUser.name : 'Accounts Office'
    });

    refreshExpenses();
    setShowAddModal(false);
    // Reset form
    setFormData({
      date: new Date().toISOString().split('T')[0],
      category: 'Lab Consumables',
      title: '',
      amount: '',
      paymentMethod: 'Cash',
      payee: '',
      receiptRef: '',
      notes: ''
    });

    // Optionally view voucher
    setSelectedVoucher(created);
  };

  const handleDelete = (id: string, voucherNo: string) => {
    if (window.confirm(`Are you sure you want to delete expense voucher ${voucherNo}?`)) {
      deleteExpense(id);
      refreshExpenses();
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Quick Add */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center space-x-3.5">
          <div className="w-12 h-12 rounded-xl bg-red-50 text-red-700 border border-red-200 flex items-center justify-center shrink-0">
            <ReceiptText className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900 tracking-tight">
              Institute Expense Book & Cash Outflows
            </h2>
            <p className="text-xs text-slate-500">
              Record utility bills, staff salaries, lab materials, generator fuel & campus maintenance
            </p>
          </div>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="inline-flex items-center justify-center px-4 py-2.5 bg-red-700 hover:bg-red-800 text-white font-bold rounded-xl text-xs sm:text-sm shadow-sm transition-all cursor-pointer space-x-2 shrink-0"
        >
          <PlusCircle className="w-4 h-4" />
          <span>+ Record New Expense Voucher</span>
        </button>
      </div>

      {/* KPI Cards: Revenue, Expenses & Net Operating Balance */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Expenses */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Total Expenses To Date
            </span>
            <span className="p-1.5 bg-rose-50 text-rose-700 rounded-lg">
              <TrendingDown className="w-4 h-4" />
            </span>
          </div>
          <div className="text-xl font-extrabold text-slate-900 mt-2 font-mono">
            {formatPKR(totalExpenses)}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            {expenses.length} recorded voucher payments
          </div>
        </div>

        {/* This Month's Expenses */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              This Month's Outflow
            </span>
            <span className="p-1.5 bg-amber-50 text-amber-700 rounded-lg">
              <Calendar className="w-4 h-4" />
            </span>
          </div>
          <div className="text-xl font-extrabold text-amber-900 mt-2 font-mono">
            {formatPKR(thisMonthExpenses)}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            Current billing cycle expenses
          </div>
        </div>

        {/* Total Fee Collected */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Total Fees Collected
            </span>
            <span className="p-1.5 bg-emerald-50 text-emerald-700 rounded-lg">
              <ArrowUpRight className="w-4 h-4" />
            </span>
          </div>
          <div className="text-xl font-extrabold text-emerald-900 mt-2 font-mono">
            {formatPKR(totalFeeCollected)}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            Student fee deposit revenues
          </div>
        </div>

        {/* Net Operating Balance */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Net In-Hand Balance
            </span>
            <span className={`p-1.5 rounded-lg ${netCashBalance >= 0 ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'}`}>
              <Wallet className="w-4 h-4" />
            </span>
          </div>
          <div className={`text-xl font-extrabold mt-2 font-mono ${netCashBalance >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
            {formatPKR(netCashBalance)}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            Fees collected minus all expenses
          </div>
        </div>
      </div>

      {/* Filters and Search Bar */}
      <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-2xs space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          {/* Search */}
          <div className="md:col-span-2 relative">
            <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
            <input
              type="text"
              placeholder="Search expenses by title, payee, voucher # or ref..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-red-700 focus:bg-white"
            />
          </div>

          {/* Category Filter */}
          <div>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-red-700 focus:bg-white"
            >
              <option value="all">All Categories</option>
              {CATEGORIES.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

          {/* Date Filter */}
          <div>
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value as any)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-red-700 focus:bg-white"
            >
              <option value="all">All Dates</option>
              <option value="today">Today Only</option>
              <option value="month">This Month</option>
              <option value="custom">Custom Date Range</option>
            </select>
          </div>
        </div>

        {/* Custom Date Inputs if selected */}
        {dateRange === 'custom' && (
          <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-slate-100 text-xs">
            <span className="font-semibold text-slate-600">From Date:</span>
            <input
              type="date"
              value={customStartDate}
              onChange={(e) => setCustomStartDate(e.target.value)}
              className="px-2.5 py-1.5 border border-slate-300 rounded-lg bg-white"
            />
            <span className="font-semibold text-slate-600">To Date:</span>
            <input
              type="date"
              value={customEndDate}
              onChange={(e) => setCustomEndDate(e.target.value)}
              className="px-2.5 py-1.5 border border-slate-300 rounded-lg bg-white"
            />
            {(customStartDate || customEndDate) && (
              <button
                type="button"
                onClick={() => { setCustomStartDate(''); setCustomEndDate(''); }}
                className="text-red-700 hover:text-red-800 font-bold ml-auto cursor-pointer"
              >
                Clear Dates
              </button>
            )}
          </div>
        )}
      </div>

      {/* Expense Records Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="px-5 py-3.5 border-b border-slate-200 bg-slate-50/70 flex items-center justify-between">
          <div className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center space-x-2">
            <span>Expenses Register</span>
            <span className="px-2 py-0.5 rounded-full bg-slate-200 text-slate-700 text-[10px]">
              {filteredExpenses.length} Records
            </span>
          </div>
          <div className="text-xs font-mono font-bold text-red-900">
            Filtered Total: {formatPKR(filteredExpenses.reduce((s, e) => s + (Number(e.amount) || 0), 0))}
          </div>
        </div>

        {filteredExpenses.length === 0 ? (
          <div className="p-10 text-center text-slate-500 text-xs">
            No expenses found matching the current search / filter criteria.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100/80 text-slate-700 uppercase tracking-wider text-[11px] font-bold border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Voucher #</th>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Expense Title / Description</th>
                  <th className="py-3 px-4">Paid To (Payee)</th>
                  <th className="py-3 px-4">Method</th>
                  <th className="py-3 px-4 text-right">Amount (PKR)</th>
                  <th className="py-3 px-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredExpenses.map((exp) => (
                  <tr key={exp.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-red-800 whitespace-nowrap">
                      {exp.voucherNo}
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-600 whitespace-nowrap">
                      {exp.date}
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      <span className="inline-block px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-100 text-slate-800 border border-slate-200">
                        {exp.category}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-900">{exp.title}</div>
                      {exp.receiptRef && (
                        <div className="text-[10px] text-slate-500 font-mono mt-0.5">
                          Ref: {exp.receiptRef}
                        </div>
                      )}
                    </td>
                    <td className="py-3 px-4 text-slate-700 font-medium">
                      {exp.payee}
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      <span className="inline-block px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
                        {exp.paymentMethod}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-slate-900 whitespace-nowrap">
                      {formatPKR(exp.amount)}
                    </td>
                    <td className="py-3 px-4 text-center whitespace-nowrap">
                      <div className="flex items-center justify-center space-x-1.5">
                        <button
                          onClick={() => setSelectedVoucher(exp)}
                          className="p-1.5 text-slate-600 hover:text-red-700 hover:bg-slate-100 rounded transition-colors cursor-pointer"
                          title="Print Expense Payment Voucher"
                        >
                          <Printer className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(exp.id, exp.voucherNo)}
                          className="p-1.5 text-slate-400 hover:text-rose-700 hover:bg-rose-50 rounded transition-colors cursor-pointer"
                          title="Delete Expense"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Record New Expense Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 backdrop-blur-2xs overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 relative my-8">
            <button
              onClick={() => setShowAddModal(false)}
              className="absolute right-4 top-4 text-slate-400 hover:text-slate-600 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center space-x-3 mb-5">
              <div className="w-10 h-10 rounded-xl bg-red-100 text-red-800 flex items-center justify-center">
                <PlusCircle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">Record New Expense</h3>
                <p className="text-xs text-slate-500">Institute official debit payment voucher</p>
              </div>
            </div>

            {formError && (
              <div className="mb-4 p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleCreateExpense} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Expense Date</label>
                  <input
                    type="date"
                    required
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-red-700 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Expense Category</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value as any })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-red-700 focus:outline-none"
                  >
                    {CATEGORIES.map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Expense Title / Purpose *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Electricity Bill or Diesel for Generator or Lab Slides"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-red-700 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Amount Paid (PKR) *
                  </label>
                  <input
                    type="number"
                    min="1"
                    step="1"
                    required
                    placeholder="e.g. 15000"
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-mono font-bold text-slate-900 focus:ring-2 focus:ring-red-700 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Payment Method</label>
                  <select
                    value={formData.paymentMethod}
                    onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value as any })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-red-700 focus:outline-none"
                  >
                    <option value="Cash">Cash</option>
                    <option value="Bank Transfer">Bank Transfer</option>
                    <option value="JazzCash">JazzCash</option>
                    <option value="EasyPaisa">EasyPaisa</option>
                    <option value="Cheque">Cheque</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Paid To (Payee / Vendor) *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. GEPCO or Supplier Name"
                    value={formData.payee}
                    onChange={(e) => setFormData({ ...formData, payee: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-red-700 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Bill / Invoice / Receipt #
                  </label>
                  <input
                    type="text"
                    placeholder="Optional (e.g. INV-8821)"
                    value={formData.receiptRef}
                    onChange={(e) => setFormData({ ...formData, receiptRef: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-red-700 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Additional Notes / Remarks</label>
                <textarea
                  rows={2}
                  placeholder="Optional notes or details..."
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-red-700 focus:outline-none"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 border border-slate-300 rounded-lg text-slate-700 font-semibold hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-red-700 hover:bg-red-800 text-white font-bold rounded-lg shadow-sm cursor-pointer"
                >
                  Save & Generate Voucher →
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Printable Expense Voucher Modal */}
      {selectedVoucher && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4 backdrop-blur-2xs overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 relative my-6 text-slate-900">
            <div className="flex items-center justify-between border-b pb-3 mb-4 no-print">
              <span className="font-bold text-xs uppercase tracking-wider text-slate-600">
                Official Expense Payment Voucher
              </span>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => window.print()}
                  className="px-3 py-1.5 bg-red-700 hover:bg-red-800 text-white text-xs font-bold rounded-lg flex items-center space-x-1 cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print Voucher</span>
                </button>
                <button
                  onClick={() => setSelectedVoucher(null)}
                  className="p-1.5 text-slate-400 hover:text-slate-600 cursor-pointer rounded-lg hover:bg-slate-100"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Voucher Paper Format */}
            <div className="border-2 border-slate-800 p-5 rounded-lg bg-white space-y-4">
              {/* Header with Circular Logo on White/Neutral Background */}
              <div className="border-b-2 border-slate-700 pb-3 flex items-start justify-between">
                <div className="flex items-center space-x-3">
                  <div className="p-0.5 rounded-full bg-slate-50 border border-slate-300 shrink-0">
                    <Logo size="lg" />
                  </div>
                  <div>
                    <h1 className="text-base font-extrabold uppercase tracking-tight text-slate-900 leading-tight">
                      {INSTITUTE_INFO.name}
                    </h1>
                    <p className="text-xs font-semibold text-slate-700">
                      {INSTITUTE_INFO.subtitle}
                    </p>
                    <p className="text-[10px] text-slate-500 mt-0.5">
                      {INSTITUTE_INFO.address} · {INSTITUTE_INFO.phones.join(' | ')}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="inline-block px-2.5 py-1 bg-red-800 text-white font-extrabold text-[10px] rounded uppercase tracking-wider">
                    EXPENSE VOUCHER
                  </span>
                  <div className="mt-1 font-mono font-bold text-xs text-red-900">
                    {selectedVoucher.voucherNo}
                  </div>
                </div>
              </div>

              {/* Voucher Meta */}
              <div className="grid grid-cols-2 gap-2 text-xs bg-slate-50 p-2.5 rounded border border-slate-200">
                <div>
                  <span className="text-slate-500">Date:</span>{' '}
                  <strong className="font-mono">{selectedVoucher.date}</strong>
                </div>
                <div>
                  <span className="text-slate-500">Payment Mode:</span>{' '}
                  <strong>{selectedVoucher.paymentMethod}</strong>
                </div>
                <div>
                  <span className="text-slate-500">Category:</span>{' '}
                  <strong>{selectedVoucher.category}</strong>
                </div>
                <div>
                  <span className="text-slate-500">Bill/Ref #:</span>{' '}
                  <strong className="font-mono">{selectedVoucher.receiptRef || 'N/A'}</strong>
                </div>
              </div>

              {/* Payee & Description */}
              <div className="border border-slate-200 rounded p-3 text-xs space-y-2">
                <div className="flex justify-between border-b pb-1.5">
                  <span className="text-slate-500">Paid To (Beneficiary):</span>
                  <span className="font-bold text-slate-900">{selectedVoucher.payee}</span>
                </div>
                <div className="flex justify-between border-b pb-1.5">
                  <span className="text-slate-500">Being Paid For (Purpose):</span>
                  <span className="font-semibold text-slate-900">{selectedVoucher.title}</span>
                </div>
                {selectedVoucher.notes && (
                  <div className="text-[11px] text-slate-600">
                    <span className="text-slate-400">Notes:</span> {selectedVoucher.notes}
                  </div>
                )}
              </div>

              {/* Amount Highlight */}
              <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-center justify-between">
                <div>
                  <div className="text-[10px] uppercase font-bold text-red-800">Total Amount Paid</div>
                  <div className="text-xs font-semibold text-red-950 mt-0.5">
                    {amountToWords(selectedVoucher.amount)}
                  </div>
                </div>
                <div className="text-xl font-extrabold font-mono text-red-900">
                  {formatPKR(selectedVoucher.amount)}
                </div>
              </div>

              {/* Signature Lines */}
              <div className="pt-8 grid grid-cols-3 gap-4 text-center text-[10px] text-slate-600">
                <div className="border-t border-slate-400 pt-1">
                  Receiver's Signature
                </div>
                <div className="border-t border-slate-400 pt-1">
                  Prepared By ({selectedVoucher.recordedBy})
                </div>
                <div className="border-t border-slate-400 pt-1 font-bold text-slate-900">
                  Authorized / Principal Sign
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
