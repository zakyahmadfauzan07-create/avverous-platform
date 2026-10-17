import { useState } from 'react';
import {
  Plus,
  Pencil,
  Trash2,
  Clock,
  BookOpen,
  Save,
  X,
  RotateCcw,
  ListChecks,
  AlertTriangle,
  Package as PackageIcon,
  ChevronDown,
  Check,
} from 'lucide-react';
import { Subtest, Question } from '@/types';
import { TryoutPackage } from '@/data/questions';
import { generateId } from '@/lib/subtestStore';
import EditQuestionModal, { QuestionForm } from './EditQuestionModal';
import QuestionImage from '@/components/QuestionImage';

interface QuestionsTabProps {
  packages: TryoutPackage[];
  onPackagesChange: (packages: TryoutPackage[]) => void;
  onResetPackages: () => void;
}

export default function QuestionsTab({ packages, onPackagesChange, onResetPackages }: QuestionsTabProps) {
  const [activePackageId, setActivePackageId] = useState<number>(packages[0]?.id ?? 0);
  const [packageDropdownOpen, setPackageDropdownOpen] = useState(false);
  const [editingSubtest, setEditingSubtest] = useState<{ id: number | null; name: string; durationMinutes: number } | null>(null);
  const [editingQuestion, setEditingQuestion] = useState<{ subtestId: number; question: Question | null } | null>(null);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [creatingPackage, setCreatingPackage] = useState(false);
  const [newPackageName, setNewPackageName] = useState('');
  const [editingPackage, setEditingPackage] = useState<{ id: number; name: string; description: string } | null>(null);
  const [subtestToDelete, setSubtestToDelete] = useState<number | null>(null);

  const activePackage = packages.find((p) => p.id === activePackageId) ?? packages[0] ?? null;
  const subtests = activePackage?.subtests ?? [];
  const [activeSubtestId, setActiveSubtestId] = useState<number | null>(null);

  // Sync active subtest when package changes
  const currentSubtestId = activeSubtestId && subtests.find((s) => s.id === activeSubtestId)
    ? activeSubtestId
    : subtests[0]?.id ?? null;
  const activeSubtest = subtests.find((s) => s.id === currentSubtestId) ?? null;

  // --- Package-level update helper ---
  const updatePackage = (pkgId: number, updater: (pkg: TryoutPackage) => TryoutPackage) => {
    onPackagesChange(packages.map((p) => (p.id === pkgId ? updater(p) : p)));
  };

  // --- Package CRUD ---
  const handleAddPackage = () => {
    const maxId = packages.reduce((max, p) => Math.max(max, p.id), 0);
    const newPkg: TryoutPackage = {
      id: maxId + 1,
      name: newPackageName.trim() || `Paket Tryout ${maxId + 1}`,
      description: 'Paket tryout baru. Tambahkan subtes dan soal untuk paket ini.',
      subtests: [],
    };
    onPackagesChange([...packages, newPkg]);
    setActivePackageId(newPkg.id);
    setNewPackageName('');
    setCreatingPackage(false);
  };

  const handleDeletePackage = (pkgId: number) => {
    if (packages.length <= 1) return;
    const filtered = packages.filter((p) => p.id !== pkgId);
    onPackagesChange(filtered);
    if (activePackageId === pkgId) setActivePackageId(filtered[0].id);
  };

  const handleSavePackageMeta = (id: number, name: string, description: string) => {
    updatePackage(id, (p) => ({
      ...p,
      name: name.trim() || p.name,
      description: description.trim() || p.description,
    }));
    setEditingPackage(null);
  };

  // --- Subtest CRUD (per active package) ---
  const saveSubtest = (name: string, duration: number) => {
    if (!editingSubtest || !activePackage) return;
    const pkgId = activePackage.id;
    if (editingSubtest.id === null) {
      const newSub: Subtest = {
        id: generateId(),
        name: name.trim() || 'Subtes Baru',
        shortName: name.trim().slice(0, 3).toUpperCase() || 'NEW',
        description: '',
        durationMinutes: duration,
        questions: [],
      };
      updatePackage(pkgId, (p) => ({ ...p, subtests: [...p.subtests, newSub] }));
      setActiveSubtestId(newSub.id);
    } else {
      updatePackage(pkgId, (p) => ({
        ...p,
        subtests: p.subtests.map((s) =>
          s.id === editingSubtest.id
            ? {
                ...s,
                name: name.trim() || s.name,
                shortName: name.trim().slice(0, 3).toUpperCase() || s.shortName,
                durationMinutes: duration,
              }
            : s,
        ),
      }));
    }
    setEditingSubtest(null);
  };

  const deleteSubtest = (id: number) => {
    if (!activePackage) return;
    const pkgId = activePackage.id;
    updatePackage(pkgId, (p) => ({ ...p, subtests: p.subtests.filter((s) => s.id !== id) }));
    if (currentSubtestId === id) setActiveSubtestId(null);
  };

  // --- Question CRUD (per active subtest in active package) ---
  const saveQuestion = (subtestId: number, formData: QuestionForm, existingId: number | null) => {
    if (!activePackage) return;
    const pkgId = activePackage.id;
    const options = formData.type === 'multiple_choice' ? formData.options.filter((o) => o.trim()) : undefined;
    const explanation = formData.explanation.filter((e) => e.content.trim() || e.label.trim());
    const image = formData.image.trim() || undefined;

    if (existingId) {
      updatePackage(pkgId, (p) => ({
        ...p,
        subtests: p.subtests.map((s) =>
          s.id === subtestId
            ? {
                ...s,
                questions: s.questions.map((q) =>
                  q.id === existingId
                    ? {
                        ...q,
                        stimulus: formData.stimulus.trim() || undefined,
                        stimulusTitle: formData.stimulusTitle.trim() || undefined,
                        image,
                        question: formData.question.trim(),
                        type: formData.type,
                        options,
                        correctAnswer: formData.correctAnswer.trim(),
                        explanation,
                      }
                    : q,
                ),
              }
            : s,
        ),
      }));
    } else {
      const newQ: Question = {
        id: generateId(),
        type: formData.type,
        stimulus: formData.stimulus.trim() || undefined,
        stimulusTitle: formData.stimulusTitle.trim() || undefined,
        image,
        question: formData.question.trim(),
        options,
        correctAnswer: formData.correctAnswer.trim(),
        explanation,
      };
      updatePackage(pkgId, (p) => ({
        ...p,
        subtests: p.subtests.map((s) => (s.id === subtestId ? { ...s, questions: [...s.questions, newQ] } : s)),
      }));
    }
    setEditingQuestion(null);
  };

  const deleteQuestion = (subtestId: number, qId: number) => {
    if (!activePackage) return;
    const pkgId = activePackage.id;
    updatePackage(pkgId, (p) => ({
      ...p,
      subtests: p.subtests.map((s) =>
        s.id === subtestId ? { ...s, questions: s.questions.filter((q) => q.id !== qId) } : s,
      ),
    }));
  };

  const totalQuestions = subtests.reduce((acc, s) => acc + s.questions.length, 0);
  const totalMinutes = subtests.reduce((acc, s) => acc + s.durationMinutes, 0);

  return (
    <div className="space-y-6">
      {/* ===== Package Selector ===== */}
      <div className="bg-white rounded-xl border border-slate-200 p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-slate-800 flex items-center gap-2">
            <PackageIcon className="w-5 h-5 text-blue-600" />
            Pilih Paket Tryout
          </h2>
          <button
            onClick={() => setCreatingPackage(true)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium transition"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">Tambah Paket Baru</span>
          </button>
        </div>

        {/* Dropdown */}
        <div className="relative">
          <button
            onClick={() => setPackageDropdownOpen(!packageDropdownOpen)}
            className="w-full flex items-center justify-between p-3.5 border-2 border-slate-200 rounded-lg hover:border-blue-300 transition text-left"
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-lg bg-blue-600/15 flex items-center justify-center text-blue-600 font-bold shrink-0">
                {activePackage?.id ?? '?'}
              </div>
              <div className="min-w-0">
                <p className="text-slate-800 font-medium text-sm truncate">{activePackage?.name ?? 'Tidak ada paket'}</p>
                <p className="text-slate-400 text-xs">
                  {subtests.length} subtes · {totalQuestions} soal · {totalMinutes} menit
                </p>
              </div>
            </div>
            <ChevronDown className={`w-5 h-5 text-slate-400 transition shrink-0 ${packageDropdownOpen ? 'rotate-180' : ''}`} />
          </button>

          {packageDropdownOpen && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-lg shadow-lg z-10 max-h-72 overflow-y-auto">
              {packages.map((pkg) => (
                <button
                  key={pkg.id}
                  onClick={() => {
                    setActivePackageId(pkg.id);
                    setActiveSubtestId(null);
                    setPackageDropdownOpen(false);
                  }}
                  className={`w-full flex items-center justify-between p-3 hover:bg-blue-50 transition text-left border-b border-slate-50 last:border-0 ${
                    pkg.id === activePackageId ? 'bg-blue-50' : ''
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-8 h-8 rounded-lg bg-blue-600/15 flex items-center justify-center text-blue-600 font-bold text-xs shrink-0">
                      {pkg.id}
                    </div>
                    <div className="min-w-0">
                      <p className="text-slate-800 font-medium text-sm truncate">{pkg.name}</p>
                      <p className="text-slate-400 text-xs">
                        {pkg.subtests.length} subtes · {pkg.subtests.reduce((a, s) => a + s.questions.length, 0)} soal
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={() => {
                        setEditingPackage({ id: pkg.id, name: pkg.name, description: pkg.description });
                        setPackageDropdownOpen(false);
                      }}
                      className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-blue-600 transition"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    {packages.length > 1 && (
                      <button
                        onClick={() => handleDeletePackage(pkg.id)}
                        className="p-1.5 rounded-lg text-slate-400 hover:bg-red-50 hover:text-red-600 transition"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                    {pkg.id === activePackageId && <Check className="w-4 h-4 text-blue-600 shrink-0" />}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ===== Subtest section ===== */}
      <div className="bg-white rounded-xl border border-slate-200 p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-slate-800 flex items-center gap-2">
            <ListChecks className="w-5 h-5 text-blue-600" />
            Kelola Subtes
            {activePackage && <span className="text-slate-400 text-sm font-normal">— {activePackage.name}</span>}
          </h2>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowResetConfirm(true)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-medium transition"
            >
              <RotateCcw className="w-4 h-4" />
              <span className="hidden sm:inline">Reset Default</span>
            </button>
            <button
              onClick={() => setEditingSubtest({ id: null, name: '', durationMinutes: 5 })}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium transition"
            >
              <Plus className="w-4 h-4" />
              Tambah Subtes
            </button>
          </div>
        </div>

        {subtests.length === 0 ? (
          <p className="text-slate-400 text-sm text-center py-6">Belum ada subtes di paket ini. Klik "Tambah Subtes" untuk memulai.</p>
        ) : (
          <div className="space-y-2">
            {subtests.map((st) => (
              <div
                key={st.id}
                className={`flex items-center justify-between p-3.5 rounded-lg border-2 transition cursor-pointer ${
                  currentSubtestId === st.id ? 'border-blue-400 bg-blue-50' : 'border-slate-200 bg-white hover:bg-slate-50'
                }`}
                onClick={() => setActiveSubtestId(st.id)}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-lg bg-blue-600/15 flex items-center justify-center text-blue-600 font-bold text-xs shrink-0">
                    {st.shortName}
                  </div>
                  <div className="min-w-0">
                    <p className="text-slate-800 font-medium text-sm truncate">{st.name}</p>
                    <p className="text-slate-400 text-xs flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {st.durationMinutes} menit · {st.questions.length} soal
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 shrink-0" onClick={(e) => e.stopPropagation()}>
                  <button
                    onClick={() => setEditingSubtest({ id: st.id, name: st.name, durationMinutes: st.durationMinutes })}
                    className="p-2 rounded-lg text-slate-500 hover:bg-slate-100 hover:text-blue-600 transition"
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setSubtestToDelete(st.id)}
                    className="p-2 rounded-lg text-slate-500 hover:bg-red-50 hover:text-red-600 transition"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ===== Questions section ===== */}
      {activeSubtest && (
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-slate-800 flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-blue-600" />
              Soal: {activeSubtest.name}
            </h2>
            <button
              onClick={() => setEditingQuestion({ subtestId: activeSubtest.id, question: null })}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-green-600 hover:bg-green-500 text-white text-sm font-medium transition"
            >
              <Plus className="w-4 h-4" />
              Tambah Soal
            </button>
          </div>

          {activeSubtest.questions.length === 0 ? (
            <p className="text-slate-400 text-sm text-center py-6">Belum ada soal di subtes ini.</p>
          ) : (
            <div className="space-y-2">
              {activeSubtest.questions.map((q, idx) => (
                <div key={q.id} className="flex items-start gap-3 p-3.5 rounded-lg border border-slate-200 hover:bg-slate-50 transition">
                  <span className="w-7 h-7 rounded-lg bg-slate-100 flex items-center justify-center font-bold text-slate-600 text-xs shrink-0 mt-0.5">
                    {idx + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-slate-800 text-sm font-medium line-clamp-2">{q.question}</p>
                    <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                      <span className="text-xs text-slate-400 bg-slate-100 px-2 py-0.5 rounded">
                        {q.type === 'multiple_choice' ? 'Pilihan Ganda' : 'Isian Singkat'}
                      </span>
                      <span className="text-xs text-green-600 bg-green-100 px-2 py-0.5 rounded">Kunci: {q.correctAnswer}</span>
                      {q.image && (
                        <span className="text-xs text-blue-600 bg-blue-100 px-2 py-0.5 rounded flex items-center gap-1">
                          <BookOpen className="w-3 h-3" /> Ada gambar
                        </span>
                      )}
                    </div>
                    {q.image && <QuestionImage src={q.image} className="mt-2 [&_img]:max-h-32" />}
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={() => setEditingQuestion({ subtestId: activeSubtest.id, question: q })}
                      className="p-2 rounded-lg text-slate-500 hover:bg-slate-100 hover:text-blue-600 transition"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => deleteQuestion(activeSubtest.id, q.id)}
                      className="p-2 rounded-lg text-slate-500 hover:bg-red-50 hover:text-red-600 transition"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ===== Modals ===== */}

      {/* Create new package */}
      {creatingPackage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-semibold text-slate-900">Tambah Paket Tryout Baru</h3>
              <button onClick={() => setCreatingPackage(false)} className="text-slate-400 hover:text-slate-600 transition">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div>
              <label className="block text-slate-600 text-sm font-medium mb-1.5">Nama Paket</label>
              <input
                type="text"
                value={newPackageName}
                onChange={(e) => setNewPackageName(e.target.value)}
                placeholder="contoh: Paket Tryout 4"
                autoFocus
                className="w-full border-2 border-slate-200 rounded-lg px-4 py-2.5 text-slate-900 focus:outline-none focus:border-blue-600 transition"
              />
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setCreatingPackage(false)}
                className="flex-1 py-2.5 rounded-lg border border-slate-300 text-slate-700 font-medium text-sm hover:bg-slate-50 transition"
              >
                Batal
              </button>
              <button
                onClick={handleAddPackage}
                className="flex-1 py-2.5 rounded-lg bg-blue-600 text-white font-medium text-sm hover:bg-blue-500 transition flex items-center justify-center gap-2"
              >
                <Save className="w-4 h-4" />
                Buat Paket
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit package meta */}
      {editingPackage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-semibold text-slate-900">Edit Paket Tryout</h3>
              <button onClick={() => setEditingPackage(null)} className="text-slate-400 hover:text-slate-600 transition">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-slate-600 text-sm font-medium mb-1.5">Nama Paket</label>
                <input
                  type="text"
                  value={editingPackage.name}
                  onChange={(e) => setEditingPackage({ ...editingPackage, name: e.target.value })}
                  className="w-full border-2 border-slate-200 rounded-lg px-4 py-2.5 text-slate-900 focus:outline-none focus:border-blue-600 transition"
                />
              </div>
              <div>
                <label className="block text-slate-600 text-sm font-medium mb-1.5">Deskripsi</label>
                <textarea
                  value={editingPackage.description}
                  onChange={(e) => setEditingPackage({ ...editingPackage, description: e.target.value })}
                  rows={2}
                  className="w-full border-2 border-slate-200 rounded-lg px-4 py-2.5 text-slate-900 focus:outline-none focus:border-blue-600 transition resize-none"
                />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setEditingPackage(null)}
                className="flex-1 py-2.5 rounded-lg border border-slate-300 text-slate-700 font-medium text-sm hover:bg-slate-50 transition"
              >
                Batal
              </button>
              <button
                onClick={() => handleSavePackageMeta(editingPackage.id, editingPackage.name, editingPackage.description)}
                className="flex-1 py-2.5 rounded-lg bg-blue-600 text-white font-medium text-sm hover:bg-blue-500 transition flex items-center justify-center gap-2"
              >
                <Save className="w-4 h-4" />
                Simpan
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit subtest */}
      {editingSubtest && (
        <EditSubtestModal editing={editingSubtest} onSave={saveSubtest} onCancel={() => setEditingSubtest(null)} />
      )}

      {/* Edit question */}
      {editingQuestion && (
        <EditQuestionModal
          question={editingQuestion.question}
          onSave={(formData, existingId) => saveQuestion(editingQuestion.subtestId, formData, existingId)}
          onCancel={() => setEditingQuestion(null)}
        />
      )}

      {/* Delete subtest confirm */}
      {subtestToDelete !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-xl w-full max-w-sm p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center">
                <AlertTriangle className="w-6 h-6 text-red-600" />
              </div>
              <div>
                <h3 className="font-semibold text-slate-900">Hapus Subtes?</h3>
                <p className="text-slate-500 text-sm">Semua soal di dalamnya akan ikut terhapus.</p>
              </div>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setSubtestToDelete(null)}
                className="flex-1 py-2.5 rounded-lg border border-slate-300 text-slate-700 font-medium text-sm hover:bg-slate-50 transition"
              >
                Batal
              </button>
              <button
                onClick={() => {
                  deleteSubtest(subtestToDelete);
                  setSubtestToDelete(null);
                }}
                className="flex-1 py-2.5 rounded-lg bg-red-600 text-white font-medium text-sm hover:bg-red-500 transition"
              >
                Ya, Hapus
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reset confirm */}
      {showResetConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-xl w-full max-w-sm p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-full bg-yellow-100 flex items-center justify-center">
                <AlertTriangle className="w-6 h-6 text-yellow-600" />
              </div>
              <div>
                <h3 className="font-semibold text-slate-900">Reset ke Paket Default?</h3>
                <p className="text-slate-500 text-sm">Semua perubahan paket & soal akan hilang.</p>
              </div>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowResetConfirm(false)}
                className="flex-1 py-2.5 rounded-lg border border-slate-300 text-slate-700 font-medium text-sm hover:bg-slate-50 transition"
              >
                Batal
              </button>
              <button
                onClick={() => {
                  onResetPackages();
                  setShowResetConfirm(false);
                }}
                className="flex-1 py-2.5 rounded-lg bg-red-600 text-white font-medium text-sm hover:bg-red-500 transition"
              >
                Ya, Reset
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ---- Edit Subtest Modal ----
function EditSubtestModal({
  editing,
  onSave,
  onCancel,
}: {
  editing: { id: number | null; name: string; durationMinutes: number };
  onSave: (name: string, duration: number) => void;
  onCancel: () => void;
}) {
  const [name, setName] = useState(editing.name);
  const [duration, setDuration] = useState(String(editing.durationMinutes));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-white rounded-xl w-full max-w-md p-6">
        <div className="flex items-center justify-between mb-5">
          <h3 className="font-semibold text-slate-900">{editing.id === null ? 'Tambah Subtes Baru' : 'Edit Subtes'}</h3>
          <button onClick={onCancel} className="text-slate-400 hover:text-slate-600 transition">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="space-y-4">
          <div>
            <label className="block text-slate-600 text-sm font-medium mb-1.5">Nama Subtes</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="contoh: Penalaran Matematika"
              autoFocus
              className="w-full border-2 border-slate-200 rounded-lg px-4 py-2.5 text-slate-900 focus:outline-none focus:border-blue-600 transition"
            />
          </div>
          <div>
            <label className="block text-slate-600 text-sm font-medium mb-1.5">Durasi Waktu (menit)</label>
            <input
              type="number"
              min={1}
              value={duration}
              onChange={(e) => setDuration(e.target.value)}
              className="w-full border-2 border-slate-200 rounded-lg px-4 py-2.5 text-slate-900 focus:outline-none focus:border-blue-600 transition"
            />
          </div>
        </div>
        <div className="flex gap-3 mt-6">
          <button
            onClick={onCancel}
            className="flex-1 py-2.5 rounded-lg border border-slate-300 text-slate-700 font-medium text-sm hover:bg-slate-50 transition"
          >
            Batal
          </button>
          <button
            onClick={() => onSave(name, Math.max(1, parseInt(duration) || 5))}
            className="flex-1 py-2.5 rounded-lg bg-blue-600 text-white font-medium text-sm hover:bg-blue-500 transition flex items-center justify-center gap-2"
          >
            <Save className="w-4 h-4" />
            Simpan
          </button>
        </div>
      </div>
    </div>
  );
}
