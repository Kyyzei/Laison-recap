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
    <div className="min-h-screen w-full relative flex flex-col justify-center items-center p-4 selection:bg-sky-500 selection:text-white overflow-hidden bg-slate-950">
      {/* Background Image: Smart Water Meter & Environment */}
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat transform scale-105 filter brightness-95 transition-transform duration-1000 ease-out"
        style={{ backgroundImage: `url(${waterMeterBg})` }}
      />

      {/* Atmospheric Overlays for Depth, Contrast, and Corporate Aesthetic */}
      <div className="absolute inset-0 bg-gradient-to-tr from-slate-950/80 via-slate-900/40 to-slate-950/70 backdrop-blur-[1.5px]" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-sky-500/10 via-slate-950/30 to-slate-950/80 pointer-events-none" />

      {/* Top Left Water Utility Branding / Environment Pill */}
      <div className="absolute top-5 left-5 hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-900/70 backdrop-blur-md border border-white/10 text-white/90 text-xs shadow-lg z-10">
        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
        <span className="font-semibold text-sky-300">IoT Water Grid</span>
        <span className="text-slate-400 text-[11px]">• Smart Environmental Metering</span>
      </div>

      {/* Main Login Card */}
      <div className="w-full max-w-md bg-white/95 backdrop-blur-md rounded-3xl shadow-2xl border border-white/40 overflow-hidden relative z-10 animate-in fade-in zoom-in-95 duration-200">
        {/* Card Header with Brand Logo */}
        <div className="p-8 pb-6 text-center border-b border-slate-100 bg-gradient-to-b from-slate-50/80 to-white">
          <div className="flex justify-center mb-4">
            <div className="p-3 bg-white rounded-2xl shadow-xs border border-slate-200/70 inline-flex items-center justify-center">
              <img
                src={LAISON_LOGO_DATA_URI}
                alt="Laison Logo"
                className="h-10 w-auto object-contain"
              />
            </div>
          </div>

          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-blue-50 border border-blue-200 text-blue-900 text-[11px] font-bold mb-2">
            <ShieldCheck className="w-3.5 h-3.5 text-blue-700" />
            <span>Sistem Otentikasi Laison Recap</span>
          </div>

          <h1 className="text-xl font-bold tracking-tight text-slate-900">
            Login Administrator
          </h1>
          <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto">
            Masukkan akun kredensial Anda untuk mengakses sistem rekap perangkat IoT & stok SIM Card.
          </p>
        </div>

        {/* Form */}
        <div className="p-8 pt-6 space-y-5">
          {errorMessage && (
            <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2.5 animate-shake">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Username */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
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
              <div className="flex items-center justify-between mb-1.5">
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
            <div className="flex items-center justify-between pt-1">
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
        <div className="px-6 py-3 bg-slate-50 border-t border-slate-100 text-center text-[11px] text-slate-400">
          <span>Laison IoT Recap System • L'AISON Technologies</span>
        </div>
      </div>

      {/* Bottom Floating Environment & Connectivity Footer */}
      <div className="relative z-10 mt-6 flex flex-wrap items-center justify-center gap-3 text-xs text-white/80">
        <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-900/60 backdrop-blur-sm border border-white/10">
          <Droplets className="w-3.5 h-3.5 text-sky-400" />
          <span>Smart Water Metering</span>
        </div>
        <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-900/60 backdrop-blur-sm border border-white/10">
          <Wifi className="w-3.5 h-3.5 text-emerald-400" />
          <span>LoRaWAN & NB-IoT Telemetry</span>
        </div>
      </div>
    </div>
  );
};
