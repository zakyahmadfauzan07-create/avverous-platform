import { useEffect, useState } from 'react';
import { Plus, Pencil, Trash2, Loader2, AlertCircle, X, BookOpen, ExternalLink } from 'lucide-react';
import {
  fetchMaterials,
  insertMaterial,
  updateMaterial,
  deleteMaterial,
  MaterialRow,
} from '@/lib/dashboardStore';

export default function MaterialsTab() {
  const [items, setItems] = useState<MaterialRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editing, setEditing] = useState<MaterialRow | null>(null);
  const [showForm, setShowForm] = useState(false);

  async function load() {
    setLoading(true);
    try {
      setItems(await fetchMaterials());
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Gagal memuat materi.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function handleDelete(id: string) {
    if (!confirm('Hapus materi ini?')) return;
    try {
      await deleteMaterial(id);
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
            <BookOpen className="w-5 h-5 text-blue-600" />
            Manajemen Modul & Materi
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">Modul belajar & pembahasan soal untuk siswa.</p>
        </div>
        <button
          onClick={() => {
            setEditing(null);
            setShowForm(true);
          }}
          className="inline-flex items-center gap-1.5 px-3 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium rounded-lg transition"
        >
          <Plus className="w-4 h-4" />
          Tambah Materi
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
        <p className="text-sm text-slate-400 py-10 text-center">Belum ada materi.</p>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {items.map((m) => (
            <div key={m.id} className="bg-white border border-slate-200 rounded-xl p-4 flex flex-col">
              <div className="flex items-start justify-between gap-2 mb-2">
                <span className="text-xs font-medium text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full truncate">
                  {m.category}
                </span>
                <div className="flex gap-1 shrink-0">
                  <button
                    onClick={() => {
                      setEditing(m);
                      setShowForm(true);
                    }}
                    className="p-1 text-slate-400 hover:text-blue-600 transition"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleDelete(m.id)}
                    className="p-1 text-slate-400 hover:text-red-600 transition"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
              <p className="font-semibold text-blue-950 text-sm leading-snug mb-1">{m.title}</p>
              {m.description && <p className="text-xs text-slate-500 line-clamp-3 mb-2">{m.description}</p>}
              {m.link && (
                <a
                  href={m.link}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-auto inline-flex items-center gap-1 text-xs font-medium text-blue-600 hover:text-blue-700"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  Buka link
                </a>
              )}
            </div>
          ))}
        </div>
      )}

      {showForm && (
        <MaterialForm
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

function MaterialForm({
  existing,
  onClose,
  onSaved,
}: {
  existing: MaterialRow | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [title, setTitle] = useState(existing?.title ?? '');
  const [category, setCategory] = useState(existing?.category ?? '');
  const [description, setDescription] = useState(existing?.description ?? '');
  const [content, setContent] = useState(existing?.content ?? '');
  const [link, setLink] = useState(existing?.link ?? '');
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState('');

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr('');
    if (!title.trim() || !category.trim()) {
      setErr('Judul dan kategori wajib diisi.');
      return;
    }
    if (!content.trim() && !link.trim()) {
      setErr('Isi minimal salah satu: konten materi atau link.');
      return;
    }
    setSaving(true);
    try {
      const payload = {
        title: title.trim(),
        category: category.trim(),
        description: description.trim() || null,
        content: content.trim() || null,
        link: link.trim() || null,
      };
      if (existing) await updateMaterial(existing.id, payload);
      else await insertMaterial(payload);
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
          <h3 className="font-bold text-blue-950">{existing ? 'Edit Materi' : 'Tambah Materi'}</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X className="w-5 h-5" />
          </button>
        </div>
        <form onSubmit={submit} className="space-y-3">
          <Field label="Judul">
            <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="contoh: Rumus Cepat PK" className="input" />
          </Field>
          <Field label="Kategori">
            <input value={category} onChange={(e) => setCategory(e.target.value)} placeholder="contoh: Pengetahuan Kuantitatif" className="input" />
          </Field>
          <Field label="Deskripsi Singkat (opsional)">
            <input value={description} onChange={(e) => setDescription(e.target.value)} className="input" />
          </Field>
          <Field label="Konten Materi (opsional)">
            <textarea value={content} onChange={(e) => setContent(e.target.value)} rows={4} className="input" />
          </Field>
          <Field label="Link Eksternal (opsional)">
            <input value={link} onChange={(e) => setLink(e.target.value)} placeholder="https://..." className="input" />
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
