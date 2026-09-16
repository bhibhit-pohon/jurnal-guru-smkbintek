'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { isAdminEmail } from '@/lib/firebase';

export default function LoginPage() {
  const router = useRouter();
  const { user, loading, signInWithGoogle } = useAuth();
  const [toast, setToast] = useState<{ message: string; type: 'error' | 'info' } | null>(null);
  const [isSigningIn, setIsSigningIn] = useState(false);

  // Auto-redirect jika sudah login
  useEffect(() => {
    if (!loading && user) {
      if (isAdminEmail(user.email)) {
        router.push('/admin');
      } else {
        router.push('/riwayat-jurnal');
      }
    }
  }, [user, loading, router]);

  const showToast = (message: string, type: 'error' | 'info' = 'error') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  const handleGoogleSignIn = async () => {
    if (isSigningIn) return;
    setIsSigningIn(true);

    const result = await signInWithGoogle();

    if (result.success) {
      if (isAdminEmail(result.user.email)) {
        router.push('/admin');
      } else {
        router.push('/riwayat-jurnal');
      }
    } else {
      showToast(result.error);
      setIsSigningIn(false);
    }
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    showToast('Login dengan email belum tersedia. Silakan gunakan "Masuk dengan Google".', 'info');
  };

  const handleAdminLinkClick = (e: React.MouseEvent) => {
    e.preventDefault();
    showToast('Sistem otomatis mendeteksi Admin. Silakan "Masuk dengan Google" saja.', 'info');
  };

  return (
    <>
      {/* ── Toast Notification ── */}
      {toast && (
        <div
          className="fixed top-4 left-1/2 -translate-x-1/2 z-50 animate-slide-down"
          role="alert"
        >
          <div
            className={`flex items-center gap-2 px-4 py-3 rounded-lg shadow-lg text-sm font-medium text-white ${toast.type === 'error'
                ? 'bg-[#ba1a1a]'
                : 'bg-[#005c55]'
              }`}
          >
            <span className="material-symbols-outlined text-[18px]">
              {toast.type === 'error' ? 'error' : 'info'}
            </span>
            <span>{toast.message}</span>
            <button
              onClick={() => setToast(null)}
              className="ml-2 hover:opacity-80 transition-opacity"
              aria-label="Tutup notifikasi"
            >
              <span className="material-symbols-outlined text-[18px]">close</span>
            </button>
          </div>
        </div>
      )}

      {/* ── Background Pattern ── */}
      <div className="min-h-screen flex items-center justify-center relative overflow-hidden bg-[#f9f9f8] bg-academic-pattern">
        {/* ── Login Container ── */}
        <main className="w-full max-w-[400px] px-4 relative z-10">
          {/* ── Branding Header ── */}
          <header className="flex flex-col items-center mb-12 text-center">
            <div className="w-28 h-28 mb-4 rounded-2xl overflow-hidden bg-white shadow-md border border-[#005c55]/20 flex items-center justify-center p-2">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                alt="Logo SMK Bina Teknologi Purwokerto"
                className="w-full h-full object-contain"
                src="/logo-smk.png"
              />
            </div>
            <h1 className="font-bold text-2xl leading-tight text-[#005c55]">
              Jurnal Guru
            </h1>
            <span className="text-xs font-semibold text-[#0f766e] tracking-wider uppercase mt-1">
              SMK Bina Teknologi Purwokerto
            </span>
            <p className="text-base leading-6 text-[#3e4947] mt-2">
              Selamat Datang, Bapak/Ibu Guru
            </p>
          </header>

          {/* ── Login Card ── */}
          <div className="bg-[#f9f9f8] rounded-xl border border-[#bdc9c6]/50 p-6 shadow-[0_4px_20px_-2px_rgba(15,118,110,0.05)]">
            <form onSubmit={handleFormSubmit} className="flex flex-col gap-4">
              {/* Email Input */}
              <div className="flex flex-col gap-1">
                <label
                  className="text-sm leading-5 font-medium tracking-[0.01em] text-[#3e4947]"
                  htmlFor="email"
                >
                  Email
                </label>
                <div className="relative">
                  <span
                    aria-hidden="true"
                    className="material-symbols-outlined absolute left-2 top-1/2 -translate-y-1/2 text-[#6e7977] text-[20px]"
                  >
                    mail
                  </span>
                  <input
                    className="w-full bg-white border border-[#bdc9c6] rounded-lg pl-12 pr-4 py-2 text-base leading-6 text-[#1a1c1c] placeholder:text-[#6e7977] focus:border-[#005c55] focus:ring-1 focus:ring-[#005c55] outline-none transition-colors"
                    id="email"
                    name="email"
                    placeholder="masukkan email anda"
                    type="email"
                  />
                </div>
              </div>

              {/* Password Input */}
              <div className="flex flex-col gap-1 mt-2">
                <div className="flex justify-between items-center">
                  <label
                    className="text-sm leading-5 font-medium tracking-[0.01em] text-[#3e4947]"
                    htmlFor="password"
                  >
                    Kata Sandi
                  </label>
                  <a
                    className="text-xs leading-4 font-medium text-[#005c55] hover:text-[#0f766e] transition-colors"
                    href="#"
                  >
                    Lupa sandi?
                  </a>
                </div>
                <div className="relative">
                  <span
                    aria-hidden="true"
                    className="material-symbols-outlined absolute left-2 top-1/2 -translate-y-1/2 text-[#6e7977] text-[20px]"
                  >
                    lock
                  </span>
                  <input
                    className="w-full bg-white border border-[#bdc9c6] rounded-lg pl-12 pr-4 py-2 text-base leading-6 text-[#1a1c1c] placeholder:text-[#6e7977] focus:border-[#005c55] focus:ring-1 focus:ring-[#005c55] outline-none transition-colors"
                    id="password"
                    name="password"
                    placeholder="••••••••"
                    type="password"
                  />
                </div>
              </div>

              {/* Submit Button */}
              <button
                className="mt-4 w-full bg-[#005c55] text-white text-sm leading-5 font-medium tracking-[0.01em] py-4 rounded-lg flex justify-center items-center gap-2 hover:bg-[#0f766e] active:scale-[0.98] transition-all"
                type="submit"
              >
                Masuk
                <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
              </button>
            </form>

            {/* Divider */}
            <div className="flex items-center gap-2 my-6">
              <div className="h-px bg-[#bdc9c6]/50 flex-1"></div>
              <span className="text-xs leading-4 font-medium text-[#3e4947] px-2">ATAU</span>
              <div className="h-px bg-[#bdc9c6]/50 flex-1"></div>
            </div>

            {/* Google Sign In */}
            <button
              onClick={handleGoogleSignIn}
              disabled={isSigningIn || loading}
              className="w-full bg-white border border-[#bdc9c6] text-[#1a1c1c] text-sm leading-5 font-medium tracking-[0.01em] py-2 rounded-lg flex justify-center items-center gap-4 hover:bg-[#f3f4f3] active:scale-[0.98] transition-all disabled:opacity-60 disabled:cursor-not-allowed"
              type="button"
            >
              {isSigningIn ? (
                <>
                  <svg
                    className="animate-spin h-5 w-5 text-[#005c55]"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  Memproses...
                </>
              ) : (
                <>
                  <svg
                    fill="none"
                    height="20"
                    viewBox="0 0 24 24"
                    width="20"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      fill="#4285F4"
                    />
                    <path
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      fill="#34A853"
                    />
                    <path
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                      fill="#FBBC05"
                    />
                    <path
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                      fill="#EA4335"
                    />
                  </svg>
                  Masuk dengan Google
                </>
              )}
            </button>
          </div>

          {/* Footer Links */}
          <footer className="mt-12 text-center flex flex-col gap-2">
            <p className="text-xs leading-4 font-medium text-[#3e4947]">
              Belum memiliki akun?{' '}
              <a className="text-[#005c55] font-medium hover:underline" href="#">
                Hubungi Admin Sekolah
              </a>
            </p>
            <div className="pt-2 border-t border-[#bdc9c6]/30">
              <button
                onClick={handleAdminLinkClick}
                className="text-xs font-semibold text-[#005c55] hover:underline flex items-center justify-center gap-1 w-full"
              >
                <span className="material-symbols-outlined text-[16px]">desktop_windows</span>
                Buka Dashboard Admin (Desktop)
              </button>
            </div>
          </footer>
        </main>
      </div>
    </>
  );
}
