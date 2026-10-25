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

type Theme = {
  bg: string;
  iconWrap: string;
  icon: string;
  ring: string;
  hover: string;
};

const TABS: {
  id: TabId;
  label: string;
  description: string;
  icon: typeof ListChecks;
  theme: Theme;
}[] = [
  {
    id: 'questions',
    label: 'Soal Tryout',
    description: 'Kelola paket soal, subtes, dan bank soal tryout siswa.',
    icon: ListChecks,
    theme: {
      bg: 'from-blue-50 to-blue-100/40',
      iconWrap: 'bg-blue-600',
      icon: 'text-white',
      ring: 'group-hover:ring-blue-300',
      hover: 'hover:shadow-blue-200',
    },
  },
  {
    id: 'practice',
    label: 'Bank Latihan Soal',
    description: 'Pertanyaan latihan mandiri untuk siswa berlatih kapan saja.',
    icon: FileQuestion,
    theme: {
      bg: 'from-emerald-50 to-emerald-100/40',
      iconWrap: 'bg-emerald-600',
      icon: 'text-white',
      ring: 'group-hover:ring-emerald-300',
      hover: 'hover:shadow-emerald-200',
    },
  },
  {
    id: 'modules',
    label: 'Modul Pembelajaran',
    description: 'Unggah dan atur modul pembelajaran digital untuk siswa.',
    icon: Library,
    theme: {
      bg: 'from-violet-50 to-violet-100/40',
      iconWrap: 'bg-violet-600',
      icon: 'text-white',
      ring: 'group-hover:ring-violet-300',
      hover: 'hover:shadow-violet-200',
    },
  },
  {
    id: 'results',
    label: 'Hasil Tryout Siswa',
    description: 'Pantau skor, rekap nilai, dan analisis hasil tryout siswa.',
    icon: Trophy,
    theme: {
      bg: 'from-amber-50 to-amber-100/40',
      iconWrap: 'bg-amber-600',
      icon: 'text-white',
      ring: 'group-hover:ring-amber-300',
      hover: 'hover:shadow-amber-200',
    },
  },
  {
    id: 'grades',
    label: 'Input Nilai',
    description: 'Catat dan perbarui nilai siswa untuk berbagai mata pelajaran.',
    icon: ClipboardList,
    theme: {
      bg: 'from-rose-50 to-rose-100/40',
      iconWrap: 'bg-rose-600',
      icon: 'text-white',
      ring: 'group-hover:ring-rose-300',
      hover: 'hover:shadow-rose-200',
    },
  },
  {
    id: 'schedules',
    label: 'Jadwal',
    description: 'Atur jadwal tryout, sesi, dan tenggat waktu pengerjaan.',
    icon: CalendarDays,
    theme: {
      bg: 'from-cyan-50 to-cyan-100/40',
      iconWrap: 'bg-cyan-600',
      icon: 'text-white',
      ring: 'group-hover:ring-cyan-300',
      hover: 'hover:shadow-cyan-200',
    },
  },
  {
    id: 'offlineClasses',
    label: 'Kelas Offline L12',
    description: 'Kelola jadwal kelas offline, pertemuan, dan absensi siswa.',
    icon: DoorOpen,
    theme: {
      bg: 'from-orange-50 to-orange-100/40',
      iconWrap: 'bg-orange-600',
      icon: 'text-white',
      ring: 'group-hover:ring-orange-300',
      hover: 'hover:shadow-orange-200',
    },
  },
  {
    id: 'materials',
    label: 'Materi Arsip',
    description: 'Kelola arsip materi pembelajaran dan dokumen pendukung.',
    icon: BookOpen,
    theme: {
      bg: 'from-teal-50 to-teal-100/40',
      iconWrap: 'bg-teal-600',
      icon: 'text-white',
      ring: 'group-hover:ring-teal-300',
      hover: 'hover:shadow-teal-200',
    },
  },
  {
    id: 'students',
    label: 'Daftar Siswa',
    description: 'Lihat dan kelola data siswa yang terdaftar pada platform.',
    icon: Users,
    theme: {
      bg: 'from-indigo-50 to-indigo-100/40',
      iconWrap: 'bg-indigo-600',
      icon: 'text-white',
      ring: 'group-hover:ring-indigo-300',
      hover: 'hover:shadow-indigo-200',
    },
  },
  {
    id: 'accessCodes',
    label: 'Kode Akses',
    description: 'Buat dan kelola kode akses tryout untuk distribusi siswa.',
    icon: KeyRound,
    theme: {
      bg: 'from-slate-50 to-slate-100/40',
      iconWrap: 'bg-slate-700',
      icon: 'text-white',
      ring: 'group-hover:ring-slate-300',
      hover: 'hover:shadow-slate-200',
    },
  },
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
  const [activeTab, setActiveTab] = useState<TabId | null>(null);
  const activeTabMeta = TABS.find((t) => t.id === activeTab) ?? null;

  const handleBack = () => setActiveTab(null);

  const renderActive = () => {
    switch (activeTab) {
      case 'questions':
        return (
          <QuestionsTab
            packages={packages}
            onPackagesChange={onPackagesChange}
            onResetPackages={onResetPackages}
          />
        );
      case 'practice':
        return <PracticeTab questions={practiceQuestions} onChange={onPracticeChange} />;
      case 'modules':
        return <ModulesTab modules={modules} onChange={onModulesChange} />;
      case 'results':
        return <ResultsTab results={results} onDelete={onResultDelete} />;
      case 'grades':
        return <GradesTab />;
      case 'schedules':
        return <SchedulesTab />;
      case 'offlineClasses':
        return <OfflineClassesTab />;
      case 'materials':
        return <MaterialsTab />;
      case 'students':
        return <StudentsTab />;
      case 'accessCodes':
        return <AccessCodesTab packages={packages} />;
      default:
        return null;
    }
  };

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

      <div className="max-w-6xl mx-auto p-4 md:p-6">
        {activeTab === null ? (
          <>
            <div className="mb-6">
              <h1 className="text-2xl md:text-3xl font-bold text-slate-800">Menu Admin</h1>
              <p className="text-slate-500 mt-1 text-sm md:text-base">
                Pilih salah satu kartu di bawah untuk mulai mengelola konten dan data siswa.
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-5">
              {TABS.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`group text-left bg-white rounded-2xl border border-slate-200 p-5 shadow-sm transition-all duration-200 hover:-translate-y-1 hover:shadow-lg ${tab.theme.hover}`}
                  >
                    <div className={`inline-flex items-center justify-center w-12 h-12 rounded-xl ${tab.theme.iconWrap} ring-4 ring-transparent ${tab.theme.ring} transition mb-4`}>
                      <Icon className={`w-6 h-6 ${tab.theme.icon}`} />
                    </div>
                    <h2 className="text-base md:text-lg font-semibold text-slate-800 leading-snug">
                      {tab.label}
                    </h2>
                    <p className="mt-1.5 text-sm text-slate-500 leading-relaxed">
                      {tab.description}
                    </p>
                    <span className="inline-flex items-center gap-1 mt-4 text-sm font-medium text-blue-600 group-hover:gap-2 transition-all">
                      Buka menu
                      <ArrowLeft className="w-4 h-4 rotate-180" />
                    </span>
                  </button>
                );
              })}
            </div>
          </>
        ) : (
          <>
            <button
              onClick={handleBack}
              className="mb-4 inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 hover:border-slate-300 text-sm font-medium transition shadow-sm"
            >
              <ArrowLeft className="w-4 h-4" />
              Kembali ke Menu Admin
            </button>
            <div className="flex items-center gap-2.5 mb-4">
              {activeTabMeta && (
                <div
                  className={`inline-flex items-center justify-center w-9 h-9 rounded-lg ${activeTabMeta.theme.iconWrap}`}
                >
                  <activeTabMeta.icon className={`w-5 h-5 ${activeTabMeta.theme.icon}`} />
                </div>
              )}
              <h1 className="text-xl md:text-2xl font-bold text-slate-800">
                {activeTabMeta?.label}
              </h1>
            </div>
            {renderActive()}
          </>
        )}
      </div>
    </div>
  );
}
