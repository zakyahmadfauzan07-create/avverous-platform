import { useState } from 'react';
import { GraduationCap, Lock, ArrowLeft, ListChecks, FileQuestion, Library, Trophy } from 'lucide-react';
import { Subtest, PracticeQuestion, LearningModule } from '@/types';
import { TryoutPackage } from '@/data/questions';
import { ExamResultWithId } from '@/lib/examResultsStore';
import QuestionsTab from './admin/QuestionsTab';
import PracticeTab from './admin/PracticeTab';
import ModulesTab from './admin/ModulesTab';
import ResultsTab from './admin/ResultsTab';

interface AdminScreenProps {
  packages: TryoutPackage[];
  onPackagesChange: (packages: TryoutPackage[]) => void;
  onResetPackages: () => void;
  practiceQuestions: PracticeQuestion[];
  onPracticeChange: (questions: PracticeQuestion[]) => void;
  modules: LearningModule[];
  onModulesChange: (modules: LearningModule[]) => void;
  results: ExamResultWithId[];
  onResultDelete: (dbId: string) => void;
  onExit: () => void;
}

const ADMIN_PIN = '123456';

type TabId = 'questions' | 'practice' | 'modules' | 'results';

const TABS: { id: TabId; label: string; icon: typeof ListChecks }[] = [
  { id: 'questions', label: 'Soal Tryout', icon: ListChecks },
  { id: 'practice', label: 'Bank Latihan Soal', icon: FileQuestion },
  { id: 'modules', label: 'Modul Pembelajaran', icon: Library },
  { id: 'results', label: 'Hasil Tryout Siswa', icon: Trophy },
];

export default function AdminScreen({
  packages,
  onPackagesChange,
  onResetPackages,
  practiceQuestions,
  onPracticeChange,
  modules,
  onModulesChange,
  results,
  onResultDelete,
  onExit,
}: AdminScreenProps) {
  const [unlocked, setUnlocked] = useState(false);
  const [pinInput, setPinInput] = useState('');
  const [pinError, setPinError] = useState(false);
  const [activeTab, setActiveTab] = useState<TabId>('questions');

  const handlePinSubmit = () => {
    if (pinInput === ADMIN_PIN) {
      setUnlocked(true);
      setPinError(false);
    } else {
      setPinError(true);
    }
  };

  // ---- PIN gate ----
  if (!unlocked) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
        <div className="w-full max-w-sm">
          <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-600 rounded-2xl mb-4 shadow-lg shadow-blue-600/30">
              <Lock className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-white mb-1">Panel Guru / Admin</h1>
            <p className="text-slate-400 text-sm">Masukkan PIN untuk mengakses panel</p>
          </div>
          <div className="bg-slate-800/50 backdrop-blur rounded-xl border border-slate-700 p-6">
            <input
              type="password"
              value={pinInput}
              onChange={(e) => {
                setPinInput(e.target.value);
                setPinError(false);
              }}
              onKeyDown={(e) => e.key === 'Enter' && handlePinSubmit()}
              placeholder="PIN Admin..."
              autoFocus
              className={`w-full bg-slate-900 border rounded-lg px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:ring-2 transition text-center text-lg tracking-widest ${
                pinError ? 'border-red-500 focus:ring-red-500' : 'border-slate-700 focus:ring-blue-500'
              }`}
            />
            {pinError && <p className="text-red-400 text-xs mt-2 text-center">PIN salah. Coba lagi.</p>}
            <button
              onClick={handlePinSubmit}
              className="w-full mt-4 bg-blue-600 hover:bg-blue-500 text-white font-semibold py-3 rounded-lg transition"
            >
              Masuk
            </button>
            <button
              onClick={onExit}
              className="w-full mt-2 text-slate-400 hover:text-white text-sm py-2 transition flex items-center justify-center gap-1.5"
            >
              <ArrowLeft className="w-4 h-4" />
              Kembali ke Beranda
            </button>
            <p className="text-slate-600 text-xs text-center mt-3">PIN default: 123456</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100">
      {/* Header */}
      <header className="bg-slate-900 text-white px-4 py-3 flex items-center justify-between shadow-md sticky top-0 z-20">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-blue-600 rounded-lg flex items-center justify-center">
            <GraduationCap className="w-5 h-5" />
          </div>
          <div>
            <p className="font-semibold text-sm leading-tight">Panel Guru / Admin</p>
            <p className="text-slate-400 text-xs">Kelola konten & hasil tryout</p>
          </div>
        </div>
        <button
          onClick={onExit}
          className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-slate-700 hover:bg-slate-600 text-white text-sm font-medium transition"
        >
          <ArrowLeft className="w-4 h-4" />
          Kembali ke Beranda
        </button>
      </header>

      {/* Tabs */}
      <div className="bg-white border-b border-slate-200 sticky top-[57px] z-10">
        <div className="max-w-5xl mx-auto px-2 sm:px-4 flex gap-1 overflow-x-auto">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-1.5 px-4 py-3 text-sm font-medium border-b-2 transition whitespace-nowrap ${
                  isActive
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-slate-500 hover:text-slate-700'
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="max-w-5xl mx-auto p-4 md:p-6">
        {activeTab === 'questions' && (
          <QuestionsTab packages={packages} onPackagesChange={onPackagesChange} onResetPackages={onResetPackages} />
        )}
        {activeTab === 'practice' && <PracticeTab questions={practiceQuestions} onChange={onPracticeChange} />}
        {activeTab === 'modules' && <ModulesTab modules={modules} onChange={onModulesChange} />}
        {activeTab === 'results' && <ResultsTab results={results} onDelete={onResultDelete} />}
      </div>
    </div>
  );
}
