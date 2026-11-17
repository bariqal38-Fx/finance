import React, { useState, useEffect } from 'react';
import { Shield, Sparkles, Terminal, Cpu, Database, Mic, ArrowRight, Zap, Play, SkipForward } from 'lucide-react';

interface Props {
  onFinish: () => void;
}

export const TechIntroSplash: React.FC<Props> = ({ onFinish }) => {
  const [progress, setProgress] = useState(0);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [glitchText, setGlitchText] = useState('SYSTEM BOOTING');

  const steps = [
    { text: 'MEMUAT SISTEM KERNEL FJ PRO v2.6...', icon: Cpu, color: 'text-emerald-400' },
    { text: 'MENGHUBUNGKAN KE SERVER NEON POSTGRESQL CLOUD...', icon: Database, color: 'text-blue-400' },
    { text: 'MENGAKTIFKAN ENKRIPSI BCRYPT & PROTEKSI ANTI-HACKER...', icon: Shield, color: 'text-purple-400' },
    { text: 'KALIBRASI MESIN AI VOICE RECOGNITION BAHASA INDONESIA...', icon: Mic, color: 'text-amber-400' },
    { text: 'MEMVERIFIKASI INTEGRITAS DATABASE & JURNAL KEUANGAN...', icon: Sparkles, color: 'text-emerald-300' },
    { text: 'SEMUA SISTEM STABIL & AMAN - AKSES DIBERIKAN!', icon: Zap, color: 'text-emerald-400' },
  ];

  useEffect(() => {
    // Animasi progress berjalan mulus hingga 100% dalam ~7 detik
    const durationMs = 7000;
    const intervalMs = 50;
    const increment = 100 / (durationMs / intervalMs);

    const timer = setInterval(() => {
      setProgress((prev) => {
        const next = prev + increment;
        if (next >= 100) {
          clearInterval(timer);
          setTimeout(() => {
            onFinish();
          }, 400);
          return 100;
        }
        return next;
      });
    }, intervalMs);

    return () => clearInterval(timer);
  }, [onFinish]);

  // Update step index berdasarkan progress
  useEffect(() => {
    const idx = Math.min(
      steps.length - 1,
      Math.floor((progress / 100) * steps.length)
    );
    setCurrentStepIndex(idx);

    if (progress < 25) setGlitchText('INITIALIZING CORE...');
    else if (progress < 50) setGlitchText('ENCRYPTING DATABASE...');
    else if (progress < 75) setGlitchText('SYNCHRONIZING AI VOICE...');
    else if (progress < 98) setGlitchText('FINALIZING SECURITY...');
    else setGlitchText('SYSTEM READY');
  }, [progress, steps.length]);

  const CurrentIcon = steps[currentStepIndex].icon;

  return (
    <div className="fixed inset-0 z-50 bg-[#05070a] text-neutral-100 flex flex-col items-center justify-center p-4 overflow-hidden select-none">
      {/* Background Cyber Grid & Glow Orbs */}
      <div className="absolute inset-0 bg-[radial-gradient(#10b981_1px,transparent_1px)] [background-size:24px_24px] opacity-15" />
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 left-1/2 -translate-x-1/2 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Cyber Scanline Effect */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-emerald-500/5 to-transparent h-24 w-full animate-pulse pointer-events-none" />

      <div className="relative z-10 max-w-lg w-full flex flex-col items-center text-center">
        {/* Holographic Logo Core */}
        <div className="relative mb-8">
          {/* Outer Pulsing Rotating Rings */}
          <div className="absolute -inset-6 rounded-3xl border border-emerald-500/20 animate-spin [animation-duration:12s]" />
          <div className="absolute -inset-3 rounded-2xl border border-emerald-400/30 animate-ping [animation-duration:3s] opacity-20" />
          <div className="absolute -inset-1 rounded-2xl bg-gradient-to-r from-emerald-500 to-purple-500 opacity-30 blur-md animate-pulse" />

          {/* Central Monogram Emblem */}
          <div className="relative w-24 h-24 sm:w-28 sm:h-28 rounded-2xl bg-gradient-to-br from-emerald-950 via-neutral-950 to-neutral-900 border-2 border-emerald-500/80 flex items-center justify-center shadow-2xl shadow-emerald-500/30">
            <span className="font-extrabold text-4xl sm:text-5xl text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-teal-200 to-emerald-300 tracking-tighter drop-shadow-md">
              FJ
            </span>
            <div className="absolute top-2 right-2 w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
          </div>
        </div>

        {/* Title & Brand */}
        <div className="space-y-1 mb-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[11px] font-mono font-bold tracking-widest uppercase">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            {glitchText}
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white drop-shadow-sm">
            Finance Journal Pro
          </h1>
          <p className="text-xs text-neutral-400 font-mono">
            Next-Gen Financial Intelligence & AI Voice System
          </p>
        </div>

        {/* Terminal Status Card */}
        <div className="w-full bg-neutral-950/90 border border-neutral-800 rounded-2xl p-4 mb-6 shadow-xl backdrop-blur-md text-left">
          <div className="flex items-center justify-between border-b border-neutral-800/80 pb-2 mb-3 text-[11px] font-mono text-neutral-400">
            <div className="flex items-center gap-2">
              <Terminal className="w-3.5 h-3.5 text-emerald-400" />
              <span>TERMINAL TELEMETRI KEAMANAN</span>
            </div>
            <span className="text-emerald-400 font-bold tabular-nums">
              {Math.min(100, Math.round(progress))}%
            </span>
          </div>

          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-neutral-900 border border-neutral-800 shrink-0">
              <CurrentIcon className={`w-5 h-5 ${steps[currentStepIndex].color} animate-pulse`} />
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-[10px] text-neutral-500 font-mono uppercase">Status Sekarang:</div>
              <div className="text-xs font-mono font-medium text-neutral-200 truncate">
                {steps[currentStepIndex].text}
              </div>
            </div>
          </div>

          {/* Futuristic Multi-Segment Progress Bar */}
          <div className="mt-4 space-y-1.5">
            <div className="w-full h-2 rounded-full bg-neutral-900 overflow-hidden p-0.5 border border-neutral-800">
              <div
                className="h-full rounded-full bg-gradient-to-r from-emerald-500 via-teal-400 to-emerald-300 transition-all duration-100 shadow-sm shadow-emerald-500"
                style={{ width: `${progress}%` }}
              />
            </div>
            <div className="flex items-center justify-between text-[10px] font-mono text-neutral-500">
              <span>STATUS: ONLINE</span>
              <span>STANDAR ENKRIPSI: SSL & BCRYPT 10-SALT</span>
            </div>
          </div>
        </div>

        {/* Action Skip Button (Bisa Langsung Masuk Kapan Saja) */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onFinish}
            className="group flex items-center gap-2 px-5 py-2.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 border border-neutral-700/80 text-neutral-200 text-xs font-semibold transition-all shadow-md hover:border-emerald-500/50 cursor-pointer active:scale-95"
          >
            <SkipForward className="w-3.5 h-3.5 text-emerald-400 group-hover:translate-x-0.5 transition-transform" />
            <span>Lewati Animasi & Masuk Langsung</span>
          </button>
        </div>

        <div className="text-[10px] text-neutral-500 font-mono mt-4">
          © 2026 Finance Journal Pro. Hak Cipta Terlindungi.
        </div>
      </div>
    </div>
  );
};
