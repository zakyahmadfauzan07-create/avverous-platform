import { Subtest, Question } from '@/types';

const pkQuestions: Question[] = [
  {
    id: 101,
    type: 'multiple_choice',
    question:
      'Sebuah toko memberi diskon 20% untuk semua barang. Sebuah sepatu dijual seharga Rp 400.000 setelah diskon. Berapakah harga awal sepatu tersebut?',
    options: ['Rp 480.000', 'Rp 500.000', 'Rp 520.000', 'Rp 560.000', 'Rp 600.000'],
    correctAnswer: 'B',
    explanation: [
      { label: 'Identifikasi data', content: 'Harga setelah diskon = Rp 400.000, diskon = 20%.' },
      {
        label: 'Rumus harga awal',
        content: 'Harga awal = Harga setelah diskon ÷ (1 − persen diskon)',
        formula: 'H_awal = 400.000 ÷ (1 − 0,20)',
      },
      { label: 'Substitusi & hitung', content: 'H_awal = 400.000 ÷ 0,80 = Rp 500.000.', formula: 'H_awal = 500.000' },
      { label: 'Kesimpulan', content: 'Jawaban benar adalah B. Rp 500.000.' },
    ],
  },
  {
    id: 102,
    type: 'numeric',
    question:
      'Sebuah barisan aritmetika memiliki suku pertama 4 dan beda 7. Berapakah suku ke-12 dari barisan tersebut?',
    correctAnswer: '81',
    explanation: [
      { label: 'Diketahui', content: 'a = 4, b = 7, n = 12.' },
      {
        label: 'Rumus suku ke-n',
        content: 'Suku ke-n barisan aritmetika:',
        formula: 'U_n = a + (n − 1) × b',
      },
      {
        label: 'Substitusi',
        content: 'U_12 = 4 + (12 − 1) × 7',
        formula: 'U_12 = 4 + 11 × 7 = 4 + 77 = 81',
      },
      { label: 'Kesimpulan', content: 'Suku ke-12 adalah 81.' },
    ],
  },
  {
    id: 103,
    type: 'multiple_choice',
    question:
      'Jika 3x + 5 = 23, maka nilai dari 5x − 4 adalah ...',
    options: ['21', '26', '31', '36', '41'],
    correctAnswer: 'B',
    explanation: [
      { label: 'Selesaikan persamaan', content: '3x + 5 = 23 → 3x = 18 → x = 6.', formula: 'x = 6' },
      { label: 'Substitusi ke ekspresi', content: '5x − 4 = 5(6) − 4 = 30 − 4 = 26.', formula: '5x − 4 = 26' },
      { label: 'Kesimpulan', content: 'Jawaban benar adalah B. 26.' },
    ],
  },
  {
    id: 104,
    type: 'multiple_choice',
    stimulus:
      'Sebuah kebun berbentuk persegi panjang memiliki keliling 60 meter. Lebar kebun tersebut adalah 10 meter.',
    stimulusTitle: 'Soal Keliling Persegi Panjang',
    question: 'Berapakah luas kebun tersebut (dalam m²)?',
    options: ['150', '200', '250', '300', '400'],
    correctAnswer: 'B',
    explanation: [
      { label: 'Diketahui', content: 'Keliling = 60 m, lebar (l) = 10 m.' },
      {
        label: 'Rumus keliling',
        content: 'Keliling = 2 × (p + l)',
        formula: '60 = 2 × (p + 10)',
      },
      { label: 'Cari panjang', content: 'p + 10 = 30 → p = 20 m.', formula: 'p = 20' },
      { label: 'Hitung luas', content: 'Luas = p × l = 20 × 10 = 200 m².', formula: 'Luas = 200 m²' },
      { label: 'Kesimpulan', content: 'Jawaban benar adalah B. 200 m².' },
    ],
  },
  {
    id: 105,
    type: 'numeric',
    question:
      'Suatu bilangan terdiri dari dua angka. Jumlah kedua angkanya adalah 9, dan jika kedua angka ditukar posisinya, bilangannya menjadi 27 lebih besar. Berapakah bilangan aslinya?',
    correctAnswer: '36',
    explanation: [
      {
        label: 'Misalkan bilangan',
        content: 'Bilangan asli = 10a + b, bilangan terbalik = 10b + a.',
      },
      {
        label: 'Kondisi 1 — jumlah angka',
        content: 'a + b = 9',
      },
      {
        label: 'Kondisi 2 — selisih',
        content: '(10b + a) − (10a + b) = 27 → 9b − 9a = 27 → b − a = 3.',
        formula: 'b − a = 3',
      },
      {
        label: 'Selesaikan sistem',
        content: 'a + b = 9 dan b − a = 3 → 2b = 12 → b = 6, a = 3.',
        formula: 'a = 3, b = 6',
      },
      { label: 'Bilangan asli', content: '10(3) + 6 = 36.', formula: '36' },
    ],
  },
];

