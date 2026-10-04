/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback } from 'react';
import { Navbar } from './components/Navbar';
import { PersonalJournal } from './components/PersonalJournal';
import { AdminMonitoring } from './components/AdminMonitoring';
import { AuthModal } from './components/AuthModal';
import { LoginPage } from './components/LoginPage';
import { AddTransactionModal } from './components/AddTransactionModal';
import { EditTransactionModal } from './components/EditTransactionModal';
import { EditProfileModal } from './components/EditProfileModal';
import { User, Transaction, TransactionSummary, DbStatus, TransactionType } from './types';
import { Database, Shield, CheckCircle2 } from 'lucide-react';

export default function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('fj_user');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return null;
      }
    }
    // Halaman awal default adalah belum login (harus login terlebih dahulu)
    return null;
  });

  const [activeView, setActiveView] = useState<'journal' | 'admin'>('journal');
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [summary, setSummary] = useState<TransactionSummary>({
    totalIncome: 0,
    totalExpense: 0,
    netBalance: 0,
    totalCount: 0,
  });
  const [loadingTx, setLoadingTx] = useState(false);

  // Neon DB Connection Status
  const [dbStatus, setDbStatus] = useState<DbStatus | null>(null);
  const [dbLoading, setDbLoading] = useState(false);

  // Modals
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [isAddTxOpen, setIsAddTxOpen] = useState(false);
  const [addTxType, setAddTxType] = useState<TransactionType>('pemasukan');
  const [isEditTxOpen, setIsEditTxOpen] = useState(false);
  const [editingTx, setEditingTx] = useState<Transaction | null>(null);
  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);
  const [resetNotice, setResetNotice] = useState<{ email?: string; message?: string } | null>(null);

  // Fetch Neon Database Status
  const fetchDbStatus = useCallback(async () => {
    setDbLoading(true);
    try {
      const res = await fetch('/api/db-status');
      const data = await res.json();
      setDbStatus(data);
    } catch (err: any) {
      setDbStatus({
        connected: false,
        error: err.message,
      });
    } finally {
      setDbLoading(false);
    }
  }, []);

  // Fetch User's Transactions (Process 4.0: Lihat Jurnal Pribadi)
  const fetchTransactions = useCallback(async () => {
    if (!currentUser) return;
    setLoadingTx(true);
    try {
      const url = `/api/transactions?userId=${currentUser.id}`;
      const res = await fetch(url);
      const data = await res.json();
      if (!res.ok) {
        if (data.passwordResetRequired) {
          setCurrentUser(null);
          localStorage.removeItem('fj_user');
          setResetNotice({
            email: currentUser.email,
            message: 'password anda telah Reset tolong masukan password kembali',
          });
          return;
        }
      }
      if (res.ok) {
        setTransactions(data.transactions || []);
        setSummary(
          data.summary || {
            totalIncome: 0,
            totalExpense: 0,
            netBalance: 0,
            totalCount: 0,
          }
        );
      }
    } catch (err) {
      console.error('Error fetching transactions:', err);
    } finally {
      setLoadingTx(false);
    }
  }, [currentUser]);

  // Pantau jika status akun di-reset oleh admin saat user sedang login
  useEffect(() => {
    if (!currentUser || currentUser.role === 'admin') return;
    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/auth/check-status?userId=${currentUser.id}`);
        const data = await res.json();
        if (data.passwordResetRequired) {
          setCurrentUser(null);
          localStorage.removeItem('fj_user');
          setResetNotice({
            email: currentUser.email,
            message: 'password anda telah Reset tolong masukan password kembali',
          });
        }
      } catch {
        // Abaikan kegagalan jaringan sementara
      }
    }, 3000);
    return () => clearInterval(interval);
  }, [currentUser]);

  useEffect(() => {
    fetchDbStatus();
  }, [fetchDbStatus]);

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  const handleLoginSuccess = (user: User) => {
    setCurrentUser(user);
    localStorage.setItem('fj_user', JSON.stringify(user));
    if (user.role === 'admin') {
      setActiveView('admin');
    } else {
      setActiveView('journal');
    }
    fetchDbStatus();
  };

  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem('fj_user');
    setTransactions([]);
    setSummary({ totalIncome: 0, totalExpense: 0, netBalance: 0, totalCount: 0 });
    setIsAuthOpen(true);
  };

  const handleQuickSwitch = async (targetRole: 'user' | 'admin') => {
    const email =
      targetRole === 'admin' ? 'admin@financejournal.pro' : 'siti.rahma@gmail.com';
    const password = targetRole === 'admin' ? 'admin123' : 'user123';

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (res.ok && data.user) {
        handleLoginSuccess(data.user);
      }
    } catch (err) {
      console.error('Quick switch error:', err);
    }
  };

  const openAddModal = (type: TransactionType = 'pemasukan') => {
    if (!currentUser) {
      setIsAuthOpen(true);
      return;
    }
    setAddTxType(type);
    setIsAddTxOpen(true);
  };

  const openEditModal = (tx: Transaction) => {
    setEditingTx(tx);
    setIsEditTxOpen(true);
  };

  // Jika belum login, tampilkan halaman Login/Register sebagai halaman pertama
  if (!currentUser) {
    return (
      <LoginPage
        onSuccess={(user) => {
          setResetNotice(null);
          handleLoginSuccess(user);
        }}
        dbStatus={dbStatus}
        resetNotice={resetNotice}
      />
    );
  }

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 flex flex-col font-sans selection:bg-emerald-500 selection:text-neutral-950">
      {/* Top Bar adhering to Top Bar Contract */}
      <Navbar
        currentUser={currentUser}
        activeView={activeView}
        onNavigate={(view) => setActiveView(view)}
        onOpenAuth={(mode = 'login') => {
          setAuthMode(mode);
          setIsAuthOpen(true);
        }}
        onOpenAddModal={openAddModal}
        onOpenEditProfile={() => setIsEditProfileOpen(true)}
        onLogout={handleLogout}
        dbStatus={dbStatus}
        dbLoading={dbLoading}
        onRefreshDb={fetchDbStatus}
        onSwitchUserQuick={handleQuickSwitch}
      />

      {/* Main Viewport */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6 sm:py-8">
        {/* Dynamic View: Personal Journal vs Admin Monitoring */}
        {activeView === 'journal' ? (
          <PersonalJournal
            currentUser={currentUser}
            transactions={transactions}
            summary={summary}
            loading={loadingTx}
            onRefresh={() => {
              fetchTransactions();
              fetchDbStatus();
            }}
            onOpenAddModal={openAddModal}
            onOpenEditModal={openEditModal}
          />
        ) : (
          <AdminMonitoring />
        )}
      </main>

      {/* Footer */}
      <footer className="mt-auto border-t border-neutral-800/80 bg-neutral-950 py-5 text-neutral-500 text-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-neutral-400">Finance Journal Pro</span>
            <span aria-hidden="true">·</span>
            <span>Aplikasi Manajemen Keuangan Pribadi</span>
          </div>
          <div className="flex items-center gap-2 text-[11px] text-neutral-500">
            <span>© 2026 Finance Journal Pro. Seluruh Hak Cipta Dilindungi.</span>
          </div>
        </div>
      </footer>

      {/* Modals */}
      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        onSuccess={handleLoginSuccess}
        initialMode={authMode}
      />

      {currentUser && (
        <AddTransactionModal
          isOpen={isAddTxOpen}
          onClose={() => setIsAddTxOpen(false)}
          onSuccess={() => {
            fetchTransactions();
            fetchDbStatus();
          }}
          currentUser={currentUser}
          initialType={addTxType}
        />
      )}

      <EditTransactionModal
        isOpen={isEditTxOpen}
        onClose={() => {
          setIsEditTxOpen(false);
          setEditingTx(null);
        }}
        onSuccess={() => {
          fetchTransactions();
          fetchDbStatus();
        }}
        transaction={editingTx}
      />

      {currentUser && (
        <EditProfileModal
          isOpen={isEditProfileOpen}
          onClose={() => setIsEditProfileOpen(false)}
          currentUser={currentUser}
          onUpdateSuccess={(updatedUser) => {
            setCurrentUser(updatedUser);
            localStorage.setItem('fj_user', JSON.stringify(updatedUser));
            fetchTransactions();
          }}
        />
      )}
    </div>
  );
}
