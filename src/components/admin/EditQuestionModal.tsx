import { useState, useRef } from 'react';
import { BookOpen, Save, X, Plus, Trash2, Upload, Link as LinkIcon, ImageIcon } from 'lucide-react';
import { Question, ExplanationStep } from '@/types';

export interface QuestionForm {
  stimulus: string;
  stimulusTitle: string;
  image: string;
  question: string;
  type: 'multiple_choice' | 'numeric';
  options: string[];
  correctAnswer: string;
  explanation: ExplanationStep[];
}

export const EMPTY_QUESTION_FORM: QuestionForm = {
  stimulus: '',
  stimulusTitle: '',
  image: '',
  question: '',
  type: 'multiple_choice',
  options: ['', '', '', '', ''],
  correctAnswer: 'A',
  explanation: [{ label: '', content: '', formula: '' }],
};

interface EditQuestionModalProps {
  question: Question | null;
  onSave: (formData: QuestionForm, existingId: number | null) => void;
  onCancel: () => void;
}

export default function EditQuestionModal({ question, onSave, onCancel }: EditQuestionModalProps) {
  const [form, setForm] = useState<QuestionForm>(() => {
    if (question) {
      return {
        stimulus: question.stimulus || '',
        stimulusTitle: question.stimulusTitle || '',
        image: question.image || '',
        question: question.question,
        type: question.type,
        options: question.options ? [...question.options] : ['', '', '', '', ''],
        correctAnswer: question.correctAnswer,
        explanation:
          question.explanation.length > 0
            ? question.explanation.map((e) => ({ ...e }))
            : [{ label: '', content: '', formula: '' }],
      };
    }
    return { ...EMPTY_QUESTION_FORM, options: [...EMPTY_QUESTION_FORM.options] };
  });
  const [imageUrlInput, setImageUrlInput] = useState('');
  const [imageError, setImageError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const updateOption = (idx: number, val: string) => {
    const newOptions = [...form.options];
    newOptions[idx] = val;
    setForm({ ...form, options: newOptions });
  };

  const updateExplanation = (idx: number, field: keyof ExplanationStep, val: string) => {
    const newExp = [...form.explanation];
    newExp[idx] = { ...newExp[idx], [field]: val };
    setForm({ ...form, explanation: newExp });
  };

  const addExplanationStep = () => {
    setForm({ ...form, explanation: [...form.explanation, { label: '', content: '', formula: '' }] });
  };

  const removeExplanationStep = (idx: number) => {
    setForm({ ...form, explanation: form.explanation.filter((_, i) => i !== idx) });
  };

  const handleFileUpload = (file: File) => {
    setImageError('');
    if (!file.type.startsWith('image/')) {
      setImageError('File harus berupa gambar.');
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      setImageError('Ukuran gambar maksimal 2MB.');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result;
      if (typeof result === 'string') {
        setForm((prev) => ({ ...prev, image: result }));
      }
    };
    reader.onerror = () => setImageError('Gagal membaca file.');
    reader.readAsDataURL(file);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFileUpload(file);
  };

  const applyImageUrl = () => {
    const url = imageUrlInput.trim();
    if (!url) return;
    if (!/^https?:\/\//i.test(url)) {
      setImageError('URL harus diawali http:// atau https://');
      return;
    }
    setImageError('');
    setForm((prev) => ({ ...prev, image: url }));
  };

  const removeImage = () => {
    setForm((prev) => ({ ...prev, image: '' }));
    setImageUrlInput('');
    setImageError('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const canSave = form.question.trim().length > 0 && (form.type === 'numeric' || form.options.some((o) => o.trim()));

  const handleSave = () => {
    if (!canSave) return;
    onSave(form, question?.id ?? null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-white rounded-none sm:rounded-xl w-full max-w-2xl max-h-screen sm:max-h-[90vh] overflow-y-auto">
        {/* Modal header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-200 sticky top-0 bg-white z-10">
          <h3 className="font-semibold text-slate-900 flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-blue-600" />
            {question ? 'Edit Soal' : 'Tambah Soal Baru'}
          </h3>
          <button onClick={onCancel} className="text-slate-400 hover:text-slate-600 transition">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 space-y-5">
          {/* Type selector */}
          <div>
            <label className="block text-slate-600 text-sm font-medium mb-2">Tipe Soal</label>
            <div className="flex gap-2">
              <button
                onClick={() =>
                  setForm({
                    ...form,
                    type: 'multiple_choice',
                    correctAnswer: form.correctAnswer.length === 1 ? form.correctAnswer : 'A',
                  })
                }
                className={`px-4 py-2 rounded-lg text-sm font-medium transition border-2 ${
                  form.type === 'multiple_choice'
                    ? 'border-blue-600 bg-blue-50 text-blue-700'
                    : 'border-slate-200 text-slate-500 hover:bg-slate-50'
                }`}
              >
                Pilihan Ganda (A–E)
              </button>
              <button
                onClick={() => setForm({ ...form, type: 'numeric' })}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition border-2 ${
                  form.type === 'numeric'
                    ? 'border-blue-600 bg-blue-50 text-blue-700'
                    : 'border-slate-200 text-slate-500 hover:bg-slate-50'
                }`}
              >
                Isian Singkat (Angka/Teks)
              </button>
            </div>
          </div>

          {/* Image upload */}
          <div>
            <label className="block text-slate-600 text-sm font-medium mb-1.5">
              Gambar Soal <span className="text-slate-400 font-normal">(opsional)</span>
            </label>
            <div className="space-y-3">
              {/* Preview */}
              {form.image && (
                <div className="relative inline-block">
                  <img
                    src={form.image}
                    alt="Preview gambar soal"
                    className="max-w-full max-h-60 object-contain rounded-lg border border-slate-200 bg-white"
                  />
                  <button
                    onClick={removeImage}
                    className="absolute top-1 right-1 w-7 h-7 rounded-full bg-black/60 text-white flex items-center justify-center hover:bg-red-600 transition"
                    title="Hapus gambar"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}

              {/* Upload buttons */}
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-blue-50 text-blue-700 text-sm font-medium hover:bg-blue-100 transition border border-blue-200"
                >
                  <Upload className="w-4 h-4" />
                  Upload dari Perangkat
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </div>

              {/* URL input */}
              <div className="flex items-center gap-2">
                <div className="flex-1 flex items-center gap-2 border-2 border-slate-200 rounded-lg px-3 py-2 focus-within:border-blue-600 transition">
                  <LinkIcon className="w-4 h-4 text-slate-400 shrink-0" />
                  <input
                    type="text"
                    value={imageUrlInput}
                    onChange={(e) => setImageUrlInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), applyImageUrl())}
                    placeholder="Atau tempel URL gambar (https://...)"
                    className="flex-1 text-slate-900 text-sm focus:outline-none bg-transparent"
                  />
                </div>
                <button
                  onClick={applyImageUrl}
                  className="px-3 py-2 rounded-lg bg-slate-100 text-slate-700 text-sm font-medium hover:bg-slate-200 transition"
                >
                  <ImageIcon className="w-4 h-4" />
                </button>
              </div>

              {imageError && <p className="text-red-500 text-xs">{imageError}</p>}
              <p className="text-slate-400 text-xs">Gambar ditampilkan proporsional di ruang ujian dan pembahasan.</p>
            </div>
          </div>

          {/* Stimulus */}
          <div>
            <label className="block text-slate-600 text-sm font-medium mb-1.5">
              Stimulus / Teks Bacaan <span className="text-slate-400 font-normal">(opsional)</span>
            </label>
            <input
              type="text"
              value={form.stimulusTitle}
              onChange={(e) => setForm({ ...form, stimulusTitle: e.target.value })}
              placeholder="Judul bacaan (opsional)"
              className="w-full border-2 border-slate-200 rounded-lg px-4 py-2.5 text-slate-900 text-sm focus:outline-none focus:border-blue-600 transition mb-2"
            />
            <textarea
              value={form.stimulus}
              onChange={(e) => setForm({ ...form, stimulus: e.target.value })}
              placeholder="Tulis paragraf/bacaan panjang di sini jika soal membutuhkannya..."
              rows={4}
              className="w-full border-2 border-slate-200 rounded-lg px-4 py-2.5 text-slate-900 text-sm focus:outline-none focus:border-blue-600 transition resize-y"
            />
          </div>

          {/* Question text */}
          <div>
            <label className="block text-slate-600 text-sm font-medium mb-1.5">Pertanyaan / Teks Soal</label>
            <textarea
              value={form.question}
              onChange={(e) => setForm({ ...form, question: e.target.value })}
              placeholder="Tulis pertanyaan di sini..."
              rows={3}
              className="w-full border-2 border-slate-200 rounded-lg px-4 py-2.5 text-slate-900 text-sm focus:outline-none focus:border-blue-600 transition resize-y"
            />
          </div>

          {/* Options for multiple choice */}
          {form.type === 'multiple_choice' && (
            <div>
              <label className="block text-slate-600 text-sm font-medium mb-2">Pilihan Jawaban</label>
              <div className="space-y-2">
                {form.options.map((opt, i) => {
                  const letter = String.fromCharCode(65 + i);
                  return (
                    <div key={letter} className="flex items-center gap-2">
                      <span className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center font-bold text-slate-600 text-sm shrink-0">
                        {letter}
                      </span>
                      <input
                        type="text"
                        value={opt}
                        onChange={(e) => updateOption(i, e.target.value)}
                        placeholder={`Opsi ${letter}`}
                        className="flex-1 border-2 border-slate-200 rounded-lg px-3 py-2 text-slate-900 text-sm focus:outline-none focus:border-blue-600 transition"
                      />
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Correct answer */}
          <div>
            <label className="block text-slate-600 text-sm font-medium mb-2">Kunci Jawaban Benar</label>
            {form.type === 'multiple_choice' ? (
              <select
                value={form.correctAnswer}
                onChange={(e) => setForm({ ...form, correctAnswer: e.target.value })}
                className="w-full sm:w-48 border-2 border-slate-200 rounded-lg px-4 py-2.5 text-slate-900 text-sm focus:outline-none focus:border-blue-600 transition bg-white"
              >
                {['A', 'B', 'C', 'D', 'E'].map((l) => (
                  <option key={l} value={l}>
                    {l}
                  </option>
                ))}
              </select>
            ) : (
              <input
                type="text"
                value={form.correctAnswer}
                onChange={(e) => setForm({ ...form, correctAnswer: e.target.value })}
                placeholder="Jawaban benar (angka/teks)"
                className="w-full sm:w-64 border-2 border-slate-200 rounded-lg px-4 py-2.5 text-slate-900 text-sm focus:outline-none focus:border-blue-600 transition"
              />
            )}
          </div>

          {/* Explanation steps */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-slate-600 text-sm font-medium">Pembahasan (Langkah demi Langkah)</label>
              <button
                onClick={addExplanationStep}
                className="text-blue-600 text-xs font-medium flex items-center gap-1 hover:text-blue-500 transition"
              >
                <Plus className="w-3 h-3" />
                Tambah Langkah
              </button>
            </div>
            <div className="space-y-3">
              {form.explanation.map((step, i) => (
                <div key={i} className="bg-slate-50 rounded-lg p-3 border border-slate-200">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-slate-500">Langkah {i + 1}</span>
                    {form.explanation.length > 1 && (
                      <button onClick={() => removeExplanationStep(i)} className="text-red-400 hover:text-red-600 transition">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                  <input
                    type="text"
                    value={step.label}
                    onChange={(e) => updateExplanation(i, 'label', e.target.value)}
                    placeholder="Label langkah (contoh: Diketahui)"
                    className="w-full border border-slate-200 rounded-md px-3 py-2 text-slate-900 text-sm focus:outline-none focus:border-blue-600 transition mb-2"
                  />
                  <textarea
                    value={step.content}
                    onChange={(e) => updateExplanation(i, 'content', e.target.value)}
                    placeholder="Penjelasan langkah ini..."
                    rows={2}
                    className="w-full border border-slate-200 rounded-md px-3 py-2 text-slate-900 text-sm focus:outline-none focus:border-blue-600 transition resize-y mb-2"
                  />
                  <input
                    type="text"
                    value={step.formula || ''}
                    onChange={(e) => updateExplanation(i, 'formula', e.target.value)}
                    placeholder="Rumus (opsional, contoh: x = 6)"
                    className="w-full border border-slate-200 rounded-md px-3 py-2 text-slate-900 text-sm font-mono focus:outline-none focus:border-blue-600 transition"
                  />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Modal footer */}
        <div className="flex gap-3 p-5 border-t border-slate-200 sticky bottom-0 bg-white">
          <button
            onClick={onCancel}
            className="flex-1 py-2.5 rounded-lg border border-slate-300 text-slate-700 font-medium text-sm hover:bg-slate-50 transition"
          >
            Batal
          </button>
          <button
            onClick={handleSave}
            disabled={!canSave}
            className="flex-1 py-2.5 rounded-lg bg-blue-600 disabled:bg-slate-300 text-white font-medium text-sm hover:bg-blue-500 transition flex items-center justify-center gap-2"
          >
            <Save className="w-4 h-4" />
            Simpan Soal
          </button>
        </div>
      </div>
    </div>
  );
}
