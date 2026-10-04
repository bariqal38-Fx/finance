import React from 'react';
import { formatRupiah } from '../utils/formatters';
import { ArrowDownRight, ArrowUpRight } from 'lucide-react';

interface Props {
  totalIncome: number;
  totalExpense: number;
  title?: string;
  subtitle?: string;
  compact?: boolean;
}

export const BudgetRatioBar: React.FC<Props> = ({
  totalIncome,
  totalExpense,
  title,
  subtitle,
  compact = false,
}) => {
  const netBalance = Math.max(0, totalIncome - totalExpense);

  // Exact ratio calculation:
  // e.g. modal = 5, keluar = 2.5 => expensePct = 50%, remainingPct = 50% (setengah merah, setengah hijau!)
  let expensePct = 0;
  let remainingPct = 100;

  if (totalIncome > 0) {
    const rawExpenseRatio = (totalExpense / totalIncome) * 100;
    expensePct = Math.min(100, Math.round(rawExpenseRatio * 10) / 10);
    remainingPct = Math.max(0, Math.round((100 - expensePct) * 10) / 10);
  } else if (totalExpense > 0) {
    expensePct = 100;
    remainingPct = 0;
  }

  const isOverBudget = totalExpense > totalIncome && totalIncome > 0;

  if (compact) {
    return (
      <div className="space-y-1.5 w-full">
        <div className="flex items-center justify-between text-[11px] font-mono">
          <span className="text-emerald-400 font-semibold flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
            Sisa: {remainingPct}%
          </span>
          <span className="text-rose-400 font-semibold flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-rose-500 inline-block" />
            Keluar: {expensePct}%
          </span>
        </div>
        {/* Dual Bar (Hijau & Merah) */}
        <div className="h-2.5 w-full bg-neutral-800 rounded-full overflow-hidden flex shadow-inner">
          <div
            style={{ width: `${remainingPct}%` }}
            className="h-full bg-emerald-500 transition-all duration-500 relative group"
            title={`Sisa Saldo: ${remainingPct}% (${formatRupiah(netBalance)})`}
          />
          <div
            style={{ width: `${expensePct}%` }}
            className="h-full bg-rose-500 transition-all duration-500 relative group"
            title={`Pengeluaran: ${expensePct}% (${formatRupiah(totalExpense)})`}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-5 rounded-2xl bg-neutral-900 border border-neutral-800 space-y-3">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
        <div>
          <h3 className="text-xs font-semibold text-neutral-200 uppercase tracking-wider">
            {title || 'Grafik Rasio Pemasukan vs Pengeluaran (Visual Bar)'}
          </h3>
          <p className="text-[11px] text-neutral-400">
            {subtitle || 'Visualisasi proporsi modal masuk vs belanja keluar'}
          </p>
        </div>
        <div className="text-[11px] font-mono font-semibold">
          {isOverBudget ? (
            <span className="text-rose-400 font-bold px-2 py-0.5 rounded bg-rose-500/10 border border-rose-500/20">
              Pengeluaran Melampaui Modal ({expensePct}%)
            </span>
          ) : (
            <span className="text-neutral-300">
              Proporsi: <span className="text-emerald-400">{remainingPct}% Sisa</span> /{' '}
              <span className="text-rose-400">{expensePct}% Keluar</span>
            </span>
          )}
        </div>
      </div>

      {/* Visual Dual-Color Ratio Bar (Hijau Setengah, Merah Setengah sesuai permintaan user) */}
      <div className="space-y-1.5 pt-1">
        <div className="h-5 w-full bg-neutral-950 rounded-xl overflow-hidden flex border border-neutral-800 shadow-inner p-0.5 gap-0.5">
          {totalIncome === 0 && totalExpense === 0 ? (
            <div className="w-full h-full bg-neutral-800 rounded-lg flex items-center justify-center text-[10px] text-neutral-500">
              Belum ada mutasi
            </div>
          ) : (
            <>
              {/* Porsi Hijau (Sisa Saldo / Pemasukan yang Belum Terpakai) */}
              <div
                style={{ width: `${remainingPct}%` }}
                className="h-full bg-emerald-500 rounded-lg transition-all duration-700 flex items-center justify-center text-[10px] font-bold text-neutral-950 font-mono overflow-hidden select-none"
                title={`Sisa Saldo Modal: ${remainingPct}% (${formatRupiah(netBalance)})`}
              >
                {remainingPct >= 18 && `${remainingPct}% Hijau`}
              </div>

              {/* Porsi Merah (Pengeluaran yang Terpakai) */}
              <div
                style={{ width: `${expensePct}%` }}
                className="h-full bg-rose-500 rounded-lg transition-all duration-700 flex items-center justify-center text-[10px] font-bold text-white font-mono overflow-hidden select-none"
                title={`Pengeluaran Terpakai: ${expensePct}% (${formatRupiah(totalExpense)})`}
              >
                {expensePct >= 18 && `${expensePct}% Merah`}
              </div>
            </>
          )}
        </div>
      </div>

      {/* KPI Details Below the Graph */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-neutral-800/80 text-xs">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-emerald-500 shrink-0" />
          <div>
            <div className="text-neutral-400 text-[10px]">Total Modal / Pemasukan</div>
            <div className="font-mono font-semibold text-emerald-400 tabular-nums">
              {formatRupiah(totalIncome)}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-rose-500 shrink-0" />
          <div>
            <div className="text-neutral-400 text-[10px]">Total Belanja / Keluar ({expensePct}%)</div>
            <div className="font-mono font-semibold text-rose-400 tabular-nums">
              {formatRupiah(totalExpense)}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-neutral-300 shrink-0" />
          <div>
            <div className="text-neutral-400 text-[10px]">Sisa Saldo Kas ({remainingPct}%)</div>
            <div className="font-mono font-semibold text-neutral-200 tabular-nums">
              {formatRupiah(totalIncome - totalExpense)}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
