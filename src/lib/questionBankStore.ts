import { supabase } from '@/lib/supabase';
import type { Subtest, Question } from '@/types';

export interface PackageRow {
  id: number;
  name: string;
  description: string;
  is_active: boolean;
}

export interface SubtestRow {
  id: number;
  package_id: number;
  name: string;
  short_name: string;
  description: string;
  duration_minutes: number;
  sort_order: number;
}

export interface QuestionRow {
  id: number;
  subtest_id: number;
  type: string;
  stimulus: string | null;
  stimulus_title: string | null;
  image: string | null;
  question: string;
  options: string[] | null;
  sort_order: number;
}

/**
 * Fetch all active tryout packages with their subtests and questions.
 * correctAnswer and explanation are NOT included — those columns are
 * revoked at the database, so the answer key never reaches the browser
 * during an exam. Solutions are revealed separately via revealSolutions()
 * after the exam is submitted.
 */
export async function fetchPackagesFromServer(): Promise<
  { id: number; name: string; description: string; subtests: Subtest[] }[]
> {
  const { data: pkgRows, error: pkgErr } = await supabase
    .from('packages')
    .select('id, name, description')
    .eq('is_active', true)
    .order('id', { ascending: true });
  if (pkgErr) throw pkgErr;
  if (!pkgRows || pkgRows.length === 0) return [];

  const pkgList = pkgRows as PackageRow[];

  const { data: subRows, error: subErr } = await supabase
    .from('subtests')
    .select('id, package_id, name, short_name, description, duration_minutes, sort_order')
    .order('sort_order', { ascending: true });
  if (subErr) throw subErr;

  const { data: qRows, error: qErr } = await supabase
    .from('questions')
    .select('id, subtest_id, type, stimulus, stimulus_title, image, question, options, sort_order')
    .order('sort_order', { ascending: true });
  if (qErr) throw qErr;

  const subList = (subRows ?? []) as SubtestRow[];
  const qList = (qRows ?? []) as QuestionRow[];

  return pkgList.map((pkg) => ({
    id: pkg.id,
    name: pkg.name,
    description: pkg.description,
    subtests: subList
      .filter((s) => s.package_id === pkg.id)
      .map((s) => {
        const questions: Question[] = qList
          .filter((q) => q.subtest_id === s.id)
          .map((q) => ({
            id: q.id,
            type: (q.type === 'numeric' ? 'numeric' : 'multiple_choice') as Question['type'],
            stimulus: q.stimulus ?? undefined,
            stimulusTitle: q.stimulus_title ?? undefined,
            image: q.image ?? undefined,
            question: q.question,
            options: q.options ?? undefined,
            correctAnswer: '', // never sent from server during exam
            explanation: [],   // never sent from server during exam
          }));
        return {
          id: s.id,
          name: s.name,
          shortName: s.short_name,
          description: s.description,
          durationMinutes: s.duration_minutes,
          questions,
        };
      }),
  }));
}

export interface RevealedSolution {
  id: number;
  subtestId: number;
  type: string;
  question: string;
  options: string[] | null;
  correctAnswer: string;
  explanation: { label: string; content: string; formula?: string }[];
  stimulus: string | null;
  stimulusTitle: string | null;
}

/**
 * Reveal the answer key and explanations for a package. Only works AFTER
 * the student has submitted the exam (the server checks exam_results).
 */
export async function revealSolutions(packageId: number): Promise<Record<number, RevealedSolution>> {
  const { data, error } = await supabase.rpc('reveal_question_solutions', { p_package_id: packageId });
  if (error) throw error;
  const arr = (data ?? []) as RevealedSolution[];
  const map: Record<number, RevealedSolution> = {};
  for (const s of arr) {
    map[s.id] = s;
  }
  return map;
}
