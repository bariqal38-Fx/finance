import React, { useState, useEffect } from 'react';
import {
  Users,
  Search,
  Mail,
  UserCheck,
  RefreshCw,
  Shield,
  ShieldAlert,
  Lock,
  CheckCircle2,
} from 'lucide-react';
import { DaftarAkunUser, User } from '../types';
import { formatDateIndo } from '../utils/formatters';

interface Props {
  onImpersonateUser?: (user: User) => void;
}

export const AdminMonitoring: React.FC<Props> = () => {
  const [users, setUsers] = useState<DaftarAkunUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [roleFilter, setRoleFilter] = useState<'all' | 'admin' | 'user'>('all');
  const [feedbackMsg, setFeedbackMsg] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/users');
      const data = await res.json();
      setUsers(data.users || []);
    } catch (err: any) {
      console.error('Error fetching admin users:', err);
      setFeedbackMsg({ text: 'Gagal memuat daftar pengguna.', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  // Filter users based on search & role
  const filteredUsers = users.filter((u) => {
    if (roleFilter !== 'all' && u.role !== roleFilter) return false;
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      const userName = (u.name || u.daftarNama || '').toLowerCase();
      const matchName = userName.includes(term);
      const matchEmail = u.email.toLowerCase().includes(term);
      return matchName || matchEmail;
    }
    return true;
  });

  const totalAdmins = users.filter((u) => u.role === 'admin').length;
  const totalRegularUsers = users.filter((u) => u.role === 'user').length;

  return (
    <div className="space-y-6">
      {/* Privacy Policy Banner */}
      <div className="p-4 sm:p-5 rounded-2xl bg-neutral-900 border border-neutral-800 relative overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start sm:items-center gap-3.5">
            <div className="p-2.5 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400 shrink-0">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-bold text-sm sm:text-base text-neutral-100">
                  Panel Manajemen Pengguna (Admin Directory)
                </h2>
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-semibold text-[10px]">
                  Privasi Keuangan Aktif
                </span>
              </div>
              <p className="text-xs text-neutral-400 mt-1 max-w-2xl leading-relaxed">
                Sesuai kebijakan perlindungan data pribadi (GDPR & Financial Privacy), rincian transaksi belanja dan pengeluaran pengguna bersifat rahasia dan tidak dapat diakses oleh Admin. Admin hanya mengelola pendaftaran akun, status otorisasi, dan bantuan reset password.
              </p>
            </div>
          </div>

          <button
            onClick={fetchUsers}
            disabled={loading}
            className="self-start sm:self-center flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-200 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            Segarkan Data
          </button>
        </div>
      </div>

      {feedbackMsg && (
        <div
          className={`p-3.5 rounded-xl text-xs flex items-center justify-between ${
            feedbackMsg.type === 'success'
              ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400'
              : 'bg-rose-500/10 border border-rose-500/20 text-rose-400'
          }`}
        >
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{feedbackMsg.text}</span>
          </div>
          <button
            onClick={() => setFeedbackMsg(null)}
            className="hover:underline text-[11px] ml-4 cursor-pointer"
          >
            Tutup
          </button>
        </div>
      )}

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-2xl bg-neutral-900 border border-neutral-800">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-neutral-400">Total Akun Terdaftar</span>
            <Users className="w-4 h-4 text-neutral-400" />
          </div>
          <div className="text-2xl font-bold tracking-tight text-neutral-100 tabular-nums">
            {users.length} <span className="text-xs font-normal text-neutral-500">Pengguna</span>
          </div>
          <div className="text-[11px] text-neutral-500 mt-1">Data Store D1 (daftar_akun)</div>
        </div>

        <div className="p-4 rounded-2xl bg-neutral-900 border border-neutral-800">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-neutral-400">Akun Pengguna Biasa</span>
            <UserCheck className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-bold tracking-tight text-emerald-400 tabular-nums">
            {totalRegularUsers} <span className="text-xs font-normal text-neutral-500">User</span>
          </div>
          <div className="text-[11px] text-neutral-500 mt-1">Hak akses: Pencatatan jurnal pribadi</div>
        </div>

        <div className="p-4 rounded-2xl bg-neutral-900 border border-neutral-800">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-neutral-400">Akun Administrator</span>
            <Shield className="w-4 h-4 text-purple-400" />
          </div>
          <div className="text-2xl font-bold tracking-tight text-purple-400 tabular-nums">
            {totalAdmins} <span className="text-xs font-normal text-neutral-500">Admin</span>
          </div>
          <div className="text-[11px] text-neutral-500 mt-1">Hak akses: Kelola akun & otorisasi sistem</div>
        </div>
      </div>

      {/* User Table Header & Filters */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-neutral-800">
          <div>
            <h3 className="font-bold text-sm text-neutral-100">Daftar Akun Pengguna Terdaftar</h3>
            <p className="text-[11px] text-neutral-400">
              Data terintegrasi langsung dengan tabel PostgreSQL <code className="text-emerald-400 font-mono">daftar_akun</code> & <code className="text-emerald-400 font-mono">users</code>
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Search Input */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-neutral-500 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Cari nama atau email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8 pr-3 py-1.5 bg-neutral-950 border border-neutral-800 rounded-xl text-xs text-neutral-200 placeholder-neutral-500 focus:outline-hidden focus:border-neutral-600 transition-colors w-48 sm:w-56"
              />
            </div>

            {/* Role Filter */}
            <div className="flex rounded-xl bg-neutral-950 p-1 border border-neutral-800 text-xs">
              <button
                onClick={() => setRoleFilter('all')}
                className={`px-2.5 py-1 rounded-lg transition-colors font-medium ${
                  roleFilter === 'all'
                    ? 'bg-neutral-800 text-white'
                    : 'text-neutral-400 hover:text-neutral-200'
                }`}
              >
                Semua
              </button>
              <button
                onClick={() => setRoleFilter('admin')}
                className={`px-2.5 py-1 rounded-lg transition-colors font-medium ${
                  roleFilter === 'admin'
                    ? 'bg-purple-500/20 text-purple-300'
                    : 'text-neutral-400 hover:text-neutral-200'
                }`}
              >
                Admin
              </button>
              <button
                onClick={() => setRoleFilter('user')}
                className={`px-2.5 py-1 rounded-lg transition-colors font-medium ${
                  roleFilter === 'user'
                    ? 'bg-emerald-500/20 text-emerald-300'
                    : 'text-neutral-400 hover:text-neutral-200'
                }`}
              >
                User
              </button>
            </div>
          </div>
        </div>

        {/* Users Table */}
        <div className="overflow-x-auto mt-4">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-neutral-800 text-neutral-400 font-semibold">
                <th className="py-3 px-3">ID</th>
                <th className="py-3 px-3">Nama Pengguna</th>
                <th className="py-3 px-3">Alamat Email</th>
                <th className="py-3 px-3">Peran Akun</th>
                <th className="py-3 px-3">Tanggal Registrasi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-800/60">
              {loading ? (
                <tr>
                  <td colSpan={5} className="py-10 text-center text-neutral-500">
                    <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-neutral-400" />
                    Memuat daftar pengguna dari database...
                  </td>
                </tr>
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-10 text-center text-neutral-500">
                    Tidak ada pengguna yang sesuai dengan kriteria pencarian.
                  </td>
                </tr>
              ) : (
                filteredUsers.map((u) => {
                  const isAdmin = u.role === 'admin';
                  return (
                    <tr key={u.id} className="hover:bg-neutral-800/40 transition-colors">
                      <td className="py-3 px-3 font-mono text-neutral-500">#{u.id}</td>
                      <td className="py-3 px-3">
                        <div className="font-semibold text-neutral-100 flex items-center gap-2">
                          <div
                            className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold ${
                              isAdmin
                                ? 'bg-purple-500/20 text-purple-300'
                                : 'bg-emerald-500/20 text-emerald-300'
                            }`}
                          >
                            {(u.name || u.daftarNama || 'U').charAt(0).toUpperCase()}
                          </div>
                          <span>{u.name || u.daftarNama}</span>
                        </div>
                      </td>
                      <td className="py-3 px-3">
                        <div className="flex items-center gap-1.5 text-neutral-300">
                          <Mail className="w-3.5 h-3.5 text-neutral-500" />
                          <span>{u.email}</span>
                        </div>
                      </td>
                      <td className="py-3 px-3">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full font-semibold text-[10px] ${
                            isAdmin
                              ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20'
                              : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                          }`}
                        >
                          {isAdmin ? (
                            <>
                              <Shield className="w-3 h-3" /> Administrator
                            </>
                          ) : (
                            <>
                              <UserCheck className="w-3 h-3" /> Pengguna Biasa
                            </>
                          )}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-neutral-400 font-mono text-[11px]">
                        {formatDateIndo(u.createdAt)}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
