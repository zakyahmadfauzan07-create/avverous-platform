import { supabase } from '@/lib/supabase';
import type { ExamProgress } from '@/types';

export interface OngoingExamRow {
  user_id: string;
  paket_id: string;
  subtest_id: string;
  answers: Record<string, { answer?: string; doubt?: boolean }>;
  time_remaining: number;
  updated_at: string;
}

export interface OngoingExamSnapshot {
  paketId: string;
  subtestId: string;
  answers: Record<string, { answer?: string; doubt?: boolean }>;
  timeRemaining: number;
  updatedAt: number;
}

function rowToSnapshot(row: OngoingExamRow): OngoingExamSnapshot {
  return {
    paketId: row.paket_id,
    subtestId: row.subtest_id,
    answers: row.answers ?? {},
    timeRemaining: row.time_remaining ?? 0,
    updatedAt: new Date(row.updated_at).getTime(),
  };
}

function snapshotFromProgress(
  progress: ExamProgress,
  timeRemaining: number,
): { paket_id: string; subtest_id: string; answers: Record<string, { answer?: string; doubt?: boolean }>; time_remaining: number } {
  const currentSubtest = progress.subtestStates[progress.currentSubtestIndex];
  const answers: Record<string, { answer?: string; doubt?: boolean }> = {};
  if (currentSubtest) {
    for (const [qid, ans] of Object.entries(currentSubtest.answers)) {
      answers[qid] = { answer: ans, doubt: Boolean(currentSubtest.doubts[Number(qid)]) };
    }
    for (const [qid, doubt] of Object.entries(currentSubtest.doubts)) {
      if (!answers[qid]) {
        answers[qid] = { answer: '', doubt: Boolean(doubt) };
      }
    }
  }
  return {
    paket_id: String(progress.packageId ?? ''),
    subtest_id: currentSubtest ? String(currentSubtest.subtestId) : '',
    answers,
    time_remaining: Math.max(0, Math.floor(timeRemaining)),
  };
}

export async function upsertOngoingExam(
  userId: string,
  progress: ExamProgress,
  timeRemaining: number,
): Promise<void> {
  if (!userId || progress.packageId == null) return;
  const payload = snapshotFromProgress(progress, timeRemaining);
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
