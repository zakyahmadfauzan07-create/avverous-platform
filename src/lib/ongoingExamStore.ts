import { supabase } from '@/lib/supabase';
import type { ExamProgress, Subtest, SubtestState } from '@/types';

export interface OngoingExamRow {
  user_id: string;
  paket_id: string;
  subtest_id: string;
  answers: StoredExamState;
  time_remaining: number;
  updated_at: string;
}

export interface StoredExamState {
  currentSubtestIndex: number;
  currentQuestionIndex: number;
  completedSubtests: number[];
  subtestStates: {
    subtestId: number;
    answers: Record<number, string>;
    doubts: Record<number, boolean>;
    ended: boolean;
  }[];
}

export interface OngoingExamSnapshot {
  paketId: string;
  subtestId: string;
  state: StoredExamState;
  timeRemaining: number;
  updatedAt: number;
}

function rowToSnapshot(row: OngoingExamRow): OngoingExamSnapshot {
  return {
    paketId: row.paket_id,
    subtestId: row.subtest_id,
    state: row.answers ?? ({} as StoredExamState),
    timeRemaining: row.time_remaining ?? 0,
    updatedAt: new Date(row.updated_at).getTime(),
  };
}

function snapshotFromProgress(
  progress: ExamProgress,
  currentQuestionIndex: number,
  timeRemaining: number,
): { paket_id: string; subtest_id: string; answers: StoredExamState; time_remaining: number } {
  const currentSubtest = progress.subtestStates[progress.currentSubtestIndex];
  return {
    paket_id: String(progress.packageId ?? ''),
    subtest_id: currentSubtest ? String(currentSubtest.subtestId) : '',
    answers: {
      currentSubtestIndex: progress.currentSubtestIndex,
      currentQuestionIndex,
      completedSubtests: progress.completedSubtests,
      subtestStates: progress.subtestStates.map((s) => ({
        subtestId: s.subtestId,
        answers: s.answers,
        doubts: s.doubts,
        ended: s.ended,
      })),
    },
    time_remaining: Math.max(0, Math.floor(timeRemaining)),
  };
}

export async function upsertOngoingExam(
  userId: string,
  progress: ExamProgress,
  currentQuestionIndex: number,
  timeRemaining: number,
): Promise<void> {
  if (!userId || progress.packageId == null) return;
  const payload = snapshotFromProgress(progress, currentQuestionIndex, timeRemaining);
  if (!payload.paket_id) return;
  const { error } = await supabase.from('ongoing_exams').upsert(
    {
      user_id: userId,
      paket_id: payload.paket_id,
      subtest_id: payload.subtest_id,
      answers: payload.answers,
      time_remaining: payload.time_remaining,
    },
    { onConflict: 'user_id,paket_id' },
  );
  if (error) throw error;
}

export async function fetchOngoingExam(
  userId: string,
  paketId: string | number,
): Promise<OngoingExamSnapshot | null> {
  const { data, error } = await supabase
    .from('ongoing_exams')
    .select('*')
    .eq('user_id', userId)
    .eq('paket_id', String(paketId))
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;
  return rowToSnapshot(data as OngoingExamRow);
}

export async function deleteOngoingExam(
  userId: string,
  paketId: string | number,
): Promise<void> {
  const { error } = await supabase
    .from('ongoing_exams')
    .delete()
    .eq('user_id', userId)
    .eq('paket_id', String(paketId));
  if (error) throw error;
}

export async function fetchAllOngoingExams(userId: string): Promise<OngoingExamSnapshot[]> {
  const { data, error } = await supabase
    .from('ongoing_exams')
    .select('*')
    .eq('user_id', userId)
    .order('updated_at', { ascending: false });
  if (error) throw error;
  if (!data) return [];
  return (data as OngoingExamRow[]).map(rowToSnapshot);
}

/**
 * Rebuild an ExamProgress from a stored snapshot so the student can resume
 * on any device. The active subtest's timer is reconstructed from the
 * server's time_remaining so it picks up exactly where it left off.
 */
export function buildProgressFromSnapshot(
  snapshot: OngoingExamSnapshot,
  packageId: number,
  participantName: string,
  subtests: Subtest[],
): ExamProgress | null {
  const state = snapshot.state;
  if (!subtests.length || !state || !Array.isArray(state.subtestStates)) return null;

  const subtestStates: SubtestState[] = subtests.map((st, idx) => {
    const stored = state.subtestStates.find((s) => s.subtestId === st.id);
    const isCurrent = idx === state.currentSubtestIndex;
    let startedAt: number | null = null;
    if (isCurrent && !stored?.ended) {
      // Reconstruct startedAt so that now - startedAt yields the elapsed time,
      // i.e. remaining == snapshot.timeRemaining.
      const totalSeconds = st.durationMinutes * 60;
      const elapsed = Math.max(0, totalSeconds - snapshot.timeRemaining);
      startedAt = Date.now() - elapsed * 1000;
    }
    return {
      subtestId: st.id,
      answers: stored?.answers ?? {},
      doubts: stored?.doubts ?? {},
      startedAt,
      ended: stored?.ended ?? false,
    };
  });

  const currentSubtestIndex = Math.min(
    Math.max(0, state.currentSubtestIndex ?? 0),
    subtests.length - 1,
  );

  return {
    packageId,
    participantName,
    currentSubtestIndex,
    subtestStates,
    completedSubtests: state.completedSubtests ?? [],
    examFinished: false,
  };
}

export function getInitialQuestionIndex(snapshot: OngoingExamSnapshot): number {
  const idx = snapshot.state?.currentQuestionIndex ?? 0;
  return Math.max(0, idx);
}
