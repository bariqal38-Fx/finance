import React, { useState } from 'react';
import {
  Wallet,
  Shield,
  User as UserIcon,
  LogOut,
  Network,
  Plus,
  ArrowDownRight,
  ArrowUpRight,
  BookOpen,
  UserCheck,
} from 'lucide-react';
import { User, DbStatus, TransactionType } from '../types';

interface Props {
  currentUser: User | null;
  activeView: 'journal' | 'admin';
  onNavigate: (view: 'journal' | 'admin') => void;
  onOpenAuth: (mode?: 'login' | 'register') => void;
  onOpenAddModal: (type: TransactionType) => void;
  onOpenArchitecture?: () => void;
  onOpenEditProfile?: () => void;
  onLogout: () => void;
  dbStatus: DbStatus | null;
  dbLoading: boolean;
  onRefreshDb: () => void;
  onSwitchUserQuick: (role: 'user' | 'admin') => void;
}

export const Navbar: React.FC<Props> = ({
  currentUser,
  activeView,
  onNavigate,
  onOpenAuth,
  onOpenAddModal,
  onOpenArchitecture,
  onOpenEditProfile,
  onLogout,
  dbStatus,
  dbLoading,
  onRefreshDb,
  onSwitchUserQuick,
}) => {
  const [showUserMenu, setShowUserMenu] = useState(false);

  return (
    <header className="sticky top-0 z-40 bg-neutral-900/90 backdrop-blur-md border-b border-neutral-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
        {/* Zone 1: Single text element wordmark */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="w-8 h-8 rounded-xl bg-neutral-100 flex items-center justify-center text-neutral-900 font-bold text-sm shadow-xs">
            FJ
          </div>
          <button
            onClick={() => onNavigate('journal')}
            className="text-base sm:text-lg font-bold tracking-tight text-neutral-100 hover:text-white transition-colors text-left"
          >
            Finance Journal Pro
          </button>
        </div>

        {/* Zone 2: Clean text navigation links */}
        <nav className="hidden md:flex items-center gap-5 text-xs font-medium text-neutral-400">
          <button
            onClick={() => onNavigate('journal')}
            className={`hover:text-neutral-100 transition-colors py-1 ${
              activeView === 'journal'
                ? 'text-neutral-100 font-semibold border-b-2 border-neutral-100'
                : ''
            }`}
          >
            Jurnal Pribadi
          </button>

          {currentUser && (
            <>
              <button
                onClick={() => onOpenAddModal('pemasukan')}
                className="hover:text-emerald-400 transition-colors py-1 flex items-center gap-1"
              >
                <ArrowDownRight className="w-3.5 h-3.5" />
                Catat Pemasukan
              </button>
              <button
                onClick={() => onOpenAddModal('pengeluaran')}
                className="hover:text-rose-400 transition-colors py-1 flex items-center gap-1"
              >
                <ArrowUpRight className="w-3.5 h-3.5" />
                Catat Pengeluaran
              </button>
            </>
          )}

          {currentUser?.role === 'admin' && (
            <button
              onClick={() => onNavigate('admin')}
              className={`hover:text-purple-300 transition-colors py-1 flex items-center gap-1.5 ${
                activeView === 'admin'
                  ? 'text-purple-300 font-semibold border-b-2 border-purple-400'
                  : ''
              }`}
            >
              <Shield className="w-3.5 h-3.5 text-purple-400" />
              Monitoring Admin
            </button>
          )}
        </nav>

        {/* Zone 3: 1-2 primary actions */}
        <div className="flex items-center gap-2.5 shrink-0">
          {currentUser ? (
            <div className="relative">
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center gap-2 p-1.5 sm:px-3 sm:py-1.5 rounded-xl bg-neutral-800 hover:bg-neutral-700/80 border border-neutral-700/60 text-xs transition-colors"
              >
                <div className="w-6 h-6 rounded-lg bg-neutral-700 flex items-center justify-center font-bold text-neutral-200 text-xs">
                  {currentUser.name.charAt(0).toUpperCase()}
                </div>
                <div className="hidden sm:block text-left">
                  <div className="font-semibold text-neutral-200 truncate max-w-[110px]">
                    {currentUser.name}
                  </div>
                  <div className="text-[10px] text-neutral-400 leading-tight">
                    {currentUser.role === 'admin' ? 'Admin' : 'Pengguna'}
                  </div>
                </div>
              </button>

              {showUserMenu && (
                <div className="absolute right-0 mt-2 w-56 rounded-2xl bg-neutral-900 border border-neutral-800 shadow-2xl p-2 z-50 text-xs">
                  <div className="px-3 py-2 border-b border-neutral-800">
                    <div className="font-semibold text-neutral-200">{currentUser.name}</div>
                    <div className="text-neutral-400 font-mono text-[11px] truncate">
                      {currentUser.email}
                    </div>
                    <div className="mt-1 text-[10px] text-emerald-400 font-medium">
                      Peran: {currentUser.role === 'admin' ? 'Admin Sistem' : 'Pengguna Jurnal'}
                    </div>
                  </div>

                  <div className="py-1 space-y-0.5">
                    {onOpenEditProfile && (
                      <button
                        onClick={() => {
                          onOpenEditProfile();
                          setShowUserMenu(false);
                        }}
                        className="w-full text-left px-3 py-2 rounded-lg hover:bg-neutral-800 text-neutral-200 transition-colors flex items-center justify-between"
                      >
                        <span className="font-medium">Ubah Profil / Nama</span>
                        <UserCheck className="w-3.5 h-3.5 text-purple-400" />
                      </button>
                    )}
                  </div>

                  <div className="pt-1 border-t border-neutral-800">
                    <button
                      onClick={() => {
                        setShowUserMenu(false);
                        onLogout();
                      }}
                      className="w-full text-left px-3 py-2 rounded-lg hover:bg-rose-500/10 text-rose-400 transition-colors flex items-center gap-2"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      Keluar (Logout)
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <button
                onClick={() => onOpenAuth('login')}
                className="px-3 py-1.5 text-xs font-semibold rounded-lg text-neutral-300 hover:text-white transition-colors"
              >
                Masuk
              </button>
              <button
                onClick={() => onOpenAuth('register')}
                className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-neutral-100 hover:bg-neutral-200 text-neutral-900 transition-colors"
              >
                Daftar Akun
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
