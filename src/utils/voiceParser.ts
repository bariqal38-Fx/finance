/**
 * Parser Cerdas Bahasa Indonesia untuk Voice Transaksi
 * Mengubah ucapan suara (speech-to-text) menjadi Nominal (Amount) dan Keterangan (Description).
 */

// Peta kata angka satuan dan belasan dalam Bahasa Indonesia
const WORDS_TO_NUM: Record<string, number> = {
  nol: 0,
  kosong: 0,
  satu: 1,
  se: 1, // untuk sepuluh, seratus, seribu, sejuta
  dua: 2,
  tiga: 3,
  empat: 4,
  lima: 5,
  enam: 6,
  tujuh: 7,
  delapan: 8,
  sembilan: 9,
  sepuluh: 10,
  sebelas: 11,
  duabelas: 12,
  tigabelas: 13,
  empatbelas: 14,
  limabelas: 15,
  enambelas: 16,
  tujuhbelas: 17,
  delapanbelas: 18,
  sembilanbelas: 19,
  seratus: 100,
  seribu: 1000,
  sejuta: 1000000,
  setengah: 0.5,
};

/**
 * Konversi teks kata angka bahasa Indonesia menjadi nilai angka murni.
 * Contoh: "dua puluh lima ribu" -> 25000
 * Contoh: "tiga juta lima ratus ribu" -> 3500000
 * Contoh: "seratus lima puluh ribu" -> 150000
 */
export function parseIndonesianSpokenNumber(text: string): number | null {
  const clean = text
    .toLowerCase()
    .replace(/rp\.?/g, '')
    .replace(/rupiah/g, '')
    .trim();

  // 1. Cek pola angka langsung dengan satuan: "50rb", "50 ribu", "2.5 juta", "2,5jt", "100k"
  const directPattern = /(\d+(?:[.,]\d+)?)\s*(k|rb|ribu|jt|juta|m|miliar)?/i;
  const directMatch = clean.match(directPattern);

  if (directMatch && directMatch[2]) {
    const base = parseFloat(directMatch[1].replace(',', '.'));
    const unit = directMatch[2].toLowerCase();
    if (unit === 'k' || unit === 'rb' || unit === 'ribu') {
      return base * 1000;
    }
    if (unit === 'jt' || unit === 'juta') {
      return base * 1000000;
    }
    if (unit === 'm' || unit === 'miliar') {
      return base * 1000000000;
    }
  }

  // 2. Parser kata-kata numerik bertingkat
  // Contoh: "seratus lima puluh ribu" -> 150000
  // Contoh: "tiga juta dua ratus lima puluh ribu" -> 3250000
  const tokens = clean.split(/\s+/);
  let total = 0;
  let currentUnit = 0;
  let currentGroup = 0;
  let hasNumber = false;

  for (let i = 0; i < tokens.length; i++) {
    const t = tokens[i];

    if (t === 'setengah') {
      currentUnit = 0.5;
      hasNumber = true;
    } else if (WORDS_TO_NUM[t] !== undefined) {
      if (t === 'seratus') {
        currentGroup += 100;
      } else if (t === 'seribu') {
        total += 1000;
      } else if (t === 'sejuta') {
        total += 1000000;
      } else {
        currentUnit = WORDS_TO_NUM[t];
      }
      hasNumber = true;
    } else if (t === 'belas') {
      currentGroup += (currentUnit || 1) + 10;
      currentUnit = 0;
      hasNumber = true;
    } else if (t === 'puluh') {
      currentGroup += (currentUnit || 1) * 10;
      currentUnit = 0;
      hasNumber = true;
    } else if (t === 'ratus') {
      currentGroup += (currentUnit || 1) * 100;
      currentUnit = 0;
      hasNumber = true;
    } else if (t === 'ribu') {
      currentGroup += currentUnit;
      if (currentGroup === 0) currentGroup = 1;
      total += currentGroup * 1000;
      currentGroup = 0;
      currentUnit = 0;
      hasNumber = true;
    } else if (t === 'juta') {
      currentGroup += currentUnit;
      if (currentGroup === 0) currentGroup = 1;
      total += currentGroup * 1000000;
      currentGroup = 0;
      currentUnit = 0;
      hasNumber = true;
    } else if (t === 'miliar' || t === 'milyar') {
      currentGroup += currentUnit;
      if (currentGroup === 0) currentGroup = 1;
      total += currentGroup * 1000000000;
      currentGroup = 0;
      currentUnit = 0;
      hasNumber = true;
    } else {
      const parsedNum = parseFloat(t.replace(/\./g, '').replace(/,/g, '.'));
      if (!isNaN(parsedNum)) {
        currentUnit = parsedNum;
        hasNumber = true;
      }
    }
  }

  total += currentGroup + currentUnit;

  if (hasNumber && total > 0) {
    return total;
  }

  // Cek apakah ada angka numerik langsung (misal: "25000" atau "25.000")
  const rawNumPattern = /\b(\d{1,3}(?:[.,]\d{3})*|\d+)\b/;
  const rawNumMatch = clean.match(rawNumPattern);
  if (rawNumMatch) {
    const cleanNum = rawNumMatch[1].replace(/[.,]/g, '');
    const num = parseFloat(cleanNum);
    if (!isNaN(num) && num > 0) return num;
  }

  return null;
}

