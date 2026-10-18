import { useEffect, useState } from 'react';
import { Plus, Pencil, Trash2, Loader2, AlertCircle, X, CalendarDays } from 'lucide-react';
import {
  fetchAllSchedules,
  insertSchedule,
  updateSchedule,
  deleteSchedule,
  ScheduleRow,
} from '@/lib/dashboardStore';

export default function SchedulesTab() {
  const [items, setItems] = useState<ScheduleRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editing, setEditing] = useState<ScheduleRow | null>(null);
  const [showForm, setShowForm] = useState(false);

  async function load() {
    setLoading(true);
    try {
      setItems(await fetchAllSchedules());
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Gagal memuat jadwal.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function handleDelete(id: string) {
    if (!confirm('Hapus jadwal ini?')) return;
    try {
      await deleteSchedule(id);
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
            <CalendarDays className="w-5 h-5 text-blue-600" />
            Manajemen Jadwal
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">Sesi bimbingan/kelas yang tampil di dashboard siswa.</p>
        </div>
        <button
          onClick={() => {
            setEditing(null);
            setShowForm(true);
          }}
          className="inline-flex items-center gap-1.5 px-3 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium rounded-lg transition"
        >
          <Plus className="w-4 h-4" />
          Tambah Jadwal
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
        <p className="text-sm text-slate-400 py-10 text-center">Belum ada jadwal.</p>
      ) : (
        <div className="bg-white border border-slate-200 rounded-xl divide-y divide-slate-100">
          {items.map((s) => (
            <div key={s.id} className="p-4 flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="font-medium text-blue-950 text-sm">{s.title}</p>
                <p className="text-xs text-slate-500 truncate">
                  {new Date(`${s.session_date}T${s.start_time}`).toLocaleDateString('id-ID', {
                    weekday: 'short',
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                  })}{' '}
                  · {s.start_time.slice(0, 5)}
                  {s.end_time ? `–${s.end_time.slice(0, 5)}` : ''} · {s.topic}
                </p>
                {s.location && <p className="text-xs text-slate-400 truncate">📍 {s.location}</p>}
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
      )}

      {showForm && (
        <ScheduleForm
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

function ScheduleForm({
  existing,
  onClose,
  onSaved,
}: {
  existing: ScheduleRow | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [title, setTitle] = useState(existing?.title ?? '');
  const [topic, setTopic] = useState(existing?.topic ?? '');
  const [date, setDate] = useState(existing?.session_date ?? new Date().toISOString().slice(0, 10));
  const [startTime, setStartTime] = useState(existing?.start_time ?? '16:00');
  const [endTime, setEndTime] = useState(existing?.end_time ?? '');
  const [location, setLocation] = useState(existing?.location ?? '');
  const [notes, setNotes] = useState(existing?.notes ?? '');
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState('');

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr('');
    if (!title.trim() || !topic.trim() || !date || !startTime) {
      setErr('Judul, topik, tanggal, dan jam mulai wajib diisi.');
      return;
    }
    setSaving(true);
    try {
      const payload = {
        title: title.trim(),
        topic: topic.trim(),
        session_date: date,
        start_time: startTime,
        end_time: endTime || null,
        location: location.trim() || null,
        notes: notes.trim() || null,
      };
      if (existing) await updateSchedule(existing.id, payload);
      else await insertSchedule(payload);
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
          <h3 className="font-bold text-blue-950">{existing ? 'Edit Jadwal' : 'Tambah Jadwal'}</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X className="w-5 h-5" />
          </button>
        </div>
        <form onSubmit={submit} className="space-y-3">
          <Field label="Judul Sesi">
            <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="contoh: Bimbingan UTBK" className="input" />
          </Field>
          <Field label="Topik / Materi">
            <input value={topic} onChange={(e) => setTopic(e.target.value)} placeholder="contoh: Penalaran Matematika" className="input" />
          </Field>
          <div className="grid grid-cols-3 gap-3">
            <Field label="Tanggal">
              <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="input" />
            </Field>
            <Field label="Mulai">
              <input type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} className="input" />
            </Field>
            <Field label="Selesai">
              <input type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} className="input" />
            </Field>
          </div>
          <Field label="Lokasi / Link">
            <input value={location} onChange={(e) => setLocation(e.target.value)} placeholder="contoh: Zoom link / alamat" className="input" />
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

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="block text-xs font-medium text-slate-600 mb-1">{label}</span>
      {children}
    </label>
  );
}
