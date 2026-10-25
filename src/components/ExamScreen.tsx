import { useEffect, useState, useCallback, useRef } from 'react';
import {
  GraduationCap,
  Clock,
  ChevronLeft,
  ChevronRight,
  Flag,
  Grid3x3,
  X,
  AlertTriangle,
  CheckCircle2,
  Circle,
  HelpCircle,
  Lock,
  Home,
} from 'lucide-react';
import { scoreSubtest } from '@/data/questions';
import { ExamProgress, SubtestResult, Subtest, Question } from '@/types';
import QuestionImage from '@/components/QuestionImage';
import { upsertOngoingExam, deleteOngoingExam } from '@/lib/ongoingExamStore';
import { supabase } from '@/lib/supabase';

interface ExamScreenProps {
  progress: ExamProgress;
  onUpdate: (progress: ExamProgress) => void;
  onFinish: (results: SubtestResult[]) => void;
  subtests: Subtest[];
  onBackHome: () => void;
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

export default function ExamScreen({ progress, onUpdate, onFinish, subtests, onBackHome }: ExamScreenProps) {
  const currentSubtest: Subtest = subtests[progress.currentSubtestIndex];
  const subState = progress.subtestStates[progress.currentSubtestIndex];
  const [currentQIndex, setCurrentQIndex] = useState(0);
  const [showNavGrid, setShowNavGrid] = useState(false);
  const [showSubmitConfirm, setShowSubmitConfirm] = useState(false);
  const [now, setNow] = useState(Date.now());

  const needsTransition = !subState.startedAt && !subState.ended;

  // tick timer only after the subtest has actually started
  useEffect(() => {
    if (!subState.startedAt) return;
    const interval = setInterval(() => setNow(Date.now()), 500);
    return () => clearInterval(interval);
  }, [subState.startedAt]);

  // compute remaining seconds
  const elapsedMs = subState.startedAt ? now - subState.startedAt : 0;
  const totalSeconds = currentSubtest.durationMinutes * 60;
  const remaining = Math.max(0, totalSeconds - Math.floor(elapsedMs / 1000));
  const isLowTime = remaining <= 60;

  // ----- Auto-save to Supabase -----
  const lastSaveRef = useRef<number>(0);
  const savingRef = useRef<boolean>(false);

  const doSave = useCallback(
    async (force = false) => {
      const userId = (await supabase.auth.getUser()).data.user?.id;
      if (!userId || !progress.packageId) return;
      // throttle: at most once per 8s unless forced
      const t = Date.now();
      if (!force && t - lastSaveRef.current < 8000) return;
      if (savingRef.current) return;
      savingRef.current = true;
      try {
        await upsertOngoingExam(userId, progress, remaining);
        lastSaveRef.current = t;
      } catch {
        // silent: auto-save failure should not interrupt exam
      } finally {
        savingRef.current = false;
      }
    },
    [progress, remaining],
  );

  // Debounced save whenever answers/doubts/subtest change.
  useEffect(() => {
    if (!subState.startedAt || subState.ended) return;
    const id = setTimeout(() => {
      void doSave(true);
    }, 600);
    return () => clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [subState.answers, subState.doubts, subState.subtestId, subState.ended, subState.startedAt]);

  // Periodic save of time_remaining every 12s while subtest is active.
  useEffect(() => {
    if (!subState.startedAt || subState.ended) return;
    const id = setInterval(() => {
      void doSave(false);
    }, 12000);
    return () => clearInterval(id);
  }, [subState.startedAt, subState.ended, doSave]);

  // auto-transition when time runs out
  useEffect(() => {
    if (subState.startedAt && remaining <= 0 && !subState.ended) {
      handleSubtestEnd(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [remaining, subState.startedAt]);

  const currentQuestion: Question = currentSubtest.questions[currentQIndex];

  const updateProgress = useCallback(
    (updates: Partial<ExamProgress>) => {
      onUpdate({ ...progress, ...updates });
    },
    [progress, onUpdate],
  );

  const setAnswer = (answer: string) => {
    const newSubStates = [...progress.subtestStates];
    newSubStates[progress.currentSubtestIndex] = {
      ...subState,
      answers: { ...subState.answers, [currentQuestion.id]: answer },
    };
    updateProgress({ subtestStates: newSubStates });
  };

  const toggleDoubt = () => {
    const newSubStates = [...progress.subtestStates];
    newSubStates[progress.currentSubtestIndex] = {
      ...subState,
      doubts: { ...subState.doubts, [currentQuestion.id]: !subState.doubts[currentQuestion.id] },
    };
    updateProgress({ subtestStates: newSubStates });
  };

  const goNext = () => {
    if (currentQIndex < currentSubtest.questions.length - 1) {
      setCurrentQIndex(currentQIndex + 1);
    }
  };

  const goPrev = () => {
    if (currentQIndex > 0) {
      setCurrentQIndex(currentQIndex - 1);
    }
  };

  const computeResults = (finalProgress: ExamProgress): SubtestResult[] => {
    return subtests.map((st, idx) => {
      const state = finalProgress.subtestStates[idx];
      let correct = 0;
      let empty = 0;
      st.questions.forEach((q) => {
        const ans = state.answers[q.id];
        if (!ans) {
          empty++;
        } else if (ans.trim().toLowerCase() === q.correctAnswer.trim().toLowerCase()) {
          correct++;
        }
      });
      const wrong = st.questions.length - correct - empty;
      return {
        subtestId: st.id,
        name: st.name,
        total: st.questions.length,
        correct,
        wrong,
        empty,
        score: scoreSubtest(correct, st.questions.length),
      };
    });
  };

  const handleSubtestEnd = (isManualSubmit: boolean) => {
    const newSubStates = [...progress.subtestStates];
    newSubStates[progress.currentSubtestIndex] = {
      ...subState,
      ended: true,
    };
    const newCompleted = [...progress.completedSubtests, currentSubtest.id];
    const isLastSubtest = progress.currentSubtestIndex >= subtests.length - 1;
    const newProgress: ExamProgress = {
      ...progress,
      subtestStates: newSubStates,
      completedSubtests: newCompleted,
      currentSubtestIndex: isLastSubtest ? progress.currentSubtestIndex : progress.currentSubtestIndex + 1,
      examFinished: isLastSubtest,
    };

    if (isLastSubtest) {
      const results = computeResults(newProgress);
      onFinish(results);
      // remove the auto-saved draft now that the exam is submitted
      void (async () => {
        const userId = (await supabase.auth.getUser()).data.user?.id;
        if (userId && progress.packageId != null) {
          try {
            await deleteOngoingExam(userId, progress.packageId);
          } catch {
            // ignore: draft cleanup is best-effort
          }
        }
      })();
    } else {
      onUpdate(newProgress);
      setCurrentQIndex(0);
    }
    if (isManualSubmit) setShowSubmitConfirm(false);
  };

  const handleStartNextSubtest = () => {
    const newSubStates = [...progress.subtestStates];
    newSubStates[progress.currentSubtestIndex] = {
      ...subState,
      startedAt: Date.now(),
    };
    onUpdate({ ...progress, subtestStates: newSubStates });
    setNow(Date.now());
  };

  const answeredCount = Object.keys(subState.answers).filter((k) => subState.answers[Number(k)]).length;
  const doubtCount = Object.keys(subState.doubts).filter((k) => subState.doubts[Number(k)]).length;

  const getQuestionStatus = (qId: number): 'answered' | 'doubt' | 'empty' => {
    if (subState.doubts[qId]) return 'doubt';
    if (subState.answers[qId]) return 'answered';
    return 'empty';
  };

  const isLastSubtest = progress.currentSubtestIndex >= subtests.length - 1;

  if (needsTransition) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl max-w-lg w-full p-8 shadow-2xl text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-5">
            <CheckCircle2 className="w-8 h-8 text-green-600" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900 mb-2">Subtes Selesai</h2>
          <p className="text-slate-500 text-sm mb-6">
            Anda telah menyelesaikan subtes sebelumnya. Siapkan diri untuk subtes berikutnya.
          </p>

          <div className="bg-slate-50 rounded-xl p-5 text-left space-y-3 mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-900 rounded-lg flex items-center justify-center shrink-0">
                <GraduationCap className="w-5 h-5 text-white" />
              </div>
              <div className="min-w-0">
                <p className="text-xs text-slate-400 uppercase tracking-wide">Subtes Berikutnya</p>
                <p className="font-bold text-slate-900 truncate">{currentSubtest.name}</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-white rounded-lg p-3 border border-slate-200">
                <div className="flex items-center gap-1.5 text-slate-400 text-xs mb-1">
                  <HelpCircle className="w-3.5 h-3.5" /> Jumlah Soal
                </div>
                <p className="text-xl font-bold text-slate-900">{currentSubtest.questions.length}</p>
              </div>
              <div className="bg-white rounded-lg p-3 border border-slate-200">
                <div className="flex items-center gap-1.5 text-slate-400 text-xs mb-1">
                  <Clock className="w-3.5 h-3.5" /> Alokasi Waktu
                </div>
                <p className="text-xl font-bold text-slate-900">{currentSubtest.durationMinutes} m</p>
              </div>
            </div>
          </div>

          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-6 flex items-start gap-2 text-left">
            <AlertTriangle className="w-4 h-4 text-yellow-600 shrink-0 mt-0.5" />
            <p className="text-xs text-yellow-700 leading-relaxed">
              Timer belum berjalan. Klik tombol di bawah ketika Anda sudah siap — timer subtes akan mulai berjalan saat itu juga.
            </p>
          </div>

          <div className="space-y-2.5">
            <button
              onClick={handleStartNextSubtest}
              className="w-full py-3.5 bg-blue-600 hover:bg-blue-500 text-white font-bold text-base rounded-xl transition flex items-center justify-center gap-2"
            >
              Lanjut Kerjakan Subtes Berikutnya
              <ChevronRight className="w-5 h-5" />
            </button>
            <button
              onClick={onBackHome}
              className="w-full py-3 bg-slate-100 hover:bg-slate-200 text-slate-600 font-semibold text-sm rounded-xl transition flex items-center justify-center gap-2"
            >
              <Home className="w-4 h-4" />
              Simpan & Kembali ke Beranda
            </button>
          </div>
          <p className="text-[11px] text-slate-400 mt-3 leading-relaxed">
            Progres subtes yang sudah selesai otomatis tersimpan. Anda bisa melanjutkan subtes berikutnya kapan saja dari beranda.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col">
      {/* Header */}
      <header className="bg-slate-900 text-white px-4 py-3 flex items-center justify-between shadow-md z-20">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-blue-600 rounded-lg flex items-center justify-center">
            <GraduationCap className="w-5 h-5 text-white" />
          </div>
          <div className="hidden sm:block">
            <p className="font-semibold text-sm leading-tight">Tryout UTBK SNBT</p>
            <p className="text-slate-400 text-xs">{progress.participantName}</p>
          </div>
          <button
            onClick={onBackHome}
            className="ml-2 flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-medium transition"
            title="Kembali ke Beranda"
          >
            <Home className="w-3.5 h-3.5" />
            <span className="hidden md:inline">Beranda</span>
          </button>
        </div>

        <div className="flex items-center gap-4">
          <div className="hidden md:flex items-center gap-2 bg-slate-800 px-3 py-1.5 rounded-lg">
            <span className="text-slate-400 text-xs">Subtes:</span>
            <span className="text-blue-400 font-medium text-sm">{currentSubtest.name}</span>
          </div>
          <div
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-mono font-bold text-lg transition ${
              isLowTime ? 'bg-red-600 text-white animate-pulse' : 'bg-slate-800 text-white'
            }`}
          >
            <Clock className="w-5 h-5" />
            {formatTime(remaining)}
          </div>
        </div>
      </header>

      {/* Subtes progress bar */}
      <div className="bg-slate-800 px-4 py-2 flex items-center gap-2">
        {subtests.map((st, idx) => {
          const isCompleted = progress.completedSubtests.includes(st.id);
          const isCurrent = idx === progress.currentSubtestIndex;
          return (
            <div key={st.id} className="flex items-center gap-2 flex-1">
              <div
                className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-medium transition flex-1 ${
                  isCurrent
                    ? 'bg-blue-600 text-white'
                    : isCompleted
                    ? 'bg-slate-700 text-slate-500'
                    : 'bg-slate-700/50 text-slate-400'
                }`}
              >
                {isCompleted ? <Lock className="w-3 h-3" /> : <span className="w-3 h-3 rounded-full border border-current" />}
                <span className="truncate">{st.shortName}</span>
              </div>
              {idx < subtests.length - 1 && <div className="w-4 h-px bg-slate-600 hidden sm:block" />}
            </div>
          );
        })}
      </div>

