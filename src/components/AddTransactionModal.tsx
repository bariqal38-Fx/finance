import React, { useState, useEffect } from 'react';
import { X, ArrowDownRight, ArrowUpRight, Calendar, Tag, CheckCircle2, Sparkles } from 'lucide-react';
import { TransactionType, User } from '../types';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  currentUser: User;
  initialType?: TransactionType;
}

export const AddTransactionModal: React.FC<Props> = ({
  isOpen,
  onClose,
  onSuccess,
  currentUser,
  initialType = 'pemasukan',
}) => {
  const [type, setType] = useState<TransactionType>(initialType);
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmation, setConfirmation] = useState<string | null>(null);

  useEffect(() => {
    setType(initialType);
    setError(null);
    setConfirmation(null);
  }, [initialType, isOpen]);

  if (!isOpen) return null;

  const quickIncomePresets = [
    'Gaji Bulanan',
    'Bonus Kinerja',
    'Freelance Project',
    'Hasil Usaha / Jualan',
    'Dividen & Investasi',
    'Pengembalian Dana',
  ];

  const quickExpensePresets = [
    'Makan & Minum Harian',
    'Sewa Tempat / Kos & Listrik',
    'Belanja Kebutuhan Pokok',
    'Transportasi & BBM',
    'Tagihan Internet & Telepon',
    'Hiburan & Liburan',
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setConfirmation(null);

    const numAmount = parseFloat(amount.replace(/\D/g, ''));
    if (!numAmount || numAmount <= 0) {
      setError('Nominal harus lebih besar dari 0');
      return;
    }

    if (!description.trim()) {
      setError('Keterangan transaksi wajib diisi');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('/api/transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: currentUser.id,
          description: description.trim(),
          amount: numAmount,
          type,
          transaction_date: new Date(date).toISOString(),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Gagal menyimpan transaksi');
      }

      setConfirmation(
        type === 'pemasukan'
          ? 'Konfirmasi: Data pemasukan berhasil dicatat ke D2 Data Transaksi!'
          : 'Konfirmasi: Data pengeluaran berhasil dicatat ke D2 Data Transaksi!'
      );

      setTimeout(() => {
        onSuccess();
        onClose();
        setAmount('');
        setDescription('');
      }, 700);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAmountChange = (val: string) => {
    const rawNumbers = val.replace(/\D/g, '');
    if (!rawNumbers) {
      setAmount('');
      return;
    }
    const formatted = new Intl.NumberFormat('id-ID').format(parseInt(rawNumbers, 10));
    setAmount(formatted);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-xs p-4">
      <div className="bg-neutral-900 border border-neutral-800 rounded-2xl max-w-md w-full p-6 shadow-2xl text-neutral-100">
        <div className="flex items-center justify-between pb-3 border-b border-neutral-800">
          <div>
            <div className="flex items-center gap-2">
              <span
                className={`text-[11px] font-mono font-semibold px-2 py-0.5 rounded border ${
                  type === 'pemasukan'
                    ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                    : 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                }`}
              >
                {type === 'pemasukan' ? 'Transaksi Masuk' : 'Transaksi Keluar'}
              </span>
              <h3 className="font-bold text-base">
                {type === 'pemasukan' ? 'Catat Pemasukan' : 'Catat Pengeluaran'}
              </h3>
            </div>
            <p className="text-xs text-neutral-400 mt-1">
              Catatan untuk akun: <span className="text-neutral-200 font-medium">{currentUser.name}</span>
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-neutral-400 hover:text-neutral-200 p-1.5 rounded-lg hover:bg-neutral-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Type Toggle Tabs */}
        <div className="grid grid-cols-2 gap-2 mt-4 p-1 rounded-xl bg-neutral-950 border border-neutral-800">
          <button
            type="button"
            onClick={() => setType('pemasukan')}
            className={`flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-semibold transition-all ${
              type === 'pemasukan'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <ArrowDownRight className="w-4 h-4" />
            2.0 Catat Pemasukan
          </button>
          <button
            type="button"
            onClick={() => setType('pengeluaran')}
            className={`flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-semibold transition-all ${
              type === 'pengeluaran'
                ? 'bg-rose-600 text-white shadow-xs'
                : 'text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <ArrowUpRight className="w-4 h-4" />
            3.0 Catat Pengeluaran
          </button>
        </div>

        {error && (
          <div className="mt-3 p-2.5 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs">
            {error}
          </div>
        )}

        {confirmation && (
          <div className="mt-3 p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs flex items-center gap-2 font-medium">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            {confirmation}
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-4 space-y-3.5">
          {/* Amount Input */}
          <div>
            <label className="block text-xs font-medium text-neutral-300 mb-1">
              Nominal Transaksi (Rp)
            </label>
            <div className="relative">
              <span className="absolute left-3 top-2.5 text-xs font-bold text-neutral-400 font-mono">
                Rp
              </span>
              <input
                type="text"
                required
                autoFocus
                placeholder="0"
                value={amount}
                onChange={(e) => handleAmountChange(e.target.value)}
                className="w-full pl-10 pr-3 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-sm font-semibold text-neutral-100 placeholder-neutral-600 focus:outline-hidden focus:border-neutral-500 font-mono tabular-nums transition-colors"
              />
            </div>
          </div>

          {/* Description Input */}
          <div>
            <label className="block text-xs font-medium text-neutral-300 mb-1">
              Keterangan / Keperluan (description)
            </label>
            <div className="relative">
              <Tag className="absolute left-3 top-2.5 w-4 h-4 text-neutral-500" />
              <input
                type="text"
                required
                placeholder={
                  type === 'pemasukan'
                    ? 'Misal: Gaji bulanan, penjualan produk...'
                    : 'Misal: Makan siang, bayar tagihan listrik...'
                }
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-xs text-neutral-100 placeholder-neutral-500 focus:outline-hidden focus:border-neutral-500 transition-colors"
              />
            </div>
          </div>

          {/* Quick presets */}
          <div>
            <div className="text-[11px] text-neutral-400 mb-1.5 flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-amber-400" />
              Pilihan Cepat Keterangan:
            </div>
            <div className="flex flex-wrap gap-1.5">
              {(type === 'pemasukan' ? quickIncomePresets : quickExpensePresets).map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => setDescription(preset)}
                  className="px-2 py-1 rounded bg-neutral-950 hover:bg-neutral-800 border border-neutral-800 hover:border-neutral-700 text-[11px] text-neutral-300 transition-colors"
                >
                  {preset}
                </button>
              ))}
            </div>
          </div>

          {/* Date Picker */}
          <div>
            <label className="block text-xs font-medium text-neutral-300 mb-1">
              Tanggal Transaksi (transaction_date)
            </label>
            <div className="relative">
              <Calendar className="absolute left-3 top-2.5 w-4 h-4 text-neutral-500" />
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-xs text-neutral-100 focus:outline-hidden focus:border-neutral-500 font-mono transition-colors"
              />
            </div>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={loading}
              className={`w-full py-2.5 px-4 rounded-xl font-semibold text-xs transition-colors flex items-center justify-center gap-2 ${
                type === 'pemasukan'
                  ? 'bg-emerald-500 hover:bg-emerald-400 text-neutral-950'
                  : 'bg-rose-500 hover:bg-rose-400 text-white'
              } disabled:opacity-50`}
            >
              {loading ? (
                'Menyimpan...'
              ) : (
                <>
                  {type === 'pemasukan' ? 'Simpan Pemasukan' : 'Simpan Pengeluaran'}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
