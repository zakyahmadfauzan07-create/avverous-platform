import { useState } from 'react';
import {
  GraduationCap,
  Lock,
  Menu,
  X,
  ArrowRight,
  BookOpen,
  Monitor,
  FileQuestion,
  ShieldCheck,
  Clock,
  Users,
  CheckCircle2,
  Mail,
  Phone,
  MapPin,
  Sparkles,
  Home as HomeIcon,
  LogIn,
  LogOut,
  History,
  LayoutDashboard,
  Info,
  CircleUser,
} from 'lucide-react';
import { Subtest } from '@/types';
import { UserProfile } from '@/lib/supabase';
import type { User } from '@supabase/supabase-js';

interface LandingPageProps {
  onStartTryout: () => void;
  onAdmin: () => void;
  onHistory: () => void;
  subtests: Subtest[];
  user: User | null;
  profile: UserProfile | null;
  onLogout: () => void;
  onLogin: () => void;
}

const NAV_ITEMS = [
  { label: 'Beranda', href: '#beranda' },
  { label: 'Modul Belajar', href: '#modul' },
  { label: 'Tryout CBT', href: '#tryout' },
  { label: 'Kontak', href: '#kontak' },
];

export default function LandingPage({ onStartTryout, onAdmin, onHistory, onDashboard, isAdmin, subtests, user, profile, onLogout, onLogin }: LandingPageProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showLoginNotice, setShowLoginNotice] = useState(false);

  const totalQuestions = subtests.reduce((acc, s) => acc + s.questions.length, 0);
  const totalMinutes = subtests.reduce((acc, s) => acc + s.durationMinutes, 0);

  const handleDashboardClick = () => {
    setMobileMenuOpen(false);
    if (user) {
      onDashboard();
    } else {
      setShowLoginNotice(true);
      onLogin();
    }
  };

  return (
    <div className="min-h-screen bg-white text-slate-800">
      {/* ============ NAVBAR ============ */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-md border-b border-slate-100 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <a href="#beranda" className="flex items-center gap-2.5 shrink-0">
              <div className="w-10 h-10 bg-blue-900 rounded-xl flex items-center justify-center shadow-md shadow-blue-900/20">
                <GraduationCap className="w-6 h-6 text-yellow-400" />
              </div>
              <div>
                <p className="font-bold text-blue-900 text-base leading-tight">Averroes Academy</p>
                <p className="text-slate-400 text-[10px] leading-tight">Portal Pembelajaran Resmi</p>
              </div>
            </a>

            {/* Desktop nav */}
            <div className="hidden lg:flex items-center gap-1">
              {NAV_ITEMS.map((item) => (
                <a
                  key={item.label}
                  href={item.href}
                  className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-blue-900 hover:bg-blue-50/50 rounded-lg transition"
                >
                  {item.label}
                </a>
              ))}
            </div>

            {/* Right actions */}
            <div className="hidden lg:flex items-center gap-3">
              <button
                onClick={handleDashboardClick}
                className="flex items-center gap-1.5 px-3.5 py-2 text-sm font-semibold text-white bg-blue-900 hover:bg-blue-800 border border-blue-800 rounded-lg transition"
              >
                <LayoutDashboard className="w-4 h-4" />
                Dashboard
              </button>
              {isAdmin && (
                <button
                  onClick={onAdmin}
                  className="flex items-center gap-1.5 px-3.5 py-2 text-sm font-medium text-slate-600 hover:text-blue-900 border border-slate-200 hover:border-blue-200 rounded-lg transition"
                >
                  <Lock className="w-4 h-4" />
                  Panel Admin
                </button>
              )}
              {user ? (
                <>
                  <button
                    onClick={onHistory}
                    className="flex items-center gap-1.5 px-3.5 py-2 text-sm font-medium text-slate-600 hover:text-blue-900 border border-slate-200 hover:border-blue-200 rounded-lg transition"
                  >
                    <History className="w-4 h-4" />
                    Riwayat Tryout
                  </button>
                  <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-50 rounded-lg">
                    <div className="w-7 h-7 bg-blue-900 rounded-full flex items-center justify-center text-yellow-400 text-xs font-bold shrink-0">
                      {(profile?.full_name || user.email || '?').charAt(0).toUpperCase()}
                    </div>
                    <span className="text-sm font-medium text-blue-900 max-w-[140px] truncate">
                      {profile?.full_name || user.email}
                    </span>
                  </div>
                  <button
                    onClick={onLogout}
                    className="flex items-center gap-1.5 px-3.5 py-2 text-sm font-medium text-red-600 hover:text-red-700 hover:bg-red-50 border border-red-200 hover:border-red-300 rounded-lg transition"
                  >
                    <LogOut className="w-4 h-4" />
                    Keluar
                  </button>
                </>
              ) : (
                <button
                  onClick={onLogin}
                  className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-blue-900 hover:text-blue-700 border border-blue-200 hover:border-blue-300 rounded-lg transition"
                >
                  <LogIn className="w-4 h-4" />
                  Masuk / Daftar
                </button>
              )}
              <button
                onClick={onStartTryout}
                className="px-5 py-2 bg-yellow-400 hover:bg-yellow-300 text-blue-900 font-semibold text-sm rounded-lg shadow-sm transition flex items-center gap-1.5"
              >
                Mulai Belajar
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>

            {/* Mobile toggle */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 text-slate-600 hover:text-blue-900 transition"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {mobileMenuOpen && (
          <div className="lg:hidden bg-white border-t border-slate-100 px-4 py-4 space-y-1 shadow-lg">
            {NAV_ITEMS.map((item) => (
              <a
                key={item.label}
                href={item.href}
                onClick={() => setMobileMenuOpen(false)}
                className="block px-4 py-2.5 text-sm font-medium text-slate-600 hover:text-blue-900 hover:bg-blue-50 rounded-lg transition"
              >
                {item.label}
              </a>
            ))}
            <div className="pt-3 mt-3 border-t border-slate-100 flex flex-col gap-2">
              {user ? (
                <>
                  <button
                    onClick={() => {
                      setMobileMenuOpen(false);
                      onHistory();
                    }}
                    className="flex items-center justify-center gap-1.5 px-4 py-2.5 text-sm font-medium text-slate-600 border border-slate-200 rounded-lg transition"
                  >
                    <History className="w-4 h-4" />
                    Riwayat Tryout
                  </button>
                  <div className="flex items-center gap-2 px-4 py-2.5 bg-blue-50 rounded-lg">
                    <div className="w-8 h-8 bg-blue-900 rounded-full flex items-center justify-center text-yellow-400 text-xs font-bold shrink-0">
                      {(profile?.full_name || user.email || '?').charAt(0).toUpperCase()}
                    </div>
                    <span className="text-sm font-medium text-blue-900 truncate">{profile?.full_name || user.email}</span>
                  </div>
                  <button
                    onClick={() => {
                      setMobileMenuOpen(false);
                      onLogout();
                    }}
                    className="flex items-center justify-center gap-1.5 px-4 py-2.5 text-sm font-medium text-red-600 border border-red-200 rounded-lg transition"
                  >
                    <LogOut className="w-4 h-4" />
                    Keluar
                  </button>
                </>
              ) : (
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    onLogin();
                  }}
                  className="flex items-center justify-center gap-1.5 px-4 py-2.5 text-sm font-medium text-blue-900 border border-blue-200 rounded-lg transition"
                >
                  <LogIn className="w-4 h-4" />
                  Masuk / Daftar
                </button>
              )}
              <button
                onClick={handleDashboardClick}
                className="flex items-center justify-center gap-1.5 px-4 py-2.5 text-sm font-semibold text-white bg-blue-900 border border-blue-800 rounded-lg transition"
              >
                <LayoutDashboard className="w-4 h-4" />
                Dashboard
              </button>
              {isAdmin && (
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    onAdmin();
                  }}
                  className="flex items-center justify-center gap-1.5 px-4 py-2.5 text-sm font-medium text-slate-600 border border-slate-200 rounded-lg transition"
                >
                  <Lock className="w-4 h-4" />
                  Panel Admin
                </button>
              )}
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  onStartTryout();
                }}
                className="px-4 py-2.5 bg-yellow-400 text-blue-900 font-semibold text-sm rounded-lg transition flex items-center justify-center gap-1.5"
              >
                Mulai Belajar
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </nav>

      {/* Login-required toast for Dashboard button */}
      {showLoginNotice && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-[60] w-[calc(100%-2rem)] max-w-sm animate-[fadeIn_0.2s_ease-out]">
          <div className="bg-blue-900 text-white rounded-xl shadow-2xl border border-blue-700 p-4 flex items-start gap-3">
            <div className="w-9 h-9 bg-blue-700 rounded-lg flex items-center justify-center shrink-0">
              <Info className="w-5 h-5 text-yellow-300" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-sm">Akses Dashboard Siswa</p>
              <p className="text-blue-200 text-xs mt-0.5 leading-relaxed">
                Silakan masuk ke akun Anda terlebih dahulu untuk mengakses Dashboard Siswa.
              </p>
            </div>
            <button
              onClick={() => setShowLoginNotice(false)}
              className="text-blue-300 hover:text-white shrink-0"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* ============ HERO ============ */}
      <section id="beranda" className="relative pt-16 overflow-hidden">
        {/* Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-950 via-blue-900 to-blue-800" />
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 20% 50%, white 1px, transparent 1px), radial-gradient(circle at 80% 20%, white 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
        {/* Decorative blobs */}
        <div className="absolute top-10 right-0 w-72 h-72 bg-yellow-400/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-10 w-96 h-96 bg-blue-400/10 rounded-full blur-3xl" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-28">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left: text */}
            <div className="text-center lg:text-left">
              <div className="inline-flex items-center gap-2 bg-yellow-400/15 border border-yellow-400/30 text-yellow-300 text-xs font-medium px-3 py-1.5 rounded-full mb-5">
                <Sparkles className="w-3.5 h-3.5" />
                Platform Persiapan UTBK #1
              </div>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white leading-tight mb-3">
                Averroes Academy
              </h1>
              <p className="text-xl sm:text-2xl text-yellow-300 font-semibold mb-4">
                "Belajar Bersama demi Mimpi Kita Bersama"
              </p>
              <p className="text-slate-300 text-base sm:text-lg leading-relaxed max-w-xl mx-auto lg:mx-0 mb-8">
                Platform persiapan ujian dan tryout UTBK interaktif nomor 1 untuk meraih kampus impianmu.
              </p>

              {/* CTA buttons */}
              <div className="flex flex-col sm:flex-row gap-3 justify-center lg:justify-start">
                <button
                  onClick={onStartTryout}
                  className="px-7 py-3.5 bg-yellow-400 hover:bg-yellow-300 text-blue-900 font-bold text-base rounded-xl shadow-lg shadow-yellow-400/20 hover:shadow-xl hover:shadow-yellow-400/30 transition flex items-center justify-center gap-2"
                >
                  <Monitor className="w-5 h-5" />
                  Ikuti Tryout CBT Sekarang
                </button>
                <a
                  href="#modul"
                  className="px-7 py-3.5 border-2 border-blue-300/50 hover:border-yellow-300 hover:text-yellow-300 text-blue-100 font-semibold text-base rounded-xl transition flex items-center justify-center gap-2"
                >
                  <BookOpen className="w-5 h-5" />
                  Jelajahi Modul Pembelajaran
                </a>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-4 mt-12 max-w-md mx-auto lg:mx-0">
                <HeroStat value="Ratusan Lebih" label="Alumni Lolos PTN" />
                <HeroStat value={`${totalQuestions}+`} label="Bank Soal" />
                <HeroStat value="0-1000" label="Skor UTBK" />
              </div>
            </div>

            {/* Right: illustration card */}
            <div className="hidden lg:block relative">
              <div className="absolute inset-0 bg-gradient-to-tr from-yellow-400/20 to-blue-400/20 rounded-3xl blur-2xl" />
              <div className="relative bg-white/10 backdrop-blur-lg border border-white/20 rounded-3xl p-8 shadow-2xl">
                <div className="bg-white rounded-2xl p-6 shadow-xl">
                  <div className="flex items-center gap-3 mb-5">
                    <div className="w-12 h-12 bg-blue-900 rounded-xl flex items-center justify-center">
                      <Monitor className="w-6 h-6 text-yellow-400" />
                    </div>
                    <div>
                      <p className="font-bold text-blue-900">Tryout CBT Simulation</p>
                      <p className="text-slate-400 text-xs">Sistem ujian berbasis komputer</p>
                    </div>
                  </div>
                  <div className="space-y-3">
                    {subtests.slice(0, 3).map((st, i) => (
                      <div key={st.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 bg-blue-100 rounded-lg flex items-center justify-center text-blue-700 font-bold text-xs">
                            {st.shortName}
                          </div>
                          <div>
                            <p className="text-slate-800 text-sm font-medium">{st.name}</p>
                            <p className="text-slate-400 text-xs">{st.questions.length} soal</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-1 text-slate-400 text-xs">
                          <Clock className="w-3.5 h-3.5" />
                          {st.durationMinutes}m
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="mt-5 flex items-center gap-2 text-xs text-slate-500">
                    <ShieldCheck className="w-4 h-4 text-green-500" />
                    Penilaian otomatis · Skor 0–1000
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Wave divider */}
        <svg className="absolute bottom-0 w-full" viewBox="0 0 1440 80" fill="none" preserveAspectRatio="none" style={{ height: '40px' }}>
          <path d="M0 80L60 70C120 60 240 40 360 35C480 30 600 40 720 45C840 50 960 50 1080 45C1200 40 1320 30 1380 25L1440 20V80H0Z" fill="white" />
        </svg>
      </section>

      {/* ============ FEATURE GRID ============ */}
      <section id="modul" className="py-20 px-4 sm:px-6 lg:px-8 bg-slate-50/50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <span className="inline-block text-blue-700 text-sm font-semibold uppercase tracking-wide mb-2">Fitur Utama</span>
            <h2 className="text-3xl sm:text-4xl font-bold text-blue-950 mb-3">Semua yang Kamu Butuhkan untuk Sukses</h2>
            <p className="text-slate-500 text-base max-w-2xl mx-auto">Tiga pilar pembelajaran terintegrasi untuk persiapan ujian yang matang.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {/* Card 1: Tryout CBT */}
            <FeatureCard
              icon={<Monitor className="w-7 h-7" />}
              iconBg="bg-blue-900"
              iconColor="text-yellow-400"
              badge="Populer"
              title="Tryout CBT UTBK"
              description="Simulasi ujian resmi dengan timer per subtes, navigasi soal, dan penilaian skor 0–1000."
              actionLabel="Mulai Ujian"
              onAction={onStartTryout}
            />

            {/* Card 2: Modul Pembelajaran */}
            <FeatureCard
              icon={<BookOpen className="w-7 h-7" />}
              iconBg="bg-blue-100"
              iconColor="text-blue-700"
              title="Modul Pembelajaran"
              description="Koleksi materi rangkuman teori, rumus cepat, dan tips pengerjaan soal."
              actionLabel="Pelajari Modul"
              href="#modul"
            />

            {/* Card 3: Bank Latihan Soal */}
            <FeatureCard
              icon={<FileQuestion className="w-7 h-7" />}
              iconBg="bg-yellow-100"
              iconColor="text-yellow-700"
              title="Bank Latihan Soal"
              description="Drilling soal mandiri tanpa tekanan waktu per subtes. Latihan sepuasnya."
              actionLabel="Latihan Sekarang"
              href="#tryout"
            />

            {/* Card 4: Dashboard Siswa */}
            <FeatureCard
              icon={<CircleUser className="w-7 h-7" />}
              iconBg="bg-purple-50"
              iconColor="text-purple-600"
              title="Dashboard Siswa"
              description="Pantau analitik nilai tryout, riwayat pengerjaan soal, dan progres belajarmu secara real-time."
              actionLabel="Buka Dashboard"
              onAction={handleDashboardClick}
            />

          </div>
        </div>
      </section>

      {/* ============ TRYOUT SECTION ============ */}
      <section id="tryout" className="py-20 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-5xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-10 items-center">
            <div>
              <span className="inline-block text-blue-700 text-sm font-semibold uppercase tracking-wide mb-2">Simulasi Ujian</span>
              <h2 className="text-3xl sm:text-4xl font-bold text-blue-950 mb-4">Rasakan Sensasi Ujian Sungguhan</h2>
              <p className="text-slate-500 text-base leading-relaxed mb-6">
                Tryout CBT kami mensimulasikan kondisi ujian UTBK yang sesungguhnya. Timer berjalan per subtes, navigasi soal dengan
                tanda ragu-ragu, dan penilaian skor otomatis menggunakan sistem 0–1000.
              </p>
              <div className="space-y-3 mb-8">
                {[
                  'Timer per subtes yang berjalan tanpa henti',
                  'Navigasi soal & penanda ragu-ragu',
                  'Penilaian otomatis skor 0–1000',
                  'Pembahasan lengkap setiap soal',
                ].map((point) => (
                  <div key={point} className="flex items-center gap-3">
                    <CheckCircle2 className="w-5 h-5 text-green-500 shrink-0" />
                    <span className="text-slate-700 text-sm">{point}</span>
                  </div>
                ))}
              </div>
              <button
                onClick={onStartTryout}
                className="px-7 py-3.5 bg-blue-900 hover:bg-blue-800 text-white font-bold text-base rounded-xl shadow-lg shadow-blue-900/20 transition flex items-center gap-2"
              >
                Mulai Tryout Sekarang
                <ArrowRight className="w-5 h-5" />
              </button>
            </div>

            {/* Stats panel */}
            <div className="bg-slate-50 rounded-2xl p-8 border border-slate-100">
              <div className="grid grid-cols-2 gap-6">
                <BigStat icon={<FileQuestion className="w-6 h-6" />} value={String(totalQuestions)} label="Total Soal" />
                <BigStat icon={<Clock className="w-6 h-6" />} value={`${totalMinutes}m`} label="Durasi Ujian" />
                <BigStat icon={<BookOpen className="w-6 h-6" />} value={String(subtests.length)} label="Subtes Tersedia" />
                <BigStat icon={<Users className="w-6 h-6" />} value="10K+" label="Siswa Terdaftar" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ============ KONTAK / CTA ============ */}
      <section id="kontak" className="py-20 px-4 sm:px-6 lg:px-8 bg-blue-950 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-yellow-400/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-72 h-72 bg-blue-400/10 rounded-full blur-3xl" />
        <div className="relative max-w-4xl mx-auto text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-3">Siap Memulai Perjalananmu?</h2>
          <p className="text-slate-300 text-base mb-8 max-w-2xl mx-auto">
            Bergabung dengan ribuan siswa lainnya dan raih kampus impianmu bersama Averroes Academy.
          </p>
          <button
            onClick={onStartTryout}
            className="px-8 py-4 bg-yellow-400 hover:bg-yellow-300 text-blue-900 font-bold text-lg rounded-xl shadow-xl shadow-yellow-400/20 transition inline-flex items-center gap-2"
          >
            Ikuti Tryout CBT Sekarang
            <ArrowRight className="w-5 h-5" />
          </button>

          <div className="grid sm:grid-cols-3 gap-6 mt-16 text-left">
            <ContactItem icon={<Mail className="w-5 h-5" />} label="Email" value="averroescmty@gmail.com" href="mailto:averroescmty@gmail.com" />
            <ContactItem icon={<Phone className="w-5 h-5" />} label="WhatsApp / Telepon" value="082126868550" href="https://wa.me/6282126868550" />
            <ContactItem icon={<MapPin className="w-5 h-5" />} label="Alamat" value="Jl. Cilengkrang II No.256, Palasari, Kec. Cibiru, Kota Bandung, Jawa Barat 40615" />
          </div>
        </div>
      </section>

      {/* ============ FOOTER ============ */}
      <footer className="bg-blue-950 border-t border-blue-900/50 py-10 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto grid gap-8 md:grid-cols-3">
          <div>
            <div className="flex items-center gap-2.5 mb-3">
              <div className="w-8 h-8 bg-blue-800 rounded-lg flex items-center justify-center">
                <GraduationCap className="w-5 h-5 text-yellow-400" />
              </div>
              <div>
                <p className="font-bold text-white text-sm">Averroes Academy</p>
                <p className="text-slate-500 text-xs">Belajar Bersama demi Mimpi Kita Bersama</p>
              </div>
            </div>
            <p className="text-slate-500 text-xs leading-relaxed max-w-xs">
              Platform tryout CBT untuk persiapan UTBK dan ujian masuk perguruan tinggi.
            </p>
          </div>

          <div>
            <p className="text-white text-sm font-semibold mb-3">Kontak</p>
            <ul className="space-y-3">
              <li>
                <a href="mailto:averroescmty@gmail.com" className="flex items-start gap-2.5 text-slate-400 hover:text-yellow-300 text-xs leading-relaxed transition">
                  <Mail className="w-4 h-4 mt-0.5 shrink-0" />
                  averroescmty@gmail.com
                </a>
              </li>
              <li>
                <a href="https://wa.me/6282126868550" target="_blank" rel="noreferrer" className="flex items-start gap-2.5 text-slate-400 hover:text-yellow-300 text-xs leading-relaxed transition">
                  <Phone className="w-4 h-4 mt-0.5 shrink-0" />
                  082126868550 (WhatsApp / Telepon)
                </a>
              </li>
              <li className="flex items-start gap-2.5 text-slate-400 text-xs leading-relaxed">
                <MapPin className="w-4 h-4 mt-0.5 shrink-0" />
                Jl. Cilengkrang II No.256, Palasari, Kec. Cibiru, Kota Bandung, Jawa Barat 40615
              </li>
            </ul>
          </div>

          <div className="flex md:justify-end items-start">
            <p className="text-slate-500 text-xs md:text-right">
              © {new Date().getFullYear()} Averroes Academy. Dibuat dengan dedikasi untuk pendidikan Indonesia.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

function HeroStat({ value, label }: { value: string; label: string }) {
  return (
    <div className="text-center lg:text-left">
      <p className="text-2xl sm:text-3xl font-bold text-yellow-300">{value}</p>
      <p className="text-slate-400 text-xs mt-0.5">{label}</p>
    </div>
  );
}

function FeatureCard({
  icon,
  iconBg,
  iconColor,
  badge,
  title,
  description,
  actionLabel,
  onAction,
  href,
}: {
  icon: React.ReactNode;
  iconBg: string;
  iconColor: string;
  badge?: string;
  title: string;
  description: string;
  actionLabel: string;
  onAction?: () => void;
  href?: string;
}) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-6 hover:shadow-xl hover:shadow-blue-900/5 hover:border-blue-200 transition group flex flex-col">
      <div className="flex items-start justify-between mb-4">
        <div className={`w-14 h-14 ${iconBg} rounded-2xl flex items-center justify-center ${iconColor} group-hover:scale-110 transition`}>
          {icon}
        </div>
        {badge && (
          <span className="text-xs font-bold text-blue-900 bg-yellow-400 px-2.5 py-1 rounded-full">{badge}</span>
        )}
      </div>
      <h3 className="font-bold text-blue-950 text-lg mb-2">{title}</h3>
      <p className="text-slate-500 text-sm leading-relaxed mb-5 flex-1">{description}</p>
      {onAction ? (
        <button
          onClick={onAction}
          className="w-full py-2.5 bg-blue-50 hover:bg-blue-900 text-blue-700 hover:text-white font-medium text-sm rounded-xl transition flex items-center justify-center gap-1.5"
        >
          {actionLabel}
          <ArrowRight className="w-4 h-4" />
        </button>
      ) : (
        <a
          href={href}
          className="w-full py-2.5 bg-blue-50 hover:bg-blue-900 text-blue-700 hover:text-white font-medium text-sm rounded-xl transition flex items-center justify-center gap-1.5"
        >
          {actionLabel}
          <ArrowRight className="w-4 h-4" />
        </a>
      )}
    </div>
  );
}

function BigStat({ icon, value, label }: { icon: React.ReactNode; value: string; label: string }) {
  return (
    <div className="text-center">
      <div className="w-12 h-12 bg-blue-900 rounded-xl flex items-center justify-center text-yellow-400 mx-auto mb-3">
        {icon}
      </div>
      <p className="text-3xl font-bold text-blue-950">{value}</p>
      <p className="text-slate-500 text-xs mt-1">{label}</p>
    </div>
  );
}

function ContactItem({ icon, label, value, href }: { icon: React.ReactNode; label: string; value: string; href?: string }) {
  const body = (
    <div className="flex items-center gap-3">
      <div className="w-10 h-10 bg-blue-900 rounded-xl flex items-center justify-center text-yellow-400 shrink-0">
        {icon}
      </div>
      <div>
        <p className="text-slate-400 text-xs">{label}</p>
        <p className="text-white text-sm font-medium leading-snug">{value}</p>
      </div>
    </div>
  );
  if (href) {
    const isExternal = href.startsWith('http');
    return (
      <a
        href={href}
        target={isExternal ? '_blank' : undefined}
        rel={isExternal ? 'noreferrer' : undefined}
        className="hover:opacity-80 transition"
      >
        {body}
      </a>
    );
  }
  return body;
}

