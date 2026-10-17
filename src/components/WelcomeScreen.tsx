import { useState } from 'react';
import {
  GraduationCap,
  Clock,
  ListChecks,
  BookOpen,
  Calculator,
  ArrowRight,
  ShieldCheck,
  ArrowLeft,
} from 'lucide-react';
import { Subtest } from '@/types';

interface WelcomeScreenProps {
  onStart: (name: string) => void;
  onBackHome: () => void;
  subtests: Subtest[];
}

export default function WelcomeScreen({ onStart, onBackHome, subtests }: WelcomeScreenProps) {
  const [name, setName] = useState('');

  const handleStart = () => {
    if (!name.trim()) return;
    onStart(name.trim());
  };

  const totalQuestions = subtests.reduce((acc, s) => acc + s.questions.length, 0);
  const totalMinutes = subtests.reduce((acc, s) => acc + s.durationMinutes, 0);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-950 via-blue-900 to-blue-950 flex items-center justify-center p-4 md:p-8 relative">
      {/* Back to home */}
      <button
        onClick={onBackHome}
        className="absolute top-4 left-4 flex items-center gap-1.5 px-3 py-2 rounded-lg bg-blue-900/80 hover:bg-blue-800 text-slate-200 hover:text-white text-xs font-medium transition border border-blue-700/50"
      >
        <ArrowLeft className="w-4 h-4" />
        Kembali ke Beranda
      </button>

      <div className="w-full max-w-4xl">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-blue-800 rounded-2xl mb-4 shadow-lg shadow-blue-600/30 border border-blue-700/50">
            <GraduationCap className="w-11 h-11 text-yellow-400" />
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">Tryout CBT UTBK SNBT</h1>
          <p className="text-blue-300 text-sm md:text-base">Averroes Academy — Simulasi Ujian Berbasis Komputer</p>
        </div>

        {/* Info cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <InfoCard icon={<ListChecks className="w-5 h-5" />} title={`${totalQuestions} Soal`} subtitle={`${subtests.length} Subtes`} />
          <InfoCard icon={<Clock className="w-5 h-5" />} title={`${totalMinutes} Menit`} subtitle="Total durasi ujian" />
          <InfoCard icon={<Calculator className="w-5 h-5" />} title="Skor 500–1000" subtitle="Sistem penilaian UTBK" />
        </div>

        {/* Subtes list */}
        <div className="bg-blue-900/40 backdrop-blur rounded-xl border border-blue-800/50 p-6 mb-6">
          <h2 className="text-white font-semibold mb-4 flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-yellow-400" />
            Daftar Subtes
          </h2>
          <div className="space-y-3">
            {subtests.map((st) => (
              <div key={st.id} className="flex items-center justify-between bg-blue-950/50 rounded-lg p-4 border border-blue-800/50">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-lg bg-yellow-400/20 flex items-center justify-center text-yellow-300 font-bold text-sm">
                    {st.shortName}
                  </div>
                  <div>
                    <p className="text-white font-medium text-sm">{st.name}</p>
                    <p className="text-blue-400 text-xs">{st.questions.length} soal</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-blue-300 text-sm">
                  <Clock className="w-4 h-4" />
                  {st.durationMinutes} menit
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Rules */}
        <div className="bg-yellow-400/10 border border-yellow-400/30 rounded-xl p-5 mb-6">
          <h3 className="text-yellow-300 font-semibold text-sm mb-3 flex items-center gap-2">
            <ShieldCheck className="w-4 h-4" />
            Tata Tertib & Aturan Ujian
          </h3>
          <ul className="text-blue-100 text-sm space-y-2">
            <li className="flex gap-2"><span className="text-yellow-400">•</span> Timer berjalan per subtes dan tidak dapat dihentikan.</li>
            <li className="flex gap-2"><span className="text-yellow-400">•</span> Anda tidak dapat kembali ke subtes sebelumnya setelah waktu habis.</li>
            <li className="flex gap-2"><span className="text-yellow-400">•</span> Jawaban tersimpan otomatis, tetap aman walau koneksi terganggu.</li>
            <li className="flex gap-2"><span className="text-yellow-400">•</span> Tidak ada pengurangan poin untuk jawaban salah.</li>
          </ul>
        </div>

        {/* Name input + start */}
        <div className="bg-blue-900/40 backdrop-blur rounded-xl border border-blue-800/50 p-6">
          <label className="block text-blue-100 text-sm font-medium mb-2">Nama Peserta</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleStart()}
            placeholder="Masukkan nama lengkap Anda..."
            className="w-full bg-blue-950 border border-blue-700 rounded-lg px-4 py-3 text-white placeholder-blue-400 focus:outline-none focus:ring-2 focus:ring-yellow-400 transition"
          />
          <button
            onClick={handleStart}
            disabled={!name.trim()}
            className="w-full mt-4 bg-yellow-400 hover:bg-yellow-300 disabled:bg-slate-700 disabled:text-slate-500 text-blue-900 font-bold py-3 rounded-lg transition flex items-center justify-center gap-2"
          >
            Mulai Ujian
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}

function InfoCard({ icon, title, subtitle }: { icon: React.ReactNode; title: string; subtitle: string }) {
  return (
    <div className="bg-blue-900/40 backdrop-blur rounded-xl border border-blue-800/50 p-4 flex items-center gap-3">
      <div className="w-10 h-10 rounded-lg bg-yellow-400/20 flex items-center justify-center text-yellow-300 shrink-0">
        {icon}
      </div>
      <div>
        <p className="text-white font-semibold text-sm">{title}</p>
        <p className="text-blue-400 text-xs">{subtitle}</p>
      </div>
    </div>
  );
}
