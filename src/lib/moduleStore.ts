import { LearningModule } from '@/types';

const STORAGE_KEY = 'utbk_learning_modules_v1';

const DEFAULT_MODULES: LearningModule[] = [
  {
    id: 7001,
    title: 'Rumus Cepat Pengetahuan Kuantitatif',
    category: 'Pengetahuan Kuantitatif',
    content:
      'Persentase: a% × n = (a/100) × n.\nDiskon: Harga akhir = Harga awal × (1 − %diskon).\nBarisan aritmetika: U_n = a + (n − 1) × b.',
    order: 1,
  },
  {
    id: 7002,
    title: 'Tips Penalaran Matematika',
    category: 'Penalaran Matematika',
    content:
      'Pecah masalah menjadi langkah kecil.\nTuliskan yang diketahui dan ditanya.\nPeriksa kembali satuan dan syarat domain (mis. logaritma > 0).',
    order: 2,
  },
];

export function loadModules(): LearningModule[] {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (saved) {
    try {
      const parsed = JSON.parse(saved) as LearningModule[];
      if (Array.isArray(parsed)) return parsed;
    } catch {
      // fall through
    }
  }
  return JSON.parse(JSON.stringify(DEFAULT_MODULES));
}

export function saveModules(items: LearningModule[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
}
