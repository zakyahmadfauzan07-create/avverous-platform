import { Loader2, AlertTriangle, RotateCcw, PlayCircle } from 'lucide-react';

interface ResumeExamModalProps {
  open: boolean;
  packageName?: string;
  lastUpdated?: string;
  loading?: boolean;
  onResume: () => void;
  onRestart: () => void;
  onCancel: () => void;
}

function formatUpdatedAt(ts?: string): string {
  if (!ts) return '';
  const d = new Date(ts);
  if (isNaN(d.getTime())) return '';
  return d.toLocaleString('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function ResumeExamModal({
  open,
  packageName,
  lastUpdated,
  loading,
  onResume,
  onRestart,
  onCancel,
}: ResumeExamModalProps) {
  if (!open) return null;

  const updated = formatUpdatedAt(lastUpdated);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-2xl">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center shrink-0">
            <AlertTriangle className="w-6 h-6 text-amber-600" />
          </div>
          <div>
            <h3 className="font-semibold text-slate-900 leading-tight">Sesi Ujian Belum Selesai</h3>
            <p className="text-slate-500 text-sm">
              {packageName ? `Paket: ${packageName}` : 'Kamu memiliki sesi ujian yang belum selesai.'}
            </p>
          </div>
        </div>

        <p className="text-slate-600 text-sm leading-relaxed mb-5">
          Tindak lanjut di perangkat ini ditemukan. Pilih untuk melanjutkan dari progres tersimpan (jawaban, subtes aktif, dan sisa waktu akan dipulihkan), atau mulai dari awal. Menyalin progres akan menghapus sesi yang tersimpan.
        </p>

        {updated && (
          <p className="text-xs text-slate-400 mb-5">
            Progres tersimpan terakhir: {updated}
          </p>
        )}

        {loading && (
          <div className="flex items-center justify-center gap-2 text-slate-500 text-sm py-6">
            <Loader2 className="w-5 h-5 animate-spin" />
            Memeriksa progres tersimpan...
          </div>
        )}

        {!loading && (
          <div className="space-y-2.5">
            <button
              onClick={onResume}
              className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 rounded-xl transition flex items-center justify-center gap-2"
            >
              <PlayCircle className="w-5 h-5" />
              Lanjutkan Ujian
            </button>
            <button
              onClick={onRestart}
              className="w-full bg-amber-500 hover:bg-amber-400 text-white font-bold py-3 rounded-xl transition flex items-center justify-center gap-2"
            >
              <RotateCcw className="w-5 h-5" />
              Mulai Ulang
            </button>
            <button
              onClick={onCancel}
              className="w-full py-2.5 text-slate-500 hover:text-slate-700 text-sm font-medium transition"
            >
              Batal
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