const pmQuestions: Question[] = [
  {
    id: 201,
    type: 'multiple_choice',
    stimulus:
      'Sebuah perusahaan memproduksi mainan dengan biaya tetap Rp 2.000.000 per bulan dan biaya variabel Rp 5.000 per unit. Mainan dijual seharga Rp 15.000 per unit.',
    stimulusTitle: 'Analisis Titik Impas',
    question: 'Berapa unit mainan harus terjual agar perusahaan tepat impas (tidak rugi, tidak untung)?',
    options: ['100 unit', '150 unit', '200 unit', '250 unit', '300 unit'],
    correctAnswer: 'C',
    explanation: [
      {
        label: 'Diketahui',
        content: 'Biaya tetap (FC) = Rp 2.000.000, biaya variabel per unit (VC) = Rp 5.000, harga jual (P) = Rp 15.000.',
      },
      {
        label: 'Rumus titik impas',
        content: 'Titik impas tercapai saat total pendapatan = total biaya.',
        formula: 'P × Q = FC + VC × Q',
      },
      {
        label: 'Substitusi & selesaikan',
        content: '15.000Q = 2.000.000 + 5.000Q → 10.000Q = 2.000.000 → Q = 200.',
        formula: 'Q = 200 unit',
      },
      { label: 'Kesimpulan', content: 'Jawaban benar adalah C. 200 unit.' },
    ],
  },
  {
    id: 202,
    type: 'multiple_choice',
    question:
      'Jika 4 pekerja dapat menyelesaikan sebuah proyek dalam 12 hari, berapa hari yang dibutuhkan jika ditambah 2 pekerja lagi (total 6 pekerja) dengan kecepatan kerja yang sama?',
    options: ['6 hari', '7 hari', '8 hari', '9 hari', '10 hari'],
    correctAnswer: 'C',
    explanation: [
      {
        label: 'Hitung total pekerjaan',
        content: 'Total pekerjaan = pekerja × hari = 4 × 12 = 48 pekerja-hari.',
        formula: 'W = 4 × 12 = 48',
      },
      {
        label: 'Bagi dengan jumlah pekerja baru',
        content: 'Hari = 48 ÷ 6 = 8 hari.',
        formula: 't = 48 ÷ 6 = 8 hari',
      },
      { label: 'Kesimpulan', content: 'Jawaban benar adalah C. 8 hari.' },
    ],
  },
  {
    id: 203,
    type: 'numeric',
    question:
      'Sebuah dadu bersisi enam dilempar dua kali. Berapa peluang (dalam bentuk pecahan sederhana p/q) bahwa kedua lemparan menghasilkan angka yang sama? Tulis jawaban sebagai nilai p+q.',
    correctAnswer: '7',
    explanation: [
      {
        label: 'Total kemungkinan',
        content: 'Lebih dahulu, peluang kedua dadu sama = 6/36 = 1/6.',
      },
      {
        label: 'Tentukan p dan q',
        content: 'p = 1, q = 6 (pecahan paling sederhana).',
        formula: '1/6',
      },
      { label: 'Hitung p + q', content: 'p + q = 1 + 6 = 7.', formula: '7' },
    ],
  },
  {
    id: 204,
    type: 'multiple_choice',
    stimulus:
      'Sebuah bak air berbentuk silinder berisi air setinggi 60 cm. Kemudian sebuah bola logam dengan jari-jari 7 cm dimasukkan ke dalam bak (sepenuhnya terendam). Jari-jari bak = 14 cm.',
    stimulusTitle: 'Soal Penerapan Geometri',
    question: 'Berapakah kenaikan tinggi air di dalam bak? (π = 22/7)',
    options: ['2,33 cm', '3,50 cm', '5,25 cm', '7,00 cm', '10,50 cm'],
    correctAnswer: 'A',
    explanation: [
      {
        label: 'Volume bola',
        content: 'V_bola = (4/3)πr³ = (4/3)(22/7)(7³) = (4/3)(22/7)(343) = (4/3)(22)(49) = 4312/3 cm³.',
        formula: 'V_bola = (4/3) × (22/7) × 343 = 4312/3 cm³',
      },
      {
        label: 'Kenaikan air',
        content: 'Kenaikan = Volume bola ÷ luas alas bak = V / (πR²) = (4312/3) / ((22/7)×196) = (4312/3) / 616 = 4312 / 1848.',
        formula: 'Δh = (4312/3) ÷ 616 = 7/3 × ...',
      },
      {
        label: 'Sederhanakan',
        content: 'Δh = (4/3 × 343) / (196) = (4 × 343) / (3 × 196) = 1372 / 588 = 7/3 ≈ 2,33... ? Cek ulang: sebenarnya = 7/3 × 1 = 7/3 ≈ 2,33.',
      },
      { label: 'Hitung final', content: 'Δh = (4312/3) / 616 = 7/3 ≈ 2,33 cm.', formula: 'Δh ≈ 2,33 cm' },
      { label: 'Kesimpulan', content: 'Jawaban benar adalah A. 2,33 cm.' },
    ],
  },
  {
    id: 205,
    type: 'multiple_choice',
    question:
      'Jika log₂(x) + log₂(x − 2) = 3, maka nilai x yang memenuhi adalah ...',
    options: ['2', '3', '4', '5', '6'],
    correctAnswer: 'C',
    explanation: [
      {
        label: 'Sifat logaritma',
        content: 'log₂(x) + log₂(x − 2) = log₂(x(x − 2)) = log₂(x² − 2x).',
        formula: 'log₂(x² − 2x) = 3',
      },
      {
        label: 'Ubah ke bentuk eksponen',
        content: 'x² − 2x = 2³ = 8.',
        formula: 'x² − 2x − 8 = 0',
      },
      {
        label: 'Faktorkan',
        content: '(x − 4)(x + 2) = 0 → x = 4 atau x = −2.',
        formula: 'x = 4 atau x = −2',
      },
      {
        label: 'Syarat domain',
        content: 'log₂(x) terdefinisi jika x > 0 dan x − 2 > 0 → x > 2. Maka x = 4.',
      },
      { label: 'Kesimpulan', content: 'Jawaban benar adalah C. 4.' },
    ],
  },
];

