import { PracticeQuestion } from '@/types';

const STORAGE_KEY = 'utbk_practice_questions_v1';

const DEFAULT_PRACTICE: PracticeQuestion[] = [
  {
    id: 9001,
    type: 'multiple_choice',
    question:
      'Hasil dari 15% × 200 adalah ...',
    options: ['20', '30', '35', '40', '45'],
    correctAnswer: 'B',
    explanation: [
      { label: 'Hitung', content: '15% × 200 = 0,15 × 200 = 30.', formula: '0,15 × 200 = 30' },
      { label: 'Kesimpulan', content: 'Jawaban benar adalah B. 30.' },
    ],
  },
  {
    id: 9002,
    type: 'numeric',
    question: 'Akar kuadrat dari 144 adalah ...',
    correctAnswer: '12',
    explanation: [
      { label: 'Definisi', content: 'Akar kuadrat dari n adalah bilangan yang jika dikuadratkan menghasilkan n.' },
      { label: 'Hitung', content: '12 × 12 = 144.', formula: '√144 = 12' },
    ],
  },
];

export function loadPracticeQuestions(): PracticeQuestion[] {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (saved) {
    try {
      const parsed = JSON.parse(saved) as PracticeQuestion[];
      if (Array.isArray(parsed)) return parsed;
    } catch {
      // fall through
    }
  }
  return JSON.parse(JSON.stringify(DEFAULT_PRACTICE));
}

export function savePracticeQuestions(items: PracticeQuestion[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
}
