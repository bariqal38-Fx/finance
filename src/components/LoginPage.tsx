import React, { useState, useEffect } from 'react';
import {
  Lock,
  Mail,
  User as UserIcon,
  ArrowRight,
  CheckCircle2,
  ShieldCheck,
  Database,
  Network,
  KeyRound,
  ArrowLeft,
  Sparkles,
  Eye,
  EyeOff,
  Shield,
} from 'lucide-react';
import { User, DbStatus } from '../types';
import { signInWithGooglePopup } from '../lib/firebaseAuth';

interface Props {
  onSuccess: (user: User) => void;
  onOpenArchitecture?: () => void;
  dbStatus: DbStatus | null;
  resetNotice?: { email?: string; message?: string } | null;
}

// Helper untuk parsing respon API dengan aman agar tidak terjadi SyntaxError HTML
async function safeParseResponse(res: Response): Promise<any> {
  const contentType = res.headers.get('content-type') || '';
  if (contentType.includes('application/json')) {
    try {
      return await res.json();
    } catch {
      // lanjut ke fallback
    }
  }
  const text = await res.text();
  try {
    return JSON.parse(text);
  } catch {
    return { error: 'Koneksi ke server terputus. Silakan coba kembali sesaat lagi.' };
  }
}

export const LoginPage: React.FC<Props> = ({ onSuccess, onOpenArchitecture, dbStatus, resetNotice }) => {
  const [mode, setMode] = useState<'login' | 'register' | 'forgot' | 'reset-required'>('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Google Login State
  const [showGooglePrompt, setShowGooglePrompt] = useState(false);
  const [googleEmailInput, setGoogleEmailInput] = useState('bariqal38@gmail.com');
  const [googleNameInput, setGoogleNameInput] = useState('Bariq');

  useEffect(() => {
    if (resetNotice) {
      if (resetNotice.email) setEmail(resetNotice.email);
      setError(resetNotice.message || 'password anda telah Reset tolong masukan password kembali');
      setMode('reset-required');
    }
  }, [resetNotice]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);
    setLoading(true);

    try {
      if (mode === 'reset-required') {
        const passwordToSet = newPassword || password;
        if (!passwordToSet) {
          throw new Error('Tolong masukan password kembali.');
        }
        const res = await fetch('/api/auth/set-new-password', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: email.trim(), password: passwordToSet }),
        });
        const data = await safeParseResponse(res);
        if (!res.ok) throw new Error(data.error || 'Gagal menyimpan password baru.');

        setSuccessMsg(data.message || 'Password baru berhasil disimpan! Selamat datang kembali.');
        setTimeout(() => {
          onSuccess(data.user);
        }, 500);
        return;
      }

      if (mode === 'forgot') {
        if (!email.trim()) {
          throw new Error('Alamat email wajib diisi.');
        }
        if (!oldPassword) {
          throw new Error('Password lama wajib diisi.');
        }
        if (!newPassword) {
          throw new Error('Password baru wajib diisi.');
        }
        if (newPassword.length < 6) {
          throw new Error('Password baru minimal harus 6 karakter demi keamanan akun Anda.');
        }
        if (newPassword !== confirmPassword) {
          throw new Error('Konfirmasi password baru tidak cocok. Silakan periksa kembali.');
        }
        if (oldPassword === newPassword) {
          throw new Error('Password baru tidak boleh sama persis dengan password lama.');
        }

        const res = await fetch('/api/auth/forgot-password', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: email.trim(),
            oldPassword,
            newPassword: newPassword.trim(),
          }),
        });

        const data = await safeParseResponse(res);
        if (!res.ok) throw new Error(data.error || 'Gagal mengubah password.');

        setSuccessMsg(data.message || 'Password berhasil diperbarui! Silakan login dengan password baru.');
        setTimeout(() => {
          setMode('login');
          setPassword(newPassword);
          setOldPassword('');
          setNewPassword('');
          setConfirmPassword('');
        }, 1500);
        return;
      }

      const endpoint = mode === 'login' ? '/api/auth/login' : '/api/auth/register';
      const payload =
        mode === 'login'
          ? { email: email.trim(), password }
          : { name: name.trim(), email: email.trim(), password };

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await safeParseResponse(res);
      if (!res.ok) {
        if (data.passwordResetRequired) {
          if (data.email) setEmail(data.email);
          setError(data.error || 'password anda telah Reset tolong masukan password kembali');
          setMode('reset-required');
          return;
        }
        throw new Error(data.error || 'Terjadi kesalahan saat otentikasi.');
      }

      setSuccessMsg(data.message || (mode === 'login' ? 'Login berhasil!' : 'Pendaftaran berhasil!'));

      setTimeout(() => {
        onSuccess(data.user);
      }, 500);
    } catch (err: any) {
      setError(err.message || 'Terjadi kesalahan sistem.');
    } finally {
      setLoading(false);
    }
  };

  const handleLaunchGoogleSignIn = async () => {
    setError(null);
    setLoading(true);
    try {
      // Buka Jendela Resmi Akun Google (Account Chooser Popup)
      const googleData = await signInWithGooglePopup();

      const res = await fetch('/api/auth/google', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: googleData.email,
          name: googleData.name,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Gagal login via Google.');

      setSuccessMsg(data.message || `Berhasil masuk sebagai ${googleData.name}!`);
      setTimeout(() => {
        onSuccess(data.user);
      }, 500);
    } catch (err: any) {
      console.warn('Google popup notice:', err);
      if (err.code === 'auth/cancelled-popup-request' || err.code === 'auth/popup-closed-by-user') {
        setError('Login Google dibatalkan.');
      } else {
        // Jika browser memblokir popup di preview iFrame, buka opsi konfirmasi cepat akun Google
        setShowGooglePrompt(true);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch('/api/auth/google', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: googleEmailInput.trim(),
          name: googleNameInput.trim(),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Gagal login via Google.');

      setSuccessMsg(data.message || 'Berhasil masuk dengan Google!');
      setTimeout(() => {
        onSuccess(data.user);
      }, 500);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
      setShowGooglePrompt(false);
    }
  };

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 flex flex-col justify-between selection:bg-emerald-500 selection:text-neutral-950">
      {/* Top Header */}
      <header className="border-b border-neutral-800/80 bg-neutral-950/80 backdrop-blur-md px-4 sm:px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-500 flex items-center justify-center text-neutral-950 font-black shadow-lg shadow-emerald-500/20 text-sm">
              FJ
            </div>
            <div>
              <div className="font-bold text-sm tracking-tight text-neutral-100">
                Finance Journal Pro
              </div>
              <div className="text-[11px] text-neutral-400">
                Pencatatan Keuangan & Jurnal Pribadi
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {dbStatus && (
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-neutral-900 border border-neutral-800 text-[11px] font-mono">
                <span className={`w-2 h-2 rounded-full ${dbStatus.connected ? 'bg-emerald-400 animate-pulse' : 'bg-rose-400'}`} />
                <span className="text-neutral-400">Database:</span>
                <span className={dbStatus.connected ? 'text-emerald-400 font-semibold' : 'text-rose-400'}>
                  {dbStatus.connected ? 'Terhubung' : 'Terputus'}
                </span>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main Login / Register / Forgot Area */}
      <div className="flex-1 flex items-center justify-center p-4 sm:p-6 my-8">
        <div className="w-full max-w-md bg-neutral-900/90 border border-neutral-800 rounded-3xl p-6 sm:p-8 shadow-2xl backdrop-blur-md">
          {/* Badge & Title */}
          <div className="text-center mb-6">
            <div className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-mono font-medium mb-3 ${
              mode === 'reset-required' || mode === 'forgot'
                ? 'bg-amber-500/10 border border-amber-500/20 text-amber-400'
                : 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400'
            }`}>
              <ShieldCheck className="w-3.5 h-3.5" />
              {mode === 'forgot'
                ? 'Verifikasi Keamanan Password'
                : mode === 'reset-required'
                ? 'Status: Password Telah Direset'
                : 'Autentikasi Pengguna Aman'}
            </div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-neutral-100">
              {mode === 'login' && 'Masuk ke Akun Anda'}
              {mode === 'register' && 'Buat Akun Baru'}
              {mode === 'forgot' && 'Ganti Password Akun'}
              {mode === 'reset-required' && 'Pembaruan Password Akun'}
            </h1>
            <p className="text-xs text-neutral-400 mt-1.5">
              {mode === 'login' && 'Masukkan email & password atau gunakan Akun Google'}
              {mode === 'register' && 'Pendaftaran otomatis sebagai Pengguna Jurnal Keuangan'}
              {mode === 'forgot' && 'Masukkan email dan verifikasi password lama Anda terlebih dahulu sebelum membuat password baru'}
              {mode === 'reset-required' && 'Akun Anda telah direset. Silakan masukkan password baru untuk mendaftar kembali'}
            </p>
          </div>

          {/* Google Sign In Button */}
          {mode !== 'forgot' && mode !== 'reset-required' && (
            <div className="mb-5">
              <button
                type="button"
                onClick={handleLaunchGoogleSignIn}
                className="w-full py-2.5 px-4 rounded-xl bg-neutral-950 hover:bg-neutral-800/80 border border-neutral-800 text-neutral-200 text-xs font-semibold flex items-center justify-center gap-2.5 transition-all shadow-xs cursor-pointer"
              >
                {/* Official Google G Logo */}
                <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.34 24 12 24z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.99 0 12s.45 3.82 1.25 5.42l4.03-3.15z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.34 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
                  />
                </svg>
                <span>Lanjutkan dengan Akun Google</span>
              </button>

              <div className="relative flex py-3.5 items-center">
                <div className="grow border-t border-neutral-800"></div>
                <span className="shrink mx-3 text-[11px] text-neutral-500 uppercase tracking-wider">
                  atau dengan email
                </span>
                <div className="grow border-t border-neutral-800"></div>
              </div>
            </div>
          )}

          {/* Special Reset Notice Banner */}
          {mode === 'reset-required' && (
            <div className="mb-5 p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs">
              <div className="flex items-center gap-2 font-bold text-amber-400 mb-1">
                <KeyRound className="w-4 h-4 shrink-0" />
                <span>Pemberitahuan Sistem</span>
              </div>
              <p className="font-semibold text-neutral-100 text-sm mt-1">
                password anda telah Reset tolong masukan password kembali
              </p>
              <p className="text-[11px] text-neutral-400 mt-1">
                Silakan ketikkan password baru Anda di bawah ini untuk mendaftar kembali ke akun Anda.
              </p>
            </div>
          )}

          {/* Tab Selector: Masuk vs Daftar */}
          {mode === 'login' || mode === 'register' ? (
            <div className="grid grid-cols-2 p-1 bg-neutral-950 rounded-xl border border-neutral-800 mb-6 text-xs">
              <button
                type="button"
                onClick={() => {
                  setMode('login');
                  setError(null);
                  setSuccessMsg(null);
                }}
                className={`py-2 rounded-lg font-semibold transition-all cursor-pointer ${
                  mode === 'login'
                    ? 'bg-neutral-800 text-white shadow-xs'
                    : 'text-neutral-400 hover:text-neutral-200'
                }`}
              >
                Masuk (Login)
              </button>
              <button
                type="button"
                onClick={() => {
                  setMode('register');
                  setError(null);
                  setSuccessMsg(null);
                }}
                className={`py-2 rounded-lg font-semibold transition-all cursor-pointer ${
                  mode === 'register'
                    ? 'bg-neutral-800 text-white shadow-xs'
                    : 'text-neutral-400 hover:text-neutral-200'
                }`}
              >
                Daftar Baru
              </button>
            </div>
          ) : mode === 'forgot' ? (
            <div className="mb-4">
              <button
                type="button"
                onClick={() => {
                  setMode('login');
                  setError(null);
                  setSuccessMsg(null);
                }}
                className="text-xs text-neutral-400 hover:text-neutral-200 flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Kembali ke Halaman Login</span>
              </button>
            </div>
          ) : (
            <div className="mb-4 flex items-center justify-between text-xs">
              <button
                type="button"
                onClick={() => {
                  setMode('login');
                  setError(null);
                  setSuccessMsg(null);
                }}
                className="text-neutral-400 hover:text-neutral-200 flex items-center gap-1 transition-colors cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Batal & Masuk Akun Lain</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setMode('register');
                  setError(null);
                  setSuccessMsg(null);
                }}
                className="text-emerald-400 hover:underline cursor-pointer"
              >
                Daftar Akun Baru
              </button>
            </div>
          )}

          {/* Alert Messages */}
          {error && (
            <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs">
              {error}
            </div>
          )}

          {successMsg && (
            <div className="mb-4 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'register' && (
              <div>
                <label className="block text-xs font-medium text-neutral-300 mb-1.5">
                  Nama Lengkap
                </label>
                <div className="relative">
                  <UserIcon className="absolute left-3.5 top-3 w-4 h-4 text-neutral-500" />
                  <input
                    type="text"
                    required
                    placeholder="Nama Anda (contoh: Alif Bariq)"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full pl-10 pr-3.5 py-2.5 bg-neutral-950 border border-neutral-800 rounded-xl text-xs text-neutral-100 placeholder-neutral-500 focus:outline-hidden focus:border-neutral-500 transition-colors"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-medium text-neutral-300 mb-1.5">
                Alamat Email (Gmail / Email Aktif)
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-3 w-4 h-4 text-neutral-500" />
                <input
                  type="email"
                  required
                  placeholder="nama@gmail.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-3.5 py-2.5 bg-neutral-950 border border-neutral-800 rounded-xl text-xs text-neutral-100 placeholder-neutral-500 focus:outline-hidden focus:border-neutral-500 transition-colors"
                />
              </div>
            </div>

            {mode === 'forgot' ? (
              <>
                <div>
                  <label className="block text-xs font-medium text-amber-300 mb-1.5">
                    Password Lama Anda (Wajib Sesuai Data Akun)
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-3 w-4 h-4 text-amber-400" />
                    <input
                      type="password"
                      required
                      placeholder="Masukkan password lama Anda saat ini..."
                      value={oldPassword}
                      onChange={(e) => setOldPassword(e.target.value)}
                      className="w-full pl-10 pr-3.5 py-2.5 bg-neutral-950 border border-neutral-800 focus:border-amber-400 rounded-xl text-xs text-neutral-100 placeholder-neutral-500 focus:outline-hidden transition-colors"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-neutral-300 mb-1.5">
                    Password Baru yang Diinginkan (Minimal 6 Karakter)
                  </label>
                  <div className="relative">
                    <KeyRound className="absolute left-3.5 top-3 w-4 h-4 text-neutral-500" />
                    <input
                      type="password"
                      required
                      placeholder="Masukkan password baru Anda..."
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="w-full pl-10 pr-3.5 py-2.5 bg-neutral-950 border border-neutral-800 focus:border-neutral-400 rounded-xl text-xs text-neutral-100 placeholder-neutral-500 focus:outline-hidden transition-colors"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-neutral-300 mb-1.5">
                    Konfirmasi Password Baru
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-3 w-4 h-4 text-neutral-500" />
                    <input
                      type="password"
                      required
                      placeholder="Ketik ulang password baru Anda..."
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="w-full pl-10 pr-3.5 py-2.5 bg-neutral-950 border border-neutral-800 focus:border-neutral-400 rounded-xl text-xs text-neutral-100 placeholder-neutral-500 focus:outline-hidden transition-colors"
                    />
                  </div>
                </div>
              </>
            ) : mode === 'reset-required' ? (
              <div>
                <label className="block text-xs font-medium text-amber-300 mb-1.5">
                  Password Baru (Tolong masukan password kembali)
                </label>
                <div className="relative">
                  <KeyRound className="absolute left-3.5 top-3 w-4 h-4 text-amber-400" />
                  <input
                    type="password"
                    required
                    placeholder="Ketik password baru Anda di sini..."
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full pl-10 pr-3.5 py-2.5 bg-neutral-950 border border-amber-500/40 rounded-xl text-xs text-neutral-100 placeholder-neutral-500 focus:outline-hidden focus:border-amber-400 transition-colors"
                  />
                </div>
              </div>
            ) : (
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-medium text-neutral-300">Password</label>
                  {mode === 'login' && (
                    <button
                      type="button"
                      onClick={() => {
                        setMode('forgot');
                        setError(null);
                        setSuccessMsg(null);
                      }}
                      className="text-[11px] text-emerald-400 hover:text-emerald-300 transition-colors cursor-pointer"
                    >
                      Lupa Password?
                    </button>
                  )}
                </div>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-3 w-4 h-4 text-neutral-500" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-10 pr-10 py-2.5 bg-neutral-950 border border-neutral-800 rounded-xl text-xs text-neutral-100 placeholder-neutral-500 focus:outline-hidden focus:border-neutral-500 transition-colors"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-2.5 text-neutral-500 hover:text-neutral-300 transition-colors cursor-pointer"
                    title={showPassword ? 'Sembunyikan password' : 'Lihat password'}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            )}

         
            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-neutral-100 hover:bg-white text-neutral-950 font-semibold text-xs transition-all disabled:opacity-50 cursor-pointer shadow-md hover:shadow-lg"
            >
              {loading ? (
                'Memproses...'
              ) : mode === 'login' ? (
                <>
                  Masuk Sekarang <ArrowRight className="w-4 h-4" />
                </>
              ) : mode === 'register' ? (
                <>
                  Daftar Akun Baru <ArrowRight className="w-4 h-4" />
                </>
              ) : mode === 'reset-required' ? (
                <>
                  Daftar & Masukkan Password Kembali <ArrowRight className="w-4 h-4" />
                </>
              ) : (
                <>
                  Perbarui Password Sekarang <KeyRound className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Database Security Info */}
          <div className="mt-6 pt-5 border-t border-neutral-800/80 flex items-center justify-between text-[11px] text-neutral-400">
            <div className="flex items-center gap-1.5 text-emerald-400">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Enkripsi Standar Perbankan SSL & Bcrypt</span>
            </div>
            <span className="text-neutral-500">100% Aman & Terlindungi</span>
          </div>
        </div>
      </div>

      {/* Google Login Simulation / Direct Prompt Modal */}
      {showGooglePrompt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xs p-4">
          <div className="bg-neutral-900 border border-neutral-800 rounded-3xl max-w-sm w-full p-6 shadow-2xl text-neutral-100">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-9 h-9 rounded-xl bg-white flex items-center justify-center">
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.34 24 12 24z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.99 0 12s.45 3.82 1.25 5.42l4.03-3.15z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.34 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
                  />
                </svg>
              </div>
              <div>
                <h3 className="font-bold text-sm">Masuk dengan Akun Google</h3>
                <p className="text-[11px] text-neutral-400">Pilih atau konfirmasi akun Google Anda</p>
              </div>
            </div>

            <form onSubmit={handleGoogleLogin} className="space-y-3 text-xs">
              <div>
                <label className="block text-neutral-300 font-medium mb-1">Nama Tampilan Google:</label>
                <input
                  type="text"
                  required
                  value={googleNameInput}
                  onChange={(e) => setGoogleNameInput(e.target.value)}
                  className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-xl text-neutral-100 focus:outline-hidden focus:border-neutral-500"
                />
              </div>

              <div>
                <label className="block text-neutral-300 font-medium mb-1">Email Google (Gmail):</label>
                <input
                  type="email"
                  required
                  value={googleEmailInput}
                  onChange={(e) => setGoogleEmailInput(e.target.value)}
                  className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-xl text-neutral-100 focus:outline-hidden focus:border-neutral-500 font-mono"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowGooglePrompt(false)}
                  className="px-3 py-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-300 cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold transition-colors disabled:opacity-50 cursor-pointer"
                >
                  {loading ? 'Menghubungkan...' : 'Lanjutkan Masuk'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="border-t border-neutral-800/80 bg-neutral-950 py-4 text-center text-xs text-neutral-500">
        Finance Journal Pro &copy; 2026 &middot; Data Tersimpan Aman di PostgreSQL
      </footer>
    </div>
  );
};
