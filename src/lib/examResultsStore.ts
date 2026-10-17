import { supabase } from '@/lib/supabase';
import { TryoutResultRecord, SubtestResult, Subtest } from '@/types';

export interface ExamResultRow {
  id: string;
  user_id: string;
  package_id: number;
  package_name: string;
  participant_name: string;
  completed_at: string;
  total_score: number;
  subtest_results: SubtestResult[];
  answers: Record<number, string>;
  subtests: Subtest[];
}

function rowToRecord(row: ExamResultRow): TryoutResultRecord {
  return {
    id: 0, // not used for DB rows; we use the DB uuid via a separate id field
    packageId: row.package_id,
    packageName: row.package_name,
    participantName: row.participant_name,
    completedAt: new Date(row.completed_at).getTime(),
    totalScore: row.total_score,
    subtestResults: row.subtest_results,
    answers: row.answers,
    subtests: row.subtests,
  };
}

export interface ExamResultWithId extends TryoutResultRecord {
  dbId: string;
}

function rowToWithId(row: ExamResultRow): ExamResultWithId {
  return { ...rowToRecord(row), dbId: row.id, userId: row.user_id };
}

export async function fetchMyResults(): Promise<ExamResultWithId[]> {
  const { data, error } = await supabase
    .from('exam_results')
    .select('*')
    .order('completed_at', { ascending: false });
  if (error) throw error;
  return (data as ExamResultRow[]).map(rowToWithId);
}

export async function fetchAllResults(): Promise<ExamResultWithId[]> {
  const { data, error } = await supabase.rpc('get_all_exam_results');
  if (error) throw error;
  return (data as ExamResultRow[]).map(rowToWithId);
}

export async function insertExamResult(
  userId: string,
  packageId: number,
  packageName: string,
  participantName: string,
  totalScore: number,
  subtestResults: SubtestResult[],
  answers: Record<number, string>,
  subtests: Subtest[],
): Promise<ExamResultWithId | null> {
  const { data, error } = await supabase
    .from('exam_results')
    .insert({
      user_id: userId,
      package_id: packageId,
      package_name: packageName,
      participant_name: participantName,
      total_score: totalScore,
      subtest_results: subtestResults,
      answers,
      subtests,
    })
    .select('*')
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;
  return rowToWithId(data as ExamResultRow);
}

export async function deleteExamResult(dbId: string): Promise<void> {
  const { error } = await supabase.from('exam_results').delete().eq('id', dbId);
  if (error) throw error;
}
