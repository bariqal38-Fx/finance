import express, { Request, Response } from 'express';
import { createServer as createViteServer } from 'vite';
import { Pool } from 'pg';
import path from 'path';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(express.json());

// ----------------------------------------------------
// 1. KONEKSI KE DATABASE NEON POSTGRESQL
// ----------------------------------------------------
const pool = new Pool({
  connectionString:
    process.env.DATABASE_URL ||
    'postgresql://neondb_owner:npg_AL5xuvo9NXBR@ep-dawn-hall-b55b37ey-pooler.c-7.us-east-2.aws.neon.tech/neondb?sslmode=require',
  ssl: { rejectUnauthorized: false },
});

// ----------------------------------------------------
// 2. INISIALISASI TABEL & SEED DATA AWAL
// ----------------------------------------------------
async function initDatabase() {
  try {
    // Pastikan tabel sesuai ERD & DFD tersedia di Neon PostgreSQL
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        email VARCHAR(150) NOT NULL UNIQUE,
        password_hash VARCHAR(255) NOT NULL,
        role VARCHAR(20) NOT NULL DEFAULT 'user',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS daftar_akun (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        nama_lengkap VARCHAR(100) NOT NULL,
        email VARCHAR(150) NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS transactions (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        user_name VARCHAR(100),
        user_email VARCHAR(150),
        description VARCHAR(255) NOT NULL,
        amount NUMERIC(15,2) NOT NULL,
        type VARCHAR(20) NOT NULL,
        transaction_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );

      ALTER TABLE transactions ALTER COLUMN type TYPE VARCHAR(20);
      ALTER TABLE transactions ADD COLUMN IF NOT EXISTS user_name VARCHAR(100);
      ALTER TABLE transactions ADD COLUMN IF NOT EXISTS user_email VARCHAR(150);
      ALTER TABLE users ADD COLUMN IF NOT EXISTS password_reset_required BOOLEAN DEFAULT FALSE;

      UPDATE transactions t
      SET user_name = u.name, user_email = u.email
      FROM users u
      WHERE t.user_id = u.id AND (t.user_name IS NULL OR t.user_email IS NULL);
    `);

    // Periksa apakah data akun demo sudah ada
    const userCount = await pool.query('SELECT count(*) FROM users');
    if (parseInt(userCount.rows[0].count, 10) === 0) {
      console.log('Menyiapkan akun demo awal...');
      const adminPass = await bcrypt.hash('admin123', 10);
      const userPass = await bcrypt.hash('user123', 10);

      // Akun 1: Alif Bariq (Admin Utama)
      const budiRes = await pool.query(
        'INSERT INTO users (name, email, password_hash, role) VALUES ($1, $2, $3, $4) RETURNING id',
        ['Alif Bariq (Admin)', 'admin@financejournal.pro', adminPass, 'admin']
      );
      await pool.query(
        'INSERT INTO daftar_akun (user_id, nama_lengkap, email) VALUES ($1, $2, $3)',
        [budiRes.rows[0].id, 'Alif Bariq (Admin)', 'admin@financejournal.pro']
      );

      // Akun 2: Siti Rahmawati (Pengguna Biasa)
      const sitiRes = await pool.query(
        'INSERT INTO users (name, email, password_hash, role) VALUES ($1, $2, $3, $4) RETURNING id',
        ['Siti Rahmawati', 'siti.rahma@gmail.com', userPass, 'user']
      );
      await pool.query(
        'INSERT INTO daftar_akun (user_id, nama_lengkap, email) VALUES ($1, $2, $3)',
        [sitiRes.rows[0].id, 'Siti Rahmawati', 'siti.rahma@gmail.com']
      );
    }

    // Pastikan akses Admin Utama Alif Bariq selalu aktif permanen dengan password tetap 'admin123'
    const fixedAdminHash = await bcrypt.hash('admin123', 10);
    await pool.query(`
      INSERT INTO users (name, email, password_hash, role, password_reset_required)
      VALUES ('Alif Bariq (Admin)', 'admin@financejournal.pro', $1, 'admin', FALSE)
      ON CONFLICT (email) 
      DO UPDATE SET password_hash = $1, role = 'admin', password_reset_required = FALSE;
    `, [fixedAdminHash]);

    await pool.query(`
      INSERT INTO users (name, email, password_hash, role, password_reset_required)
      VALUES ('Alif Bariq', 'bariqal38@gmail.com', $1, 'admin', FALSE)
      ON CONFLICT (email) 
      DO UPDATE SET password_hash = $1, role = 'admin', password_reset_required = FALSE;
    `, [fixedAdminHash]);
  } catch (err) {
    console.error('Inisialisasi database:', err);
  }
}

initDatabase();

// ----------------------------------------------------
// 3. API ROUTES (PENJELASAN RINGKAS & MUDAH DIPELAJARI)
// ----------------------------------------------------

// Status Koneksi Neon PostgreSQL
app.get('/api/db-status', async (_req: Request, res: Response) => {
  try {
    const start = Date.now();
    await pool.query('SELECT 1');
    const [uCount, tCount, aCount] = await Promise.all([
      pool.query('SELECT count(*) FROM users'),
      pool.query('SELECT count(*) FROM transactions'),
      pool.query('SELECT count(*) FROM daftar_akun'),
    ]);

    res.json({
      connected: true,
      database: 'neondb',
      latencyMs: Date.now() - start,
      counts: {
        users: parseInt(uCount.rows[0].count, 10),
        transactions: parseInt(tCount.rows[0].count, 10),
        daftarAkun: parseInt(aCount.rows[0].count, 10),
      },
    });
  } catch (err: any) {
    res.status(500).json({ connected: false, error: err.message });
  }
});

// Proses 1.0 DFD: Registrasi Akun Baru (Hanya Pengguna Biasa, Admin hanya bisa diberi akses oleh Admin)
app.post('/api/auth/register', async (req: Request, res: Response) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password) {
      res.status(400).json({ error: 'Nama, email, dan password wajib diisi.' });
      return;
    }

    const cleanEmail = email.trim().toLowerCase();
    const existing = await pool.query('SELECT id, name, email, role, password_reset_required FROM users WHERE LOWER(email) = $1', [cleanEmail]);
    if (existing.rows.length > 0) {
      const existingUser = existing.rows[0];
      if (existingUser.password_reset_required) {
        // User yang tereset oleh admin mendaftar ulang password-nya
        const hash = await bcrypt.hash(password, 10);
        const updated = await pool.query(
          'UPDATE users SET password_hash = $1, password_reset_required = FALSE, name = COALESCE(NULLIF($2, \'\'), name) WHERE id = $3 RETURNING id, name, email, role',
          [hash, name.trim(), existingUser.id]
        );
        res.status(200).json({
          message: 'Pendaftaran ulang berhasil! Password Anda telah diperbarui.',
          user: updated.rows[0],
        });
        return;
      }
      res.status(400).json({ error: 'Email sudah terdaftar.' });
      return;
    }

    const hash = await bcrypt.hash(password, 10);
    // Pendaftaran umum selalu menjadi role 'user' (tidak bisa daftar jadi admin)
    const userRes = await pool.query(
      'INSERT INTO users (name, email, password_hash, role) VALUES ($1, $2, $3, $4) RETURNING id, name, email, role',
      [name.trim(), cleanEmail, hash, 'user']
    );
    const newUser = userRes.rows[0];

    // Simpan juga ke tabel daftar_akun sesuai ERD
    await pool.query(
      'INSERT INTO daftar_akun (user_id, nama_lengkap, email) VALUES ($1, $2, $3)',
      [newUser.id, newUser.name, newUser.email]
    );

    res.status(201).json({ message: 'Registrasi berhasil!', user: newUser });
  } catch (err: any) {
    res.status(500).json({ error: 'Gagal daftar: ' + err.message });
  }
});

// Proses 1.0 DFD: Login Pengguna / Admin
app.post('/api/auth/login', async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      res.status(400).json({ error: 'Email dan password wajib diisi.' });
      return;
    }

    const cleanEmail = email.trim().toLowerCase();
    const result = await pool.query('SELECT * FROM users WHERE LOWER(email) = $1', [cleanEmail]);
    if (result.rows.length === 0) {
      res.status(404).json({ error: 'Akun dengan email ini belum terdaftar. Silakan buat akun baru.' });
      return;
    }

    const user = result.rows[0];

    // Cek password aman dengan bcrypt hashing standar industri (tanpa backdoor)
    const match = await bcrypt.compare(password, user.password_hash);
    if (!match) {
      res.status(401).json({ error: 'Password Anda salah. Silakan periksa kembali.' });
      return;
    }

    // Jika sebelumnya akun ditandai perlu pembaruan password, bersihkan statusnya
    if (user.password_reset_required) {
      await pool.query('UPDATE users SET password_reset_required = FALSE WHERE id = $1', [user.id]);
    }

    res.json({
      message: 'Login berhasil!',
      user: { id: user.id, name: user.name, email: user.email, role: user.role },
    });
  } catch (err: any) {
    res.status(500).json({ error: 'Gagal login: ' + err.message });
  }
});

// Simpan password baru setelah di-reset oleh Admin
app.post('/api/auth/set-new-password', async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      res.status(400).json({ error: 'Email dan password baru wajib diisi.' });
      return;
    }
    const cleanEmail = email.trim().toLowerCase();
    const hash = await bcrypt.hash(password, 10);
    const updated = await pool.query(
      'UPDATE users SET password_hash = $1, password_reset_required = FALSE WHERE LOWER(email) = $2 RETURNING id, name, email, role',
      [hash, cleanEmail]
    );
    if (updated.rows.length === 0) {
      res.status(404).json({ error: 'Pengguna tidak ditemukan.' });
      return;
    }
    res.json({
      message: 'Password baru berhasil disimpan! Silakan masuk.',
      user: updated.rows[0],
    });
  } catch (err: any) {
    res.status(500).json({ error: 'Gagal memperbarui password: ' + err.message });
  }
});

// Periksa status akun (apakah perlu reset password)
app.get('/api/auth/check-status', async (req: Request, res: Response) => {
  try {
    const { userId, email } = req.query;
    let query = '';
    let param = '';
    if (userId) {
      query = 'SELECT id, email, name, password_reset_required FROM users WHERE id = $1';
      param = userId as string;
    } else if (email) {
      query = 'SELECT id, email, name, password_reset_required FROM users WHERE LOWER(email) = LOWER($1)';
      param = (email as string).trim();
    } else {
      res.json({ passwordResetRequired: false });
      return;
    }
    const result = await pool.query(query, [param]);
    if (result.rows.length === 0) {
      res.json({ passwordResetRequired: false, exists: false });
      return;
    }
    const isReset = Boolean(result.rows[0].password_reset_required);
    res.json({
      exists: true,
      passwordResetRequired: isReset,
      email: result.rows[0].email,
      name: result.rows[0].name,
      message: isReset ? 'password anda telah Reset tolong masukan password kembali' : '',
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Fitur Ganti / Lupa Password: Wajib memverifikasi Password Lama terlebih dahulu
app.post('/api/auth/forgot-password', async (req: Request, res: Response) => {
  try {
    const { email, oldPassword, newPassword } = req.body;
    if (!email || !oldPassword || !newPassword) {
      res.status(400).json({ error: 'Email, password lama, dan password baru wajib diisi.' });
      return;
    }
    const cleanEmail = email.trim().toLowerCase();
    const userRes = await pool.query('SELECT id, name, email, password_hash FROM users WHERE LOWER(email) = $1', [cleanEmail]);
    if (userRes.rows.length === 0) {
      res.status(404).json({ error: 'Akun dengan email tersebut tidak ditemukan di database.' });
      return;
    }

    const user = userRes.rows[0];

    // Cek password lama harus sesuai dengan yang di database
    const isOldPasswordValid = await bcrypt.compare(oldPassword, user.password_hash);
    if (!isOldPasswordValid) {
      res.status(401).json({ error: 'Password lama Anda salah. Mohon masukkan password lama yang sesuai.' });
      return;
    }

    if (newPassword.trim().length < 6) {
      res.status(400).json({ error: 'Password baru minimal harus 6 karakter demi keamanan akun Anda.' });
      return;
    }

    if (oldPassword === newPassword.trim()) {
      res.status(400).json({ error: 'Password baru tidak boleh sama persis dengan password lama.' });
      return;
    }

    const hash = await bcrypt.hash(newPassword.trim(), 10);
    await pool.query('UPDATE users SET password_hash = $1, password_reset_required = FALSE WHERE id = $2', [hash, user.id]);

    res.json({
      message: 'Password berhasil diperbarui! Silakan masuk dengan password baru Anda.',
    });
  } catch (err: any) {
    res.status(500).json({ error: 'Gagal memperbarui password: ' + err.message });
  }
});

// Fitur Login dengan Akun Google
app.post('/api/auth/google', async (req: Request, res: Response) => {
  try {
    const { email, name } = req.body;
    if (!email) {
      res.status(400).json({ error: 'Email Google diperlukan.' });
      return;
    }
    const cleanEmail = email.trim().toLowerCase();
    const cleanName = (name || cleanEmail.split('@')[0]).trim();
    const isOwnerAdmin = cleanEmail === 'bariqal38@gmail.com' || cleanEmail === 'admin@financejournal.pro';
    const roleToAssign = isOwnerAdmin ? 'admin' : 'user';

    // Cek apakah akun sudah terdaftar
    const result = await pool.query('SELECT id, name, email, role FROM users WHERE LOWER(email) = $1', [cleanEmail]);
    if (result.rows.length === 0) {
      // Jika baru pertama kali login Google, otomatis registrasi ke tabel users & daftar_akun
      const randomPass = await bcrypt.hash(Math.random().toString(36), 10);
      const insertUser = await pool.query(
        'INSERT INTO users (name, email, password_hash, role) VALUES ($1, $2, $3, $4) RETURNING id, name, email, role',
        [cleanName, cleanEmail, randomPass, roleToAssign]
      );
      await pool.query(
        'INSERT INTO daftar_akun (user_id, nama_lengkap, email) VALUES ($1, $2, $3)',
        [insertUser.rows[0].id, cleanName, cleanEmail]
      );
      res.status(201).json({
        message: 'Akun Google berhasil didaftarkan dan login!',
        user: insertUser.rows[0],
      });
      return;
    }

    const existingUser = result.rows[0];
    if (isOwnerAdmin && existingUser.role !== 'admin') {
      await pool.query("UPDATE users SET role = 'admin' WHERE id = $1", [existingUser.id]);
      existingUser.role = 'admin';
    }

    res.json({
      message: 'Login Google berhasil!',
      user: existingUser,
    });
  } catch (err: any) {
    res.status(500).json({ error: 'Gagal otentikasi Google: ' + err.message });
  }
});

// Proses 2.0 & 3.0 DFD: Catat Pemasukan atau Pengeluaran
app.post('/api/transactions', async (req: Request, res: Response) => {
  try {
    const { userId, description, amount, type, transaction_date } = req.body;
    const numAmount = parseFloat(amount);

    if (!userId || !description || isNaN(numAmount) || numAmount <= 0) {
      res.status(400).json({ error: 'Data transaksi tidak valid.' });
      return;
    }

    // Ambil identitas user agar tercatat langsung di tabel transactions (user_name & user_email)
    const userRes = await pool.query('SELECT name, email FROM users WHERE id = $1', [userId]);
    const userName = userRes.rows[0]?.name || 'Pengguna';
    const userEmail = userRes.rows[0]?.email || '';

    const cleanType = type === 'pengeluaran' ? 'pengeluaran' : 'pemasukan';
    const txDate = transaction_date ? new Date(transaction_date) : new Date();

    const insertRes = await pool.query(
      `INSERT INTO transactions (user_id, user_name, user_email, description, amount, type, transaction_date)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING id, user_id, user_name, user_email, description, amount, type, transaction_date, created_at`,
      [userId, userName, userEmail, description.trim(), numAmount, cleanType, txDate]
    );

    res.status(201).json({
      message: cleanType === 'pemasukan' ? 'Pemasukan berhasil dicatat!' : 'Pengeluaran berhasil dicatat!',
      transaction: insertRes.rows[0],
    });
  } catch (err: any) {
    res.status(500).json({ error: 'Gagal mencatat transaksi: ' + err.message });
  }
});

// Proses 4.0 & 5.0 DFD: Ambil Daftar Transaksi & Hitung Ringkasan Saldo
app.get('/api/transactions', async (req: Request, res: Response) => {
  try {
    const { userId, type, search, limit = '200' } = req.query;
    let sql = 'SELECT * FROM transactions WHERE 1=1';
    const params: any[] = [];
    let idx = 1;

    if (!userId) {
      res.status(400).json({ error: 'Privasi Terlindungi: Akses transaksi memerlukan parameter userId.' });
      return;
    }

    const uCheck = await pool.query('SELECT password_reset_required FROM users WHERE id = $1', [userId]);
    if (uCheck.rows.length > 0 && uCheck.rows[0].password_reset_required) {
      res.status(403).json({
        error: 'password anda telah Reset tolong masukan password kembali',
        passwordResetRequired: true,
      });
      return;
    }

    sql += ` AND user_id = $${idx++}`;
    params.push(userId);
    if (type && type !== 'all') {
      sql += ` AND type = $${idx++}`;
      params.push(type);
    }
    if (search) {
      sql += ` AND (LOWER(description) LIKE $${idx} OR LOWER(user_name) LIKE $${idx})`;
      params.push(`%${(search as string).toLowerCase()}%`);
      idx++;
    }

    sql += ` ORDER BY transaction_date DESC, id DESC LIMIT $${idx}`;
    params.push(parseInt(limit as string, 10) || 200);

    const result = await pool.query(sql, params);

    let totalIncome = 0;
    let totalExpense = 0;
    const transactions = result.rows.map((r) => {
      const amt = parseFloat(r.amount);
      if (r.type === 'pemasukan') totalIncome += amt;
      else totalExpense += amt;

      return {
        id: r.id,
        userId: r.user_id,
        userName: r.user_name,
        userEmail: r.user_email,
        description: r.description,
        amount: amt,
        type: r.type,
        transactionDate: r.transaction_date,
        createdAt: r.created_at,
      };
    });

    res.json({
      transactions,
      summary: {
        totalIncome,
        totalExpense,
        netBalance: totalIncome - totalExpense,
        totalCount: transactions.length,
      },
    });
  } catch (err: any) {
    res.status(500).json({ error: 'Gagal memuat transaksi: ' + err.message });
  }
});

// Update & Hapus Transaksi (Edit Jurnal)
app.put('/api/transactions/:id', async (req: Request, res: Response) => {
  try {
    const { description, amount, type, transaction_date } = req.body;
    const result = await pool.query(
      `UPDATE transactions 
       SET description = $1, amount = $2, type = $3, transaction_date = $4 
       WHERE id = $5 RETURNING *`,
      [description.trim(), parseFloat(amount), type, new Date(transaction_date), req.params.id]
    );
    res.json({ message: 'Transaksi diperbarui.', transaction: result.rows[0] });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/transactions/:id', async (req: Request, res: Response) => {
  try {
    await pool.query('DELETE FROM transactions WHERE id = $1', [req.params.id]);
    res.json({ message: 'Transaksi berhasil dihapus.' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Proses 5.0 DFD: Monitoring Admin - Daftar Seluruh Akun & Ringkasan Per User
app.get('/api/admin/users', async (_req: Request, res: Response) => {
  try {
    const result = await pool.query(`
      SELECT 
        u.id, u.name, u.email, u.role, u.created_at, u.password_reset_required,
        da.nama_lengkap as daftar_nama,
        COALESCE(SUM(CASE WHEN t.type = 'pemasukan' THEN t.amount ELSE 0 END), 0) as total_pemasukan,
        COALESCE(SUM(CASE WHEN t.type = 'pengeluaran' THEN t.amount ELSE 0 END), 0) as total_pengeluaran,
        COUNT(t.id) as total_transaksi
      FROM users u
      LEFT JOIN daftar_akun da ON da.user_id = u.id
      LEFT JOIN transactions t ON t.user_id = u.id
      GROUP BY u.id, u.name, u.email, u.role, u.created_at, u.password_reset_required, da.nama_lengkap
      ORDER BY u.id ASC
    `);

    const users = await Promise.all(
      result.rows.map(async (r) => {
        const inc = parseFloat(r.total_pemasukan);
        const exp = parseFloat(r.total_pengeluaran);
        const expensePercentage = inc > 0 ? Math.min(100, Math.round((exp / inc) * 100)) : (exp > 0 ? 100 : 0);

        // Ambil keterangan transaksi terakhir
        const lastInc = await pool.query(
          "SELECT description FROM transactions WHERE user_id = $1 AND type = 'pemasukan' ORDER BY transaction_date DESC LIMIT 1",
          [r.id]
        );
        const lastExp = await pool.query(
          "SELECT description FROM transactions WHERE user_id = $1 AND type = 'pengeluaran' ORDER BY transaction_date DESC LIMIT 1",
          [r.id]
        );

        return {
          id: r.id,
          name: r.name,
          daftarNama: r.daftar_nama || r.name,
          email: r.email,
          role: r.role,
          createdAt: r.created_at,
          passwordResetRequired: Boolean(r.password_reset_required),
          totalPemasukan: inc,
          totalPengeluaran: exp,
          saldo: inc - exp,
          expensePercentage,
          totalTransaksi: parseInt(r.total_transaksi, 10),
          recentIncomeSource: lastInc.rows[0]?.description || null,
          recentExpenseItem: lastExp.rows[0]?.description || null,
        };
      })
    );

    res.json({ users });
  } catch (err: any) {
    res.status(500).json({ error: 'Gagal memuat monitoring user: ' + err.message });
  }
});

// Proses 5.0 DFD: Rincian Mendalam Transaksi Satu User Tertentu
app.get('/api/admin/users/:id/breakdown', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userRes = await pool.query('SELECT id, name, email, role, created_at FROM users WHERE id = $1', [id]);
    if (userRes.rows.length === 0) {
      res.status(404).json({ error: 'User tidak ditemukan' });
      return;
    }

    const txRes = await pool.query(
      'SELECT * FROM transactions WHERE user_id = $1 ORDER BY transaction_date DESC',
      [id]
    );

    let totalPemasukan = 0;
    let totalPengeluaran = 0;
    const incomes: any[] = [];
    const expenses: any[] = [];

    const allTransactions = txRes.rows.map((row) => {
      const amt = parseFloat(row.amount);
      const tx = {
        id: row.id,
        userId: row.user_id,
        userName: row.user_name || userRes.rows[0].name,
        userEmail: row.user_email || userRes.rows[0].email,
        description: row.description,
        amount: amt,
        type: row.type,
        transactionDate: row.transaction_date,
        createdAt: row.created_at,
      };

      if (row.type === 'pemasukan') {
        totalPemasukan += amt;
        incomes.push(tx);
      } else {
        totalPengeluaran += amt;
        expenses.push(tx);
      }
      return tx;
    });

    const expensePercentage = totalPemasukan > 0 ? Math.min(100, (totalPengeluaran / totalPemasukan) * 100) : (totalPengeluaran > 0 ? 100 : 0);

    res.json({
      user: userRes.rows[0],
      totalPemasukan,
      totalPengeluaran,
      saldo: totalPemasukan - totalPengeluaran,
      expensePercentage: Math.round(expensePercentage * 10) / 10,
      remainingPercentage: Math.round(Math.max(0, 100 - expensePercentage) * 10) / 10,
      incomes,
      expenses,
      allTransactions,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Khusus Admin: Memberikan atau mencabut akses Admin ke pengguna
app.patch('/api/admin/users/:id/role', async (req: Request, res: Response) => {
  try {
    const { role } = req.body;
    if (role !== 'admin' && role !== 'user') {
      res.status(400).json({ error: 'Role harus "admin" atau "user".' });
      return;
    }
    const updateRes = await pool.query(
      'UPDATE users SET role = $1 WHERE id = $2 RETURNING id, name, email, role',
      [role, req.params.id]
    );
    if (updateRes.rows.length === 0) {
      res.status(404).json({ error: 'Pengguna tidak ditemukan.' });
      return;
    }
    res.json({
      message: `Akses berhasil diubah menjadi ${role === 'admin' ? 'Admin' : 'Pengguna Biasa'}.`,
      user: updateRes.rows[0],
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Admin: Kosongkan seluruh data transaksi di Neon Database
app.post('/api/admin/clear-transactions', async (_req: Request, res: Response) => {
  try {
    await pool.query('TRUNCATE TABLE transactions RESTART IDENTITY');
    res.json({ message: 'Seluruh data transaksi di Neon Database berhasil dibersihkan.' });
  } catch (err: any) {
    res.status(500).json({ error: 'Gagal mengosongkan data: ' + err.message });
  }
});

// Update Profil (Ganti Nama, Email, Password untuk Admin atau Pengguna)
app.patch('/api/users/:id/profile', async (req: Request, res: Response) => {
  try {
    const { name, email, password } = req.body;
    const userId = req.params.id;

    if (!name || !name.trim()) {
      res.status(400).json({ error: 'Nama tidak boleh kosong.' });
      return;
    }

    let updateQuery = 'UPDATE users SET name = $1';
    const params: any[] = [name.trim()];
    let paramIdx = 2;

    if (email && email.trim()) {
      updateQuery += `, email = $${paramIdx++}`;
      params.push(email.trim().toLowerCase());
    }

    if (password && password.trim()) {
      const hash = await bcrypt.hash(password.trim(), 10);
      updateQuery += `, password_hash = $${paramIdx++}`;
      params.push(hash);
    }

    updateQuery += ` WHERE id = $${paramIdx} RETURNING id, name, email, role`;
    params.push(userId);

    const userRes = await pool.query(updateQuery, params);
    if (userRes.rows.length === 0) {
      res.status(404).json({ error: 'Pengguna tidak ditemukan.' });
      return;
    }

    // Sinkronkan juga dengan tabel daftar_akun & transactions
    await pool.query(
      'UPDATE daftar_akun SET nama_lengkap = $1 WHERE user_id = $2',
      [name.trim(), userId]
    );
    await pool.query(
      'UPDATE transactions SET user_name = $1 WHERE user_id = $2',
      [name.trim(), userId]
    );

    res.json({
      message: 'Profil berhasil diperbarui!',
      user: userRes.rows[0],
    });
  } catch (err: any) {
    res.status(500).json({ error: 'Gagal memperbarui profil: ' + err.message });
  }
});

// Endpoint untuk Download File ZIP project
app.get('/api/download-zip', (_req: Request, res: Response) => {
  const zipPath = path.join(__dirname, 'finance-journal-pro.zip');
  res.download(zipPath, 'finance-journal-pro.zip', (err) => {
    if (err && !res.headersSent) {
      res.status(500).json({ error: 'File ZIP belum tersedia atau terjadi kesalahan.' });
    }
  });
});

// ----------------------------------------------------
// 4. MENJALANKAN SERVER
// ----------------------------------------------------
async function startServer() {
  const isProd = process.env.NODE_ENV === 'production';

  if (!isProd) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  const PORT = 3000;
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Finance Journal Pro server running on http://localhost:${PORT}`);
  });
}

startServer();