      {/* Main content — split panel */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
        {/* Left column — stimulus */}
        {currentQuestion.stimulus ? (
          <div className="lg:w-2/5 lg:border-r border-slate-300 bg-white overflow-y-auto p-5 lg:p-6 max-h-[35vh] lg:max-h-none">
            <div className="mb-3">
              <span className="inline-block bg-blue-50 text-blue-700 text-xs font-semibold px-2.5 py-1 rounded">
                {currentQuestion.stimulusTitle || 'Bacaan'}
              </span>
            </div>
            <p className="text-slate-700 text-sm md:text-base leading-relaxed whitespace-pre-wrap">
              {currentQuestion.stimulus}
            </p>
          </div>
        ) : (
          <div className="lg:w-2/5 lg:border-r border-slate-300 bg-slate-50 overflow-y-auto p-5 lg:p-6 max-h-[35vh] lg:max-h-none flex items-center justify-center">
            <div className="text-center text-slate-400">
              <BookIcon />
              <p className="text-sm mt-2">Soal ini tidak memiliki bacaan/stimulus.</p>
            </div>
          </div>
        )}

        {/* Right column — question + answers */}
        <div className="flex-1 overflow-y-auto p-5 lg:p-6 bg-slate-50">
          <div className="max-w-2xl mx-auto">
            <div className="flex items-center justify-between mb-4">
              <span className="text-slate-500 text-sm">
                Soal No. <span className="font-bold text-slate-800">{currentQIndex + 1}</span> dari{' '}
                {currentSubtest.questions.length}
              </span>
              <span className="text-xs text-slate-400">{currentSubtest.name}</span>
            </div>

            <p className="text-slate-900 text-base md:text-lg font-medium leading-relaxed mb-6">
              {currentQuestion.question}
            </p>

            <QuestionImage src={currentQuestion.image} />

            {/* Answer area */}
            {currentQuestion.type === 'multiple_choice' && currentQuestion.options ? (
              <div className="space-y-3">
                {currentQuestion.options.map((opt, i) => {
                  const letter = String.fromCharCode(65 + i);
                  const isSelected = subState.answers[currentQuestion.id] === letter;
                  return (
                    <button
                      key={letter}
                      onClick={() => setAnswer(letter)}
                      className={`w-full flex items-center gap-3 p-3.5 rounded-lg border-2 text-left transition ${
                        isSelected
                          ? 'border-blue-600 bg-blue-50'
                          : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'
                      }`}
                    >
                      <span
                        className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm shrink-0 transition ${
                          isSelected ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {letter}
                      </span>
                      <span className="text-slate-700 text-sm md:text-base">{opt}</span>
                    </button>
                  );
                })}
              </div>
            ) : (
              <div>
                <label className="block text-slate-600 text-sm mb-2">Masukkan jawaban (angka/teks singkat):</label>
                <input
                  type="text"
                  value={subState.answers[currentQuestion.id] || ''}
                  onChange={(e) => setAnswer(e.target.value)}
                  placeholder="Ketik jawaban di sini..."
                  className="w-full max-w-xs border-2 border-slate-200 rounded-lg px-4 py-3 text-slate-900 text-base focus:outline-none focus:border-blue-600 transition bg-white"
                />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <footer className="bg-slate-900 px-4 py-3 flex items-center justify-between gap-2 shadow-lg z-20">
        <button
          onClick={goPrev}
          disabled={currentQIndex === 0}
          className="flex items-center gap-1 px-4 py-2 rounded-lg bg-slate-700 hover:bg-slate-600 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-medium transition"
        >
          <ChevronLeft className="w-4 h-4" />
          Sebelumnya
        </button>

        <div className="flex items-center gap-2">
          <button
            onClick={toggleDoubt}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition ${
              subState.doubts[currentQuestion.id]
                ? 'bg-yellow-500 text-white'
                : 'bg-slate-700 text-yellow-400 hover:bg-slate-600'
            }`}
          >
            <Flag className="w-4 h-4" />
            Ragu-ragu
          </button>

          <button
            onClick={() => setShowNavGrid(true)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-slate-700 hover:bg-slate-600 text-white text-sm font-medium transition"
          >
            <Grid3x3 className="w-4 h-4" />
            <span className="hidden sm:inline">Daftar Soal</span>
          </button>
        </div>

        {currentQIndex < currentSubtest.questions.length - 1 ? (
          <button
            onClick={goNext}
            className="flex items-center gap-1 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium transition"
          >
            Berikutnya
            <ChevronRight className="w-4 h-4" />
          </button>
        ) : (
          <button
            onClick={() => setShowSubmitConfirm(true)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-green-600 hover:bg-green-500 text-white text-sm font-medium transition"
          >
            <CheckCircle2 className="w-4 h-4" />
            {isLastSubtest ? 'Selesai' : 'Submit Subtes'}
          </button>
        )}
      </footer>

      {/* Navigation grid modal */}
      {showNavGrid && (
        <NavGridModal
          subtest={currentSubtest}
          subState={subState}
          currentQIndex={currentQIndex}
          answeredCount={answeredCount}
          doubtCount={doubtCount}
          onClose={() => setShowNavGrid(false)}
          onJump={(idx) => {
            setCurrentQIndex(idx);
            setShowNavGrid(false);
          }}
          onSubmit={() => {
            setShowNavGrid(false);
            setShowSubmitConfirm(true);
          }}
          isLastSubtest={isLastSubtest}
        />
      )}

      {/* Submit confirmation */}
      {showSubmitConfirm && (
        <SubmitConfirm
          answeredCount={answeredCount}
          totalQuestions={currentSubtest.questions.length}
          isLastSubtest={isLastSubtest}
          onCancel={() => setShowSubmitConfirm(false)}
          onConfirm={() => handleSubtestEnd(true)}
        />
      )}
    </div>
  );
}

function BookIcon() {
  return (
    <svg className="w-12 h-12 mx-auto text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
    </svg>
  );
}

function NavGridModal({
  subtest,
  subState,
  currentQIndex,
  answeredCount,
  doubtCount,
  onClose,
  onJump,
  onSubmit,
  isLastSubtest,
}: {
  subtest: Subtest;
  subState: { answers: Record<number, string>; doubts: Record<number, boolean> };
  currentQIndex: number;
  answeredCount: number;
  doubtCount: number;
  onClose: () => void;
  onJump: (idx: number) => void;
  onSubmit: () => void;
  isLastSubtest: boolean;
}) {
  const getStatusStyle = (qId: number, isCurrent: boolean) => {
    if (isCurrent) return 'bg-blue-600 text-white ring-2 ring-blue-400 ring-offset-2 ring-offset-slate-900';
    if (subState.doubts[qId]) return 'bg-yellow-500 text-white';
    if (subState.answers[qId]) return 'bg-green-600 text-white';
    return 'bg-slate-700 text-slate-300';
  };

  const emptyCount = subtest.questions.length - answeredCount;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-slate-900 rounded-xl border border-slate-700 w-full max-w-md p-6">
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-white font-semibold flex items-center gap-2">
            <Grid3x3 className="w-5 h-5 text-blue-400" />
            Daftar Soal
          </h3>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="grid grid-cols-5 gap-2.5 mb-5">
          {subtest.questions.map((q, idx) => (
            <button
              key={q.id}
              onClick={() => onJump(idx)}
              className={`aspect-square rounded-lg font-bold text-sm transition hover:scale-105 ${getStatusStyle(
                q.id,
                idx === currentQIndex,
              )}`}
            >
              {idx + 1}
            </button>
          ))}
        </div>

        <div className="space-y-2 mb-5 text-xs">
          <div className="flex items-center gap-2 text-slate-300">
            <span className="w-4 h-4 rounded bg-green-600" /> Dijawab ({answeredCount})
          </div>
          <div className="flex items-center gap-2 text-slate-300">
            <span className="w-4 h-4 rounded bg-yellow-500" /> Ragu-ragu ({doubtCount})
          </div>
          <div className="flex items-center gap-2 text-slate-300">
            <span className="w-4 h-4 rounded bg-slate-700" /> Belum dijawab ({emptyCount})
          </div>
        </div>

        <button
          onClick={onSubmit}
          className="w-full bg-green-600 hover:bg-green-500 text-white font-medium py-2.5 rounded-lg transition flex items-center justify-center gap-2 text-sm"
        >
          <CheckCircle2 className="w-4 h-4" />
          {isLastSubtest ? 'Selesaikan Ujian' : 'Submit Subtes'}
        </button>
      </div>
    </div>
  );
}

function SubmitConfirm({
  answeredCount,
  totalQuestions,
  isLastSubtest,
  onCancel,
  onConfirm,
}: {
  answeredCount: number;
  totalQuestions: number;
  isLastSubtest: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  const emptyCount = totalQuestions - answeredCount;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-white rounded-xl w-full max-w-sm p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-full bg-yellow-100 flex items-center justify-center">
            <AlertTriangle className="w-6 h-6 text-yellow-600" />
          </div>
          <div>
            <h3 className="font-semibold text-slate-900">Konfirmasi Submit</h3>
            <p className="text-slate-500 text-sm">
              {isLastSubtest ? 'Selesaikan ujian?' : 'Kumpulkan subtes ini?'}
            </p>
          </div>
        </div>

        <div className="bg-slate-50 rounded-lg p-4 mb-5 space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-slate-500 flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-green-600" /> Sudah dijawab
            </span>
            <span className="font-semibold text-slate-800">{answeredCount}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500 flex items-center gap-1.5">
              <Circle className="w-4 h-4 text-slate-400" /> Belum dijawab
            </span>
            <span className="font-semibold text-slate-800">{emptyCount}</span>
          </div>
        </div>

        {emptyCount > 0 && (
          <p className="text-yellow-600 text-xs mb-4 flex items-center gap-1.5">
            <HelpCircle className="w-4 h-4 shrink-0" />
            Masih ada soal yang belum dijawab. Anda tidak dapat kembali setelah submit.
          </p>
        )}

        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 py-2.5 rounded-lg border border-slate-300 text-slate-700 font-medium text-sm hover:bg-slate-50 transition"
          >
            Batal
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 py-2.5 rounded-lg bg-green-600 text-white font-medium text-sm hover:bg-green-500 transition"
          >
            Ya, Submit
          </button>
        </div>
      </div>
    </div>
  );
}
