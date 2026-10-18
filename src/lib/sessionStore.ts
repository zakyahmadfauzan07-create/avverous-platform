import { ExamProgress } from '@/types';

const PREFIX = 'utbk_tryout_session_';

function key(packageId: number): string {
  return `${PREFIX}${packageId}`;
}

export function loadSession(packageId: number): ExamProgress | null {
  const raw = localStorage.getItem(key(packageId));
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as ExamProgress;
    if (parsed && typeof parsed.currentSubtestIndex === 'number') {
      if (parsed.examFinished) return null;
      return parsed;
    }
  } catch {
    // ignore corrupt data
  }
  return null;
}

export function saveSession(progress: ExamProgress): void {
  if (!progress.packageId) return;
  localStorage.setItem(key(progress.packageId), JSON.stringify(progress));
}

export function clearSession(packageId: number): void {
  localStorage.removeItem(key(packageId));
}

export interface SessionSummary {
  packageId: number;
  progress: ExamProgress;
  updatedAt: number;
}

export function loadAllSessions(): SessionSummary[] {
  const out: SessionSummary[] = [];
  for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i);
    if (!k || !k.startsWith(PREFIX)) continue;
    try {
      const parsed = JSON.parse(localStorage.getItem(k) || '') as ExamProgress;
      if (parsed && !parsed.examFinished) {
        out.push({ packageId: parsed.packageId, progress: parsed, updatedAt: 0 });
      }
    } catch {
      // ignore
    }
  }
  return out;
}
