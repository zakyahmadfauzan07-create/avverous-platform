import { useEffect, useMemo, useState } from 'react';
import {
  GraduationCap,
  ArrowLeft,
  Loader2,
  AlertCircle,
  Trophy,
  ListChecks,
  CalendarDays,
  BookOpen,
  ExternalLink,
  TrendingUp,
  Clock,
  MapPin,
  FileText,
  Inbox,
} from 'lucide-react';
import type { User } from '@supabase/supabase-js';
import { UserProfile } from '@/lib/supabase';
import { fetchMyResults, ExamResultWithId } from '@/lib/examResultsStore';
import {
  fetchUpcomingSchedules,
  fetchMaterials,
  fetchMyGrades,
  ScheduleRow,
  MaterialRow,
  GradeRow,
} from '@/lib/dashboardStore';

interface StudentDashboardProps {
  user: User;
  profile: UserProfile | null;
  onBackHome: () => void;
  onStartTryout: () => void;
}

interface ChartPoint {
  label: string;
  score: number;
  date: number;
}

export default function StudentDashboard({ user, profile, onBackHome, onStartTryout }: StudentDashboardProps) {
  const [results, setResults] = useState<ExamResultWithId[]>([]);
  const [grades, setGrades] = useState<GradeRow[]>([]);
  const [schedules, setSchedules] = useState<ScheduleRow[]>([]);
  const [materials, setMaterials] = useState<MaterialRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const [r, g, s, m] = await Promise.all([
          fetchMyResults(),
          fetchMyGrades(),
          fetchUpcomingSchedules(10),
          fetchMaterials(),
        ]);
        if (!mounted) return;
        setResults(r);
        setGrades(g);
        setSchedules(s);
        setMaterials(m);
      } catch (e) {
        if (mounted) setError(e instanceof Error ? e.message : 'Gagal memuat dashboard.');
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const totalQuestions = useMemo(
    () =>
      results.reduce(
        (acc, r) => acc + r.subtestResults.reduce((a, s) => a + s.total, 0),
        0,
      ),
    [results],
  );

  const chartPoints: ChartPoint[] = useMemo(() => {
    const points: ChartPoint[] = [];
    results.forEach((r) => {
      points.push({
        label: r.packageName,
        score: r.totalScore,
        date: r.completedAt,
      });
    });
    grades.forEach((g) => {
      points.push({
        label: g.title,
        score: g.score,
        date: new Date(g.graded_at).getTime(),
      });
    });
    return points.sort((a, b) => a.date - b.date);
  }, [results, grades]);

  const displayName = profile?.full_name || user.email || 'Siswa';
  const initial = displayName.charAt(0).toUpperCase();

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-gradient-to-r from-blue-950 to-blue-900 text-white shadow-lg">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-5 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <button
              onClick={onBackHome}
              className="p-2 rounded-lg bg-blue-800/60 hover:bg-blue-800 text-blue-100 transition shrink-0"
              aria-label="Kembali"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="w-11 h-11 bg-yellow-400 rounded-xl flex items-center justify-center text-blue-900 font-bold text-lg shrink-0">
              {initial}
            </div>
            <div className="min-w-0">
              <p className="font-semibold text-white text-sm truncate">{displayName}</p>
              <p className="text-blue-300 text-xs truncate">
                {profile?.school || 'Averroes Academy'} · Siswa
              </p>
            </div>
          </div>
          <button
            onClick={onStartTryout}
            className="hidden sm:inline-flex items-center gap-1.5 px-4 py-2 bg-yellow-400 hover:bg-yellow-300 text-blue-900 font-semibold text-sm rounded-lg transition"
          >
            <Trophy className="w-4 h-4" />
            Mulai Tryout
          </button>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
            <p className="text-red-700 text-sm">{error}</p>
          </div>
        )}

        {/* Statistic cards */}
        <section className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            icon={<ListChecks className="w-5 h-5" />}
            label="Soal Dikerjakan"
            value={totalQuestions.toLocaleString('id-ID')}
            tone="blue"
          />
          <StatCard
            icon={<Trophy className="w-5 h-5" />}
            label="Tryout Selesai"
            value={results.length.toString()}
            tone="yellow"
          />
          <StatCard
            icon={<TrendingUp className="w-5 h-5" />}
            label="Nilai Terakhir"
            value={chartPoints.length ? `${chartPoints[chartPoints.length - 1].score}` : '—'}
            tone="green"
          />
          <StatCard
            icon={<CalendarDays className="w-5 h-5" />}
            label="Sesi Mendatang"
            value={schedules.length.toString()}
            tone="purple"
          />
        </section>

        {/* Rapor chart */}
        <section className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="font-bold text-blue-950 text-lg flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-blue-600" />
                Grafik Rapor Nilai
              </h2>
              <p className="text-slate-500 text-xs mt-0.5">
                Perkembangan skor tryout & penilaian dari waktu ke waktu
              </p>
            </div>
          </div>
          {chartPoints.length === 0 ? (
            <EmptyState
              icon={<Inbox className="w-8 h-8" />}
              text="Belum ada nilai. Ikuti tryout atau tunggu admin menginput nilai."
            />
          ) : (
            <ScoreChart points={chartPoints} />
          )}
        </section>

        {/* Jadwal belajar */}
        <section className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-sm">
          <h2 className="font-bold text-blue-950 text-lg flex items-center gap-2 mb-4">
            <CalendarDays className="w-5 h-5 text-blue-600" />
            Jadwal Belajar Mendatang
          </h2>
          {schedules.length === 0 ? (
            <EmptyState icon={<Inbox className="w-8 h-8" />} text="Belum ada jadwal sesi belajar." />
          ) : (
            <div className="grid sm:grid-cols-2 gap-3">
              {schedules.map((s) => (
                <ScheduleCard key={s.id} schedule={s} />
              ))}
            </div>
          )}
        </section>

        {/* Arsip materi */}
        <section className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-sm">
          <h2 className="font-bold text-blue-950 text-lg flex items-center gap-2 mb-4">
            <BookOpen className="w-5 h-5 text-blue-600" />
            Arsip Materi & Pembahasan
          </h2>
          {materials.length === 0 ? (
            <EmptyState icon={<Inbox className="w-8 h-8" />} text="Belum ada materi yang dipublikasikan." />
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {materials.map((m) => (
                <MaterialCard key={m.id} material={m} />
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
  tone,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  tone: 'blue' | 'yellow' | 'green' | 'purple';
}) {
  const tones: Record<string, { bg: string; fg: string; ring: string }> = {
    blue: { bg: 'bg-blue-50', fg: 'text-blue-600', ring: 'ring-blue-100' },
    yellow: { bg: 'bg-yellow-50', fg: 'text-yellow-600', ring: 'ring-yellow-100' },
    green: { bg: 'bg-green-50', fg: 'text-green-600', ring: 'ring-green-100' },
    purple: { bg: 'bg-purple-50', fg: 'text-purple-600', ring: 'ring-purple-100' },
  };
  const t = tones[tone];
  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm flex items-center gap-3">
      <div className={`w-11 h-11 ${t.bg} ${t.fg} rounded-xl flex items-center justify-center ring-4 ${t.ring}`}>
        {icon}
      </div>
      <div>
        <p className="text-2xl font-bold text-blue-950 leading-none">{value}</p>
        <p className="text-slate-500 text-xs mt-1">{label}</p>
      </div>
    </div>
  );
}

function ScoreChart({ points }: { points: ChartPoint[] }) {
  const width = 720;
  const height = 240;
  const padding = { top: 20, right: 16, bottom: 36, left: 40 };
  const innerW = width - padding.left - padding.right;
  const innerH = height - padding.top - padding.bottom;
  const maxY = 1000;

  const xFor = (i: number) =>
    padding.left + (points.length <= 1 ? innerW / 2 : (innerW * i) / (points.length - 1));
  const yFor = (score: number) => padding.top + innerH - (score / maxY) * innerH;

  const pathD = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${xFor(i)} ${yFor(p.score)}`).join(' ');
  const areaD = `${pathD} L ${xFor(points.length - 1)} ${padding.top + innerH} L ${xFor(0)} ${padding.top + innerH} Z`;

  const yTicks = [0, 250, 500, 750, 1000];

  return (
    <div className="overflow-x-auto">
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full min-w-[560px] h-auto">
        <defs>
          <linearGradient id="scoreArea" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="rgba(37,99,235,0.25)" />
            <stop offset="100%" stopColor="rgba(37,99,235,0)" />
          </linearGradient>
        </defs>
        {yTicks.map((t) => (
          <g key={t}>
            <line
              x1={padding.left}
              x2={width - padding.right}
              y1={yFor(t)}
              y2={yFor(t)}
              stroke="#e2e8f0"
              strokeDasharray={t === 0 ? '0' : '4 4'}
            />
            <text x={padding.left - 8} y={yFor(t) + 4} textAnchor="end" className="fill-slate-400" fontSize="10">
              {t}
            </text>
          </g>
        ))}
        {points.length > 1 && <path d={areaD} fill="url(#scoreArea)" />}
        <path d={pathD} fill="none" stroke="#2563eb" strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />
        {points.map((p, i) => (
          <g key={i}>
            <circle cx={xFor(i)} cy={yFor(p.score)} r="4" fill="#2563eb" stroke="white" strokeWidth="2" />
            <text
              x={xFor(i)}
              y={padding.top + innerH + 18}
              textAnchor="middle"
              className="fill-slate-500"
              fontSize="10"
            >
              {formatShortDate(p.date)}
            </text>
            <text x={xFor(i)} y={yFor(p.score) - 10} textAnchor="middle" className="fill-blue-700" fontSize="10" fontWeight="600">
              {p.score}
            </text>
          </g>
        ))}
      </svg>
      <div className="flex flex-wrap gap-2 mt-3">
        {points.map((p, i) => (
          <span
            key={i}
            className="inline-flex items-center gap-1.5 text-xs bg-slate-50 border border-slate-200 rounded-full px-2.5 py-1 text-slate-600"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
            {p.label} · {p.score}
          </span>
        ))}
      </div>
    </div>
  );
}

function ScheduleCard({ schedule }: { schedule: ScheduleRow }) {
  const d = new Date(`${schedule.session_date}T${schedule.start_time}`);
  return (
    <div className="border border-slate-200 rounded-xl p-4 hover:border-blue-200 hover:shadow-sm transition">
      <div className="flex items-start justify-between gap-2 mb-2">
        <p className="font-semibold text-blue-950 text-sm leading-snug">{schedule.title}</p>
        <span className="text-xs font-medium text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full shrink-0">
          {formatFullDate(d)}
        </span>
      </div>
      <p className="text-slate-500 text-xs mb-2">{schedule.topic}</p>
      <div className="space-y-1.5 text-xs text-slate-600">
        <p className="flex items-center gap-1.5">
          <Clock className="w-3.5 h-3.5 text-slate-400" />
          {formatTime(schedule.start_time)}
          {schedule.end_time ? ` – ${formatTime(schedule.end_time)}` : ''}
        </p>
        {schedule.location && (
          <p className="flex items-center gap-1.5">
            <MapPin className="w-3.5 h-3.5 text-slate-400" />
            <span className="truncate">{schedule.location}</span>
          </p>
        )}
      </div>
      {schedule.notes && <p className="text-slate-400 text-xs mt-2 italic">{schedule.notes}</p>}
    </div>
  );
}

function MaterialCard({ material }: { material: MaterialRow }) {
  return (
    <div className="border border-slate-200 rounded-xl p-4 hover:border-blue-200 hover:shadow-sm transition flex flex-col">
      <div className="flex items-center gap-2 mb-2">
        <div className="w-9 h-9 bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center shrink-0">
          <FileText className="w-4 h-4" />
        </div>
        <span className="text-xs font-medium text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full truncate">
          {material.category}
        </span>
      </div>
      <p className="font-semibold text-blue-950 text-sm leading-snug mb-1">{material.title}</p>
      {material.description && <p className="text-slate-500 text-xs mb-2 line-clamp-2">{material.description}</p>}
      <div className="mt-auto pt-2 flex items-center gap-3">
        {material.link && (
          <a
            href={material.link}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1 text-xs font-medium text-blue-600 hover:text-blue-700"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            Buka link
          </a>
        )}
        {material.content && (
          <span className="text-xs text-slate-400">Materi tersedia</span>
        )}
      </div>
    </div>
  );
}

function EmptyState({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-10 text-slate-400">
      <div className="w-14 h-14 bg-slate-50 rounded-2xl flex items-center justify-center mb-3">{icon}</div>
      <p className="text-sm">{text}</p>
    </div>
  );
}

function formatShortDate(ts: number): string {
  return new Date(ts).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
}
function formatFullDate(d: Date): string {
  return d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
}
function formatTime(t: string): string {
  return t.slice(0, 5);
}
