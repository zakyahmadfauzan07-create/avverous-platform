import { useEffect, useState } from 'react';
import {
  GraduationCap,
  ArrowLeft,
  ArrowRight,
  Clock,
  ListChecks,
  FileQuestion,
  Package,
  ChevronDown,
  ChevronUp,
  Lock,
  PlayCircle,
  Loader2,
} from 'lucide-react';
import { TryoutPackage } from '@/data/questions';
import { verifyTryoutCode, fetchAccessCodes } from '@/lib/accessCodeStore';
import { loadSession } from '@/lib/sessionStore';
import AccessCodeModal from './AccessCodeModal';

interface PackageSelectionScreenProps {
  packages: TryoutPackage[];
  onSelect: (pkg: TryoutPackage) => void;
  onResume: (pkg: TryoutPackage) => void;
  onBackHome: () => void;
}

export default function PackageSelectionScreen({ packages, onSelect, onResume, onBackHome }: PackageSelectionScreenProps) {
  const [expandedId, setExpandedId] = useState<number | null>(packages[0]?.id ?? null);
  const [codeModalPkg, setCodeModalPkg] = useState<TryoutPackage | null>(null);
  const [protectedIds, setProtectedIds] = useState<Set<number>>(new Set());
  const [inProgressIds, setInProgressIds] = useState<Set<number>>(new Set());

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const rows = await fetchAccessCodes();
        if (mounted) setProtectedIds(new Set(rows.map((r) => r.package_id)));
      } catch {
        // Students can't SELECT the table (admin-only); that's fine —
        // verification still happens via verifyTryoutCode on submit.
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    const ids = new Set<number>();
    packages.forEach((p) => {
      if (loadSession(p.id)) ids.add(p.id);
    });
    setInProgressIds(ids);
  }, [packages]);

  const toggle = (id: number) => {
    setExpandedId((prev) => (prev === id ? null : id));
  };

  const handleAttemptStart = async (pkg: TryoutPackage) => {
    // Verify access code server-side. If no code is set for the package,
    // verifyTryoutCode returns true and we proceed immediately.
    try {
      const ok = await verifyTryoutCode(pkg.id, '');
      if (ok) {
        onSelect(pkg);
        return;
      }
    } catch {
      // fall through to code modal
    }
    setCodeModalPkg(pkg);
  };

  const handleAttemptResume = async (pkg: TryoutPackage) => {
    try {
      const ok = await verifyTryoutCode(pkg.id, '');
      if (ok) {
        onResume(pkg);
        return;
      }
    } catch {
      // fall through to code modal
    }
    setCodeModalPkg(pkg);
  };

  const handleCodeSubmit = async (code: string) => {
    if (!codeModalPkg) return;
    const ok = await verifyTryoutCode(codeModalPkg.id, code);
    if (!ok) {
      throw new Error('Kode akses tidak valid, silakan hubungi tutor/admin.');
    }
    const pkg = codeModalPkg;
    const isResume = inProgressIds.has(pkg.id);
    setCodeModalPkg(null);
    if (isResume) onResume(pkg);
    else onSelect(pkg);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-950 via-blue-900 to-blue-950">
      {/* Header */}
      <header className="sticky top-0 z-20 bg-blue-950/90 backdrop-blur border-b border-blue-800/50">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-800 rounded-xl flex items-center justify-center border border-blue-700/50">
              <GraduationCap className="w-6 h-6 text-yellow-400" />
            </div>
            <div>
              <p className="text-white font-semibold text-sm leading-tight">Daftar Paket Tryout</p>
              <p className="text-blue-400 text-xs">Pilih paket untuk memulai simulasi</p>
            </div>
          </div>
          <button
            onClick={onBackHome}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-blue-900/80 hover:bg-blue-800 text-slate-200 hover:text-white text-xs font-medium transition border border-blue-700/50"
          >
            <ArrowLeft className="w-4 h-4" />
            Kembali ke Beranda
          </button>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 py-8 md:py-12">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 bg-yellow-400/15 border border-yellow-400/30 text-yellow-300 text-xs font-medium px-3 py-1.5 rounded-full mb-4">
            <Package className="w-3.5 h-3.5" />
            Pilih Paket Tryout
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">Daftar Paket Tryout</h1>
          <p className="text-blue-300 text-sm md:text-base max-w-2xl mx-auto">
            Setiap paket berisi subtes dengan total soal dan durasi yang berbeda. Pilih paket yang ingin kamu kerjakan.
          </p>
        </div>

        <div className="space-y-4">
          {packages.map((pkg) => {
            const totalQuestions = pkg.subtests.reduce((acc, s) => acc + s.questions.length, 0);
            const totalMinutes = pkg.subtests.reduce((acc, s) => acc + s.durationMinutes, 0);
            const expanded = expandedId === pkg.id;

            return (
              <div
                key={pkg.id}
                className="bg-blue-900/40 backdrop-blur rounded-xl border border-blue-800/50 overflow-hidden transition"
              >
                {/* Summary row */}
                <button
                  onClick={() => toggle(pkg.id)}
                  className="w-full flex items-center gap-4 p-5 text-left hover:bg-blue-900/60 transition"
                >
                  <div className="w-12 h-12 rounded-xl bg-yellow-400/20 flex items-center justify-center text-yellow-300 font-bold shrink-0">
                    {pkg.id}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-white font-semibold text-base truncate">{pkg.name}</p>
                      {protectedIds.has(pkg.id) && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-medium text-yellow-300 bg-yellow-400/15 border border-yellow-400/30 px-1.5 py-0.5 rounded-full shrink-0">
                          <Lock className="w-3 h-3" />
                          Terkunci
                        </span>
                      )}
                      {inProgressIds.has(pkg.id) && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-medium text-green-300 bg-green-400/15 border border-green-400/30 px-1.5 py-0.5 rounded-full shrink-0">
                          <Loader2 className="w-3 h-3 animate-spin" />
                          Sedang Berjalan
                        </span>
                      )}
                    </div>
                    <p className="text-blue-300 text-sm line-clamp-1">{pkg.description}</p>
                    <div className="flex flex-wrap items-center gap-3 mt-2 text-xs text-blue-300">
                      <span className="inline-flex items-center gap-1">
                        <ListChecks className="w-3.5 h-3.5" />
                        {pkg.subtests.length} subtes
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <FileQuestion className="w-3.5 h-3.5" />
                        {totalQuestions} soal
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" />
                        {totalMinutes} menit
                      </span>
                    </div>
                  </div>
                  <div className="shrink-0 text-blue-300">
                    {expanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                  </div>
                </button>

                {/* Expanded subtest detail */}
                {expanded && (
                  <div className="border-t border-blue-800/50 p-5 bg-blue-950/40 space-y-3">
                    {pkg.subtests.map((st) => (
                      <div
                        key={st.id}
                        className="flex items-center justify-between bg-blue-950/50 rounded-lg p-3.5 border border-blue-800/50"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-9 h-9 rounded-lg bg-yellow-400/20 flex items-center justify-center text-yellow-300 font-bold text-xs shrink-0">
                            {st.shortName}
                          </div>
                          <div className="min-w-0">
                            <p className="text-white font-medium text-sm truncate">{st.name}</p>
                            <p className="text-blue-400 text-xs">{st.questions.length} soal</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-1.5 text-blue-300 text-xs shrink-0">
                          <Clock className="w-3.5 h-3.5" />
                          {st.durationMinutes} menit
                        </div>
                      </div>
                    ))}

                    {inProgressIds.has(pkg.id) ? (
                      <button
                        onClick={() => handleAttemptResume(pkg)}
                        className="w-full mt-2 bg-green-500 hover:bg-green-400 text-white font-bold py-3 rounded-lg transition flex items-center justify-center gap-2"
                      >
                        <PlayCircle className="w-5 h-5" />
                        Lanjutkan Ujian
                        <ArrowRight className="w-5 h-5" />
                      </button>
                    ) : (
                      <button
                        onClick={() => handleAttemptStart(pkg)}
                        className="w-full mt-2 bg-yellow-400 hover:bg-yellow-300 text-blue-900 font-bold py-3 rounded-lg transition flex items-center justify-center gap-2"
                      >
                        Mulai Paket Ini
                        <ArrowRight className="w-5 h-5" />
                      </button>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {codeModalPkg && (
        <AccessCodeModal
          packageName={codeModalPkg.name}
          onSubmit={handleCodeSubmit}
          onCancel={() => setCodeModalPkg(null)}
        />
      )}
    </div>
  );
}
