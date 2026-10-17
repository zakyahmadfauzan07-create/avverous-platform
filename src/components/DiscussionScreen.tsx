import { useState } from 'react';
import { BookOpen, CheckCircle2, XCircle, ChevronDown, ChevronUp, ArrowLeft, GraduationCap } from 'lucide-react';
import { ExamProgress, Question, Subtest } from '@/types';
import QuestionImage from '@/components/QuestionImage';

interface DiscussionScreenProps {
  progress: ExamProgress;
  onBack: () => void;
  subtests: Subtest[];
}

export default function DiscussionScreen({ progress, onBack, subtests }: DiscussionScreenProps) {
  const [activeSubtestId, setActiveSubtestId] = useState(subtests[0]?.id ?? 0);
  const [expandedQuestions, setExpandedQuestions] = useState<Set<number>>(new Set());

  const activeSubtest = subtests.find((s) => s.id === activeSubtestId);
  const subState = progress.subtestStates.find((s) => s.subtestId === activeSubtestId);

  if (!activeSubtest || !subState) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center">
        <p className="text-slate-400">Tidak ada data pembahasan.</p>
      </div>
    );
  }

  const toggleExpand = (qId: number) => {
    setExpandedQuestions((prev) => {
      const next = new Set(prev);
      if (next.has(qId)) next.delete(qId);
      else next.add(qId);
      return next;
    });
  };

  const isCorrect = (q: Question) => {
    const ans = subState.answers[q.id];
    if (!ans) return false;
    return ans.trim().toLowerCase() === q.correctAnswer.trim().toLowerCase();
  };

  return (
    <div className="min-h-screen bg-slate-100">
      {/* Header */}
      <header className="bg-slate-900 text-white px-4 py-3 flex items-center justify-between shadow-md sticky top-0 z-20">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-blue-600 rounded-lg flex items-center justify-center">
            <GraduationCap className="w-5 h-5" />
          </div>
          <div>
            <p className="font-semibold text-sm leading-tight">Pembahasan Soal</p>
            <p className="text-slate-400 text-xs">{progress.participantName}</p>
          </div>
        </div>
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-slate-700 hover:bg-slate-600 text-white text-sm font-medium transition"
        >
          <ArrowLeft className="w-4 h-4" />
          Kembali ke Hasil
        </button>
      </header>

      {/* Subtest tabs */}
      <div className="bg-white border-b border-slate-200 px-4 sticky top-[57px] z-10">
        <div className="max-w-4xl mx-auto flex gap-1">
          {subtests.map((st) => (
            <button
              key={st.id}
              onClick={() => setActiveSubtestId(st.id)}
              className={`px-5 py-3 text-sm font-medium border-b-2 transition ${
                activeSubtestId === st.id
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-slate-500 hover:text-slate-700'
              }`}
            >
              {st.name}
            </button>
          ))}
        </div>
      </div>

      {/* Questions */}
      <div className="max-w-4xl mx-auto p-4 md:p-6 space-y-4">
        {activeSubtest.questions.map((q, idx) => {
          const expanded = expandedQuestions.has(q.id);
          const correct = isCorrect(q);
          const studentAnswer = subState.answers[q.id];
          const noAnswer = !studentAnswer;

          return (
            <div key={q.id} className="bg-white rounded-xl border border-slate-200 overflow-hidden">
              {/* Question header */}
              <button
                onClick={() => toggleExpand(q.id)}
                className="w-full flex items-start gap-3 p-4 md:p-5 text-left hover:bg-slate-50 transition"
              >
                <span className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center font-bold text-slate-600 text-sm shrink-0 mt-0.5">
                  {idx + 1}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-slate-800 text-sm md:text-base font-medium leading-relaxed line-clamp-2">
                    {q.question}
                  </p>
                  <div className="flex items-center gap-2 mt-2">
                    {noAnswer ? (
                      <span className="inline-flex items-center gap-1 text-xs text-slate-400 bg-slate-100 px-2 py-0.5 rounded">
                        Tidak dijawab
                      </span>
                    ) : correct ? (
                      <span className="inline-flex items-center gap-1 text-xs text-green-700 bg-green-100 px-2 py-0.5 rounded">
                        <CheckCircle2 className="w-3 h-3" /> Benar
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-xs text-red-700 bg-red-100 px-2 py-0.5 rounded">
                        <XCircle className="w-3 h-3" /> Salah
                      </span>
                    )}
                  </div>
                </div>
                <div className="shrink-0 mt-1">
                  {expanded ? <ChevronUp className="w-5 h-5 text-slate-400" /> : <ChevronDown className="w-5 h-5 text-slate-400" />}
                </div>
              </button>

              {/* Expanded content */}
              {expanded && (
                <div className="border-t border-slate-200 p-4 md:p-5 bg-slate-50/50">
                  {/* Stimulus if present */}
                  {q.stimulus && (
                    <div className="mb-4 bg-blue-50 border border-blue-100 rounded-lg p-3">
                      <p className="text-xs font-semibold text-blue-700 mb-1">{q.stimulusTitle || 'Bacaan'}</p>
                      <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">{q.stimulus}</p>
                    </div>
                  )}

                  {/* Question text */}
                  <p className="text-slate-800 text-sm md:text-base mb-4 leading-relaxed">{q.question}</p>

                  <QuestionImage src={q.image} />

                  {/* Options for multiple choice */}
                  {q.type === 'multiple_choice' && q.options && (
                    <div className="space-y-2 mb-4">
                      {q.options.map((opt, i) => {
                        const letter = String.fromCharCode(65 + i);
                        const isCorrectOpt = letter === q.correctAnswer;
                        const isStudentOpt = studentAnswer === letter;
                        return (
                          <div
                            key={letter}
                            className={`flex items-center gap-3 p-2.5 rounded-lg border text-sm ${
                              isCorrectOpt
                                ? 'border-green-300 bg-green-50'
                                : isStudentOpt
                                ? 'border-red-300 bg-red-50'
                                : 'border-slate-200 bg-white'
                            }`}
                          >
                            <span
                              className={`w-7 h-7 rounded flex items-center justify-center font-bold text-xs shrink-0 ${
                                isCorrectOpt
                                  ? 'bg-green-600 text-white'
                                  : isStudentOpt
                                  ? 'bg-red-500 text-white'
                                  : 'bg-slate-100 text-slate-600'
                              }`}
                            >
                              {letter}
                            </span>
                            <span className="text-slate-700">{opt}</span>
                            {isCorrectOpt && (
                              <span className="ml-auto text-xs text-green-600 font-medium">Kunci</span>
                            )}
                            {isStudentOpt && !isCorrectOpt && (
                              <span className="ml-auto text-xs text-red-500 font-medium">Jawabanmu</span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* Numeric answer comparison */}
                  {q.type === 'numeric' && (
                    <div className="grid grid-cols-2 gap-3 mb-4">
                      <div className="bg-white border border-slate-200 rounded-lg p-3">
                        <p className="text-xs text-slate-500 mb-1">Jawaban Kamu</p>
                        <p className={`font-bold text-sm ${noAnswer ? 'text-slate-400' : correct ? 'text-green-600' : 'text-red-500'}`}>
                          {noAnswer ? '(kosong)' : studentAnswer}
                        </p>
                      </div>
                      <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                        <p className="text-xs text-green-600 mb-1">Kunci Jawaban</p>
                        <p className="font-bold text-sm text-green-700">{q.correctAnswer}</p>
                      </div>
                    </div>
                  )}

                  {/* Explanation */}
                  <div className="bg-white border border-slate-200 rounded-lg p-4">
                    <h4 className="flex items-center gap-2 text-sm font-semibold text-slate-800 mb-3">
                      <BookOpen className="w-4 h-4 text-blue-600" />
                      Pembahasan
                    </h4>
                    <div className="space-y-3">
                      {q.explanation.map((step, i) => (
                        <div key={i} className="flex gap-3">
                          <div className="flex flex-col items-center shrink-0">
                            <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 text-xs font-bold flex items-center justify-center">
                              {i + 1}
                            </span>
                            {i < q.explanation.length - 1 && <span className="w-px h-full bg-slate-200 mt-1" />}
                          </div>
                          <div className="pb-1 flex-1">
                            <p className="text-xs font-semibold text-blue-600 mb-0.5">{step.label}</p>
                            <p className="text-sm text-slate-700 leading-relaxed">{step.content}</p>
                            {step.formula && (
                              <div className="mt-1.5 bg-slate-100 rounded-md px-3 py-2 font-mono text-sm text-slate-800 overflow-x-auto">
                                {step.formula}
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
