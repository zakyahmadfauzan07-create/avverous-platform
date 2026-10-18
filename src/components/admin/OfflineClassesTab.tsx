import { useEffect, useState } from 'react';
import { Plus, Pencil, Trash2, Loader2, AlertCircle, X, DoorOpen, Clock, User } from 'lucide-react';
import {
  fetchOfflineClasses,
  insertOfflineClass,
  updateOfflineClass,
  deleteOfflineClass,
  OfflineClassRow,
  WEEKDAYS,
} from '@/lib/dashboardStore';

export default function OfflineClassesTab() {
  const [items, setItems] = useState<OfflineClassRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editing, setEditing] = useState<OfflineClassRow | null>(null);
  const [showForm, setShowForm] = useState(false);

  async function load() {
    setLoading(true);
    try {
      setItems(await fetchOfflineClasses());
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Gagal memuat jadwal kelas offline.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function handleDelete(id: string) {
    if (!confirm('Hapus sesi kelas offline ini?')) return;
    try {
      await deleteOfflineClass(id);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Gagal menghapus.');
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-bold text-blue-950 flex items-center gap-2">
            <DoorOpen className="w-5 h-5 text-green-600" />
            Kelas Offline Level 12
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Jadwal mingguan tatap muka. Siswa hanya bisa melihat (read-only).
          </p>
        </div>
        <button
          onClick={() => {
            setEditing(null);
            setShowForm(true);
          }}
          className="inline-flex items-center gap-1.5 px-3 py-2 bg-green-600 hover:bg-green-500 text-white text-sm font-medium rounded-lg transition"
        >
          <Plus className="w-4 h-4" />
          Tambah Sesi
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-3 flex items-start gap-2 text-sm text-red-700">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{error}</span>
          <button onClick={() => setError('')} className="ml-auto">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-10">
          <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
        </div>
      ) : items.length === 0 ? (
        <p className="text-sm text-slate-400 py-10 text-center">Belum ada jadwal kelas offline.</p>
      ) : (
        <div className="space-y-4">
          {WEEKDAYS.map((dayName, idx) => {
            const dayNum = idx + 1;
            const sessions = items.filter((s) => s.day_of_week === dayNum);
            if (sessions.length === 0) return null;
            return (
              <div key={dayNum} className="bg-white border border-slate-200 rounded-xl overflow-hidden">
                <div className="bg-slate-50 px-4 py-2 border-b border-slate-200">
                  <h3 className="text-sm font-bold text-slate-700 flex items-center gap-2">
                    <span className="w-1.5 h-4 bg-green-500 rounded-full" />
                    {dayName}
                  </h3>
                </div>
                <div className="divide-y divide-slate-100">
                  {sessions.map((s) => (
                    <div key={s.id} className="p-3.5 flex items-center justify-between gap-3">
                      <div className="flex items-start gap-3 min-w-0">
                        <div className="flex flex-col items-center shrink-0 w-14 bg-slate-50 rounded-lg py-1.5">
                          <span className="text-xs font-bold text-slate-700">{s.start_time.slice(0, 5)}</span>
                          {s.end_time && (
                            <>
                              <span className="text-[10px] text-slate-400 my-0.5">s/d</span>
                              <span className="text-xs font-bold text-slate-500">{s.end_time.slice(0, 5)}</span>
                            </>
                          )}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="font-medium text-blue-950 text-sm">{s.subject}</p>
                            <span className="inline-flex items-center gap-1 text-[10px] font-medium text-green-700 bg-green-50 border border-green-200 px-1.5 py-0.5 rounded-full">
                              {s.location_label}
                            </span>
                            {s.track && (
                              <span className="text-[10px] font-medium text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded-full capitalize">
                                {s.track}
                              </span>
                            )}
                          </div>
                          {s.tutor && (
                            <p className="flex items-center gap-1 text-xs text-slate-500 mt-1">
                              <User className="w-3 h-3 text-slate-400" />
                              {s.tutor}
                            </p>
                          )}
                          {s.notes && <p className="text-slate-400 text-xs mt-1 italic">{s.notes}</p>}
                        </div>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          onClick={() => {
                            setEditing(s);
                            setShowForm(true);
                          }}
                          className="p-1.5 text-slate-400 hover:text-blue-600 transition"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(s.id)}
                          className="p-1.5 text-slate-400 hover:text-red-600 transition"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {showForm && (
        <OfflineClassForm
          existing={editing}
          onClose={() => setShowForm(false)}
          onSaved={async () => {
            setShowForm(false);
            await load();
          }}
        />
      )}
    </div>
  );
}

function OfflineClassForm({
  existing,
  onClose,
  onSaved,
}: {
  existing: OfflineClassRow | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [dayOfWeek, setDayOfWeek] = useState(existing?.day_of_week ?? 1);
  const [startTime, setStartTime] = useState(existing?.start_time ?? '16:00');
  const [endTime, setEndTime] = useState(existing?.end_time ?? '');
  const [subject, setSubject] = useState(existing?.subject ?? '');
  const [tutor, setTutor] = useState(existing?.tutor ?? '');
  const [track, setTrack] = useState(existing?.track ?? '');
  const [locationLabel, setLocationLabel] = useState(existing?.location_label ?? 'Offline');
  const [notes, setNotes] = useState(existing?.notes ?? '');
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState('');

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr('');
    if (!subject.trim() || !startTime) {
      setErr('Mata pelajaran dan jam mulai wajib diisi.');
      return;
    }
    setSaving(true);
    try {
      const payload = {
        day_of_week: dayOfWeek,
        start_time: startTime,
        end_time: endTime || null,
        subject: subject.trim(),
        tutor: tutor.trim() || null,
        track: track.trim() || null,
        location_label: locationLabel.trim() || 'Offline',
        notes: notes.trim() || null,
      };
      if (existing) await updateOfflineClass(existing.id, payload);
      else await insertOfflineClass(payload);
      onSaved();
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Gagal menyimpan.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl max-w-md w-full p-5 shadow-xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-blue-950">{existing ? 'Edit Sesi Offline' : 'Tambah Sesi Offline'}</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X className="w-5 h-5" />
          </button>
        </div>
        <form onSubmit={submit} className="space-y-3">
          <Field label="Hari">
            <select
              value={dayOfWeek}
              onChange={(e) => setDayOfWeek(Number(e.target.value))}
              className="input"
            >
              {WEEKDAYS.map((d, i) => (
                <option key={i} value={i + 1}>
                  {d}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Mata Pelajaran / Kelas">
            <input
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="contoh: TKA Kimia / UTBK Kelas A"
              className="input"
            />
          </Field>
          <Field label="Tutor (opsional)">
            <input
              value={tutor}
              onChange={(e) => setTutor(e.target.value)}
              placeholder="contoh: Salisa"
              className="input"
            />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Jam Mulai">
              <input type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} className="input" />
            </Field>
            <Field label="Jam Selesai">
              <input type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} className="input" />
            </Field>
          </div>
          <Field label="Jalur (opsional)">
            <select value={track} onChange={(e) => setTrack(e.target.value)} className="input">
              <option value="">— Umum / Semua —</option>
              <option value="saintek">Saintek</option>
              <option value="soshum">Soshum</option>
            </select>
          </Field>
          <Field label="Label Lokasi / Mode">
            <input
              value={locationLabel}
              onChange={(e) => setLocationLabel(e.target.value)}
              placeholder="contoh: Offline"
              className="input"
            />
          </Field>
          <Field label="Catatan (opsional)">
            <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} className="input" />
          </Field>
          {err && <p className="text-xs text-red-600">{err}</p>}
          <div className="flex gap-2 pt-1">
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
              className="flex-1 py-2.5 bg-green-600 hover:bg-green-500 text-white text-sm font-semibold rounded-lg transition disabled:opacity-50"
            >
              {saving ? 'Menyimpan...' : 'Simpan'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="block text-xs font-medium text-slate-600 mb-1">{label}</span>
      {children}
    </label>
  );
}
