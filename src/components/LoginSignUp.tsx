import React, { useState } from 'react';
import { User, UserRole } from '../types';
import { loginUser, registerUser } from '../utils/storage';
import { INSTITUTE_INFO } from '../constants';
import { Logo } from './Logo';
import { 
  ShieldCheck, 
  UserCheck, 
  Lock, 
  Mail, 
  User as UserIcon, 
  Building2, 
  CheckCircle2, 
  AlertCircle, 
  KeyRound,
  ArrowRight,
  ShieldAlert,
  CreditCard,
  UserPlus
} from 'lucide-react';

interface LoginSignUpProps {
  onLoginSuccess: (user: User) => void;
  onCancel?: () => void;
  initialMode?: 'login' | 'signup';
}

export const LoginSignUp: React.FC<LoginSignUpProps> = ({
  onLoginSuccess,
  onCancel,
  initialMode = 'login'
}) => {
  const [mode, setMode] = useState<'login' | 'signup'>(initialMode);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Form states
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [role, setRole] = useState<UserRole>('staff');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');

    if (mode === 'login') {
      if (!email.trim() || !password) {
        setError('Please enter your email/username and password.');
        return;
      }

      const res = loginUser(email, password);
      if (res.success && res.user) {
        onLoginSuccess(res.user);
      } else {
        setError(res.error || 'Failed to authenticate.');
      }
    } else {
      // Sign Up validation
      if (!name.trim() || !email.trim() || !password) {
        setError('Please fill in all required fields.');
        return;
      }

      if (password.length < 6) {
        setError('Password must be at least 6 characters long.');
        return;
      }

      if (password !== confirmPassword) {
        setError('Passwords do not match.');
        return;
      }

      const res = registerUser({
        name: name.trim(),
        email: email.trim(),
        password,
        role
      });

      if (res.success && res.user) {
        setSuccessMsg(`Account created successfully as ${role.toUpperCase()}! Logging you in...`);
        setTimeout(() => {
          onLoginSuccess(res.user!);
        }, 600);
      } else {
        setError(res.error || 'Failed to create user account.');
      }
    }
  };

  const handleQuickDemoLogin = (demoRole: UserRole) => {
    if (demoRole === 'admin') {
      setEmail('admin@citycon.edu.pk');
      setPassword('admin123');
      const res = loginUser('admin@citycon.edu.pk', 'admin123');
      if (res.success && res.user) onLoginSuccess(res.user);
    } else {
      setEmail('staff@citycon.edu.pk');
      setPassword('staff123');
      const res = loginUser('staff@citycon.edu.pk', 'staff123');
      if (res.success && res.user) onLoginSuccess(res.user);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900/95 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        {/* Institute Logo Brand - Circular on clean slate backdrop */}
        <div className="flex justify-center">
          <div className="p-1.5 rounded-full bg-slate-800 border-2 border-slate-700 shadow-2xl">
            <Logo size="xl" />
          </div>
        </div>

        <h2 className="mt-4 text-center text-2xl font-extrabold text-white tracking-tight">
          {INSTITUTE_INFO.name}
        </h2>
        <p className="mt-1 text-center text-xs text-slate-300 font-semibold uppercase tracking-wider">
          {INSTITUTE_INFO.subtitle} · Fee Management Portal
        </p>
      </div>

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-6 shadow-2xl rounded-2xl sm:px-10 border border-slate-100">
          {/* Mode Switcher Tabs */}
          <div className="flex border-b border-slate-200 mb-6">
            <button
              type="button"
              onClick={() => { setMode('login'); setError(''); setSuccessMsg(''); }}
              className={`flex-1 pb-3 text-center text-sm font-bold border-b-2 cursor-pointer transition-colors ${
                mode === 'login'
                  ? 'border-red-700 text-red-800'
                  : 'border-transparent text-slate-400 hover:text-slate-600'
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => { setMode('signup'); setError(''); setSuccessMsg(''); }}
              className={`flex-1 pb-3 text-center text-sm font-bold border-b-2 cursor-pointer transition-colors ${
                mode === 'signup'
                  ? 'border-red-700 text-red-800'
                  : 'border-transparent text-slate-400 hover:text-slate-600'
              }`}
            >
              Create Account
            </button>
          </div>

          {/* Quick Demo Credentials Box */}
          <div className="mb-6 bg-slate-50 border border-slate-200 rounded-xl p-3">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wider flex items-center">
                <KeyRound className="w-3.5 h-3.5 text-red-700 mr-1.5" />
                Quick 1-Click Role Login
              </span>
              <span className="text-[10px] text-slate-400">Demo Testing</span>
            </div>
            
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => handleQuickDemoLogin('admin')}
                className="py-2 px-2.5 bg-red-800 hover:bg-red-900 active:bg-red-950 text-white rounded-lg text-left transition-colors cursor-pointer shadow-2xs"
              >
                <div className="flex items-center space-x-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-red-200" />
                  <span className="font-bold text-xs">Admin Role</span>
                </div>
                <div className="text-[10px] text-red-200 truncate mt-0.5">
                  Full System Access
                </div>
              </button>

              <button
                type="button"
                onClick={() => handleQuickDemoLogin('staff')}
                className="py-2 px-2.5 bg-slate-800 hover:bg-slate-900 active:bg-slate-950 text-white rounded-lg text-left transition-colors cursor-pointer shadow-2xs"
              >
                <div className="flex items-center space-x-1.5">
                  <UserCheck className="w-3.5 h-3.5 text-slate-300" />
                  <span className="font-bold text-xs">Staff Role</span>
                </div>
                <div className="text-[10px] text-slate-300 truncate mt-0.5">
                  Deposit & Add Student Only
                </div>
              </button>
            </div>
          </div>

          {/* Error / Success Notifications */}
          {error && (
            <div className="mb-4 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-lg p-3 flex items-start space-x-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {successMsg && (
            <div className="mb-4 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-lg p-3 flex items-start space-x-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'signup' && (
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Full Name
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <UserIcon className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Tariq Mehmood"
                    className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-lg text-xs sm:text-sm focus:ring-2 focus:ring-emerald-600 focus:outline-none"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Email Address or Username
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@citycon.edu.pk"
                  className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-lg text-xs sm:text-sm focus:ring-2 focus:ring-emerald-600 focus:outline-none"
                />
              </div>
            </div>

            {mode === 'signup' && (
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Assign User Role
                </label>
                <div className="grid grid-cols-2 gap-2 mt-1">
                  <label
                    className={`border rounded-lg p-2.5 cursor-pointer flex flex-col justify-between transition-colors ${
                      role === 'admin'
                        ? 'border-emerald-600 bg-emerald-50 text-emerald-950 font-bold'
                        : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-1.5">
                        <ShieldCheck className="w-4 h-4 text-emerald-700" />
                        <span className="text-xs">Admin</span>
                      </div>
                      <input
                        type="radio"
                        name="role"
                        value="admin"
                        checked={role === 'admin'}
                        onChange={() => setRole('admin')}
                        className="text-emerald-600"
                      />
                    </div>
                    <p className="text-[10px] text-slate-500 font-normal mt-1 leading-tight">
                      Full access to all modules, reports, ledger & backup
                    </p>
                  </label>

                  <label
                    className={`border rounded-lg p-2.5 cursor-pointer flex flex-col justify-between transition-colors ${
                      role === 'staff'
                        ? 'border-emerald-600 bg-emerald-50 text-emerald-950 font-bold'
                        : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-1.5">
                        <UserCheck className="w-4 h-4 text-slate-700" />
                        <span className="text-xs">Staff</span>
                      </div>
                      <input
                        type="radio"
                        name="role"
                        value="staff"
                        checked={role === 'staff'}
                        onChange={() => setRole('staff')}
                        className="text-emerald-600"
                      />
                    </div>
                    <p className="text-[10px] text-slate-500 font-normal mt-1 leading-tight">
                      Deposit fee & add student access only
                    </p>
                  </label>
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-lg text-xs sm:text-sm focus:ring-2 focus:ring-red-700 focus:outline-none"
                />
              </div>
            </div>

            {mode === 'signup' && (
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Confirm Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    type="password"
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-lg text-xs sm:text-sm focus:ring-2 focus:ring-red-700 focus:outline-none"
                  />
                </div>
              </div>
            )}

            <button
              type="submit"
              className="w-full py-2.5 px-4 bg-red-700 hover:bg-red-800 active:bg-red-900 text-white font-bold rounded-lg text-sm shadow-md transition-colors cursor-pointer flex items-center justify-center space-x-1.5 mt-2"
            >
              <span>{mode === 'login' ? 'Sign In to Portal' : 'Register Account'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Role Access Guide */}
          <div className="mt-6 pt-4 border-t border-slate-100 text-xs text-slate-500">
            <h5 className="font-bold text-slate-700 mb-1.5">Role Permission Matrix:</h5>
            <div className="space-y-1 text-[11px]">
              <div className="flex items-center space-x-1.5">
                <span className="w-2 h-2 rounded-full bg-red-600"></span>
                <span><strong>Admin:</strong> Full dashboard, reports, pending dues, ledger, backup & expenses.</span>
              </div>
              <div className="flex items-center space-x-1.5">
                <span className="w-2 h-2 rounded-full bg-slate-600"></span>
                <span><strong>Staff:</strong> Deposit fee collection & add new student records only.</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
