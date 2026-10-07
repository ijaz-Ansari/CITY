import React, { useState, useMemo, useRef, useEffect } from 'react';
import { User } from '../types';
import { INSTITUTE_INFO } from '../constants';
import { formatPKR } from '../utils/numberToWords';
import { getStudents, getTransactions } from '../utils/storage';
import { Logo } from './Logo';
import { 
  Building2, 
  Phone, 
  MapPin, 
  CreditCard, 
  UserPlus, 
  History, 
  LayoutDashboard, 
  AlertCircle, 
  BookOpen, 
  CalendarCheck, 
  Receipt, 
  BarChart3, 
  Search, 
  X, 
  ArrowRight, 
  UserCheck, 
  ShieldCheck, 
  ShieldAlert, 
  LogOut, 
  KeyRound,
  ReceiptText,
  FileText,
  Smartphone
} from 'lucide-react';

export type NavTab = 
  | 'dashboard' 
  | 'add-student' 
  | 'fee-collection' 
  | 'course-vouchers'
  | 'student-history' 
  | 'defaulters' 
  | 'day-book' 
  | 'expenses'
  | 'reports' 
  | 'php-code';

interface HeaderProps {
  activeTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  pendingCount: number;
  onNavigateToPayment?: (studentId: string) => void;
  onNavigateToLedger?: (studentId: string) => void;
  currentUser: User | null;
  onLogout: () => void;
  onSwitchUser: () => void;
  onOpenAndroidModal?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  onSelectTab,
  pendingCount,
  onNavigateToPayment,
  onNavigateToLedger,
  currentUser,
  onLogout,
  onSwitchUser,
  onOpenAndroidModal
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const searchContainerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const isAdmin = currentUser?.role === 'admin';

