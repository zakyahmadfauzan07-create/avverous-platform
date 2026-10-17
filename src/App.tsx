import { useState, useEffect, useCallback } from 'react';
import LandingPage from '@/components/LandingPage';
import PackageSelectionScreen from '@/components/PackageSelectionScreen';
import WelcomeScreen from '@/components/WelcomeScreen';
import ExamScreen from '@/components/ExamScreen';
import ResultScreen from '@/components/ResultScreen';
import DiscussionScreen from '@/components/DiscussionScreen';
import AdminScreen from '@/components/AdminScreen';
import AuthScreen from '@/components/AuthScreen';
import HistoryScreen from '@/components/HistoryScreen';
import { scoreSubtest } from '@/lib/subtestStore';
import { loadPackages, savePackages, resetPackages } from '@/lib/packageStore';
import { loadPracticeQuestions, savePracticeQuestions } from '@/lib/practiceStore';
import { loadModules, saveModules } from '@/lib/moduleStore';
import { fetchAllResults, insertExamResult, deleteExamResult, ExamResultWithId } from '@/lib/examResultsStore';
import { useAuth } from '@/lib/useAuth';
import { TryoutPackage } from '@/data/questions';
import { ExamProgress, Screen, SubtestResult, Subtest, PracticeQuestion, LearningModule } from '@/types';

const PROGRESS_KEY = 'utbk_tryout_progress_v1';

function createInitialProgress(name: string, subtests: Subtest[]): ExamProgress {
  return {
    participantName: name,
    currentSubtestIndex: 0,
    subtestStates: subtests.map((st) => ({
      subtestId: st.id,
      answers: {},
      doubts: {},
      startedAt: Date.now(),
      ended: false,
    })),
    completedSubtests: [],
    examFinished: false,
  };
}

