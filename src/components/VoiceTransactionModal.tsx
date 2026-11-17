import React, { useState, useEffect, useRef } from 'react';
import {
  Mic,
  MicOff,
  X,
  CheckCircle2,
  AlertCircle,
  Volume2,
  Sparkles,
  ArrowRight,
  RotateCcw,
  Wallet,
  TrendingDown,
  TrendingUp,
  ExternalLink,
} from 'lucide-react';
import { TransactionType } from '../types';
import { parseVoiceTransaction } from '../utils/voiceParser';
import { formatRupiah } from '../utils/formatters';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  initialType: TransactionType;
  onSave: (data: {
    description: string;
    amount: number;
    type: TransactionType;
    transaction_date: string;
  }) => Promise<void>;
}

// Deklarasi tipe Web Speech API
declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}

export const VoiceTransactionModal: React.FC<Props> = ({
  isOpen,
  onClose,
  initialType,
  onSave,
}) => {
  const [txType, setTxType] = useState<TransactionType>(initialType);
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [amount, setAmount] = useState<number>(0);
  const [description, setDescription] = useState('');
  const [date, setDate] = useState<string>(() => new Date().toISOString().split('T')[0]);
  const [isSupported, setIsSupported] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [hasParsed, setHasParsed] = useState(false);

  const recognitionRef = useRef<any>(null);

  // Inisialisasi saat modal dibuka
  useEffect(() => {
    if (isOpen) {
      setTxType(initialType);
      setTranscript('');
      setAmount(0);
      setDescription('');
      setErrorMsg(null);
      setHasParsed(false);
      setDate(new Date().toISOString().split('T')[0]);

      // Cek dukungan Web Speech API
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (!SpeechRecognition) {
        setIsSupported(false);
      } else {
        setIsSupported(true);
      }
    } else {
      stopListening();
    }

    return () => {
      stopListening();
    };
  }, [isOpen, initialType]);

  const startListening = async (currentType: TransactionType) => {
    setErrorMsg(null);

    // Minta izin mikrofon getUserMedia eksplisit via aksi klik pengguna
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        stream.getTracks().forEach((track) => track.stop());
      } catch (micErr: any) {
        console.warn('getUserMedia mic error:', micErr);
        if (micErr.name === 'NotAllowedError' || micErr.name === 'PermissionDeniedError') {
          setErrorMsg('Izin mikrofon belum diberikan. Silakan izinkan akses mikrofon di browser Anda melalui ikon gembok pada bilah alamat.');
          setIsListening(false);
          return;
        }
      }
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setIsSupported(false);
      setErrorMsg('Browser Anda belum mendukung Speech Recognition. Anda dapat mengetik teks ucapan langsung di bawah.');
      return;
    }

    try {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }

      const recognition = new SpeechRecognition();
      recognition.lang = 'id-ID'; // Bahasa Indonesia
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.maxAlternatives = 1;

      recognition.onstart = () => {
        setIsListening(true);
        setErrorMsg(null);
      };

      recognition.onresult = (event: any) => {
        let currentTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          currentTranscript += event.results[i][0].transcript;
        }
        setTranscript(currentTranscript);

        // Langsung parse jika sudah ada hasil
        const parsed = parseVoiceTransaction(currentTranscript, currentType);
        if (parsed.amount > 0) {
          setAmount(parsed.amount);
        }
        if (parsed.description) {
          setDescription(parsed.description);
        }
        setHasParsed(true);
      };

      recognition.onerror = (event: any) => {
        console.warn('Speech Recognition error:', event.error);
        setIsListening(false);
        if (event.error === 'not-allowed') {
          setErrorMsg('Izin mikrofon tidak diberikan. Silakan izinkan akses mikrofon di browser Anda.');
        } else if (event.error === 'no-speech') {
          setErrorMsg('Suara tidak terdengar. Silakan tekan tombol mikrofon dan bicara lagi.');
        } else {
          setErrorMsg(`Pesan suara: ${event.error}`);
        }
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (err: any) {
      console.error('Error starting recognition:', err);
      setIsListening(false);
    }
  };

  const stopListening = () => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.abort();
      } catch {
        // Abaikan jika sudah berhenti
      }
      recognitionRef.current = null;
    }
    setIsListening(false);
  };

  const handleManualTranscriptChange = (text: string) => {
    setTranscript(text);
    const parsed = parseVoiceTransaction(text, txType);
    if (parsed.amount > 0) setAmount(parsed.amount);
    if (parsed.description) setDescription(parsed.description);
    setHasParsed(true);
  };

  const handleSaveTransaction = async () => {
    if (!amount || amount <= 0) {
      setErrorMsg('Nominal belum terdeteksi. Silakan sebutkan angka atau isi nominal secara manual.');
      return;
    }
    if (!description.trim()) {
      setErrorMsg('Keterangan transaksi belum diisi.');
      return;
    }

    setSaving(true);
    setErrorMsg(null);
    try {
      await onSave({
        amount,
        description: description.trim(),
        type: txType,
        transaction_date: date,
      });
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'Gagal menyimpan transaksi.');
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  const isIncome = txType === 'pemasukan';
  const themeColor = isIncome ? 'emerald' : 'rose';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-lg bg-neutral-900 border border-neutral-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header Modal */}
        <div
          className={`p-5 border-b border-neutral-800 flex items-center justify-between ${
            isIncome ? 'bg-emerald-950/20' : 'bg-rose-950/20'
          }`}
        >
          <div className="flex items-center gap-3">
            <div
              className={`w-10 h-10 rounded-2xl flex items-center justify-center ${
                isIncome
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                  : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
              }`}
            >
              <Mic className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span
                  className={`text-[11px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                    isIncome
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                      : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                  }`}
                >
                  {isIncome ? '🟢 AI Voice Pemasukan' : '🔴 AI Voice Pengeluaran'}
                </span>
                <span className="text-[11px] text-neutral-400 font-mono">Bahasa Indonesia</span>
              </div>
              <h2 className="text-base font-bold text-neutral-100 mt-0.5">
                {isIncome ? 'Bicara untuk Catat Pemasukan' : 'Bicara untuk Catat Pengeluaran'}
              </h2>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-neutral-800 hover:bg-neutral-700 text-neutral-400 hover:text-neutral-200 flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1">
          {/* Banner Buka Tab Penuh untuk Memunculkan Popup Izin Chrome */}
          <div className="p-3.5 rounded-2xl bg-gradient-to-r from-blue-950/70 via-indigo-950/60 to-purple-950/70 border border-blue-500/30 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-md">
            <div className="flex items-start sm:items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center shrink-0 mt-0.5 sm:mt-0">
                <ExternalLink className="w-4 h-4" />
              </div>
              <div>
                <div className="font-bold text-white flex items-center gap-1.5">
                  <span>Memunculkan Popup Izin Mikrofon Google</span>
                  <span className="text-[10px] px-1.5 py-0.2 rounded bg-blue-500/30 text-blue-200">Chrome</span>
                </div>
                <p className="text-[11px] text-blue-200/80 mt-0.5 leading-snug">
                  Jika popup Google <em>"Allow while visiting the site"</em> belum muncul di frame ini, buka di tab baru agar Chrome langsung menampilkannya.
                </p>
              </div>
            </div>
            <a
              href={window.location.href}
              target="_blank"
              rel="noopener noreferrer"
              className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs whitespace-nowrap transition-colors flex items-center justify-center gap-1.5 shadow-md shadow-blue-600/30 shrink-0 cursor-pointer"
            >
              <span>Buka Tab Baru</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>

          {/* Audio Visualizer & Mic Button */}
          <div className="flex flex-col items-center justify-center py-3 text-center">
            <div className="relative mb-4">
              {/* Pulsing rings when listening */}
              {isListening && (
                <>
                  <div
                    className={`absolute inset-0 rounded-full animate-ping opacity-30 ${
                      isIncome ? 'bg-emerald-500' : 'bg-rose-500'
                    }`}
                  />
                  <div
                    className={`absolute -inset-4 rounded-full animate-pulse opacity-20 ${
                      isIncome ? 'bg-emerald-400' : 'bg-rose-400'
                    }`}
                  />
                </>
              )}

              <button
                type="button"
                onClick={() => {
                  if (isListening) {
                    stopListening();
                  } else {
                    startListening(txType);
                  }
                }}
                className={`relative w-24 h-24 rounded-full flex flex-col items-center justify-center shadow-xl transition-all cursor-pointer ${
                  isListening
                    ? isIncome
                      ? 'bg-emerald-500 text-neutral-950 ring-4 ring-emerald-500/40 scale-105'
                      : 'bg-rose-500 text-white ring-4 ring-rose-500/40 scale-105'
                    : isIncome
                    ? 'bg-neutral-800 hover:bg-neutral-700 text-emerald-400 border border-emerald-500/40'
                    : 'bg-neutral-800 hover:bg-neutral-700 text-rose-400 border border-rose-500/40'
                }`}
              >
                {isListening ? (
                  <>
                    <Mic className="w-8 h-8 animate-bounce" />
                    <span className="text-[10px] font-bold uppercase mt-1">Mendengar</span>
                  </>
                ) : (
                  <>
                    <MicOff className="w-8 h-8 opacity-70" />
                    <span className="text-[10px] font-medium mt-1">Klik Bicara</span>
                  </>
                )}
              </button>
            </div>

            {/* Sound Wave Bars Simulation */}
            {isListening && (
              <div className="flex items-center gap-1.5 h-6 mb-2">
                {[40, 70, 90, 60, 100, 75, 45, 80, 50].map((h, i) => (
                  <div
                    key={i}
                    className={`w-1 rounded-full animate-pulse ${
                      isIncome ? 'bg-emerald-400' : 'bg-rose-400'
                    }`}
                    style={{
                      height: `${h}%`,
                      animationDelay: `${i * 0.15}s`,
                    }}
                  />
                ))}
              </div>
            )}

            <p className="text-xs text-neutral-300 font-medium max-w-xs">
              {isListening
                ? 'Silakan berbicara sekarang... Sebutkan nominal & keperluan Anda.'
                : 'Mikrofon berhenti. Tekan tombol di atas untuk berbicara kembali.'}
            </p>
            <p className="text-[11px] text-neutral-500 mt-1">
              Contoh ucapan:{' '}
              <span className="text-neutral-400 italic font-mono">
                {isIncome
                  ? '"Gaji bulanan lima juta lima ratus ribu rupiah"'
                  : '"Makan siang nasi padang dua puluh lima ribu"'}
              </span>
            </p>

            {/* Quick Example Chips */}
            <div className="mt-3 w-full">
              <div className="text-[10px] text-neutral-400 mb-1.5 font-medium">
                Atau coba klik contoh ucapan cepat:
              </div>
              <div className="flex flex-wrap items-center justify-center gap-1.5">
                {(isIncome
                  ? [
                      'Gaji bulanan 5 juta',
                      'Bonus proyek 1.5 juta',
                      'Jual pakaian 150 ribu',
                      'Transfer masuk 500 ribu',
                    ]
                  : [
                      'Makan siang 25 ribu',
                      'Beli bensin 30 ribu',
                      'Bayar kos 1.2 juta',
                      'Kopi susu 18 ribu',
                    ]
                ).map((example, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleManualTranscriptChange(example)}
                    className="px-2.5 py-1 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-[11px] transition-colors border border-neutral-700/60 cursor-pointer"
                  >
                    "{example}"
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Transcript Live Box */}
          <div className="bg-neutral-950/80 border border-neutral-800 rounded-2xl p-4">
            <div className="flex items-center justify-between text-[11px] text-neutral-400 mb-2">
              <span className="flex items-center gap-1.5 font-medium">
                <Volume2 className="w-3.5 h-3.5 text-neutral-500" />
                Ucapan Suara yang Terdeteksi:
              </span>
              {transcript && (
                <button
                  type="button"
                  onClick={() => {
                    setTranscript('');
                    startListening(txType);
                  }}
                  className="text-neutral-500 hover:text-neutral-300 transition-colors flex items-center gap-1"
                >
                  <RotateCcw className="w-3 h-3" /> Ulangi
                </button>
              )}
            </div>

            <textarea
              rows={2}
              value={transcript}
              onChange={(e) => handleManualTranscriptChange(e.target.value)}
              placeholder="Ucapan Anda akan otomatis tertulis di sini... (Atau Anda bisa ketik langsung)"
              className="w-full bg-transparent text-xs text-neutral-200 placeholder-neutral-600 focus:outline-hidden resize-none"
            />
          </div>

          {/* Error Notice & Permission Guide */}
          {errorMsg && (
            <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs space-y-2">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-400 mt-0.5" />
                <div className="font-semibold">{errorMsg}</div>
              </div>
              <div className="pl-6 text-[11px] text-neutral-300 space-y-1 bg-neutral-900/60 p-2.5 rounded-xl border border-neutral-800/80">
                <p className="font-semibold text-neutral-200">💡 Cara Mengizinkan Mikrofon di Browser:</p>
                <p>1. Klik ikon 🔒 <strong>Gembok / Izin Situs</strong> di bilah alamat URL atas browser.</p>
                <p>2. Ubah izin <strong>Mikrofon (Microphone)</strong> menjadi <strong>"Izinkan" (Allow)</strong>.</p>
                <p>3. Muat ulang halaman, lalu tekan kembali tombol <strong>Klik Bicara</strong>.</p>
                <p className="text-neutral-400 pt-1">
                  *Tips: Anda juga dapat langsung mengetik atau memilih contoh cepat di atas tanpa mikrofon.
                </p>
              </div>
            </div>
          )}

          {/* Smart AI Extracted Form Confirmation */}
          <div className="bg-neutral-950 border border-neutral-800 rounded-2xl p-4 space-y-4">
            <div className="flex items-center justify-between border-b border-neutral-800/80 pb-3">
              <div className="flex items-center gap-2">
                <Sparkles
                  className={`w-4 h-4 ${isIncome ? 'text-emerald-400' : 'text-rose-400'}`}
                />
                <span className="text-xs font-semibold text-neutral-200">
                  Hasil Analisis AI Transaksi
                </span>
              </div>

              {/* Toggle Jenis Transaksi */}
              <div className="flex items-center bg-neutral-900 rounded-lg p-0.5 border border-neutral-800 text-[11px]">
                <button
                  type="button"
                  onClick={() => setTxType('pemasukan')}
                  className={`px-2.5 py-1 rounded-md font-medium transition-colors cursor-pointer ${
                    txType === 'pemasukan'
                      ? 'bg-emerald-500 text-neutral-950 font-bold'
                      : 'text-neutral-400 hover:text-neutral-200'
                  }`}
                >
                  Pemasukan
                </button>
                <button
                  type="button"
                  onClick={() => setTxType('pengeluaran')}
                  className={`px-2.5 py-1 rounded-md font-medium transition-colors cursor-pointer ${
                    txType === 'pengeluaran'
                      ? 'bg-rose-500 text-white font-bold'
                      : 'text-neutral-400 hover:text-neutral-200'
                  }`}
                >
                  Pengeluaran
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Input Nominal */}
              <div>
                <label className="block text-[11px] font-medium text-neutral-400 mb-1">
                  Nominal (Rp)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-xs font-bold text-neutral-400">
                    Rp
                  </span>
                  <input
                    type="number"
                    min="1"
                    step="any"
                    value={amount || ''}
                    onChange={(e) => setAmount(parseFloat(e.target.value) || 0)}
                    placeholder="0"
                    className="w-full pl-9 pr-3 py-2 bg-neutral-900 border border-neutral-800 focus:border-neutral-500 rounded-xl text-xs font-bold text-neutral-100 placeholder-neutral-600 focus:outline-hidden"
                  />
                </div>
                {amount > 0 && (
                  <p className="text-[10px] text-emerald-400 font-mono mt-1">
                    {formatRupiah(amount)}
                  </p>
                )}
              </div>

              {/* Input Tanggal */}
              <div>
                <label className="block text-[11px] font-medium text-neutral-400 mb-1">
                  Tanggal Transaksi
                </label>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full px-3 py-2 bg-neutral-900 border border-neutral-800 focus:border-neutral-500 rounded-xl text-xs text-neutral-100 focus:outline-hidden"
                />
              </div>
            </div>

            {/* Input Keterangan */}
            <div>
              <label className="block text-[11px] font-medium text-neutral-400 mb-1">
                Keterangan / Keperluan
              </label>
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Contoh: Makan siang nasi padang, Gaji bulanan..."
                className="w-full px-3 py-2 bg-neutral-900 border border-neutral-800 focus:border-neutral-500 rounded-xl text-xs text-neutral-100 placeholder-neutral-600 focus:outline-hidden"
              />
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-neutral-800 bg-neutral-950/80 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-xs font-medium transition-colors cursor-pointer"
          >
            Batal
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                setTranscript('');
                setAmount(0);
                setDescription('');
                startListening(txType);
              }}
              className="px-3.5 py-2.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-xs font-medium transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Bicara Ulang
            </button>

            <button
              type="button"
              disabled={saving || !amount || amount <= 0 || !description.trim()}
              onClick={handleSaveTransaction}
              className={`px-5 py-2.5 rounded-xl font-semibold text-xs transition-all flex items-center gap-2 shadow-lg disabled:opacity-40 cursor-pointer ${
                isIncome
                  ? 'bg-emerald-500 hover:bg-emerald-400 text-neutral-950 shadow-emerald-500/20'
                  : 'bg-rose-500 hover:bg-rose-400 text-white shadow-rose-500/20'
              }`}
            >
              {saving ? (
                'Menyimpan...'
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  Simpan Transaksi Sekarang
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
