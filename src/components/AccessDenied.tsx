import React from 'react';
import { User } from '../types';
import { ShieldAlert, CreditCard, UserPlus, LogOut, ArrowRight } from 'lucide-react';

interface AccessDeniedProps {
  currentUser: User | null;
  onNavigateTab: (tab: any) => void;
  onSwitchUser: () => void;
}

export const AccessDenied: React.FC<AccessDeniedProps> = ({
  currentUser,
  onNavigateTab,
  onSwitchUser
}) => {
  return (
    <div className="max-w-2xl mx-auto my-12 bg-white border border-slate-200 rounded-2xl p-8 shadow-sm text-center space-y-6">
      <div className="w-16 h-16 bg-amber-50 border border-amber-200 rounded-2xl flex items-center justify-center mx-auto text-amber-700">
        <ShieldAlert className="w-8 h-8" />
      </div>

      <div className="space-y-2">
        <span className="px-3 py-1 bg-amber-100 text-amber-900 font-extrabold rounded-full text-xs uppercase tracking-wider border border-amber-300">
          Module Restricted
        </span>
        <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">
          Administrator Permission Required
        </h2>
        <p className="text-sm text-slate-600 max-w-md mx-auto">
          You are currently logged in as <strong className="text-slate-900">{currentUser?.name}</strong> with the <strong className="text-amber-800 uppercase">Staff Role</strong>.
        </p>
      </div>

      <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-xs text-left max-w-md mx-auto space-y-2">
        <h4 className="font-bold text-slate-800 uppercase tracking-wider text-[11px]">
          Your Staff Access Includes:
        </h4>
        <div className="flex items-center space-x-2 text-slate-700">
          <span className="w-1.5 h-1.5 bg-emerald-600 rounded-full"></span>
          <span><strong>1. Add New Student</strong> (Register student with fee package)</span>
        </div>
        <div className="flex items-center space-x-2 text-slate-700">
          <span className="w-1.5 h-1.5 bg-emerald-600 rounded-full"></span>
          <span><strong>2. Fee Collection Desk</strong> (Deposit fees & print double-copy vouchers)</span>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
        <button
          onClick={() => onNavigateTab('fee-collection')}
          className="inline-flex items-center px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-lg text-xs sm:text-sm shadow-sm transition-colors cursor-pointer"
        >
          <CreditCard className="w-4 h-4 mr-1.5" />
          Go to Fee Collection Desk
        </button>

        <button
          onClick={() => onNavigateTab('add-student')}
          className="inline-flex items-center px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white font-semibold rounded-lg text-xs sm:text-sm shadow-sm transition-colors cursor-pointer"
        >
          <UserPlus className="w-4 h-4 mr-1.5" />
          Add New Student
        </button>

        <button
          onClick={onSwitchUser}
          className="inline-flex items-center px-3.5 py-2 bg-white hover:bg-slate-50 text-slate-700 font-semibold rounded-lg text-xs sm:text-sm border border-slate-300 transition-colors cursor-pointer"
        >
          <LogOut className="w-4 h-4 mr-1.5 text-slate-500" />
          Switch to Admin Login
        </button>
      </div>
    </div>
  );
};
