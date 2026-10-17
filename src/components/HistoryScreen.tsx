import { useState, useEffect } from 'react';
import { ArrowLeft, Trophy, Calendar, ChevronRight, GraduationCap, Loader2, BookOpen, Clock, CheckCircle2, XCircle, Circle, Package } from 'lucide-react';
import { supabase, UserProfile } from '@/lib/supabase';
import { fetchMyResults, ExamResultWithId } from '@/lib/examResultsStore';
import type { User } from '@supabase/supabase-js';
import { SubtestResult, Subtest, Question } from '@/types';
import QuestionImage from '@/components/QuestionImage';

interface HistoryScreenProps {
  user: User;
  profile: UserProfile | null;
  onBackHome: () => void;
}

export default function HistoryScreen({ user, profile, onBackHome }: HistoryScreenProps) {
  const [results, setResults] = useState<ExamResultWithId[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selected, setSelected] = useState<ExamResultWithId | null>(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const data = await fetchMyResults();
        if (mounted) {
          setResults(data);
          setLoading(false);
        }
      } catch (e) {
        if (mounted) {
          setError('Gagal memuat riwayat. Coba lagi nanti.');
          setLoading(false);
        }
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  if (selected) {
    return <HistoryDetail record={selected} onBack={() => setSelected(null)} />;
  }

  return (
    <div className="min-h-screen bg-slate-100">
      {/* Header */}
      <header className="bg-slate-900 text-white px-4 py-3 flex items-center justify-between shadow-md sticky top-0 z-20">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-blue-600 rounded-lg flex items-center justify-center">
            <Trophy className="w-5 h-5 text-yellow-400" />
          </div>
          <div>
            <p className="font-semibold text-sm leading-tight">Riwayat Tryout Saya</p>
            <p className="text-slate-400 text-xs">{profile?.full_name || user.email}</p>
          </div>
        </div>
        <button
          onClick={onBackHome}
          className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-slate-700 hover:bg-slate-600 text-white text-sm font-medium transition"
        >
          <ArrowLeft className="w-4 h-4" />
          Beranda
        </button>
      </header>

      <div className="max-w-3xl mx-auto p-4 md:p-6">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
          </div>
        ) : error ? (
          <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
            <p className="text-red-600 text-sm">{error}</p>
          </div>
        ) : results.length === 0 ? (
          <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Trophy className="w-8 h-8 text-slate-400" />
            </div>
            <p className="text-slate-600 font-medium mb-1">Belum ada riwayat tryout</p>
            <p className="text-slate-400 text-sm">Selesaikan tryout pertama kamu untuk melihat hasilnya di sini.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {results.map((r) => (
              <button
                key={r.dbId}
                onClick={() => setSelected(r)}
                className="w-full bg-white hover:bg-blue-50 border border-slate-200 hover:border-blue-300 rounded-xl p-5 transition text-left group flex items-center gap-4"
              >
                <div className="w-12 h-12 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold shrink-0">
                  {r.packageId}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-slate-800 text-sm">{r.packageName}</p>
                  <p className="text-slate-400 text-xs flex items-center gap-1.5 mt-1">
                    <Calendar className="w-3.5 h-3.5" />
                    {new Date(r.completedAt).toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' })}
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-2xl font-bold text-blue-700">{r.totalScore}</p>
                  <p className="text-slate-400 text-xs">/ 1000</p>
                </div>
                <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-blue-600 transition shrink-0" />
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ---- History Detail (reuses discussion-style layout) ----
function HistoryDetail({ record, onBack }: { record: ExamResultWithId; onBack: () => void }) {
  const [activeSubtestIdx, setActiveSubtestIdx] = useState(0);

  const subtests: Subtest[] = record.subtests;
  const activeSubtest = subtests[activeSubtestIdx];

  return (
    <div className="min-h-screen bg-slate-100">
      <header className="bg-slate-900 text-white px-4 py-3 flex items-center justify-between shadow-md sticky top-0 z-20">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-blue-600 rounded-lg flex items-center justify-center">
            <BookOpen className="w-5 h-5 text-yellow-400" />
          </div>
          <div>
            <p className="font-semibold text-sm leading-tight">Pembahasan Tryout</p>
            <p className="text-slate-400 text-xs">{record.packageName}</p>
          </div>
        </div>
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-slate-700 hover:bg-slate-600 text-white text-sm font-medium transition"
        >
          <ArrowLeft className="w-4 h-4" />
          Kembali
        </button>
      </header>

      <div className="max-w-4xl mx-auto p-4 md:p-6 space-y-5">
        {/* Summary card */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 text-center">
          <p className="text-slate-500 text-sm mb-1">{record.participantName}</p>
          <p className="text-slate-400 text-xs mb-3">
            {new Date(record.completedAt).toLocaleString('id-ID', {
              day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit',
            })}
          </p>
          <h1 className="text-5xl font-bold text-blue-700 mb-1">
            {record.totalScore}
            <span className="text-slate-400 text-2xl font-medium"> / 1000</span>
          </h1>
        </div>

        {/* Subtest breakdown */}
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <h2 className="font-semibold text-slate-800 mb-4">Rincian Nilai per Subtes</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-slate-400 text-xs uppercase tracking-wide">
                  <th className="text-left py-3 px-2">Subtes</th>
                  <th className="text-center py-3 px-2">Benar</th>
                  <th className="text-center py-3 px-2">Salah</th>
                  <th className="text-center py-3 px-2">Kosong</th>
                  <th className="text-right py-3 px-2">Skor</th>
                </tr>
              </thead>
              <tbody>
                {record.subtestResults.map((r: SubtestResult) => (
                  <tr key={r.subtestId} className="border-b border-slate-100 last:border-0">
                    <td className="py-3 px-2 text-slate-800 font-medium">{r.name}</td>
                    <td className="py-3 px-2 text-center text-green-600">{r.correct}</td>
                    <td className="py-3 px-2 text-center text-red-500">{r.wrong}</td>
                    <td className="py-3 px-2 text-center text-slate-400">{r.empty}</td>
                    <td className="py-3 px-2 text-right font-bold text-slate-800">{r.score}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Subtest tabs */}
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="border-b border-slate-200 flex gap-1 overflow-x-auto px-2">
            {subtests.map((st, i) => (
              <button
                key={st.id}
                onClick={() => setActiveSubtestIdx(i)}
                className={`px-4 py-3 text-sm font-medium border-b-2 transition whitespace-nowrap ${
                  i === activeSubtestIdx ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-700'
                }`}
              >
                {st.name}
              </button>
            ))}
          </div>

          {/* Questions with answers + explanation */}
          <div className="p-4 md:p-5 space-y-4">
            {activeSubtest.questions.map((q: Question, idx: number) => {
              const studentAns = record.answers[q.id] || '';
              const isCorrect = studentAns && studentAns.trim().toLowerCase() === q.correctAnswer.trim().toLowerCase();
              const isWrong = studentAns && !isCorrect;

              return (
                <div key={q.id} className="border border-slate-200 rounded-lg p-4">
                  <div className="flex items-start gap-3 mb-3">
                    <span className="w-7 h-7 rounded-lg bg-slate-100 flex items-center justify-center font-bold text-slate-600 text-xs shrink-0">
                      {idx + 1}
                    </span>
                    <div className="flex-1">
                      <p className="text-slate-800 text-sm font-medium leading-relaxed">{q.question}</p>
                      {q.image && <QuestionImage src={q.image} />}
                    </div>
                  </div>

                  {/* Options */}
                  {q.type === 'multiple_choice' && q.options && (
                    <div className="space-y-2 mb-3 ml-10">
                      {q.options.map((opt, i) => {
                        const letter = String.fromCharCode(65 + i);
                        const isKey = letter === q.correctAnswer;
                        const isStudent = studentAns === letter;
                        return (
                          <div
                            key={letter}
                            className={`flex items-center gap-2 p-2.5 rounded-lg border text-sm ${
                              isKey ? 'border-green-300 bg-green-50' : isStudent ? 'border-red-300 bg-red-50' : 'border-slate-200 bg-white'
                            }`}
                          >
                            <span className={`w-6 h-6 rounded flex items-center justify-center font-bold text-xs shrink-0 ${
                              isKey ? 'bg-green-600 text-white' : isStudent ? 'bg-red-500 text-white' : 'bg-slate-100 text-slate-600'
                            }`}>
                              {letter}
                            </span>
                            <span className="text-slate-700">{opt}</span>
                            {isKey && <span className="ml-auto text-xs text-green-600 font-medium">Kunci</span>}
                            {isStudent && !isKey && <span className="ml-auto text-xs text-red-500 font-medium">Jawabanmu</span>}
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* Numeric */}
                  {q.type === 'numeric' && (
                    <div className="grid grid-cols-2 gap-3 mb-3 ml-10">
                      <div className="bg-white border border-slate-200 rounded-lg p-3">
                        <p className="text-xs text-slate-500 mb-1">Jawaban Kamu</p>
                        <p className={`font-bold text-sm ${!studentAns ? 'text-slate-400' : isCorrect ? 'text-green-600' : 'text-red-500'}`}>
                          {studentAns || '(kosong)'}
                        </p>
                      </div>
                      <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                        <p className="text-xs text-green-600 mb-1">Kunci Jawaban</p>
                        <p className="font-bold text-sm text-green-700">{q.correctAnswer}</p>
                      </div>
                    </div>
                  )}

                  {/* Status badge */}
                  <div className="ml-10 mb-3">
                    {isCorrect ? (
                      <span className="inline-flex items-center gap-1 text-xs text-green-700 bg-green-100 px-2 py-0.5 rounded">
                        <CheckCircle2 className="w-3 h-3" /> Benar
                      </span>
                    ) : isWrong ? (
                      <span className="inline-flex items-center gap-1 text-xs text-red-700 bg-red-100 px-2 py-0.5 rounded">
                        <XCircle className="w-3 h-3" /> Salah
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-xs text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                        <Circle className="w-3 h-3" /> Kosong
                      </span>
                    )}
                  </div>

                  {/* Explanation */}
                  <div className="ml-10 bg-blue-50 border border-blue-100 rounded-lg p-3">
                    <h4 className="flex items-center gap-2 text-xs font-semibold text-blue-700 mb-2">
                      <BookOpen className="w-3.5 h-3.5" />
                      Pembahasan
                    </h4>
                    <div className="space-y-2">
                      {q.explanation.map((step, i) => (
                        <div key={i} className="flex gap-2">
                          <span className="w-5 h-5 rounded-full bg-blue-200 text-blue-700 text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">
                            {i + 1}
                          </span>
                          <div className="flex-1">
                            <p className="text-[11px] font-semibold text-blue-600">{step.label}</p>
                            <p className="text-xs text-slate-700 leading-relaxed">{step.content}</p>
                            {step.formula && (
                              <div className="mt-1 bg-slate-100 rounded px-2 py-1 font-mono text-xs text-slate-800 overflow-x-auto">
                                {step.formula}
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