export default function App() {
  const [screen, setScreen] = useState<Screen>('landing');
  const [progress, setProgress] = useState<ExamProgress | null>(null);
  const [results, setResults] = useState<SubtestResult[] | null>(null);
  const [packages, setPackages] = useState<TryoutPackage[]>([]);
  const [activeSubtests, setActiveSubtests] = useState<Subtest[]>([]);
  const [activePackage, setActivePackage] = useState<TryoutPackage | null>(null);
  const [practiceQuestions, setPracticeQuestions] = useState<PracticeQuestion[]>([]);
  const [modules, setModules] = useState<LearningModule[]>([]);
  const [tryoutResults, setTryoutResults] = useState<ExamResultWithId[]>([]);
  const auth = useAuth();

  useEffect(() => {
    setPackages(loadPackages());
    setPracticeQuestions(loadPracticeQuestions());
    setModules(loadModules());
  }, []);

  // Load exam results from Supabase when user changes
  useEffect(() => {
    if (!auth.user) {
      setTryoutResults([]);
      return;
    }
    let mounted = true;
    (async () => {
      try {
        const data = await fetchAllResults();
        if (mounted) setTryoutResults(data);
      } catch {
        if (mounted) setTryoutResults([]);
      }
    })();
    return () => { mounted = false; };
  }, [auth.user]);

  useEffect(() => {
    const saved = localStorage.getItem(PROGRESS_KEY);
    if (saved) {
      try {
        const parsed: ExamProgress = JSON.parse(saved);
        setProgress(parsed);
        if (parsed.examFinished) {
          setScreen('result');
        } else {
          setScreen('exam');
        }
      } catch {
        // ignore corrupt data
      }
    }
  }, []);

  const saveProgress = useCallback((p: ExamProgress) => {
    localStorage.setItem(PROGRESS_KEY, JSON.stringify(p));
  }, []);

  const handlePackagesChange = (newPackages: TryoutPackage[]) => {
    setPackages(newPackages);
    savePackages(newPackages);
  };

  const handleResetPackages = () => {
    const defaults = resetPackages();
    setPackages(defaults);
  };

  const handlePracticeChange = (items: PracticeQuestion[]) => {
    setPracticeQuestions(items);
    savePracticeQuestions(items);
  };

  const handleModulesChange = (items: LearningModule[]) => {
    setModules(items);
    saveModules(items);
  };

  const handleResultDelete = async (dbId: string) => {
    try {
      await deleteExamResult(dbId);
      setTryoutResults((prev) => prev.filter((r) => r.dbId !== dbId));
    } catch {
      // ignore
    }
  };

  const goHome = () => {
    setScreen('landing');
  };

  const handleStartTryout = () => {
    if (!auth.user) {
      setScreen('auth');
      return;
    }
    setScreen('packageSelection');
  };

  const handleSelectPackage = (pkg: TryoutPackage) => {
    setActivePackage(pkg);
    setActiveSubtests(pkg.subtests);
    setScreen('registration');
  };

  const handleStart = (name: string) => {
    const initial = createInitialProgress(name, activeSubtests);
    setProgress(initial);
    saveProgress(initial);
    setScreen('exam');
  };

  const handleAuthSuccess = () => {
    setScreen('packageSelection');
  };

  const handleUpdate = (newProgress: ExamProgress) => {
    setProgress(newProgress);
    saveProgress(newProgress);
  };

  const handleFinish = async (finalResults: SubtestResult[]) => {
    if (progress) {
      const finalProgress = { ...progress, examFinished: true };
      setProgress(finalProgress);
      saveProgress(finalProgress);
      const totalCorrect = finalResults.reduce((acc, r) => acc + r.correct, 0);
      const totalQuestions = finalResults.reduce((acc, r) => acc + r.total, 0);
      const totalScore = totalQuestions > 0 ? Math.round((totalCorrect / totalQuestions) * 1000) : 0;
      const answers: Record<number, string> = {};
      progress.subtestStates.forEach((st) => {
        Object.entries(st.answers).forEach(([qid, ans]) => {
          answers[Number(qid)] = ans;
        });
      });
      const examSubtests = activeSubtests.length > 0 ? activeSubtests : (activePackage?.subtests ?? packages[0]?.subtests ?? []);
      // Persist to Supabase
      if (auth.user) {
        try {
          const saved = await insertExamResult(
            auth.user.id,
            activePackage?.id ?? 0,
            activePackage?.name ?? 'Paket Tryout',
            progress.participantName,
            totalScore,
            finalResults,
            answers,
            examSubtests,
          );
          if (saved) {
            setTryoutResults((prev) => [saved, ...prev]);
          }
        } catch {
          // Supabase save failed; results still shown locally
        }
      }
    }
    setResults(finalResults);
    setScreen('result');
  };

  const handleUnlockDiscussion = () => setScreen('discussion');

  const handleRestart = () => {
    localStorage.removeItem(PROGRESS_KEY);
    setProgress(null);
    setResults(null);
    setScreen('registration');
  };

  const handleBackToResult = () => {
    if (!results && progress) {
      const source = activeSubtests.length > 0 ? activeSubtests : (packages[0]?.subtests ?? []);
      const computed: SubtestResult[] = source.map((st) => {
        const state = progress.subtestStates.find((s) => s.subtestId === st.id);
        let correct = 0;
        let empty = 0;
        st.questions.forEach((q) => {
          const ans = state?.answers[q.id];
          if (!ans) empty++;
          else if (ans.trim().toLowerCase() === q.correctAnswer.trim().toLowerCase()) correct++;
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
      setResults(computed);
    }
    setScreen('result');
  };

  if (screen === 'admin') {
    return (
      <AdminScreen
        packages={packages}
        onPackagesChange={handlePackagesChange}
        onResetPackages={handleResetPackages}
        practiceQuestions={practiceQuestions}
        onPracticeChange={handlePracticeChange}
        modules={modules}
        onModulesChange={handleModulesChange}
        results={tryoutResults}
        onResultDelete={handleResultDelete}
        onExit={goHome}
      />
    );
  }

  if (screen === 'auth') {
    return <AuthScreen onBackHome={goHome} />;
  }

  if (screen === 'history' && auth.user) {
    return <HistoryScreen user={auth.user} profile={auth.profile} onBackHome={goHome} />;
  }

  if (screen === 'landing') {
    return (
      <LandingPage
        onStartTryout={handleStartTryout}
        onAdmin={() => setScreen('admin')}
        onHistory={() => setScreen('history')}
        subtests={packages[0]?.subtests ?? []}
        user={auth.user}
        profile={auth.profile}
        onLogout={auth.signOut}
        onLogin={() => setScreen('auth')}
      />
    );
  }

  if (screen === 'packageSelection') {
    return <PackageSelectionScreen packages={packages} onSelect={handleSelectPackage} onBackHome={goHome} />;
  }

  if (screen === 'registration' || (screen === 'exam' && !progress)) {
    return <WelcomeScreen onStart={handleStart} onBackHome={goHome} subtests={activeSubtests.length > 0 ? activeSubtests : (packages[0]?.subtests ?? [])} />;
  }

  if (screen === 'exam' && progress) {
    return <ExamScreen progress={progress} onUpdate={handleUpdate} onFinish={handleFinish} subtests={activeSubtests.length > 0 ? activeSubtests : (packages[0]?.subtests ?? [])} onBackHome={goHome} />;
  }

  if (screen === 'result' && progress) {
    return (
      <ResultScreen
        results={results || []}
        participantName={progress.participantName}
        onUnlockDiscussion={handleUnlockDiscussion}
        onRestart={handleRestart}
        onBackHome={goHome}
      />
    );
  }

  if (screen === 'discussion' && progress) {
    return <DiscussionScreen progress={progress} onBack={handleBackToResult} subtests={activeSubtests.length > 0 ? activeSubtests : (packages[0]?.subtests ?? [])} />;
  }

  return (
    <LandingPage
      onStartTryout={handleStartTryout}
      onAdmin={() => setScreen('admin')}
      onHistory={() => setScreen('history')}
      subtests={packages[0]?.subtests ?? []}
      user={auth.user}
      profile={auth.profile}
      onLogout={auth.signOut}
      onLogin={() => setScreen('auth')}
    />
  );
}
