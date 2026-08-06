import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Jurnal Guru Online | SMK Bina Teknologi Purwokerto",
  description:
    "Aplikasi pencatatan jurnal mengajar harian untuk guru SMK Bina Teknologi Purwokerto. Catat kehadiran, materi, dan dokumentasi pembelajaran secara digital.",
  keywords: ["jurnal guru", "SMK Bina Teknologi Purwokerto", "SMK Bintek", "absensi", "pembelajaran", "e-jurnal"],
  authors: [{ name: "SMK Bina Teknologi Purwokerto" }],
  icons: {
    icon: [
      { url: "/logo-smk.png" },
      { url: "/icon.png" },
    ],
    shortcut: "/logo-smk.png",
    apple: "/logo-smk.png",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#005c55",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" className={`${inter.variable} h-full antialiased`}>
      <head>
        {/* Material Symbols Outlined — used for login page icons */}
        {/* eslint-disable-next-line @next/next/no-page-custom-font */}
        <link
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-full flex flex-col font-sans">{children}</body>
    </html>
  );
}
