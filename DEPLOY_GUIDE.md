# 🚀 Panduan Mempublikasikan Finance Journal Pro ke Publik (GitHub & Hosting)

Panduan lengkap untuk mempublikasikan aplikasi ini ke internet secara online, aman, dan tanpa kendala **"koneksi terputus"**.

---

## 🔍 Mengapa Terjadi "Koneksi Terputus" Saat Upload ke GitHub?

Ada 2 penyebab utama mengapa aplikasi web full-stack terputus koneksinya saat di-upload ke GitHub:

1. **File `.env` tidak ikut ter-upload ke GitHub**:
   File `.env` yang berisi URL database sengaja dilindungi (masuk `.gitignore`) agar password database Anda tidak dicuri orang lain di GitHub. Oleh karena itu, saat di-deploy ke hosting (seperti Vercel, Render, atau Railway), server hosting belum mengetahui alamat database Anda.
2. **Port Server Harus Dinamis (`process.env.PORT`)**:
   Layanan hosting cloud seperti Render atau Railway menggunakan port acak (misalnya port 10000 atau 8080). Server kami kini telah diperbarui otomatis dengan `process.env.PORT` sehingga dapat berjalan mulus di platform mana pun.

---

## 🌐 Cara Deploy / Mempublikasikan Aplikasi (Paling Mudah & Gratis)

Pilihan terbaik dan termudah untuk aplikasi Node.js + React + PostgreSQL adalah menggunakan **Render** atau **Railway**.

### Opsi A: Deploy Gratis via Render.com (Sangat Direkomendasikan)

1. **Push Proyek ke GitHub**:
   - Buat repositori baru di akun GitHub Anda (misal: `finance-journal-pro`).
   - Upload / push semua file proyek Anda ke repositori tersebut.
2. **Daftar di [Render.com](https://render.com/)**:
   - Login menggunakan akun GitHub Anda.
   - Klik tombol **"New +"** lalu pilih **"Web Service"**.
   - Pilih repositori GitHub Anda tadi.
3. **Konfigurasi Pengaturan di Render**:
   - **Name**: `finance-journal-pro`
   - **Environment**: `Node`
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm start`
4. **Masukkan Environment Variables (Kunci Database)**:
   - Gulir ke bagian **"Environment Variables"** lalu klik **"Add Environment Variable"**:
     * **Key**: `DATABASE_URL`
     * **Value**: Masukkan koneksi Neon PostgreSQL Anda:
       `postgresql://neondb_owner:npg_AL5xuvo9NXBR@ep-dawn-hall-b55b37ey-pooler.c-7.us-east-2.aws.neon.tech/neondb?sslmode=require`
     * **Key**: `NODE_ENV`
     * **Value**: `production`
5. **Klik "Deploy Web Service"**:
   - Tunggu sekitar 2 menit hingga build selesai.
   - Render akan memberikan URL publik resmi gratis (contoh: `https://finance-journal-pro.onrender.com`).
   - Aplikasi Anda kini aktif 24 jam dan bisa diakses oleh siapa saja di internet!

---

### Opsi B: Deploy via Railway.app

1. Buka [Railway.app](https://railway.app/) dan login via GitHub.
2. Klik **"New Project"** -> **"Deploy from GitHub repo"**.
3. Pilih repositori Anda.
4. Buka tab **"Variables"** di dashboard Railway, tambahkan:
   - `DATABASE_URL` = URL Neon PostgreSQL Anda
   - `NODE_ENV` = `production`
5. Buka tab **"Settings"** -> di bagian **"Networking"**, klik **"Generate Domain"** untuk mendapatkan alamat website publik Anda.

---

## 🔒 Keamanan Data Pengguna

- **Enkripsi Bcrypt**: Seluruh password pengguna otomatis terenkripsi satu arah dengan garam (*salt*) 10 putaran.
- **Isolasi Data Akun**: Setiap pengguna hanya dapat melihat dan mengelola transaksi miliknya sendiri (`user_id`).
- **Proteksi Brute-Force**: Login dibatasi maksimal 10 percobaan per 5 menit untuk mencegah hacker mencoba membobol kata sandi.
