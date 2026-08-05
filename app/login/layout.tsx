import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Login - Jurnal Guru Online | SMK Bintek',
  description:
    'Halaman login untuk aplikasi Jurnal Guru Online. Masuk menggunakan akun Google Anda.',
};

export default function LoginLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
