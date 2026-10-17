import { useState } from 'react';
import { ArrowLeft, Trophy, Calendar, CheckCircle2, XCircle, Circle, Package, Users, ChevronRight, Trash2 } from 'lucide-react';
import { ExamResultWithId } from '@/lib/examResultsStore';
import { TRYOUT_PACKAGES } from '@/data/questions';

interface ResultsTabProps {
  results: ExamResultWithId[];
  onDelete: (dbId: string) => void;
}

export default function ResultsTab({ results, onDelete }: ResultsTabProps) {
  const [selectedPackageId, setSelectedPackageId] = useState<number | null>(null);
  const [selectedResult, setSelectedResult] = useState<ExamResultWithId | null>(null);

  if (selectedResult) {
    return <ResultDetail record={selectedResult} onBack={() => setSelectedResult(null)} />;
  }

  if (selectedPackageId !== null) {
    const pkgResults = results.filter((r) => r.packageId === selectedPackageId);
    const pkg = TRYOUT_PACKAGES.find((p) => p.id === selectedPackageId);
    return (
      <PackageStudentsView
        packageName={pkg?.name || `Paket ${selectedPackageId}`}
        results={pkgResults}
        onSelect={setSelectedResult}
        onBack={() => setSelectedPackageId(null)}
        onDelete={onDelete}
      />
    );
  }

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5">
      <h2 className="font-semibold text-slate-800 flex items-center gap-2 mb-4">
        <Trophy className="w-5 h-5 text-yellow-600" />
        Hasil Tryout Siswa
      </h2>
      <p className="text-slate-500 text-sm mb-5">Pilih paket untuk melihat daftar siswa yang sudah mengerjakan.</p>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {TRYOUT_PACKAGES.map((pkg) => {
          const count = results.filter((r) => r.packageId === pkg.id).length;
          const avgScore =
            count > 0
              ? Math.round(results.filter((r) => r.packageId === pkg.id).reduce((acc, r) => acc + r.totalScore, 0) / count)
              : 0;
          return (
            <button
              key={pkg.id}
              onClick={() => setSelectedPackageId(pkg.id)}
              className="text-left bg-slate-50 hover:bg-blue-50 border border-slate-200 hover:border-blue-300 rounded-xl p-5 transition group"
            >
              <div className="flex items-center justify-between mb-3">
                <div className="w-11 h-11 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold">
                  {pkg.id}
                </div>
                <ChevronRight className="w-5 h-5 text-slate-400 group-hover:text-blue-600 transition" />
              </div>
              <p className="font-semibold text-slate-800 text-sm">{pkg.name}</p>
              <p className="text-slate-400 text-xs line-clamp-2 mt-0.5">{pkg.description}</p>
              <div className="flex items-center gap-4 mt-3 pt-3 border-t border-slate-200">
                <span className="flex items-center gap-1.5 text-xs text-slate-500">
                  <Users className="w-3.5 h-3.5" />
                  {count} siswa
                </span>
                {count > 0 && (
                  <span className="flex items-center gap-1.5 text-xs text-slate-500">
                    <Trophy className="w-3.5 h-3.5" />
                    Rata-rata {avgScore}
                  </span>
                )}
              </div>
            </button>
          );
        })}
      </div>

      {results.length === 0 && (
        <p className="text-slate-400 text-sm text-center py-8 mt-2 border-t border-slate-100">
          Belum ada siswa yang menyelesaikan tryout.
        </p>
      )}
    </div>
  );
}

