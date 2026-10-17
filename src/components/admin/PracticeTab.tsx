import { useState } from 'react';
import { Plus, Pencil, Trash2, FileQuestion, BookOpen } from 'lucide-react';
import { PracticeQuestion } from '@/types';
import { generateId } from '@/lib/subtestStore';
import EditQuestionModal, { QuestionForm, EMPTY_QUESTION_FORM } from './EditQuestionModal';
import QuestionImage from '@/components/QuestionImage';

interface PracticeTabProps {
  questions: PracticeQuestion[];
  onChange: (questions: PracticeQuestion[]) => void;
}

function toForm(q: PracticeQuestion): QuestionForm {
  return {
    stimulus: '',
    stimulusTitle: '',
    image: q.image || '',
    question: q.question,
    type: q.type,
    options: q.options ? [...q.options] : ['', '', '', '', ''],
    correctAnswer: q.correctAnswer,
    explanation: q.explanation.length > 0 ? q.explanation.map((e) => ({ ...e })) : [{ label: '', content: '', formula: '' }],
  };
}

function fromForm(form: QuestionForm, id: number): PracticeQuestion {
  const options = form.type === 'multiple_choice' ? form.options.filter((o) => o.trim()) : undefined;
  const explanation = form.explanation.filter((e) => e.content.trim() || e.label.trim());
  return {
    id,
    type: form.type,
    image: form.image || undefined,
    question: form.question.trim(),
    options,
    correctAnswer: form.correctAnswer.trim(),
    explanation,
  };
}

export default function PracticeTab({ questions, onChange }: PracticeTabProps) {
  const [editing, setEditing] = useState<{ question: PracticeQuestion | null } | null>(null);

  const saveQuestion = (form: QuestionForm, existingId: number | null) => {
    if (existingId) {
      onChange(questions.map((q) => (q.id === existingId ? fromForm(form, q.id) : q)));
    } else {
      onChange([...questions, fromForm(form, generateId())]);
    }
    setEditing(null);
  };

  const deleteQuestion = (id: number) => {
    onChange(questions.filter((q) => q.id !== id));
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-semibold text-slate-800 flex items-center gap-2">
          <FileQuestion className="w-5 h-5 text-yellow-600" />
          Bank Latihan Soal
        </h2>
        <button
          onClick={() => setEditing({ question: null })}
          className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-yellow-600 hover:bg-yellow-500 text-white text-sm font-medium transition"
        >
          <Plus className="w-4 h-4" />
          Tambah Soal Latihan
        </button>
      </div>

      {questions.length === 0 ? (
        <p className="text-slate-400 text-sm text-center py-6">Belum ada soal latihan. Klik "Tambah Soal Latihan" untuk memulai.</p>
      ) : (
        <div className="space-y-2">
          {questions.map((q, idx) => (
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
                  {q.image && <span className="text-xs text-blue-600 bg-blue-100 px-2 py-0.5 rounded flex items-center gap-1"><BookOpen className="w-3 h-3" /> Ada gambar</span>}
                </div>
                {q.image && <QuestionImage src={q.image} className="mt-2 [&_img]:max-h-32" />}
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <button
                  onClick={() => setEditing({ question: q })}
                  className="p-2 rounded-lg text-slate-500 hover:bg-slate-100 hover:text-blue-600 transition"
                >
                  <Pencil className="w-4 h-4" />
                </button>
                <button
                  onClick={() => deleteQuestion(q.id)}
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
        <EditQuestionModal
          question={editing.question ? { ...editing.question, stimulus: undefined, stimulusTitle: undefined } : null}
          onSave={saveQuestion}
          onCancel={() => setEditing(null)}
        />
      )}
    </div>
  );
}
