import { useState } from 'react';
import { KeyRound, Loader2, AlertCircle, X, ArrowRight } from 'lucide-react';

interface AccessCodeModalProps {
  packageName: string;
  onSubmit: (code: string) => Promise<void>;
  onCancel: () => void;
}

export default function AccessCodeModal({ packageName, onSubmit, onCancel }: AccessCodeModalProps) {
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [verifying, setVerifying] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim()) {
      setError('Masukkan kode akses terlebih dahulu.');
      return;
    }
    setVerifying(true);
    setError('');
    try {
      await onSubmit(code.trim());
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Kode akses tidak valid, silakan hubungi tutor/admin.');
    } finally {
      setVerifying(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 bg-yellow-100 rounded-xl flex items-center justify-center text-yellow-700">
              <KeyRound className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-blue-950 text-sm">Masukkan Kode Akses Tryout</h3>
              <p className="text-xs text-slate-500 truncate max-w-[200px]">{packageName}</p>
            </div>
          </div>
          <button onClick={onCancel} className="text-slate-400 hover:text-slate-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={submit} className="space-y-3">
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Kode Akses</label>
            <input
              value={code}
              onChange={(e) => {
                setCode(e.target.value);
                setError('');
              }}
              placeholder="Ketik kode akses..."
              autoFocus
              className="w-full px-3.5 py-3 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono tracking-wide"
            />
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-2.5 flex items-start gap-2 text-xs text-red-700">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <p className="text-xs text-slate-400 leading-relaxed">
            Kode akses didapat dari tutor/admin Averroes Academy. Kode bersifat case-sensitive.
          </p>

          <div className="flex gap-2 pt-1">
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 py-2.5 border border-slate-200 text-slate-600 text-sm font-medium rounded-lg hover:bg-slate-50 transition"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={verifying}
              className="flex-1 py-2.5 bg-yellow-400 hover:bg-yellow-300 text-blue-900 text-sm font-bold rounded-lg transition disabled:opacity-50 flex items-center justify-center gap-1.5"
            >
              {verifying ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Memeriksa...
                </>
              ) : (
                <>
                  Mulai Tryout
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
