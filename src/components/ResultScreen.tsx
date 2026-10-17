import { Award, CheckCircle2, XCircle, Circle, BookOpen, RotateCcw, TrendingUp, Home } from 'lucide-react';
import { SubtestResult } from '@/types';

interface ResultScreenProps {
  results: SubtestResult[];
  participantName: string;
  onUnlockDiscussion: () => void;
  onRestart: () => void;
  onBackHome: () => void;
}

export default function ResultScreen({ results, participantName, onUnlockDiscussion, onRestart, onBackHome }: ResultScreenProps) {
  const totalCorrect = results.reduce((acc, r) => acc + r.correct, 0);
  const totalQuestions = results.reduce((acc, r) => acc + r.total, 0);
  const totalScore = totalQuestions > 0 ? Math.round((totalCorrect / totalQuestions) * 1000) : 0;
  const scoreColor = totalScore >= 800 ? 'text-green-500' : totalScore >= 600 ? 'text-blue-400' : 'text-orange-400';

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 py-8 px-4">
      <div className="max-w-3xl mx-auto">
        {/* Score card */}
        <div className="bg-slate-800/50 backdrop-blur rounded-2xl border border-slate-700 p-8 mb-6 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-600/20 rounded-full mb-4">
            <Award className="w-8 h-8 text-blue-400" />
          </div>
          <p className="text-slate-400 text-sm mb-1">Hasil Tryout — {participantName}</p>
          <h1 className={`text-6xl font-bold ${scoreColor} mb-1`}>
            {totalScore}
            <span className="text-slate-500 text-3xl font-medium"> / 1000</span>
          </h1>
          <p className="text-slate-500 text-sm">Skor maksimal 1000</p>

          <div className="flex items-center justify-center gap-2 mt-4 text-slate-300 text-sm">
            <TrendingUp className="w-4 h-4 text-blue-400" />
            {totalCorrect} dari {totalQuestions} soal benar
          </div>
        </div>

        {/* Breakdown table */}
        <div className="bg-slate-800/50 backdrop-blur rounded-2xl border border-slate-700 p-6 mb-6">
          <h2 className="text-white font-semibold mb-4">Rincian Nilai per Subtes</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-700 text-slate-400 text-xs uppercase tracking-wide">
                  <th className="text-left py-3 px-2">Subtes</th>
                  <th className="text-center py-3 px-2">Benar</th>
                  <th className="text-center py-3 px-2">Salah</th>
                  <th className="text-center py-3 px-2">Kosong</th>
                  <th className="text-right py-3 px-2">Skor</th>
                </tr>
              </thead>
              <tbody>
                {results.map((r) => (
                  <tr key={r.subtestId} className="border-b border-slate-700/50 last:border-0">
                    <td className="py-3.5 px-2 text-slate-200 font-medium">{r.name}</td>
                    <td className="py-3.5 px-2 text-center">
                      <span className="inline-flex items-center gap-1 text-green-400">
                        <CheckCircle2 className="w-4 h-4" />
                        {r.correct}
                      </span>
                    </td>
                    <td className="py-3.5 px-2 text-center">
                      <span className="inline-flex items-center gap-1 text-red-400">
                        <XCircle className="w-4 h-4" />
                        {r.wrong}
                      </span>
                    </td>
                    <td className="py-3.5 px-2 text-center">
                      <span className="inline-flex items-center gap-1 text-slate-500">
                        <Circle className="w-4 h-4" />
                        {r.empty}
                      </span>
                    </td>
                    <td className="py-3.5 px-2 text-right">
                      <span className="font-bold text-white text-base">{r.score}</span>
                      <span className="text-slate-500 text-xs"> / 1000</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3">
          <button
            onClick={onUnlockDiscussion}
            className="flex-1 bg-blue-600 hover:bg-blue-500 text-white font-semibold py-3.5 rounded-xl transition flex items-center justify-center gap-2"
          >
            <BookOpen className="w-5 h-5" />
            Buka Kunci Pembahasan
          </button>
          <button
            onClick={onRestart}
            className="flex-1 bg-slate-700 hover:bg-slate-600 text-white font-semibold py-3.5 rounded-xl transition flex items-center justify-center gap-2"
          >
            <RotateCcw className="w-5 h-5" />
            Ulang Tryout
          </button>
          <button
            onClick={onBackHome}
            className="flex-1 bg-slate-700 hover:bg-slate-600 text-white font-semibold py-3.5 rounded-xl transition flex items-center justify-center gap-2"
          >
            <Home className="w-5 h-5" />
            Kembali ke Beranda
          </button>
        </div>
      </div>
    </div>
  );
}
