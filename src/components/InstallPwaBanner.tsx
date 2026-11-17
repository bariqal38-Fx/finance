import React, { useState, useEffect } from 'react';
import { Download, Smartphone, X, CheckCircle2 } from 'lucide-react';

export const InstallPwaBanner: React.FC = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstallable, setIsInstallable] = useState(false);
  const [isDismissed, setIsDismissed] = useState(() => {
    return localStorage.getItem('fj_pwa_dismissed') === 'true';
  });
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    // Cek apakah sudah berjalan dalam mode standalone (sudah diinstall)
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
      return;
    }

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setIsInstallable(true);
    };

    window.addEventListener('beforeinstallprompt', handler);

    window.addEventListener('appinstalled', () => {
      setIsInstalled(true);
      setIsInstallable(false);
      setDeferredPrompt(null);
    });

    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) {
      // Fallback petunjuk jika di iOS Safari
      alert(
        'Untuk memasang di iPhone/iPad:\n1. Tekan tombol Bagikan (Share / kotak panah ke atas) di Safari.\n2. Pilih "Tambah ke Layar Utama" (Add to Home Screen).'
      );
      return;
    }

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setIsInstallable(false);
      setDeferredPrompt(null);
    }
  };

  const handleDismiss = () => {
    setIsDismissed(true);
    localStorage.setItem('fj_pwa_dismissed', 'true');
  };

  // Jangan tampilkan jika sudah di-dismiss atau sudah diinstall
  if (isDismissed || isInstalled) return null;

  return (
    <div className="bg-gradient-to-r from-emerald-950/80 via-neutral-900 to-neutral-900 border-b border-emerald-500/20 px-4 py-2.5 text-xs text-neutral-200">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
            <Smartphone className="w-4 h-4" />
          </div>
          <div>
            <span className="font-bold text-white">Pasang Aplikasi ke HP / Laptop Anda</span>
            <span className="hidden sm:inline text-neutral-400 ml-2">
              (Bisa dibuka langsung dari layar utama tanpa buka browser)
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={handleInstallClick}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-neutral-950 font-bold text-xs transition-colors shadow-sm cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Pasang Sekarang</span>
          </button>
          <button
            onClick={handleDismiss}
            className="p-1.5 rounded-lg hover:bg-neutral-800 text-neutral-400 hover:text-neutral-200 transition-colors cursor-pointer"
            title="Tutup banner"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
