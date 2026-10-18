import { useEffect, useState } from 'react';
import { KeyRound, Loader2, AlertCircle, X, Save, Trash2, Check, Lock, LockOpen } from 'lucide-react';
import { TryoutPackage } from '@/data/questions';
import {
  fetchAccessCodes,
  upsertAccessCode,
  deleteAccessCode,
  AccessCodeRow,
} from '@/lib/accessCodeStore';

interface AccessCodesTabProps {
  packages: TryoutPackage[];
}

export default function AccessCodesTab({ packages }: AccessCodesTabProps) {
  const [codes, setCodes] = useState<AccessCodeRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editing, setEditing] = useState<{ packageId: number; packageName: string; code: string } | null>(null);
  const [saving, setSaving] = useState(false);
  const [savedPkg, setSavedPkg] = useState<number | null>(null);

  async function load() {
    setLoading(true);
    try {
      setCodes(await fetchAccessCodes());
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Gagal memuat kode akses.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  function codeFor(packageId: number): AccessCodeRow | undefined {
    return codes.find((c) => c.package_id === packageId);
  }

  async function handleSave() {
    if (!editing) return;
    if (!editing.code.trim()) {
      setError('Kode akses tidak boleh kosong.');
      return;
    }
    setSaving(true);
    setError('');
    try {
      await upsertAccessCode(editing.packageId, editing.packageName, editing.code);
      setEditing(null);
      await load();
      setSavedPkg(editing.packageId);
      setTimeout(() => setSavedPkg(null), 1800);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Gagal menyimpan.');
    } finally {
      setSaving(false);
    }
  }

  async function handleRemove(packageId: number) {
    if (!confirm('Hapus kode akses untuk paket ini? Paket akan jadi tanpa kode (bebas akses).')) return;
    try {
      await deleteAccessCode(packageId);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Gagal menghapus.');
    }
  }

  return (
    <div className="space-y-4">
      <div>
        <h2 className="font-bold text-blue-950 flex items-center gap-2">
          <KeyRound className="w-5 h-5 text-blue-600" />
          Kode Akses Tryout
        </h2>
        <p className="text-xs text-slate-500 mt-0.5">
          Atur kode akses per paket. Siswa harus memasukkan kode yang benar sebelum mulai mengerjakan. Paket tanpa
          kode bersifat bebas akses.
        </p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-3 flex items-start gap-2 text-sm text-red-700">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{error}</span>
          <button onClick={() => setError('')} className="ml-auto">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-10">
          <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
        </div>
      ) : (
        <div className="bg-white border border-slate-200 rounded-xl divide-y divide-slate-100">
          {packages.map((pkg) => {
            const row = codeFor(pkg.id);
            const protectedCount = pkg.subtests.reduce((a, s) => a + s.questions.length, 0);
            return (
              <div key={pkg.id} className="p-4 flex items-center justify-between gap-3">
                <div className="min-w-0 flex items-center gap-3">
                  <div
                    className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
                      row ? 'bg-yellow-100 text-yellow-700' : 'bg-slate-100 text-slate-400'
                    }`}
                  >
                    {row ? <Lock className="w-4 h-4" /> : <LockOpen className="w-4 h-4" />}
                  </div>
                  <div className="min-w-0">
                    <p className="font-medium text-blue-950 text-sm truncate">{pkg.name}</p>
                    <p className="text-xs text-slate-500">
                      {protectedCount} soal ·{' '}
                      {row ? (
                        <span className="text-yellow-700 font-mono font-medium">Kode: {row.access_code}</span>
                      ) : (
                        <span className="text-slate-400">Tanpa kode (bebas akses)</span>
                      )}
                    </p>
                  </div>
                  {savedPkg === pkg.id && (
                    <span className="inline-flex items-center gap-1 text-xs text-green-600 bg-green-50 px-2 py-0.5 rounded-full">
                      <Check className="w-3 h-3" /> Tersimpan
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    onClick={() =>
                      setEditing({ packageId: pkg.id, packageName: pkg.name, code: row?.access_code ?? '' })
                    }
                    className="px-3 py-1.5 text-xs font-medium bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-lg transition"
                  >
                    {row ? 'Ubah Kode' : 'Atur Kode'}
                  </button>
                  {row && (
                    <button
                      onClick={() => handleRemove(pkg.id)}
                      className="p-1.5 text-slate-400 hover:text-red-600 transition"
                      title="Hapus kode"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {editing && (
        <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-sm w-full p-5 shadow-xl">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-bold text-blue-950 flex items-center gap-2">
                <KeyRound className="w-4 h-4 text-blue-600" />
                Kode Akses
              </h3>
              <button onClick={() => setEditing(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className="text-xs text-slate-500 mb-3 truncate">Paket: {editing.packageName}</p>
            <label className="block text-xs font-medium text-slate-600 mb-1">Masukkan Kode Akses</label>
            <input
              value={editing.code}
              onChange={(e) => setEditing({ ...editing, code: e.target.value })}
              placeholder="contoh: AVERROES2026"
              autoFocus
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
            />
            <p className="text-xs text-slate-400 mt-2">
              Kode bersifat case-sensitive (huruf besar/kecil berbeda).
            </p>
            <div className="flex gap-2 mt-4">
              <button
                onClick={() => setEditing(null)}
                className="flex-1 py-2.5 border border-slate-200 text-slate-600 text-sm font-medium rounded-lg hover:bg-slate-50 transition"
              >
                Batal
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold rounded-lg transition disabled:opacity-50 flex items-center justify-center gap-1.5"
              >
                <Save className="w-4 h-4" />
                {saving ? 'Menyimpan...' : 'Simpan'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