  // Close search dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        searchContainerRef.current &&
        !searchContainerRef.current.contains(e.target as Node)
      ) {
        setIsSearchOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Keyboard shortcut: Press Ctrl+K or / to focus search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        searchInputRef.current?.focus();
        setIsSearchOpen(true);
      } else if (e.key === 'Escape') {
        setIsSearchOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Compute live student balances for instant search preview
  const searchResults = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return [];

    const students = getStudents();
    const txs = getTransactions();

    const matches = students.filter((s) => {
      return (
        s.fullName.toLowerCase().includes(q) ||
        s.rollNo.toLowerCase().includes(q) ||
        (s.regNo && s.regNo.toLowerCase().includes(q)) ||
        s.fatherName.toLowerCase().includes(q) ||
        s.phone.includes(q) ||
        s.program.toLowerCase().includes(q)
      );
    });

    return matches.slice(0, 8).map((s) => {
      const studentTxs = txs.filter((t) => t.studentId === s.id);
      const totalPaid = studentTxs.reduce((sum, t) => sum + Number(t.amount || 0), 0);
      const balance = Math.max(0, (s.netPayableFee || 0) - totalPaid);
      return {
        ...s,
        totalPaid,
        remainingBalance: balance
      };
    });
  }, [searchQuery, isSearchOpen]);

  const handleSelectPayment = (studentId: string) => {
    setIsSearchOpen(false);
    setSearchQuery('');
    if (onNavigateToPayment) {
      onNavigateToPayment(studentId);
    } else {
      onSelectTab('fee-collection');
    }
  };

  const handleSelectLedger = (studentId: string) => {
    setIsSearchOpen(false);
    setSearchQuery('');
    if (isAdmin) {
      if (onNavigateToLedger) {
        onNavigateToLedger(studentId);
      } else {
        onSelectTab('student-history');
      }
    } else {
      if (onNavigateToPayment) {
        onNavigateToPayment(studentId);
      } else {
        onSelectTab('fee-collection');
      }
    }
  };

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-40 shadow-xs no-print">
      {/* Top Institute Contact Strip in Clean Slate Navy */}
      <div className="bg-slate-900 text-slate-200 text-xs py-1.5 px-4 sm:px-6 border-b border-slate-800">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-1">
          <div className="flex items-center space-x-2">
            <MapPin className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <span className="truncate">
              {INSTITUTE_INFO.address}
            </span>
          </div>

          <div className="flex items-center space-x-3 text-[11px] font-mono">
            <span className="flex items-center space-x-1">
              <Phone className="w-3 h-3 text-emerald-400" />
              <span className="font-semibold text-white">{INSTITUTE_INFO.phones[0]}</span>
            </span>
            <span className="text-slate-600">|</span>
            <span className="font-semibold text-white">{INSTITUTE_INFO.phones[1]}</span>
          </div>
        </div>
      </div>

      {/* Main Branding Bar & Global Search */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          {/* Logo & Institute Name - Non-red background in logo area */}
          <div 
            onClick={() => onSelectTab(isAdmin ? 'dashboard' : 'fee-collection')} 
            className="flex items-center space-x-3 cursor-pointer select-none group shrink-0"
          >
            <div className="p-0.5 rounded-full bg-slate-900/10 shadow-xs border border-slate-300">
              <Logo size="md" className="group-hover:scale-105 transition-transform" />
            </div>

            <div>
              <div className="flex items-center space-x-2">
                <h1 className="text-base sm:text-lg font-extrabold text-slate-900 tracking-tight leading-tight group-hover:text-red-900 transition-colors">
                  {INSTITUTE_INFO.name}
                </h1>
                <span className="hidden sm:inline-block px-1.5 py-0.5 text-[9px] font-bold text-slate-800 bg-slate-100 rounded border border-slate-300 uppercase">
                  Nowshera Virkan
                </span>
              </div>
              <p className="text-[11px] text-slate-500 font-medium leading-tight">
                Allied Health Sciences · Fee Portal
              </p>
            </div>
          </div>

          {/* GLOBAL SEARCH INPUT (CENTER) */}
          <div ref={searchContainerRef} className="relative flex-1 max-w-md w-full">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                <Search className="w-4 h-4" />
              </div>
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setIsSearchOpen(true);
                }}
                onFocus={() => setIsSearchOpen(true)}
                placeholder="Search student by name, roll # or reg #..."
                className="w-full pl-9 pr-8 py-2 bg-slate-100/90 hover:bg-slate-100 focus:bg-white border border-slate-200 rounded-lg text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-red-700 focus:border-red-700 transition-all focus:outline-none shadow-2xs"
              />
              {searchQuery ? (
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery('');
                    setIsSearchOpen(false);
                  }}
                  className="absolute inset-y-0 right-0 pr-2.5 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              ) : (
                <div className="hidden sm:flex absolute inset-y-0 right-0 pr-2.5 items-center pointer-events-none">
                  <kbd className="text-[10px] font-mono text-slate-400 bg-white border border-slate-200 px-1.5 py-0.5 rounded shadow-2xs">
                    Ctrl K
                  </kbd>
                </div>
              )}
            </div>

            {/* Global Search Results Dropdown */}
            {isSearchOpen && searchQuery.trim().length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-1.5 bg-white border border-slate-200 rounded-xl shadow-2xl z-50 overflow-hidden divide-y divide-slate-100">
                <div className="p-2 bg-slate-50 border-b border-slate-100 flex items-center justify-between text-[11px] text-slate-500 font-medium">
                  <span>
                    Matching Students: <strong className="text-slate-800 font-bold">{searchResults.length}</strong>
                  </span>
                  <span className="text-[10px]">
                    {isAdmin ? 'Jump to Ledger or Collect Fee' : 'Jump to Collect Fee'}
                  </span>
                </div>

                {searchResults.length === 0 ? (
                  <div className="p-6 text-center text-slate-500">
                    <p className="text-xs font-semibold">No students found for "{searchQuery}"</p>
                    <p className="text-[11px] text-slate-400 mt-1">
                      Try searching by full name, roll number (e.g. CCN-2024-001) or father's name.
                    </p>
                  </div>
                ) : (
                  <div className="max-h-80 overflow-y-auto divide-y divide-slate-100">
                    {searchResults.map((st) => (
                      <div
                        key={st.id}
                        className="p-3 hover:bg-slate-50 transition-colors flex items-center justify-between gap-3 group"
                      >
                        <div 
                          className="min-w-0 flex-1 cursor-pointer"
                          onClick={() => handleSelectPayment(st.id)}
                        >
                          <div className="flex items-center space-x-2">
                            <span className="font-mono text-xs font-bold text-red-900 bg-red-50 px-2 py-0.5 rounded border border-red-200">
                              {st.rollNo}
                            </span>
                            <h4 className="text-xs sm:text-sm font-bold text-slate-900 group-hover:text-red-900 truncate">
                              {st.fullName}
                            </h4>
                          </div>

                          <div className="flex items-center space-x-3 text-[11px] text-slate-500 mt-1">
                            <span>S/D/O: <strong className="text-slate-700">{st.fatherName}</strong></span>
                            <span>•</span>
                            <span className="text-red-800 font-medium truncate">{st.program}</span>
                          </div>

                          <div className="mt-1 flex items-center space-x-2 text-[11px]">
                            {st.remainingBalance > 0 ? (
                              <span className="font-mono font-bold text-red-700">
                                Balance Due: {formatPKR(st.remainingBalance)}
                              </span>
                            ) : (
                              <span className="text-emerald-700 font-bold">
                                ✓ Fully Cleared
                              </span>
                            )}
                            <span className="text-slate-300">|</span>
                            <span className="text-slate-500 font-mono">
                              Paid: {formatPKR(st.totalPaid)}
                            </span>
                          </div>
                        </div>

                        {/* Direct Jump Action Buttons */}
                        <div className="flex items-center space-x-1.5 shrink-0">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleSelectPayment(st.id);
                            }}
                            className="px-2.5 py-1.5 bg-red-700 hover:bg-red-800 text-white text-xs font-bold rounded-lg shadow-2xs transition-colors flex items-center space-x-1 cursor-pointer"
                            title="Collect Fee for this student"
                          >
                            <CreditCard className="w-3.5 h-3.5" />
                            <span className="hidden sm:inline">Collect</span>
                          </button>

                          {isAdmin && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleSelectLedger(st.id);
                              }}
                              className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold rounded-lg border border-slate-200 transition-colors flex items-center space-x-1 cursor-pointer"
                              title="View student installment ledger"
                            >
                              <History className="w-3.5 h-3.5 text-slate-600" />
                              <span className="hidden sm:inline">Ledger</span>
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Logged in User Profile & Role Indicator */}
          <div className="flex items-center space-x-3 shrink-0">
            {currentUser ? (
              <div className="flex items-center space-x-2 bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5">
                <div className="w-8 h-8 rounded-lg bg-red-700 text-white flex items-center justify-center font-bold text-xs">
                  {currentUser.role === 'admin' ? (
                    <ShieldCheck className="w-4 h-4 text-red-100" />
                  ) : (
                    <UserCheck className="w-4 h-4 text-red-100" />
                  )}
                </div>

                <div className="text-left hidden sm:block">
                  <div className="text-xs font-bold text-slate-900 leading-tight">
                    {currentUser.name}
                  </div>
                  <div className="flex items-center space-x-1 mt-0.5">
                    <span className={`inline-block px-1.5 py-0.2 text-[9px] font-extrabold uppercase rounded ${
                      isAdmin 
                        ? 'bg-red-100 text-red-900 border border-red-300' 
                        : 'bg-amber-100 text-amber-900 border border-amber-300'
                    }`}>
                      {isAdmin ? 'Admin (Full Access)' : 'Staff (Deposit Only)'}
                    </span>
                  </div>
                </div>

                <div className="flex items-center space-x-1 border-l border-slate-200 pl-2 ml-1">
                  <button
                    onClick={onSwitchUser}
                    className="p-1 text-slate-500 hover:text-red-700 hover:bg-slate-200/60 rounded text-xs transition-colors cursor-pointer"
                    title="Switch user or account"
                  >
                    <KeyRound className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={onLogout}
                    className="p-1 text-slate-500 hover:text-rose-700 hover:bg-rose-50 rounded text-xs transition-colors cursor-pointer"
                    title="Logout"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={onSwitchUser}
                className="inline-flex items-center px-3.5 py-2 bg-red-700 hover:bg-red-800 text-white text-xs sm:text-sm font-bold rounded-lg shadow-sm transition-all cursor-pointer"
              >
                Sign In
              </button>
            )}

            {/* Quick Android App Button */}
            {onOpenAndroidModal && (
              <button
                type="button"
                onClick={onOpenAndroidModal}
                className="inline-flex items-center px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 rounded-xl text-xs font-bold transition-all shadow-2xs cursor-pointer group"
                title="Install Android App or export Android Studio project"
              >
                <Smartphone className="w-3.5 h-3.5 text-emerald-600 mr-1.5 group-hover:scale-110 transition-transform" />
                <span className="hidden sm:inline">Android App</span>
                <span className="sm:hidden">App</span>
              </button>
            )}
          </div>
        </div>

        {/* Navigation Tabs (Enforcing Role-Based Access) */}
        <nav className="flex items-center space-x-1 sm:space-x-2 mt-3 pt-2 border-t border-slate-100 overflow-x-auto scrollbar-none">
          {/* Admin Tabs */}
          {isAdmin && (
            <button
              onClick={() => onSelectTab('dashboard')}
              className={`flex items-center px-3 py-2 rounded-lg text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                activeTab === 'dashboard'
                  ? 'bg-red-50 text-red-900 border-b-2 border-red-700'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <LayoutDashboard className="w-3.5 h-3.5 mr-1.5" />
              Dashboard
            </button>
          )}

          {/* 1. Add Student (Staff & Admin) */}
          <button
            onClick={() => onSelectTab('add-student')}
            className={`flex items-center px-3 py-2 rounded-lg text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'add-student'
                ? 'bg-red-50 text-red-900 border-b-2 border-red-700'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <UserPlus className="w-3.5 h-3.5 mr-1.5" />
            1. Add Student
          </button>

          {/* 2. Fee Collection (Staff & Admin) */}
          <button
            onClick={() => onSelectTab('fee-collection')}
            className={`flex items-center px-3.5 py-2 rounded-lg text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'fee-collection'
                ? 'bg-red-700 text-white shadow-xs'
                : 'text-slate-700 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <CreditCard className="w-3.5 h-3.5 mr-1.5" />
            2. Fee Collection (Deposit)
          </button>

          {/* Course-wise Fee Slip Generator */}
          <button
            onClick={() => onSelectTab('course-vouchers')}
            className={`flex items-center px-3 py-2 rounded-lg text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'course-vouchers'
                ? 'bg-red-50 text-red-900 border-b-2 border-red-700'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <FileText className="w-3.5 h-3.5 mr-1.5 text-red-700" />
            Issue Slips (Course-wise)
          </button>

          {/* Admin Only Modules */}
          {isAdmin ? (
            <>
              <button
                onClick={() => onSelectTab('student-history')}
                className={`flex items-center px-3 py-2 rounded-lg text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                  activeTab === 'student-history'
                    ? 'bg-red-50 text-red-900 border-b-2 border-red-700'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                <History className="w-3.5 h-3.5 mr-1.5" />
                3. Student Ledger History
              </button>

              <button
                onClick={() => onSelectTab('defaulters')}
                className={`flex items-center px-3 py-2 rounded-lg text-xs font-bold transition-all whitespace-nowrap cursor-pointer relative ${
                  activeTab === 'defaulters'
                    ? 'bg-rose-50 text-rose-800 border-b-2 border-rose-600'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                <AlertCircle className="w-3.5 h-3.5 mr-1.5 text-rose-600" />
                Pending Dues
                {pendingCount > 0 && (
                  <span className="ml-1.5 px-1.5 py-0.2 bg-rose-600 text-white rounded-full text-[10px] font-mono">
                    {pendingCount}
                  </span>
                )}
              </button>

              <button
                onClick={() => onSelectTab('day-book')}
                className={`flex items-center px-3 py-2 rounded-lg text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                  activeTab === 'day-book'
                    ? 'bg-red-50 text-red-900 border-b-2 border-red-700'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                <Receipt className="w-3.5 h-3.5 mr-1.5" />
                Day Book & Backup
              </button>

              <button
                onClick={() => onSelectTab('expenses')}
                className={`flex items-center px-3 py-2 rounded-lg text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                  activeTab === 'expenses'
                    ? 'bg-red-50 text-red-900 border-b-2 border-red-700'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                <ReceiptText className="w-3.5 h-3.5 mr-1.5 text-red-700" />
                Expense Book
              </button>

              <button
                onClick={() => onSelectTab('reports')}
                className={`flex items-center px-3 py-2 rounded-lg text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                  activeTab === 'reports'
                    ? 'bg-red-50 text-red-900 border-b-2 border-red-700'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                <BarChart3 className="w-3.5 h-3.5 mr-1.5 text-red-700" />
                Reports
              </button>

              <button
                onClick={() => onSelectTab('php-code')}
                className={`flex items-center px-3 py-2 rounded-lg text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                  activeTab === 'php-code'
                    ? 'bg-indigo-50 text-indigo-800 border-b-2 border-indigo-600'
                    : 'text-slate-600 hover:text-indigo-900 hover:bg-indigo-50/50'
                }`}
              >
                <span className="mr-1.5 font-mono text-[11px] bg-indigo-100 text-indigo-700 px-1 py-0.2 rounded font-extrabold">PHP</span>
                PHP & MySQL Code (ZIP)
              </button>

              {onOpenAndroidModal && (
                <button
                  type="button"
                  onClick={onOpenAndroidModal}
                  className="flex items-center px-3 py-2 rounded-lg text-xs font-bold transition-all whitespace-nowrap cursor-pointer bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300"
                >
                  <Smartphone className="w-3.5 h-3.5 mr-1.5 text-emerald-600" />
                  <span>📲 Android App</span>
                </button>
              )}
            </>
          ) : (
            <div className="flex items-center px-3 py-1 bg-amber-50 border border-amber-200 text-amber-900 rounded-lg text-[11px] font-medium ml-2">
              <ShieldAlert className="w-3.5 h-3.5 mr-1.5 text-amber-700" />
              <span>Staff Mode: Restricted to Fee Collection & Add Student. Reports & Ledgers locked.</span>
            </div>
          )}
        </nav>
      </div>
    </header>
  );
};
