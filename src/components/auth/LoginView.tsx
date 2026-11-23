import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { LAISON_LOGO_DATA_URI } from '../../assets/logo';
import waterMeterBg from '../../assets/water-meter-bg.jpg';
import {
  User as UserIcon,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  ShieldCheck,
  AlertCircle,
  Droplets,
  Wifi,
} from 'lucide-react';

export const LoginView: React.FC = () => {
  const { login, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const from = (location.state as any)?.from?.pathname || '/dashboard';

  // If already logged in, redirect
  React.useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setIsLoading(true);

    const res = await login({
      username,
      password,
      rememberMe,
    });

    setIsLoading(false);

    if (res.success) {
      navigate(from, { replace: true });
    } else {
      setErrorMessage(res.error || 'Username atau password salah.');
    }
  };

  return (
    <div className="min-h-screen w-full relative flex flex-col justify-between p-4 sm:p-6 md:p-10 selection:bg-sky-500 selection:text-white overflow-hidden bg-slate-950">
      {/* Background Image: Smart Water Meter & Environment */}
      <div
        className="absolute inset-0 bg-cover bg-[36%_center] md:bg-[38%_center] lg:bg-[40%_center] bg-no-repeat filter brightness-[0.98] transition-all duration-1000 ease-out"
        style={{ backgroundImage: `url(${waterMeterBg})` }}
      />

      {/* Atmospheric Overlays for Depth, Contrast, and Corporate Aesthetic */}
      <div className="absolute inset-0 bg-gradient-to-r from-slate-950/75 via-slate-950/40 to-slate-950/85 backdrop-blur-[0.5px]" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-sky-400/10 via-transparent to-slate-950/80 pointer-events-none" />

      {/* Top Header Bar */}
      <header className="relative z-10 w-full flex items-center justify-between">
        <div className="flex items-center gap-3 px-3.5 py-1.5 rounded-full bg-slate-900/70 backdrop-blur-md border border-white/10 text-white shadow-lg">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
          <span className="font-bold text-sky-300 text-xs tracking-wide">IoT Water Grid</span>
          <span className="text-slate-400 text-xs hidden sm:inline">• Smart Water Metering & Environmental Telemetry</span>
        </div>

        <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-900/60 backdrop-blur-md border border-white/10 text-white/80 text-xs">
          <Droplets className="w-3.5 h-3.5 text-sky-400" />
          <span>L'AISON Technologies</span>
        </div>
      </header>

      {/* Main Content Area: Split Showcase + Login Card */}
      <main className="relative z-10 w-full max-w-7xl mx-auto my-auto py-6 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
        {/* Left Side: Water Meter & Environmental System Highlights (Desktop) */}
        <div className="hidden lg:flex lg:col-span-7 flex-col justify-center space-y-6 pr-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-sky-500/20 backdrop-blur-md border border-sky-400/30 text-sky-200 text-xs font-semibold w-fit">
            <Wifi className="w-3.5 h-3.5 text-sky-300" />
            <span>Next-Gen Smart Water Infrastructure</span>
          </div>

          <div className="space-y-2">
            <h1 className="text-3xl xl:text-4xl font-extrabold text-white tracking-tight drop-shadow-md">
              Sistem Monitoring & Rekap <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-sky-300 via-cyan-200 to-emerald-300">
                Smart Water Meter Laison
              </span>
            </h1>
            <p className="text-slate-200/90 text-sm max-w-xl leading-relaxed drop-shadow-sm font-medium">
              Platform inventaris terpadu untuk pencatatan perangkat AquaLink, Ultrasonic, Hybrid, dan MIU beserta integrasi data stok SIM Card telemetri secara akurat.
            </p>
          </div>

          {/* Quick Metric Badges */}
          <div className="grid grid-cols-3 gap-3 max-w-lg pt-1">
            <div className="px-3.5 py-2.5 rounded-2xl bg-slate-900/70 backdrop-blur-md border border-white/10 text-white">
              <div className="text-[11px] text-slate-400 font-medium">Perangkat Aktif</div>
              <div className="text-lg font-bold text-sky-400">305+ Unit</div>
            </div>
            <div className="px-3.5 py-2.5 rounded-2xl bg-slate-900/70 backdrop-blur-md border border-white/10 text-white">
              <div className="text-[11px] text-slate-400 font-medium">Konektivitas</div>
              <div className="text-lg font-bold text-cyan-300">LoRa & NB</div>
            </div>
            <div className="px-3.5 py-2.5 rounded-2xl bg-slate-900/70 backdrop-blur-md border border-white/10 text-white">
              <div className="text-[11px] text-slate-400 font-medium">Basis Data</div>
              <div className="text-lg font-bold text-emerald-400">Cloud Realtime</div>
            </div>
          </div>
        </div>

        {/* Right Side: Glassmorphic Login Card */}
        <div className="lg:col-span-5 flex justify-center lg:justify-end w-full">
          <div className="w-full max-w-md bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/40 overflow-hidden relative z-10 animate-in fade-in zoom-in-95 duration-200">
            {/* Card Header with Brand Logo */}
            <div className="p-7 pb-5 text-center border-b border-slate-100 bg-gradient-to-b from-slate-50/90 to-white">
              <div className="flex justify-center mb-3">
                <div className="p-3 bg-white rounded-2xl shadow-xs border border-slate-200/70 inline-flex items-center justify-center">
                  <img
                    src={LAISON_LOGO_DATA_URI}
                    alt="Laison Logo"
                    className="h-9 w-auto object-contain"
                  />
                </div>
              </div>

              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-blue-50 border border-blue-200 text-blue-900 text-[11px] font-bold mb-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-blue-700" />
                <span>Sistem Otentikasi Laison Recap</span>
              </div>

              <h2 className="text-lg font-bold tracking-tight text-slate-900">
                Login Administrator
              </h2>
              <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto">
                Masukkan akun kredensial Anda untuk mengakses sistem rekap IoT Laison.
              </p>
            </div>

            {/* Form */}
            <div className="p-7 pt-5 space-y-4">
              {errorMessage && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2.5 animate-shake">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-3.5">
                {/* Username */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Username Akun
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <UserIcon className="w-4 h-4" />
                    </div>
                    <input
                      type="text"
                      required
                      autoFocus
                      placeholder="Masukkan username"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50 hover:bg-slate-100/60 focus:bg-white text-xs font-semibold rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-blue-900/20 focus:border-blue-900 transition-all text-slate-900"
                    />
                  </div>
                </div>

                {/* Password */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-bold text-slate-700">
                      Password Sandi
                    </label>
                  </div>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <Lock className="w-4 h-4" />
                    </div>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      placeholder="Masukkan kata sandi"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full pl-10 pr-10 py-2.5 bg-slate-50 hover:bg-slate-100/60 focus:bg-white text-xs font-semibold rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-blue-900/20 focus:border-blue-900 transition-all text-slate-900"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 transition-colors"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Remember me */}
                <div className="flex items-center justify-between pt-0.5">
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="rounded-sm border-slate-300 text-blue-900 focus:ring-blue-900 cursor-pointer"
                    />
                    <span className="text-xs text-slate-600">Ingat sesi di browser ini</span>
                  </label>

                  <span className="text-xs text-blue-900 font-semibold cursor-help" title="Sistem menggunakan autentikasi lokal terenkripsi">
                    Bantuan?
                  </span>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-2.5 px-4 rounded-xl bg-blue-900 hover:bg-blue-800 active:bg-blue-950 text-white text-xs font-bold flex items-center justify-center gap-2 transition-all shadow-md hover:shadow-lg disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
                >
                  {isLoading ? (
                    <>
                      <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>Memverifikasi...</span>
                    </>
                  ) : (
                    <>
                      <span>Masuk ke Dashboard</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>
            </div>

            {/* Footer info */}
            <div className="px-6 py-2.5 bg-slate-50 border-t border-slate-100 text-center text-[11px] text-slate-400">
              <span>Laison IoT Recap System • L'AISON Technologies</span>
            </div>
          </div>
        </div>
      </main>

      {/* Bottom Floating Bar */}
      <footer className="relative z-10 w-full flex flex-wrap items-center justify-between gap-3 text-xs text-white/75 pt-2">
        <div className="flex items-center gap-2 text-slate-300 text-[11px]">
          <span>© {new Date().getFullYear()} L'AISON Technologies Co., Ltd. All rights reserved.</span>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-900/60 backdrop-blur-sm border border-white/10 text-[11px]">
            <Droplets className="w-3 h-3 text-sky-400" />
            <span>Smart Water Metering</span>
          </div>
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-900/60 backdrop-blur-sm border border-white/10 text-[11px]">
            <Wifi className="w-3 h-3 text-emerald-400" />
            <span>LoRaWAN & NB-IoT</span>
          </div>
        </div>
      </footer>
    </div>
  );
};
