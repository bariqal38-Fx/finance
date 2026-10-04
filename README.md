# Finance Journal Pro 💰📊

Aplikasi pencatatan jurnal keuangan pribadi dan monitoring admin berbasis full-stack **React + TypeScript + Express + PostgreSQL (Neon DB)** yang dirancang sesuai dengan:
- **Diagram ERD**: Tabel `users`, `daftar_akun`, dan `transactions`.
- **DFD Level 0**: Diagram Konteks (Entitas Pengguna & Entitas Admin).
- **DFD Level 1**:
  - `1.0`: Daftar & Login
  - `2.0`: Catat Pemasukan
  - `3.0`: Catat Pengeluaran
  - `4.0`: Lihat Jurnal Pribadi
  - `5.0`: Monitoring Admin (Analisis Sumber Uang & Barang yang Dibeli)

---

## 🚀 Fitur Utama

1. **Pemisahan Transaksi Mandiri Per User**:
   - Catatan keuangan Budi Santoso dan Siti Rahmawati tersimpan terpisah di Neon PostgreSQL.
   - Admin dapat mengetahui secara rinci uang masuk didapat dari mana dan uang keluar dipakai untuk membeli apa saja.
2. **Grafik Rasio Visual (Hijau & Merah)**:
   - Proporsi visual modal vs belanja (*misal modal 5 keluar 2.5 $\rightarrow$ grafik 50% Hijau Sisa Kas dan 50% Merah Pengeluaran*).
3. **Penyimpanan Identitas Langsung**:
   - Kolom `user_name` dan `user_email` tersimpan langsung di tabel `transactions` Neon DB sehingga sangat mudah dipantau melalui Neon Console.
4. **Ekspor Data**: Mendukung ekspor mutasi ke format file `.csv`.

---

## 🛠️ Tech Stack

- **Frontend**: React 18, TypeScript, Tailwind CSS, Lucide Icons
- **Backend**: Node.js, Express, `pg` (PostgreSQL Client), bcryptjs
- **Database**: [Neon Serverless PostgreSQL](https://neon.tech)
- **Bundler**: Vite

---

## 💻 Cara Menjalankan di Lokal (Local Development)

### 1. Prasyarat
- [Node.js](https://nodejs.org) versi 18 atau lebih baru.
- Akun dan connection string database [Neon PostgreSQL](https://neon.tech).

### 2. Instalasi Dependensi
```bash
npm install --legacy-peer-deps
```

### 3. Konfigurasi Environment Variable
Salin file `.env.example` menjadi `.env`:
```bash
cp .env.example .env
```
Lalu isi `DATABASE_URL` di file `.env` dengan string koneksi database Neon Anda:
```env
DATABASE_URL="postgresql://neondb_owner:password@ep-host.aws.neon.tech/neondb?sslmode=require"
```

### 4. Jalankan Aplikasi
```bash
npm run dev
```
Buka browser di `http://localhost:3000`.

---

## 📤 Cara Upload Project Ini ke GitHub

Anda dapat mengunggah seluruh kode proyek ini ke repositori GitHub Anda dengan langkah-langkah berikut:

1. **Buka Terminal / Command Prompt** di folder proyek ini.
2. **Inisialisasi Git** (jika belum):
   ```bash
   git init
   ```
3. **Tambahkan Semua File ke Staging**:
   ```bash
   git add .
   ```
4. **Buat Commit Pertama**:
   ```bash
   git commit -m "feat: inisialisasi Finance Journal Pro sesuai DFD & ERD Neon DB"
   ```
5. **Buat Repositori Baru di [GitHub](https://github.com/new)**:
   - Beri nama repositori, misalnya `finance-journal-pro`.
   - Pilih *Public* atau *Private*.
   - Jangan centang "Initialize this repository with a README" (karena sudah ada di lokal).
6. **Hubungkan Remote GitHub dan Push**:
   ```bash
   git branch -M main
   git remote add origin https://github.com/USERNAME_ANDA/finance-journal-pro.git
   git push -u origin main
   ```

*(File `.env` otomatis diabaikan oleh `.gitignore` sehingga password database Anda tetap aman dan tidak bocor ke publik).*

---

## 👥 Akun Demo Awal

| Peran | Email | Password |
| :--- | :--- | :--- |
| **Admin** | `admin@financejournal.pro` | `admin123` |
| **Pengguna** | `siti.rahma@gmail.com` | `user123` |
