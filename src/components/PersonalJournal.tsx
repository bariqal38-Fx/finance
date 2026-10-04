import React, { useState } from 'react';
import {
  ArrowDownRight,
  ArrowUpRight,
  Wallet,
  Search,
  Download,
  Plus,
  Trash2,
  Edit2,
  Calendar,
  AlertCircle,
  FileSpreadsheet,
} from 'lucide-react';
import { Transaction, TransactionSummary, TransactionType, User } from '../types';
import { formatRupiah, formatDateIndo, formatDateTimeIndo, exportTransactionsToCsv } from '../utils/formatters';
import { BudgetRatioBar } from './BudgetRatioBar';

interface Props {
  currentUser: User;
  transactions: Transaction[];
  summary: TransactionSummary;
  loading: boolean;
  onRefresh: () => void;
  onOpenAddModal: (type?: TransactionType) => void;
  onOpenEditModal: (tx: Transaction) => void;
}

export const PersonalJournal: React.FC<Props> = ({
  currentUser,
  transactions,
  summary,
  loading,
  onRefresh,
  onOpenAddModal,
  onOpenEditModal,
}) => {
  const [filterType, setFilterType] = useState<'all' | 'pemasukan' | 'pengeluaran'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFilter, setDateFilter] = useState<'all' | 'this_month' | 'today'>('all');
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const handleDelete = async (id: number) => {
    if (!window.confirm('Apakah Anda yakin ingin menghapus catatan transaksi ini?')) return;
    setDeletingId(id);
    try {
      const res = await fetch(`/api/transactions/${id}`, { method: 'DELETE' });
      if (res.ok) {
        onRefresh();
      } else {
        alert('Gagal menghapus transaksi');
      }
    } catch (err) {
      console.error(err);
      alert('Terjadi kesalahan saat menghapus transaksi');
    } finally {
      setDeletingId(null);
    }
  };

  // Client-side filtering for fast response
  const filteredTransactions = transactions.filter((t) => {
    // Type filter
    if (filterType !== 'all' && t.type !== filterType) return false;

    // Search filter
    if (searchTerm && !t.description.toLowerCase().includes(searchTerm.toLowerCase())) {
      return false;
    }

    // Date range filter
    if (dateFilter === 'today') {
      const txDate = new Date(t.transactionDate).toISOString().split('T')[0];
      const today = new Date().toISOString().split('T')[0];
      if (txDate !== today) return false;
    } else if (dateFilter === 'this_month') {
      const d = new Date(t.transactionDate);
      const now = new Date();
      if (d.getMonth() !== now.getMonth() || d.getFullYear() !== now.getFullYear()) {
        return false;
      }
    }

    return true;
  });

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-neutral-800">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-neutral-100">
            Jurnal Keuangan Pribadi
          </h1>
          <div className="flex items-center gap-2 text-xs text-neutral-400 mt-1">
            <span>Pemilik Akun: <strong className="text-neutral-200">{currentUser.name}</strong></span>
            <span aria-hidden="true">·</span>
            <span className="font-mono text-neutral-300">{currentUser.email}</span>
          </div>
        </div>

        {/* Action Buttons for Process 2.0 & 3.0 */}
        <div className="flex items-center gap-2.5">
          <button
            onClick={() => onOpenAddModal('pemasukan')}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-xl bg-emerald-500 hover:bg-emerald-400 text-neutral-950 transition-colors shadow-xs"
          >
            <Plus className="w-4 h-4" />
            Catat Pemasukan
          </button>
          <button
            onClick={() => onOpenAddModal('pengeluaran')}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-xl bg-rose-500 hover:bg-rose-400 text-white transition-colors shadow-xs"
          >
            <Plus className="w-4 h-4" />
            Catat Pengeluaran
          </button>
        </div>
      </div>

      {/* Financial Summary KPI Cards (Single-Elevation Depth, High Contrast) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Total Saldo Bersih */}
        <div className="p-5 rounded-2xl bg-neutral-900 border border-neutral-800">
          <div className="flex items-center justify-between text-neutral-400 text-xs mb-2">
            <span className="font-medium">Saldo Bersih Saat Ini</span>
            <Wallet className="w-4 h-4 text-neutral-400" />
          </div>
          <div
            className={`text-2xl font-bold font-mono tabular-nums ${
              summary.netBalance >= 0 ? 'text-neutral-100' : 'text-rose-400'
            }`}
          >
            {formatRupiah(summary.netBalance)}
          </div>
          <div className="flex items-center gap-2 text-[11px] text-neutral-500 mt-2">
            <span>Pemasukan dikurangi Pengeluaran</span>
            <span aria-hidden="true">·</span>
            <span className="tabular-nums font-mono">{summary.totalCount} catatan</span>
          </div>
        </div>

        {/* Total Pemasukan */}
        <div className="p-5 rounded-2xl bg-neutral-900 border border-neutral-800">
          <div className="flex items-center justify-between text-neutral-400 text-xs mb-2">
            <span className="font-medium">Total Pemasukan</span>
            <div className="w-6 h-6 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-400">
              <ArrowDownRight className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-emerald-400 font-mono tabular-nums">
            {formatRupiah(summary.totalIncome)}
          </div>
          <div className="text-[11px] text-neutral-500 mt-2">
            Akumulasi kredit / penerimaan kas
          </div>
        </div>

        {/* Total Pengeluaran */}
        <div className="p-5 rounded-2xl bg-neutral-900 border border-neutral-800">
          <div className="flex items-center justify-between text-neutral-400 text-xs mb-2">
            <span className="font-medium">Total Pengeluaran</span>
            <div className="w-6 h-6 rounded-lg bg-rose-500/10 flex items-center justify-center text-rose-400">
              <ArrowUpRight className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-rose-400 font-mono tabular-nums">
            {formatRupiah(summary.totalExpense)}
          </div>
          <div className="text-[11px] text-neutral-500 mt-2">
            Akumulasi debit / belanja & operasional
          </div>
        </div>
      </div>

      {/* Visual Budget Ratio Graph (Hijau Setengah Merah Setengah) */}
      <BudgetRatioBar
        totalIncome={summary.totalIncome}
        totalExpense={summary.totalExpense}
        title={`Rasio Pemasukan vs Pengeluaran Pribadi (${currentUser.name})`}
        subtitle="Visualisasi proporsi modal masuk vs belanja keluar pada jurnal Anda"
      />

      {/* Filter and Control Bar */}
      <div className="p-4 rounded-2xl bg-neutral-900 border border-neutral-800 space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Segmented Filter Buttons (Allowed functional filter tabs) */}
          <div className="flex items-center gap-1 p-1 bg-neutral-950 rounded-xl border border-neutral-800/80 shrink-0">
            <button
              onClick={() => setFilterType('all')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                filterType === 'all'
                  ? 'bg-neutral-800 text-neutral-100 shadow-xs'
                  : 'text-neutral-400 hover:text-neutral-200'
              }`}
            >
              Semua Mutasi ({transactions.length})
            </button>
            <button
              onClick={() => setFilterType('pemasukan')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1 ${
                filterType === 'pemasukan'
                  ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-800/60 shadow-xs'
                  : 'text-neutral-400 hover:text-neutral-200'
              }`}
            >
              <ArrowDownRight className="w-3.5 h-3.5 text-emerald-400" />
              Pemasukan
            </button>
            <button
              onClick={() => setFilterType('pengeluaran')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1 ${
                filterType === 'pengeluaran'
                  ? 'bg-rose-950/80 text-rose-300 border border-rose-800/60 shadow-xs'
                  : 'text-neutral-400 hover:text-neutral-200'
              }`}
            >
              <ArrowUpRight className="w-3.5 h-3.5 text-rose-400" />
              Pengeluaran
            </button>
          </div>

          {/* Search & Date Controls */}
          <div className="flex items-center gap-2.5 flex-1 max-w-md">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-2.5 w-4 h-4 text-neutral-500" />
              <input
                type="text"
                placeholder="Cari keterangan transaksi..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 bg-neutral-950 border border-neutral-800 rounded-xl text-xs text-neutral-200 placeholder-neutral-500 focus:outline-hidden focus:border-neutral-600 transition-colors"
              />
            </div>

            <select
              value={dateFilter}
              onChange={(e: any) => setDateFilter(e.target.value)}
              className="px-2.5 py-1.5 bg-neutral-950 border border-neutral-800 rounded-xl text-xs text-neutral-300 focus:outline-hidden focus:border-neutral-600 transition-colors"
            >
              <option value="all">Semua Waktu</option>
              <option value="this_month">Bulan Ini</option>
              <option value="today">Hari Ini</option>
            </select>

            <button
              onClick={() => exportTransactionsToCsv(filteredTransactions, `jurnal-${currentUser.name}.csv`)}
              title="Ekspor data jurnal ke format CSV"
              className="p-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-300 transition-colors border border-neutral-700/60"
            >
              <Download className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Transactions Data Table */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-2xl overflow-hidden">
        <div className="px-5 py-3.5 border-b border-neutral-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-semibold text-neutral-200">Daftar Mutasi Transaksi</h2>
            <span className="text-xs text-neutral-500 font-mono tabular-nums">
              ({filteredTransactions.length} baris ditampilkan)
            </span>
          </div>
          <span className="text-[11px] text-neutral-500 hidden sm:inline">
            Tersinkronisasi otomatis dengan PostgreSQL
          </span>
        </div>

        {loading ? (
          <div className="p-8 text-center text-xs text-neutral-500 animate-pulse">
            Memuat data transaksi dari database Neon...
          </div>
        ) : filteredTransactions.length === 0 ? (
          <div className="py-16 px-6 text-center">
            <div className="w-12 h-12 rounded-2xl bg-neutral-800/80 border border-neutral-700/60 flex items-center justify-center mx-auto mb-3 text-neutral-400">
              <FileSpreadsheet className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-semibold text-neutral-300">Belum Ada Transaksi</h3>
            <p className="text-xs text-neutral-500 max-w-sm mx-auto mt-1 mb-4">
              {searchTerm || filterType !== 'all'
                ? 'Tidak ada transaksi yang cocok dengan filter yang dipilih.'
                : 'Mulai catat pemasukan atau pengeluaran pertama Anda untuk melihat mutasi jurnal.'}
            </p>
            <div className="flex items-center justify-center gap-2">
              <button
                onClick={() => onOpenAddModal('pemasukan')}
                className="px-3.5 py-2 text-xs font-semibold rounded-xl bg-emerald-500 hover:bg-emerald-400 text-neutral-950 transition-colors"
              >
                + Catat Pemasukan
              </button>
              <button
                onClick={() => onOpenAddModal('pengeluaran')}
                className="px-3.5 py-2 text-xs font-semibold rounded-xl bg-rose-500 hover:bg-rose-400 text-white transition-colors"
              >
                + Catat Pengeluaran
              </button>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-neutral-800 text-neutral-400 bg-neutral-950/40">
                  <th className="py-3 px-4 font-medium w-16">ID</th>
                  <th className="py-3 px-4 font-medium">Tanggal</th>
                  <th className="py-3 px-4 font-medium">Keterangan</th>
                  <th className="py-3 px-4 font-medium">Jenis</th>
                  <th className="py-3 px-4 font-medium text-right">Nominal</th>
                  <th className="py-3 px-4 font-medium text-right w-24">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-800/60">
                {filteredTransactions.map((tx) => {
                  const isIncome = tx.type === 'pemasukan';
                  return (
                    <tr
                      key={tx.id}
                      className="hover:bg-neutral-800/40 transition-colors group"
                    >
                      <td className="py-3.5 px-4 font-mono text-neutral-500 text-[11px] tabular-nums">
                        #{tx.id}
                      </td>
                      <td className="py-3.5 px-4 text-neutral-300 whitespace-nowrap font-mono tabular-nums text-[11px]">
                        {formatDateIndo(tx.transactionDate)}
                      </td>
                      <td className="py-3.5 px-4 font-medium text-neutral-200">
                        {tx.description}
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span
                          className={`font-semibold text-xs flex items-center gap-1 ${
                            isIncome ? 'text-emerald-400' : 'text-rose-400'
                          }`}
                        >
                          {isIncome ? (
                            <>
                              <ArrowDownRight className="w-3.5 h-3.5" /> Pemasukan
                            </>
                          ) : (
                            <>
                              <ArrowUpRight className="w-3.5 h-3.5" /> Pengeluaran
                            </>
                          )}
                        </span>
                      </td>
                      <td
                        className={`py-3.5 px-4 text-right font-mono font-semibold text-xs tabular-nums whitespace-nowrap ${
                          isIncome ? 'text-emerald-400' : 'text-rose-400'
                        }`}
                      >
                        {isIncome ? '+' : '-'} {formatRupiah(tx.amount)}
                      </td>
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => onOpenEditModal(tx)}
                            title="Ubah transaksi"
                            className="p-1.5 rounded-lg hover:bg-neutral-700 text-neutral-400 hover:text-neutral-200 transition-colors"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDelete(tx.id)}
                            disabled={deletingId === tx.id}
                            title="Hapus transaksi"
                            className="p-1.5 rounded-lg hover:bg-rose-500/20 text-neutral-400 hover:text-rose-400 transition-colors disabled:opacity-50"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
