import { useEffect, useState } from 'react';
import { Loader2, AlertCircle, X, Users, ShieldCheck, GraduationCap, Search } from 'lucide-react';
import { fetchStudentSummaries, StudentSummaryRow } from '@/lib/dashboardStore';
import { supabase } from '@/lib/supabase';

export default function StudentsTab() {
  const [items, setItems] = useState<StudentSummaryRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [busy, setBusy] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    try {
      setItems(await fetchStudentSummaries());
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Gagal memuat siswa.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function toggleRole(s: StudentSummaryRow) {
    const newRole = s.role === 'admin' ? 'student' : 'admin';
    if (!confirm(`Ubah ${s.full_name || s.email} menjadi ${newRole}?`)) return;
    setBusy(s.id);
    try {
      const { error } = await supabase.rpc('set_user_role', { target_id: s.id, new_role: newRole });
      if (error) throw error;
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Gagal mengubah role.');
    } finally {
      setBusy(null);
    }
  }

  const filtered = items.filter(
    (s) =>
      s.full_name.toLowerCase().includes(search.toLowerCase()) ||
      s.email.toLowerCase().includes(search.toLowerCase()) ||
      s.school.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="font-bold text-blue-950 flex items-center gap-2">
            <Users className="w-5 h-5 text-blue-600" />
            Daftar Siswa
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">Progres tryout & role pengguna.</p>
        </div>
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari siswa..."
            className="pl-8 pr-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 w-56"
          />
        </div>
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
        <div className="bg-white border border-slate-200 rounded-xl overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-slate-500 text-xs">
              <tr>
                <th className="text-left px-4 py-3 font-medium">Siswa</th>
                <th className="text-left px-4 py-3 font-medium">Sekolah</th>
                <th className="text-center px-4 py-3 font-medium">Tryout</th>
                <th className="text-center px-4 py-3 font-medium">Nilai</th>
                <th className="text-center px-4 py-3 font-medium">Skor Akhir</th>
                <th className="text-center px-4 py-3 font-medium">Role</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-10 text-slate-400">
                    Tidak ada siswa.
                  </td>
                </tr>
              ) : (
                filtered.map((s) => (
                  <tr key={s.id} className="hover:bg-slate-50/50">
                    <td className="px-4 py-3">
                      <p className="font-medium text-blue-950">{s.full_name || '—'}</p>
                      <p className="text-xs text-slate-500">{s.email}</p>
                    </td>
                    <td className="px-4 py-3 text-slate-600 text-xs">{s.school || '—'}</td>
                    <td className="px-4 py-3 text-center text-slate-700">{s.tryout_count}</td>
                    <td className="px-4 py-3 text-center text-slate-700">{s.grade_count}</td>
                    <td className="px-4 py-3 text-center">
                      {s.latest_score !== null ? (
                        <span className="font-semibold text-blue-700">{s.latest_score}</span>
                      ) : (
                        <span className="text-slate-400">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <button
                        onClick={() => toggleRole(s)}
                        disabled={busy === s.id}
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium transition disabled:opacity-50 ${
                          s.role === 'admin'
                            ? 'bg-purple-100 text-purple-700 hover:bg-purple-200'
                            : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                        }`}
                      >
                        {s.role === 'admin' ? (
                          <>
                            <ShieldCheck className="w-3 h-3" />
                            Admin
                          </>
                        ) : (
                          <>
                            <GraduationCap className="w-3 h-3" />
                            Siswa
                          </>
                        )}
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
