import { useState } from 'react';
import { Plus, Pencil, Trash2, Save, X, BookOpen, Library } from 'lucide-react';
import { LearningModule } from '@/types';
import { generateId } from '@/lib/subtestStore';

interface ModulesTabProps {
  modules: LearningModule[];
  onChange: (modules: LearningModule[]) => void;
}

export default function ModulesTab({ modules, onChange }: ModulesTabProps) {
  const [editing, setEditing] = useState<{ id: number | null; title: string; category: string; content: string } | null>(null);

  const sorted = [...modules].sort((a, b) => a.order - b.order || a.id - b.id);

  const save = () => {
    if (!editing) return;
    if (editing.id === null) {
      const newModule: LearningModule = {
        id: generateId(),
        title: editing.title.trim() || 'Modul Baru',
        category: editing.category.trim() || 'Umum',
        content: editing.content,
        order: sorted.length + 1,
      };
      onChange([...modules, newModule]);
    } else {
      onChange(
        modules.map((m) =>
          m.id === editing.id
            ? { ...m, title: editing.title.trim() || m.title, category: editing.category.trim() || m.category, content: editing.content }
            : m,
        ),
      );
    }
    setEditing(null);
  };

  const remove = (id: number) => onChange(modules.filter((m) => m.id !== id));

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-semibold text-slate-800 flex items-center gap-2">
          <Library className="w-5 h-5 text-blue-600" />
          Modul Pembelajaran
        </h2>
        <button
          onClick={() => setEditing({ id: null, title: '', category: '', content: '' })}
          className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium transition"
        >
          <Plus className="w-4 h-4" />
          Tambah Modul
        </button>
      </div>

      {sorted.length === 0 ? (
        <p className="text-slate-400 text-sm text-center py-6">Belum ada modul. Klik "Tambah Modul" untuk memulai.</p>
      ) : (
        <div className="space-y-2">
          {sorted.map((m) => (
            <div key={m.id} className="flex items-start gap-3 p-3.5 rounded-lg border border-slate-200 hover:bg-slate-50 transition">
              <div className="w-10 h-10 rounded-lg bg-blue-600/15 flex items-center justify-center text-blue-600 shrink-0">
                <BookOpen className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-slate-800 font-medium text-sm truncate">{m.title}</p>
                <p className="text-slate-400 text-xs">{m.category}</p>
                <p className="text-slate-500 text-xs mt-1 line-clamp-2 whitespace-pre-wrap">{m.content}</p>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <button
                  onClick={() => setEditing({ id: m.id, title: m.title, category: m.category, content: m.content })}
                  className="p-2 rounded-lg text-slate-500 hover:bg-slate-100 hover:text-blue-600 transition"
                >
                  <Pencil className="w-4 h-4" />
                </button>
                <button
                  onClick={() => remove(m.id)}
                  className="p-2 rounded-lg text-slate-500 hover:bg-red-50 hover:text-red-600 transition"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {editing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-5 border-b border-slate-200">
              <h3 className="font-semibold text-slate-900">{editing.id === null ? 'Tambah Modul' : 'Edit Modul'}</h3>
              <button onClick={() => setEditing(null)} className="text-slate-400 hover:text-slate-600 transition">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="block text-slate-600 text-sm font-medium mb-1.5">Judul Modul</label>
                <input
                  type="text"
                  value={editing.title}
                  onChange={(e) => setEditing({ ...editing, title: e.target.value })}
                  placeholder="contoh: Rumus Cepat Aljabar"
                  autoFocus
                  className="w-full border-2 border-slate-200 rounded-lg px-4 py-2.5 text-slate-900 focus:outline-none focus:border-blue-600 transition"
                />
              </div>
              <div>
                <label className="block text-slate-600 text-sm font-medium mb-1.5">Kategori</label>
                <input
                  type="text"
                  value={editing.category}
                  onChange={(e) => setEditing({ ...editing, category: e.target.value })}
                  placeholder="contoh: Penalaran Matematika"
                  className="w-full border-2 border-slate-200 rounded-lg px-4 py-2.5 text-slate-900 focus:outline-none focus:border-blue-600 transition"
                />
              </div>
              <div>
                <label className="block text-slate-600 text-sm font-medium mb-1.5">Isi Materi</label>
                <textarea
                  value={editing.content}
                  onChange={(e) => setEditing({ ...editing, content: e.target.value })}
                  placeholder="Tulis materi/rangkuman di sini..."
                  rows={6}
                  className="w-full border-2 border-slate-200 rounded-lg px-4 py-2.5 text-slate-900 text-sm focus:outline-none focus:border-blue-600 transition resize-y"
                />
              </div>
            </div>
            <div className="flex gap-3 p-5 border-t border-slate-200">
              <button
                onClick={() => setEditing(null)}
                className="flex-1 py-2.5 rounded-lg border border-slate-300 text-slate-700 font-medium text-sm hover:bg-slate-50 transition"
              >
                Batal
              </button>
              <button
                onClick={save}
                className="flex-1 py-2.5 rounded-lg bg-blue-600 text-white font-medium text-sm hover:bg-blue-500 transition flex items-center justify-center gap-2"
              >
                <Save className="w-4 h-4" />
                Simpan
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