/**
 * Ekstraksi Deskripsi & Nominal dari Teks Ucapan Suara
 */
export function parseVoiceTransaction(transcript: string, fallbackType: 'pemasukan' | 'pengeluaran' = 'pengeluaran'): {
  amount: number;
  description: string;
  type: 'pemasukan' | 'pengeluaran';
} {
  const text = transcript.trim();
  const lower = text.toLowerCase();

  // 1. Tentukan jenis transaksi jika terdeteksi dalam ucapan
  let type = fallbackType;
  if (
    lower.includes('pemasukan') ||
    lower.includes('masuk') ||
    lower.includes('gaji') ||
    lower.includes('dapat uang') ||
    lower.includes('dapat duit') ||
    lower.includes('bonus') ||
    lower.includes('jual') ||
    lower.includes('transfer dari')
  ) {
    type = 'pemasukan';
  } else if (
    lower.includes('pengeluaran') ||
    lower.includes('keluar') ||
    lower.includes('beli') ||
    lower.includes('bayar') ||
    lower.includes('makan') ||
    lower.includes('ongkir') ||
    lower.includes('bensin') ||
    lower.includes('jajan')
  ) {
    type = 'pengeluaran';
  }

  // 2. Ekstraksi Nominal
  const parsedAmount = parseIndonesianSpokenNumber(text) || 0;

  // 3. Bersihkan Deskripsi dari kata-kata nominal & trigger
  // Hapus kata-kata angka dan kata umum agar deskripsi rapi
  const wordsToRemove = [
    'rp',
    'rupiah',
    'sebesar',
    'seharga',
    'senilai',
    'total',
    'totalnya',
    'sebanyak',
    'angka',
    'nominal',
    'pemasukan',
    'pengeluaran',
    'catat',
    'catatkan',
    'tulis',
    'masukkan',
    'tolong',
    'ribu',
    'juta',
    'miliar',
    'ratus',
    'puluh',
    'belas',
    'satu',
    'dua',
    'tiga',
    'empat',
    'lima',
    'enam',
    'tujuh',
    'delapan',
    'sembilan',
    'sepuluh',
    'sebelas',
    'seratus',
    'seribu',
    'sejuta',
    'setengah',
  ];

  let cleanedWords = text.split(/\s+/).filter((w) => {
    const cleanWord = w.toLowerCase().replace(/[^a-z0-9]/g, '');
    // Jangan buang jika bukan kata angka murni dan bukan angka
    if (/^\d+$/.test(cleanWord)) return false;
    if (wordsToRemove.includes(cleanWord)) return false;
    return true;
  });

  let description = cleanedWords.join(' ').trim();

  // Jika setelah dibersihkan deskripsinya kosong, berikan default yang pantas
  if (!description || description.length < 2) {
    description = type === 'pemasukan' ? 'Pemasukan (Voice)' : 'Pengeluaran (Voice)';
  } else {
    // Huruf kapital di awal
    description = description.charAt(0).toUpperCase() + description.slice(1);
  }

  return {
    amount: parsedAmount,
    description,
    type,
  };
}