export const SUBTESTS: Subtest[] = [
  {
    id: 1,
    name: 'Pengetahuan Kuantitatif',
    shortName: 'PK',
    description: 'Subtes yang mengukur kemampuan pemahaman dan penerapan konsep kuantitatif dasar.',
    durationMinutes: 5,
    questions: pkQuestions,
  },
  {
    id: 2,
    name: 'Penalaran Matematika',
    shortName: 'PM',
    description: 'Subtes yang mengukur kemampuan penalaran untuk menyelesaikan masalah matematis.',
    durationMinutes: 7,
    questions: pmQuestions,
  },
];

export function scoreSubtest(correct: number, total: number): number {
  return Math.round((correct / total) * 1000);
}

export interface TryoutPackage {
  id: number;
  name: string;
  description: string;
  subtests: Subtest[];
}

function cloneSubtests(): Subtest[] {
  return JSON.parse(JSON.stringify(SUBTESTS));
}

export const TRYOUT_PACKAGES: TryoutPackage[] = [
  {
    id: 1,
    name: 'Paket Tryout 1',
    description: 'Paket dasar berisi subtes Pengetahuan Kuantitatif & Penalaran Matematika.',
    subtests: cloneSubtests(),
  },
  {
    id: 2,
    name: 'Paket Tryout 2',
    description: 'Paket latihan tambahan dengan kumpulan soal setara untuk memperdalam pemahaman.',
    subtests: cloneSubtests(),
  },
  {
    id: 3,
    name: 'Paket Tryout 3',
    description: 'Paket simulasi lanjutan untuk menguji kesiapan menjelang ujian sebenarnya.',
    subtests: cloneSubtests(),
  },
];
