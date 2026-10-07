/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Student, FeeTransaction, User } from './types';
import { INSTITUTE_INFO } from './constants';
import { 
  getStudents, 
  getTransactions, 
  getStudentBalance, 
  getStudentPaymentHistory,
  getCurrentUser,
  logoutUser
} from './utils/storage';

import { Header, NavTab } from './components/Header';
import { Dashboard } from './components/Dashboard';
import { StudentAdd } from './components/StudentAdd';
import { FeeCollection } from './components/FeeCollection';
import { StudentHistory } from './components/StudentHistory';
import { DefaultersList } from './components/DefaultersList';
import { DayBook } from './components/DayBook';
import { DoubleReceipt } from './components/DoubleReceipt';
import { PhpSourceViewer } from './components/PhpSourceViewer';
import { Reports } from './components/Reports';
import { LoginSignUp } from './components/LoginSignUp';
import { AccessDenied } from './components/AccessDenied';
import { ExpenseBook } from './components/ExpenseBook';
import { CourseWiseVoucherGenerator } from './components/CourseWiseVoucherGenerator';
import { AndroidInstallBanner } from './components/AndroidInstallBanner';
import { AndroidAppModal } from './components/AndroidAppModal';

export default function App() {
  // Current authenticated user state
  const [currentUser, setCurrentUser] = useState<User | null>(() => getCurrentUser());
  const [showAuthModal, setShowAuthModal] = useState<boolean>(false);
  const [showAndroidModal, setShowAndroidModal] = useState<boolean>(false);

  const isAdmin = currentUser?.role === 'admin';
  const isStaff = currentUser?.role === 'staff';

  const [activeTab, setActiveTab] = useState<NavTab>(() => {
    // Check URL query parameters (e.g. from Android shortcuts ?tab=fee-collection)
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      const tabParam = urlParams.get('tab') as NavTab | null;
      if (tabParam) return tabParam;
    }
    const user = getCurrentUser();
    return user?.role === 'staff' ? 'fee-collection' : 'dashboard';
  });

  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Cross-navigation student pointer
  const [collectionStudentId, setCollectionStudentId] = useState<string | undefined>(undefined);
  const [ledgerStudentId, setLedgerStudentId] = useState<string | undefined>(undefined);

  // Active Double Receipt Modal state
  const [receiptData, setReceiptData] = useState<{
    student: Student;
    transaction: FeeTransaction;
    allTransactions: FeeTransaction[];
  } | null>(null);

  const refreshAll = useCallback(() => {
    setRefreshTrigger((prev) => prev + 1);
  }, []);

  const students = useMemo(() => {
    return getStudents();
  }, [refreshTrigger]);

  const pendingCount = useMemo(() => {
    const txs = getTransactions();
    return students.filter((s) => {
      const studentTxs = txs.filter((t) => t.studentId === s.id);
      const paid = studentTxs.reduce((sum, t) => sum + Number(t.amount || 0), 0);
      return (s.netPayableFee || 0) - paid > 0;
    }).length;
  }, [students, refreshTrigger]);

  const handleStudentAdded = (newStudent: Student) => {
    refreshAll();
  };

  const handlePaymentSuccess = (transaction: FeeTransaction) => {
    refreshAll();
    // Open Double Copy Receipt
    const currentStudent = students.find((s) => s.id === transaction.studentId);
    if (currentStudent) {
      const allTx = getStudentPaymentHistory(currentStudent.id);
      setReceiptData({
        student: currentStudent,
        transaction,
        allTransactions: allTx
      });
    }
  };

  const handleViewReceipt = (tx: FeeTransaction) => {
    const currentStudent = students.find((s) => s.id === tx.studentId);
    if (currentStudent) {
      const allTx = getStudentPaymentHistory(currentStudent.id);
      setReceiptData({
        student: currentStudent,
        transaction: tx,
        allTransactions: allTx
      });
    }
  };

  // Navigate to Fee Collection with pre-selected student
  const handleNavigateToPayment = (studentId: string) => {
    setCollectionStudentId(studentId);
    setActiveTab('fee-collection');
  };

  // Navigate to Student Ledger with pre-selected student
  const handleNavigateToLedger = (studentId: string) => {
    if (!isAdmin) {
      // If staff tries to navigate to ledger, redirect to fee collection
      handleNavigateToPayment(studentId);
      return;
    }
    setLedgerStudentId(studentId);
    setActiveTab('student-history');
  };

  const handleLogout = () => {
    logoutUser();
    setCurrentUser(null);
    setShowAuthModal(true);
  };

  const handleLoginSuccess = (user: User) => {
    setCurrentUser(user);
    setShowAuthModal(false);
    if (user.role === 'staff') {
      setActiveTab('fee-collection');
    } else {
      setActiveTab('dashboard');
    }
  };

  // If no user is logged in or user clicked Switch/Login, show Auth Screen
  if (!currentUser || showAuthModal) {
    return (
      <LoginSignUp
        onLoginSuccess={handleLoginSuccess}
        onCancel={currentUser ? () => setShowAuthModal(false) : undefined}
      />
    );
  }

  // Check if current tab is restricted for staff role
  const isTabRestrictedForStaff = isStaff && activeTab !== 'fee-collection' && activeTab !== 'add-student' && activeTab !== 'course-vouchers';

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-900 antialiased selection:bg-emerald-600 selection:text-white">
      {/* Android PWA Install Banner */}
      <AndroidInstallBanner onOpenModal={() => setShowAndroidModal(true)} />

      {/* Top Header & Navigation with Global Search & Role State */}
      <Header
        activeTab={activeTab}
        onSelectTab={(tab) => {
          setActiveTab(tab);
          if (tab !== 'fee-collection') {
            setCollectionStudentId(undefined);
          }
        }}
        pendingCount={pendingCount}
        onNavigateToPayment={handleNavigateToPayment}
        onNavigateToLedger={handleNavigateToLedger}
        currentUser={currentUser}
        onLogout={handleLogout}
        onSwitchUser={() => setShowAuthModal(true)}
        onOpenAndroidModal={() => setShowAndroidModal(true)}
      />

      {/* Main Content Body */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6 sm:py-8">
        {/* If Staff tries to access a restricted module */}
        {isTabRestrictedForStaff ? (
          <AccessDenied
            currentUser={currentUser}
            onNavigateTab={setActiveTab}
            onSwitchUser={() => setShowAuthModal(true)}
          />
        ) : (
          <>
            {activeTab === 'dashboard' && (
              <Dashboard
                onNavigateTab={setActiveTab}
                onSelectStudentForPayment={handleNavigateToPayment}
                onViewReceipt={handleViewReceipt}
                onOpenAndroidModal={() => setShowAndroidModal(true)}
              />
            )}

            {activeTab === 'add-student' && (
              <StudentAdd
                onStudentAdded={handleStudentAdded}
                onNavigateToCollection={handleNavigateToPayment}
              />
            )}

            {activeTab === 'fee-collection' && (
              <FeeCollection
                key={`fee-${collectionStudentId || 'none'}-${refreshTrigger}`}
                initialStudentId={collectionStudentId}
                onPaymentSuccess={handlePaymentSuccess}
                onViewStudentHistory={handleNavigateToLedger}
              />
            )}

            {activeTab === 'course-vouchers' && (
              <CourseWiseVoucherGenerator
                onNavigateToCollection={handleNavigateToPayment}
              />
            )}

            {activeTab === 'student-history' && (
              <StudentHistory
                key={`history-${ledgerStudentId || 'none'}-${refreshTrigger}`}
                initialSelectedStudentId={ledgerStudentId}
                onSelectStudentForPayment={handleNavigateToPayment}
                onViewReceipt={(tx, st) => handleViewReceipt(tx)}
              />
            )}

            {activeTab === 'defaulters' && (
              <DefaultersList
                key={`defaulters-${refreshTrigger}`}
                onCollectFee={handleNavigateToPayment}
                onViewStudentHistory={handleNavigateToLedger}
              />
            )}

            {activeTab === 'day-book' && (
              <DayBook
                key={`daybook-${refreshTrigger}`}
                onViewReceipt={handleViewReceipt}
                onRefreshData={refreshAll}
              />
            )}

            {activeTab === 'reports' && (
              <Reports />
            )}

            {activeTab === 'expenses' && (
              <ExpenseBook currentUser={currentUser} />
            )}

            {activeTab === 'php-code' && (
              <PhpSourceViewer />
            )}
          </>
        )}
      </main>

      {/* Double Copy Receipt Modal (Supports on-screen view, direct PDF export & A4 printing) */}
      {receiptData && (
        <DoubleReceipt
          student={receiptData.student}
          currentTransaction={receiptData.transaction}
          allTransactions={receiptData.allTransactions}
          onClose={() => setReceiptData(null)}
        />
      )}

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-6 text-center text-xs text-slate-500 no-print">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <p>© {new Date().getFullYear()} {INSTITUTE_INFO.name}. All rights reserved.</p>
          <div className="flex items-center space-x-3 text-slate-400">
            <span>Logged in as: <strong className="text-slate-700">{currentUser.name}</strong> ({currentUser.role.toUpperCase()})</span>
            <span>·</span>
            <button
              onClick={() => setShowAndroidModal(true)}
              className="text-emerald-700 hover:text-emerald-800 font-bold hover:underline cursor-pointer flex items-center space-x-1"
            >
              <span>📲 Android App &amp; APK</span>
            </button>
            <span>·</span>
            <span>Campus: {INSTITUTE_INFO.subtitle}</span>
          </div>
        </div>
      </footer>

      {/* Android Installation & Native APK Studio Modal */}
      <AndroidAppModal
        isOpen={showAndroidModal}
        onClose={() => setShowAndroidModal(false)}
      />
    </div>
  );
}
