'use client';

import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';

export default function ForceProfileModal() {
  const { user, updateUserProfile } = useAuth();
  const [displayName, setDisplayName] = useState(user?.displayName || '');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  // If loading user or user already confirmed, don't show modal
  if (!user || user.hasConfirmedProfile) {
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!displayName.trim()) {
      setError('Nama Lengkap tidak boleh kosong.');
      return;
    }

    setIsSubmitting(true);
    setError('');
    const res = await updateUserProfile(displayName.trim());
    setIsSubmitting(false);

    if (!res.success) {
      setError(res.error || 'Gagal menyimpan profil.');
    }
    // Jika sukses, useAuth akan merubah state user.hasConfirmedProfile menjadi true
    // sehingga komponen ini akan hilang secara otomatis.
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fade-in">
      <div className="bg-white rounded-xl shadow-2xl max-w-sm w-full p-6 flex flex-col gap-4">
        <div className="flex flex-col gap-1 text-center items-center">
          <span className="material-symbols-outlined text-[#005c55] text-[48px] mb-2">badge</span>
          <h2 className="text-xl font-bold text-[#1a1c1c] font-[Inter]">Lengkapi Profil Anda</h2>
          <p className="text-sm text-[#6e7977] font-[Inter]">
            Silakan masukkan Nama Lengkap beserta Gelar Anda untuk digunakan dalam laporan jurnal.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4 mt-2">
          {error && (
            <div className="bg-[#ffdad6]/40 text-[#ba1a1a] text-xs font-medium px-3 py-2 rounded-lg border border-[#ffdad6]">
              {error}
            </div>
          )}

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-[#3e4947] font-[Inter]">
              Nama Lengkap & Gelar <span className="text-[#ba1a1a]">*</span>
            </label>
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Contoh: Budi Santoso, S.Pd"
              className="bg-[#F5F5F4] border border-[#E7E5E4] rounded-lg px-4 py-3 text-sm font-[Inter] text-[#1a1c1c] focus:outline-none focus:border-[#005c55] focus:shadow-[0_0_0_1px_#005c55] transition-shadow w-full"
              autoFocus
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-[#005c55] text-white text-sm font-semibold font-[Inter] py-3 rounded-lg hover:bg-[#0f766e] active:scale-[0.98] transition-all disabled:opacity-50 flex items-center justify-center gap-2 mt-2"
          >
            {isSubmitting ? (
              <>
                <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Menyimpan...
              </>
            ) : (
              'Simpan & Lanjutkan'
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
