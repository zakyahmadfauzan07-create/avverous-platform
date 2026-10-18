import { useState } from 'react';
import {
  GraduationCap,
  Lock,
  ArrowLeft,
  ListChecks,
  FileQuestion,
  Library,
  Trophy,
  CalendarDays,
  BookOpen,
  Users,
  ClipboardList,
  ShieldCheck,
  KeyRound,
  DoorOpen,
} from 'lucide-react';
import { Subtest, PracticeQuestion, LearningModule } from '@/types';
import { TryoutPackage } from '@/data/questions';
import { ExamResultWithId } from '@/lib/examResultsStore';
import QuestionsTab from './admin/QuestionsTab';
import PracticeTab from './admin/PracticeTab';
import ModulesTab from './admin/ModulesTab';
import ResultsTab from './admin/ResultsTab';
import GradesTab from './admin/GradesTab';
import SchedulesTab from './admin/SchedulesTab';
import MaterialsTab from './admin/MaterialsTab';
import StudentsTab from './admin/StudentsTab';
import AccessCodesTab from './admin/AccessCodesTab';
import OfflineClassesTab from './admin/OfflineClassesTab';

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
  isAdmin: boolean;
  adminName?: string;
}

type TabId =
  | 'questions'
  | 'practice'
  | 'modules'
  | 'results'
  | 'grades'
  | 'schedules'
  | 'offlineClasses'
  | 'materials'
  | 'students'
  | 'accessCodes';

const TABS: { id: TabId; label: string; icon: typeof ListChecks }[] = [
  { id: 'questions', label: 'Soal Tryout', icon: ListChecks },
  { id: 'practice', label: 'Bank Latihan', icon: FileQuestion },
  { id: 'modules', label: 'Modul (lokal)', icon: Library },
  { id: 'results', label: 'Hasil Tryout', icon: Trophy },
  { id: 'grades', label: 'Input Nilai', icon: ClipboardList },
  { id: 'schedules', label: 'Jadwal', icon: CalendarDays },
  { id: 'offlineClasses', label: 'Kelas Offline L12', icon: DoorOpen },
  { id: 'materials', label: 'Materi Arsip', icon: BookOpen },
  { id: 'students', label: 'Daftar Siswa', icon: Users },
  { id: 'accessCodes', label: 'Kode Akses', icon: KeyRound },
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
  isAdmin,
  adminName,
}: AdminScreenProps) {
  const [activeTab, setActiveTab] = useState<TabId>('questions');

  // Role gate: only admins. The database also enforces this via RLS,
  // so this is defense-in-depth, not the only check.
  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
        <div className="w-full max-w-sm text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-red-600/20 border border-red-500/30 rounded-2xl mb-4">
            <Lock className="w-8 h-8 text-red-400" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">Akses Ditolak</h1>
          <p className="text-slate-400 text-sm mb-6">
            Halaman ini khusus admin/tutor. Akun kamu tidak memiliki izin yang diperlukan.
          </p>
          <button
            onClick={onExit}
            className="inline-flex items-center gap-1.5 px-5 py-2.5 bg-slate-700 hover:bg-slate-600 text-white text-sm font-medium rounded-lg transition"
          >
            <ArrowLeft className="w-4 h-4" />
            Kembali ke Beranda
          </button>
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
            <p className="font-semibold text-sm leading-tight flex items-center gap-1.5">
              Panel Guru / Admin
              <ShieldCheck className="w-3.5 h-3.5 text-yellow-400" />
            </p>
            <p className="text-slate-400 text-xs">
              {adminName ? `Masuk sebagai ${adminName}` : 'Kelola konten & hasil tryout'}
            </p>
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
        {activeTab === 'grades' && <GradesTab />}
        {activeTab === 'schedules' && <SchedulesTab />}
        {activeTab === 'offlineClasses' && <OfflineClassesTab />}
        {activeTab === 'materials' && <MaterialsTab />}
        {activeTab === 'students' && <StudentsTab />}
        {activeTab === 'accessCodes' && <AccessCodesTab packages={packages} />}
      </div>
    </div>
  );
}
