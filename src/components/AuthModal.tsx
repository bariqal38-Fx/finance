import React, { useState } from 'react';
import {
  X,
  Lock,
  Mail,
  User as UserIcon,
  Shield,
  ArrowRight,
  CheckCircle2,
  KeyRound,
  ArrowLeft,
  Sparkles,
} from 'lucide-react';
import { User } from '../types';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (user: User) => void;
  initialMode?: 'login' | 'register';
}

async function safeParseModalResponse(res: Response): Promise<any> {
  const contentType = res.headers.get('content-type') || '';
  if (contentType.includes('application/json')) {
    try {
      return await res.json();
    } catch {
      // fallback
    }
  }
  const text = await res.text();
  try {
    return JSON.parse(text);
  } catch {
    return { error: 'Koneksi ke server terputus. Silakan coba sesaat lagi.' };
  }
}

export const AuthModal: React.FC<Props> = ({
  isOpen,
  onClose,
  onSuccess,
  initialMode = 'login',
}) => {
  const [mode, setMode] = useState<'login' | 'register' | 'forgot'>(initialMode);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const [googleNameInput, setGoogleNameInput] = useState('Bariq');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);
    setLoading(true);

    try {
      if (mode === 'forgot') {
        if (!email.trim() || !oldPassword || !newPassword) {
          throw new Error('Email, password lama, dan password baru wajib diisi.');
        }
        if (newPassword.length < 6) {
          throw new Error('Password baru minimal harus 6 karakter.');
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
        const data = await safeParseModalResponse(res);
        if (!res.ok) throw new Error(data.error || 'Gagal mereset password.');

        setSuccessMsg(data.message || 'Password berhasil diperbarui! Silakan login.');
        setTimeout(() => {
          setMode('login');
          setPassword(newPassword);
          setOldPassword('');
          setNewPassword('');
        }, 1200);
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

      const data = await safeParseModalResponse(res);
      if (!res.ok) {
        throw new Error(data.error || 'Terjadi kesalahan saat otentikasi');
      }

      setSuccessMsg(data.message || 'Berhasil!');
      setTimeout(() => {
        onSuccess(data.user);
        onClose();
      }, 500);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-xs p-4">
      <div className="bg-neutral-900 border border-neutral-800 rounded-2xl max-w-md w-full p-6 shadow-2xl text-neutral-100">
        <div className="flex items-center justify-between pb-3 border-b border-neutral-800">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-mono text-emerald-400 font-semibold px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20">
                Keamanan Terenkripsi
              </span>
              <h3 className="font-bold text-base">
                {mode === 'login' && 'Masuk ke Finance Journal'}
                {mode === 'register' && 'Pendaftaran Akun Baru'}
                {mode === 'forgot' && 'Reset Password Akun'}
              </h3>
            </div>
            <p className="text-xs text-neutral-400 mt-1">
              {mode === 'login' && 'Gunakan Email & Password Anda'}
              {mode === 'register' && 'Data disimpan ke D1 (users & daftar_akun) Neon PostgreSQL'}
              {mode === 'forgot' && 'Ketik email terdaftar untuk mengatur password baru'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-neutral-400 hover:text-neutral-200 p-1.5 rounded-lg hover:bg-neutral-800 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Selector */}
        {mode !== 'forgot' ? (
          <div className="grid grid-cols-2 p-1 bg-neutral-950 rounded-xl border border-neutral-800 mb-4 text-xs">
            <button
              type="button"
              onClick={() => {
                setMode('login');
                setError(null);
                setSuccessMsg(null);
              }}
              className={`py-1.5 rounded-lg font-medium transition-colors cursor-pointer ${
                mode === 'login'
                  ? 'bg-neutral-800 text-white'
                  : 'text-neutral-400 hover:text-neutral-200'
              }`}
            >
              Masuk
            </button>
            <button
              type="button"
              onClick={() => {
                setMode('register');
                setError(null);
                setSuccessMsg(null);
              }}
              className={`py-1.5 rounded-lg font-medium transition-colors cursor-pointer ${
                mode === 'register'
                  ? 'bg-neutral-800 text-white'
                  : 'text-neutral-400 hover:text-neutral-200'
              }`}
            >
              Daftar Baru
            </button>
          </div>
        ) : (
          <div className="my-3">
            <button
              type="button"
              onClick={() => {
                setMode('login');
                setError(null);
                setSuccessMsg(null);
              }}
              className="text-xs text-neutral-400 hover:text-neutral-200 flex items-center gap-1.5 cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Kembali ke Form Login</span>
            </button>
          </div>
        )}

        {error && (
          <div className="mb-3 p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs">
            {error}
          </div>
        )}

        {successMsg && (
          <div className="mb-3 p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            {successMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3 text-xs">
          {mode === 'register' && (
            <div>
              <label className="block font-medium text-neutral-300 mb-1">Nama Lengkap</label>
              <div className="relative">
                <UserIcon className="absolute left-3 top-2.5 w-4 h-4 text-neutral-500" />
                <input
                  type="text"
                  required
                  placeholder="Nama Lengkap Anda"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-neutral-950 border border-neutral-800 rounded-xl text-neutral-100 placeholder-neutral-500 focus:outline-hidden focus:border-neutral-500"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block font-medium text-neutral-300 mb-1">Email</label>
            <div className="relative">
              <Mail className="absolute left-3 top-2.5 w-4 h-4 text-neutral-500" />
              <input
                type="email"
                required
                placeholder="nama@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-neutral-950 border border-neutral-800 rounded-xl text-neutral-100 placeholder-neutral-500 focus:outline-hidden focus:border-neutral-500"
              />
            </div>
          </div>

          {mode === 'forgot' ? (
            <>
              <div>
                <label className="block font-medium text-amber-300 mb-1">
                  Password Lama Anda (Wajib Sesuai)
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-2.5 w-4 h-4 text-amber-400" />
                  <input
                    type="password"
                    required
                    placeholder="Password lama saat ini..."
                    value={oldPassword}
                    onChange={(e) => setOldPassword(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 bg-neutral-950 border border-neutral-800 focus:border-amber-400 rounded-xl text-neutral-100 placeholder-neutral-500 focus:outline-hidden"
                  />
                </div>
              </div>

              <div>
                <label className="block font-medium text-neutral-300 mb-1">
                  Password Baru yang Diinginkan
                </label>
                <div className="relative">
                  <KeyRound className="absolute left-3 top-2.5 w-4 h-4 text-neutral-500" />
                  <input
                    type="password"
                    required
                    placeholder="Password baru (min. 6 karakter)..."
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 bg-neutral-950 border border-neutral-800 rounded-xl text-neutral-100 placeholder-neutral-500 focus:outline-hidden focus:border-neutral-500"
                  />
                </div>
              </div>
            </>
          ) : (
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block font-medium text-neutral-300">Password</label>
                {mode === 'login' && (
                  <button
                    type="button"
                    onClick={() => {
                      setMode('forgot');
                      setError(null);
                      setSuccessMsg(null);
                    }}
                    className="text-[11px] text-emerald-400 hover:text-emerald-300 cursor-pointer"
                  >
                    Lupa Password?
                  </button>
                )}
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-2.5 w-4 h-4 text-neutral-500" />
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-neutral-950 border border-neutral-800 rounded-xl text-neutral-100 placeholder-neutral-500 focus:outline-hidden focus:border-neutral-500"
                />
              </div>
            </div>
          )}

          <div className="pt-2">
            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 px-4 rounded-xl bg-neutral-100 hover:bg-white text-neutral-950 font-semibold transition-colors disabled:opacity-50 cursor-pointer"
            >
              {loading ? (
                'Memproses...'
              ) : mode === 'login' ? (
                'Masuk'
              ) : mode === 'register' ? (
                'Daftar Sekarang'
              ) : (
                'Reset Password'
              )}
            </button>
          </div>
        </form>
      </div>

    </div>
  );
};
