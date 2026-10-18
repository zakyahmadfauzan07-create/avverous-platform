export type QuestionType = 'multiple_choice' | 'numeric';

export interface Question {
  id: number;
  type: QuestionType;
  stimulus?: string;
  stimulusTitle?: string;
  image?: string; // base64 data URL or http(s) URL
  question: string;
  options?: string[]; // A-E for multiple choice
  correctAnswer: string; // 'A'..'E' or numeric string
  explanation: ExplanationStep[];
}

export interface ExplanationStep {
  label: string;
  content: string;
  formula?: string;
}

export interface Subtest {
  id: number;
  name: string;
  shortName: string;
  description: string;
  durationMinutes: number;
  questions: Question[];
}

export type AnswerMap = Record<number, string>; // questionId -> answer
export type DoubtMap = Record<number, boolean>; // questionId -> ragu-ragu

export interface SubtestState {
  subtestId: number;
  answers: AnswerMap;
  doubts: DoubtMap;
  startedAt: number | null;
  ended: boolean;
}

export interface ExamProgress {
  packageId?: number;
  participantName: string;
  currentSubtestIndex: number;
  subtestStates: SubtestState[];
  completedSubtests: number[]; // subtest ids that are submitted
  examFinished: boolean;
}

export interface SubtestResult {
  subtestId: number;
  name: string;
  total: number;
  correct: number;
  wrong: number;
  empty: number;
  score: number;
}

export type Screen = 'landing' | 'auth' | 'packageSelection' | 'registration' | 'exam' | 'result' | 'discussion' | 'history' | 'historyDetail' | 'admin' | 'dashboard';

export interface PracticeQuestion {
  id: number;
  type: QuestionType;
  image?: string;
  question: string;
  options?: string[];
  correctAnswer: string;
  explanation: ExplanationStep[];
}

export interface LearningModule {
  id: number;
  title: string;
  category: string;
  content: string;
  order: number;
}

export interface TryoutResultRecord {
  id: number;
  userId?: string;
  packageId: number;
  packageName: string;
  participantName: string;
  completedAt: number;
  totalScore: number;
  subtestResults: SubtestResult[];
  answers: Record<number, string>;
  subtests: Subtest[];
}