function PackageStudentsView({
  packageName,
  results,
  onSelect,
  onBack,
  onDelete,
}: {
  packageName: string;
  results: ExamResultWithId[];
  onSelect: (r: ExamResultWithId) => void;
  onBack: () => void;
  onDelete: (dbId: string) => void;
}) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5">
      <button
        onClick={onBack}
        className="flex items-center gap-1.5 text-slate-500 hover:text-blue-600 text-sm font-medium mb-4 transition"
      >
        <ArrowLeft className="w-4 h-4" />
        Kembali ke Daftar Paket
      </button>

      <h2 className="font-semibold text-slate-800 flex items-center gap-2 mb-1">
        <Package className="w-5 h-5 text-blue-600" />
        {packageName}
      </h2>
      <p className="text-slate-500 text-sm mb-5">{results.length} siswa telah mengerjakan paket ini.</p>

      {results.length === 0 ? (
        <p className="text-slate-400 text-sm text-center py-8">Belum ada siswa yang mengerjakan paket ini.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-slate-400 text-xs uppercase tracking-wide">
                <th className="text-left py-3 px-3">Nama Siswa</th>
                <th className="text-left py-3 px-3">Tanggal</th>
                <th className="text-right py-3 px-3">Skor</th>
                <th className="text-center py-3 px-3">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {results.map((r) => (
                <tr key={r.dbId} className="border-b border-slate-100 last:border-0 hover:bg-slate-50 transition">
                  <td className="py-3.5 px-3">
                    <button
                      onClick={() => onSelect(r)}
                      className="font-medium text-slate-800 hover:text-blue-600 transition text-left"
                    >
                      {r.participantName}
                    </button>
                  </td>
                  <td className="py-3.5 px-3 text-slate-500 flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5" />
                    {new Date(r.completedAt).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })}
                  </td>
                  <td className="py-3.5 px-3 text-right">
                    <span className="font-bold text-blue-700 text-base">{r.totalScore}</span>
                    <span className="text-slate-400 text-xs"> / 1000</span>
                  </td>
                  <td className="py-3.5 px-3 text-center">
                    <div className="flex items-center justify-center gap-1">
                      <button
                        onClick={() => onSelect(r)}
                        className="px-2.5 py-1.5 rounded-lg bg-blue-50 text-blue-700 text-xs font-medium hover:bg-blue-100 transition"
                      >
                        Detail
                      </button>
                      <button
                        onClick={() => onDelete(r.dbId)}
                        className="p-1.5 rounded-lg text-slate-400 hover:bg-red-50 hover:text-red-600 transition"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function ResultDetail({ record, onBack }: { record: ExamResultWithId; onBack: () => void }) {
  return (
    <div className="space-y-5">
      <button
        onClick={onBack}
        className="flex items-center gap-1.5 text-slate-500 hover:text-blue-600 text-sm font-medium transition"
      >
        <ArrowLeft className="w-4 h-4" />
        Kembali ke Daftar Siswa
      </button>

      <div className="bg-white rounded-xl border border-slate-200 p-6 text-center">
        <p className="text-slate-500 text-sm mb-1">{record.participantName} — {record.packageName}</p>
        <p className="text-slate-400 text-xs mb-3">
          {new Date(record.completedAt).toLocaleString('id-ID', { day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
        </p>
        <h1 className="text-5xl font-bold text-blue-700 mb-1">
          {record.totalScore}
          <span className="text-slate-400 text-2xl font-medium"> / 1000</span>
        </h1>
      </div>

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
              {record.subtestResults.map((r) => (
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

      {record.subtests.map((st) => (
        <div key={st.id} className="bg-white rounded-xl border border-slate-200 p-6">
          <h3 className="font-semibold text-slate-800 mb-4">{st.name}</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-slate-400 text-xs uppercase tracking-wide">
                  <th className="text-left py-2 px-2">No.</th>
                  <th className="text-left py-2 px-2">Jawaban Siswa</th>
                  <th className="text-left py-2 px-2">Kunci</th>
                  <th className="text-center py-2 px-2">Status</th>
                </tr>
              </thead>
              <tbody>
                {st.questions.map((q, idx) => {
                  const studentAns = record.answers[q.id] || '';
                  const isCorrect = studentAns && studentAns.trim().toLowerCase() === q.correctAnswer.trim().toLowerCase();
                  const isWrong = studentAns && !isCorrect;
                  return (
                    <tr key={q.id} className="border-b border-slate-50 last:border-0">
                      <td className="py-2.5 px-2 text-slate-500 font-medium">{idx + 1}</td>
                      <td className="py-2.5 px-2 text-slate-700">{studentAns || <span className="text-slate-400">(kosong)</span>}</td>
                      <td className="py-2.5 px-2 text-slate-700 font-medium">{q.correctAnswer}</td>
                      <td className="py-2.5 px-2 text-center">
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
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ))}
    </div>
  );
}
