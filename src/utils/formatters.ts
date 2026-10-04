export function formatRupiah(amount: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatDateIndo(dateStr: string): string {
  try {
    const d = new Date(dateStr);
    return new Intl.DateTimeFormat('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    }).format(d);
  } catch {
    return dateStr;
  }
}

export function formatDateTimeIndo(dateStr: string): string {
  try {
    const d = new Date(dateStr);
    return new Intl.DateTimeFormat('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(d);
  } catch {
    return dateStr;
  }
}

export function exportTransactionsToCsv(transactions: any[], filename = 'jurnal-keuangan.csv') {
  const headers = ['ID', 'User', 'Email', 'Keterangan', 'Jenis', 'Nominal (Rp)', 'Tanggal Transaksi'];
  const rows = transactions.map((t) => [
    t.id,
    `"${t.userName || ''}"`,
    `"${t.userEmail || ''}"`,
    `"${(t.description || '').replace(/"/g, '""')}"`,
    t.type === 'pemasukan' ? 'Pemasukan' : 'Pengeluaran',
    t.amount,
    `"${t.transactionDate}"`,
  ]);

  const csvContent = [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
