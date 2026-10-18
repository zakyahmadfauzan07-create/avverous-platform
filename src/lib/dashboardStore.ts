import { supabase } from '@/lib/supabase';

export interface ScheduleRow {
  id: string;
  title: string;
  topic: string;
  session_date: string;
  start_time: string;
  end_time: string | null;
  location: string | null;
  notes: string | null;
}

export interface MaterialRow {
  id: string;
  title: string;
  category: string;
  description: string | null;
  content: string | null;
  link: string | null;
  created_at: string;
}

export interface GradeRow {
  id: string;
  user_id: string;
  title: string;
  score: number;
  graded_at: string;
  notes: string | null;
}

export interface StudentSummaryRow {
  id: string;
  email: string;
  full_name: string;
  school: string;
  role: string;
  tryout_count: number;
  grade_count: number;
  latest_score: number | null;
  latest_at: string | null;
}

function tidy<T>(payload: { data: T | null; error: { message: string } | null }): T {
  if (payload.error) throw new Error(payload.error.message);
  return payload.data as T;
}

export async function fetchUpcomingSchedules(limit = 20): Promise<ScheduleRow[]> {
  const today = new Date().toISOString().slice(0, 10);
  const data = tidy(
    await supabase
      .from('schedules')
      .select('id, title, topic, session_date, start_time, end_time, location, notes')
      .gte('session_date', today)
      .order('session_date', { ascending: true })
      .order('start_time', { ascending: true })
      .limit(limit),
  );
  return data ?? [];
}

export async function fetchAllSchedules(): Promise<ScheduleRow[]> {
  const data = tidy(
    await supabase
      .from('schedules')
      .select('id, title, topic, session_date, start_time, end_time, location, notes')
      .order('session_date', { ascending: false })
      .order('start_time', { ascending: false }),
  );
  return data ?? [];
}

export async function insertSchedule(row: Omit<ScheduleRow, 'id'>): Promise<ScheduleRow> {
  const data = tidy(
    await supabase
      .from('schedules')
      .insert(row)
      .select('id, title, topic, session_date, start_time, end_time, location, notes')
      .maybeSingle(),
  );
  return data as ScheduleRow;
}

export async function updateSchedule(id: string, row: Partial<Omit<ScheduleRow, 'id'>>): Promise<void> {
  const { error } = await supabase.from('schedules').update(row).eq('id', id);
  if (error) throw new Error(error.message);
}

export async function deleteSchedule(id: string): Promise<void> {
  const { error } = await supabase.from('schedules').delete().eq('id', id);
  if (error) throw new Error(error.message);
}

export async function fetchMaterials(): Promise<MaterialRow[]> {
  const data = tidy(
    await supabase
      .from('materials')
      .select('id, title, category, description, content, link, created_at')
      .order('created_at', { ascending: false }),
  );
  return data ?? [];
}

export async function insertMaterial(
  row: Omit<MaterialRow, 'id' | 'created_at'>,
): Promise<MaterialRow> {
  const data = tidy(
    await supabase
      .from('materials')
      .insert(row)
      .select('id, title, category, description, content, link, created_at')
      .maybeSingle(),
  );
  return data as MaterialRow;
}

export async function updateMaterial(id: string, row: Partial<Omit<MaterialRow, 'id' | 'created_at'>>): Promise<void> {
  const { error } = await supabase.from('materials').update(row).eq('id', id);
  if (error) throw new Error(error.message);
}

export async function deleteMaterial(id: string): Promise<void> {
  const { error } = await supabase.from('materials').delete().eq('id', id);
  if (error) throw new Error(error.message);
}

export async function fetchMyGrades(): Promise<GradeRow[]> {
  const data = tidy(
    await supabase
      .from('grades')
      .select('id, user_id, title, score, graded_at, notes')
      .order('graded_at', { ascending: true }),
  );
  return data ?? [];
}

export async function fetchGradesForStudent(userId: string): Promise<GradeRow[]> {
  const data = tidy(
    await supabase
      .from('grades')
      .select('id, user_id, title, score, graded_at, notes')
      .eq('user_id', userId)
      .order('graded_at', { ascending: true }),
  );
  return data ?? [];
}

export async function insertGrade(
  row: Omit<GradeRow, 'id'>,
): Promise<GradeRow> {
  const data = tidy(
    await supabase
      .from('grades')
      .insert(row)
      .select('id, user_id, title, score, graded_at, notes')
      .maybeSingle(),
  );
  return data as GradeRow;
}

export async function updateGrade(id: string, row: Partial<Omit<GradeRow, 'id'>>): Promise<void> {
  const { error } = await supabase.from('grades').update(row).eq('id', id);
  if (error) throw new Error(error.message);
}

export async function deleteGrade(id: string): Promise<void> {
  const { error } = await supabase.from('grades').delete().eq('id', id);
  if (error) throw new Error(error.message);
}

export async function fetchStudentSummaries(): Promise<StudentSummaryRow[]> {
  const data = tidy(await supabase.rpc('get_student_summaries'));
  return (data ?? []) as StudentSummaryRow[];
}

export interface OfflineClassRow {
  id: string;
  day_of_week: number;
  start_time: string;
  end_time: string | null;
  subject: string;
  tutor: string | null;
  track: string | null;
  location_label: string;
  notes: string | null;
}

export const WEEKDAYS = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat'] as const;

export async function fetchOfflineClasses(): Promise<OfflineClassRow[]> {
  const data = tidy(
    await supabase
      .from('offline_classes')
      .select('id, day_of_week, start_time, end_time, subject, tutor, track, location_label, notes')
      .order('day_of_week', { ascending: true })
      .order('start_time', { ascending: true }),
  );
  return data ?? [];
}

export async function insertOfflineClass(row: Omit<OfflineClassRow, 'id'>): Promise<OfflineClassRow> {
  const data = tidy(
    await supabase
      .from('offline_classes')
      .insert(row)
      .select('id, day_of_week, start_time, end_time, subject, tutor, track, location_label, notes')
      .maybeSingle(),
  );
  return data as OfflineClassRow;
}

export async function updateOfflineClass(id: string, row: Partial<Omit<OfflineClassRow, 'id'>>): Promise<void> {
  const { error } = await supabase.from('offline_classes').update(row).eq('id', id);
  if (error) throw new Error(error.message);
}

export async function deleteOfflineClass(id: string): Promise<void> {
  const { error } = await supabase.from('offline_classes').delete().eq('id', id);
  if (error) throw new Error(error.message);
}
