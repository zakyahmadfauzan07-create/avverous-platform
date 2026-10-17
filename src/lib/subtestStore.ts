import { Subtest, Question } from '@/types';
import { SUBTESTS as DEFAULT_SUBTESTS, scoreSubtest as defaultScoreSubtest } from '@/data/questions';

const STORAGE_KEY = 'utbk_subtests_v1';

export function loadSubtests(): Subtest[] {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (saved) {
    try {
      const parsed = JSON.parse(saved) as Subtest[];
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    } catch {
      // fall through to default
    }
  }
  // deep clone defaults so mutations don't affect the source
  return JSON.parse(JSON.stringify(DEFAULT_SUBTESTS));
}

export function saveSubtests(subtests: Subtest[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(subtests));
}

export function resetToDefault(): Subtest[] {
  localStorage.removeItem(STORAGE_KEY);
  return JSON.parse(JSON.stringify(DEFAULT_SUBTESTS));
}

export function generateId(): number {
  return Date.now() + Math.floor(Math.random() * 1000);
}

export { defaultScoreSubtest as scoreSubtest };
