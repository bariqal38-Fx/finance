export type TransactionType = 'pemasukan' | 'pengeluaran';

export interface User {
  id: number;
  name: string;
  email: string;
  role: 'admin' | 'user';
  createdAt?: string;
  passwordResetRequired?: boolean;
}

export interface DaftarAkunUser {
  id: number;
  name: string;
  daftarNama: string;
  email: string;
  role: 'admin' | 'user';
  createdAt: string;
  totalPemasukan: number;
  totalPengeluaran: number;
  saldo: number;
  totalTransaksi: number;
  lastTransactionAt: string | null;
  expensePercentage?: number;
  recentIncomeSource?: string | null;
  recentExpenseItem?: string | null;
  passwordResetRequired?: boolean;
}

export interface Transaction {
  id: number;
  userId: number;
  userName?: string;
  userEmail?: string;
  description: string;
  amount: number;
  type: TransactionType;
  transactionDate: string;
  createdAt: string;
}

export interface TransactionSummary {
  totalIncome: number;
  totalExpense: number;
  netBalance: number;
  totalCount: number;
}

export interface UserDetailBreakdown {
  user: User;
  totalPemasukan: number;
  totalPengeluaran: number;
  saldo: number;
  expensePercentage: number;
  remainingPercentage: number;
  incomes: Transaction[];
  expenses: Transaction[];
  allTransactions: Transaction[];
}

export interface DbStatus {
  connected: boolean;
  database?: string;
  latencyMs?: number;
  serverTime?: string;
  counts?: {
    users: number;
    transactions: number;
    daftarAkun: number;
  };
  error?: string;
}
