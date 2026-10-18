import { useEffect, useState } from 'react';
import { Plus, Pencil, Trash2, Loader2, AlertCircle, X, Search } from 'lucide-react';
import {
  fetchStudentSummaries,
  fetchGradesForStudent,
  insertGrade,
  updateGrade,
  deleteGrade,
  GradeRow,
  StudentSummaryRow,
} from '@/lib/dashboardStore';
import { supabase } from '@/lib/supabase';

export default function GradesTab() {
  const [students, setStudents] = useState<StudentSummaryRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<StudentSummaryRow | null>(null);
  const [grades, setGrades] = useState<GradeRow[]>([]);
  const [gradesLoading, setGradesLoading] = useState(false);
  const [editing, setEditing] = useState<GradeRow | null>(null);
  const [showForm, setShowForm] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const data = await fetchStudentSummaries();
      setStudents(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Gagal memuat daftar siswa.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function openStudent(s: StudentSummaryRow) {
    setSelected(s);
    setGradesLoading(true);
    try {
      const g = await fetchGradesForStudent(s.id);
      setGrades(g);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Gagal memuat nilai.');
    } finally {
      setGradesLoading(false);
    }
  }

  async function refreshGrades() {
    if (!selected) return;
    const g = await fetchGradesForStudent(selected.id);
    setGrades(g);
  }

  async function handleDelete(id: string) {
    if (!confirm('Hapus nilai ini?')) return;
    try {
      await deleteGrade(id);
      await refreshGrades();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Gagal menghapus.');
    }
  }

  const filtered = students.filter(
    (s) =>
      s.full_name.toLowerCase().includes(search.toLowerCase()) ||
      s.email.toLowerCase().includes(search.toLowerCase()),
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center py-10 text-slate-400">
        <Loader2 className="w-6 h-6 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-3 flex items-start gap-2 text-sm text-red-700">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{error}</span>
          <button onClick={() => setError('')} className="ml-auto">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      <div className="grid lg:grid-cols-5 gap-4">
        {/* Students list */}
        <div className="lg:col-span-2 bg-white border border-slate-200 rounded-xl p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-blue-950 text-sm">Daftar Siswa</h3>
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Cari..."
                className="pl-7 pr-2 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 w-32"
              />
            </div>
          </div>
          <div className="space-y-1.5 max-h-[460px] overflow-y-auto">
            {filtered.length === 0 ? (
              <p className="text-xs text-slate-400 py-6 text-center">Tidak ada siswa.</p>
            ) : (
              filtered.map((s) => (
                <button
                  key={s.id}
                  onClick={() => openStudent(s)}
                  className={`w-full text-left p-3 rounded-lg border transition ${
                    selected?.id === s.id
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-slate-200 hover:border-blue-200'
                  }`}
                >
                  <p className="font-medium text-blue-950 text-sm truncate">{s.full_name || s.email}</p>
                  <p className="text-xs text-slate-500 truncate">{s.email}</p>
                  <div className="flex gap-3 mt-1.5 text-xs text-slate-500">
                    <span>{s.tryout_count} tryout</span>
                    <span>{s.grade_count} nilai</span>
                    {s.latest_score !== null && (
                      <span className="text-blue-600 font-medium">akhir: {s.latest_score}</span>
                    )}
                  </div>
                </button>
              ))
            )}
          </div>
        </div>

        {/* Grades panel */}
        <div className="lg:col-span-3 bg-white border border-slate-200 rounded-xl p-4">
          {!selected ? (
            <div className="flex flex-col items-center justify-center py-16 text-slate-400">
              <p className="text-sm">Pilih siswa untuk melihat dan mengelola nilai.</p>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between mb-3">
                <div className="min-w-0">
                  <h3 className="font-semibold text-blue-950 text-sm truncate">
                    Nilai: {selected.full_name || selected.email}
                  </h3>
                  <p className="text-xs text-slate-500">{selected.school || '—'}</p>
                </div>
                <button
                  onClick={() => {
                    setEditing(null);
                    setShowForm(true);
                  }}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium rounded-lg transition"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Tambah Nilai
                </button>
              </div>
              {gradesLoading ? (
                <div className="flex justify-center py-10">
                  <Loader2 className="w-5 h-5 animate-spin text-slate-400" />
                </div>
              ) : grades.length === 0 ? (
                <p className="text-xs text-slate-400 py-10 text-center">Belum ada nilai.</p>
              ) : (
                <div className="space-y-2">
                  {grades.map((g) => (
                    <div
                      key={g.id}
                      className="flex items-center justify-between gap-2 p-3 border border-slate-200 rounded-lg"
                    >
                      <div className="min-w-0">
                        <p className="font-medium text-blue-950 text-sm truncate">{g.title}</p>
                        <p className="text-xs text-slate-500">
                          {new Date(g.graded_at).toLocaleDateString('id-ID', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                          })}
                          {g.notes ? ` · ${g.notes}` : ''}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="font-bold text-blue-700 text-sm">{g.score}</span>
                        <button
                          onClick={() => {
                            setEditing(g);
                            setShowForm(true);
                          }}
                          className="p-1.5 text-slate-400 hover:text-blue-600 transition"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDelete(g.id)}
                          className="p-1.5 text-slate-400 hover:text-red-600 transition"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {showForm && selected && (
        <GradeForm
          studentId={selected.id}
          existing={editing}
          onClose={() => setShowForm(false)}
          onSaved={async () => {
            setShowForm(false);
            await refreshGrades();
            await load();
          }}
        />
      )}
    </div>
  );
}

function GradeForm({
  studentId,
  existing,
  onClose,
  onSaved,
}: {
  studentId: string;
  existing: GradeRow | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [title, setTitle] = useState(existing?.title ?? '');
  const [score, setScore] = useState(existing ? String(existing.score) : '');
  const [gradedAt, setGradedAt] = useState(
    existing ? existing.graded_at : new Date().toISOString().slice(0, 10),
  );
  const [notes, setNotes] = useState(existing?.notes ?? '');
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState('');

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr('');
    if (!title.trim() || !score.trim() || !gradedAt) {
      setErr('Judul, nilai, dan tanggal wajib diisi.');
      return;
    }
    const scoreNum = Number(score);
    if (Number.isNaN(scoreNum) || scoreNum < 0 || scoreNum > 1000) {
      setErr('Nilai harus angka 0–1000.');
      return;
    }
    setSaving(true);
    try {
      const payload = {
        user_id: studentId,
        title: title.trim(),
        score: scoreNum,
        graded_at: gradedAt,
        notes: notes.trim() || null,
      };
      if (existing) {
        await updateGrade(existing.id, payload);
      } else {
        await insertGrade(payload);
      }
      onSaved();
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Gagal menyimpan.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl max-w-md w-full p-5 shadow-xl">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-blue-950">{existing ? 'Edit Nilai' : 'Tambah Nilai'}</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X className="w-5 h-5" />
          </button>
        </div>
        <form onSubmit={submit} className="space-y-3">
          <Field label="Judul Penilaian">
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="contoh: Tryout #1"
              className="input"
            />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Nilai (0–1000)">
              <input
                type="number"
                min={0}
                max={1000}
                value={score}
                onChange={(e) => setScore(e.target.value)}
                className="input"
              />
            </Field>
            <Field label="Tanggal">
              <input type="date" value={gradedAt} onChange={(e) => setGradedAt(e.target.value)} className="input" />
            </Field>
          </div>
          <Field label="Catatan (opsional)">
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              className="input"
            />
          </Field>
          {err && <p className="text-xs text-red-600">{err}</p>}
          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 border border-slate-200 text-slate-600 text-sm font-medium rounded-lg hover:bg-slate-50 transition"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold rounded-lg transition disabled:opacity-50"
            >
              {saving ? 'Menyimpan...' : 'Simpan'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Small inline field helper reusing tailwind `input` class from index.css
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="block text-xs font-medium text-slate-600 mb-1">{label}</span>
      {children}
    </label>
  );
}

// Quick re-export so this file can also be used to set role from a sibling tab if needed.
export async function setRole(userId: string, newRole: 'student' | 'admin') {
  const { error } = await supabase.rpc('set_user_role', { target_id: userId, new_role: newRole });
  if (error) throw error;
}
