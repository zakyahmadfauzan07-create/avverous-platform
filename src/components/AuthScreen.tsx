import { useState, useEffect, useRef } from 'react';
import { GraduationCap, Mail, Lock, User, School, ArrowLeft, AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';

interface AuthScreenProps {
  onBackHome: () => void;
  onAuthSuccess: () => void;
}

export default function AuthScreen({ onBackHome, onAuthSuccess }: AuthScreenProps) {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [fullName, setFullName] = useState('');
  const [school, setSchool] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const successRef = useRef(false);

  // Navigate away whenever a session is established (covers login, register+auto-signin, and existing sessions).
  useEffect(() => {
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session && !successRef.current) {
        successRef.current = true;
        onAuthSuccess();
      }
    });
    return () => {
      listener.subscription.unsubscribe();
    };
  }, [onAuthSuccess]);

  const handleLogin = async () => {
    setError('');
    setInfo('');
    if (!email.trim() || !password) {
      setError('Email dan password wajib diisi.');
      return;
    }
    setLoading(true);
    const { error: err } = await supabase.auth.signInWithPassword({ email, password });
    if (err) {
      setLoading(false);
      setError(translateError(err.message));
      return;
    }
    // onAuthStateChange listener will trigger onAuthSuccess.
  };

  const handleRegister = async () => {
    setError('');
    setInfo('');
    if (!fullName.trim() || !school.trim() || !email.trim() || !password.trim()) {
      setError('Semua kolom wajib diisi.');
      return;
    }
    if (password.length < 6) {
      setError('Password minimal 6 karakter.');
      return;
    }
    setLoading(true);
    const { data, error: err } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName.trim(),
          school: school.trim(),
        },
      },
    });
    if (err) {
      setLoading(false);
      setError(translateError(err.message));
      return;
    }
    // If Supabase returned a session immediately, the user is already logged in.
    if (data.session) {
      // onAuthStateChange listener will trigger onAuthSuccess.
      return;
    }
    // Fallback: no session returned (email confirmation still on at the auth level).
    // Try signing in immediately since our DB trigger auto-confirms the email.
    const { error: signInErr } = await supabase.auth.signInWithPassword({ email, password });
    if (signInErr) {
      setLoading(false);
      setError('Akun berhasil dibuat. Silakan masuk dengan email dan password kamu.');
      setFullName('');
      setSchool('');
      setPassword('');
      setMode('login');
      return;
    }
    // onAuthStateChange listener will trigger onAuthSuccess.
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;
    if (mode === 'login') handleLogin();
    else handleRegister();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-950 via-blue-900 to-blue-950 flex items-center justify-center p-4 md:p-8 relative">
      <button
        onClick={onBackHome}
        className="absolute top-4 left-4 flex items-center gap-1.5 px-3 py-2 rounded-lg bg-blue-900/80 hover:bg-blue-800 text-slate-200 hover:text-white text-xs font-medium transition border border-blue-700/50"
      >
        <ArrowLeft className="w-4 h-4" />
        Kembali ke Beranda
      </button>

      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-blue-800 rounded-2xl mb-4 shadow-lg shadow-blue-600/30 border border-blue-700/50">
            <GraduationCap className="w-11 h-11 text-yellow-400" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-1">
            {mode === 'login' ? 'Masuk Akun' : 'Buat Akun'}
          </h1>
          <p className="text-blue-300 text-sm">Averroes Academy — Portal Siswa</p>
        </div>

        {/* Info message */}
        {info && (
          <div className="bg-green-500/15 border border-green-400/30 rounded-xl p-4 mb-4 flex items-start gap-3">
            <CheckCircle2 className="w-5 h-5 text-green-400 shrink-0 mt-0.5" />
            <p className="text-green-200 text-sm leading-relaxed">{info}</p>
          </div>
        )}

        {/* Error message */}
        {error && (
          <div className="bg-red-500/15 border border-red-400/30 rounded-xl p-4 mb-4 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
            <p className="text-red-200 text-sm leading-relaxed">{error}</p>
          </div>
        )}

        {/* Form card */}
        <div className="bg-blue-900/40 backdrop-blur rounded-xl border border-blue-800/50 p-6">
          {/* Mode tabs */}
          <div className="flex gap-1 mb-5 bg-blue-950/50 rounded-lg p-1">
            <button
              onClick={() => {
                setMode('login');
                setError('');
                setInfo('');
              }}
              className={`flex-1 py-2.5 rounded-md text-sm font-medium transition ${
                mode === 'login' ? 'bg-yellow-400 text-blue-900' : 'text-blue-200 hover:text-white'
              }`}
            >
              Masuk
            </button>
            <button
              onClick={() => {
                setMode('register');
                setError('');
                setInfo('');
              }}
              className={`flex-1 py-2.5 rounded-md text-sm font-medium transition ${
                mode === 'register' ? 'bg-yellow-400 text-blue-900' : 'text-blue-200 hover:text-white'
              }`}
            >
              Daftar
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'register' && (
              <>
                <FormField
                  icon={<User className="w-4 h-4" />}
                  label="Nama Lengkap"
                  type="text"
                  value={fullName}
                  onChange={setFullName}
                  placeholder="Nama lengkap kamu"
                />
                <FormField
                  icon={<School className="w-4 h-4" />}
                  label="Asal Sekolah"
                  type="text"
                  value={school}
                  onChange={setSchool}
                  placeholder="contoh: SMA Negeri 1 Jakarta"
                />
              </>
            )}

            <FormField
              icon={<Mail className="w-4 h-4" />}
              label="Email Gmail"
              type="email"
              value={email}
              onChange={setEmail}
              placeholder="nama@gmail.com"
            />

            <FormField
              icon={<Lock className="w-4 h-4" />}
              label="Password"
              type="password"
              value={password}
              onChange={setPassword}
              placeholder="Minimal 6 karakter"
            />

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-yellow-400 hover:bg-yellow-300 disabled:bg-slate-700 disabled:text-slate-500 text-blue-900 font-bold py-3 rounded-lg transition flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Memproses...
                </>
              ) : mode === 'login' ? (
                'Masuk'
              ) : (
                'Daftar Sekarang'
              )}
            </button>
          </form>

          {mode === 'register' && (
            <p className="text-blue-300 text-xs mt-4 text-center leading-relaxed">
              Setelah daftar, kamu langsung masuk dan bisa memilih paket tryout.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

function FormField({
  icon,
  label,
  type,
  value,
  onChange,
  placeholder,
}: {
  icon: React.ReactNode;
  label: string;
  type: string;
  value: string;
  onChange: (val: string) => void;
  placeholder: string;
}) {
  return (
    <div>
      <label className="block text-blue-100 text-sm font-medium mb-1.5">{label}</label>
      <div className="flex items-center gap-2 bg-blue-950 border border-blue-700 rounded-lg px-3 py-3 focus-within:ring-2 focus-within:ring-yellow-400 transition">
        <span className="text-blue-400 shrink-0">{icon}</span>
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="flex-1 bg-transparent text-white placeholder-blue-400 focus:outline-none text-sm"
        />
      </div>
    </div>
  );
}

function translateError(msg: string): string {
  const lower = msg.toLowerCase();
  if (lower.includes('invalid login credentials')) return 'Email atau password salah.';
  if (lower.includes('user already registered')) return 'Email sudah terdaftar. Silakan login.';
  if (lower.includes('email not confirmed')) return 'Akun belum diverifikasi. Cek email kamu untuk verifikasi.';
  if (lower.includes('password should be at least')) return 'Password minimal 6 karakter.';
  if (lower.includes('unable to send email')) return 'Gagal mengirim email verifikasi. Coba lagi nanti.';
  return msg;
}
