import type { Metadata } from "next";
import { Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "CUK - Gestion des Étudiants",
  description: "Centre Universitaire de Koulamoutou - Système de Gestion des Dossiers Étudiants",
  keywords: ["CUK", "Koulamoutou", "Gabon", "Université", "Étudiants", "Gestion"],
  authors: [{ name: "CUK - Centre Universitaire de Koulamoutou" }],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" className="dark" suppressHydrationWarning>
      <body
        className={`${geistMono.variable} antialiased bg-background text-foreground font-mono`}
      >
        {children}
        <Toaster 
          theme="dark"
          toastOptions={{
            style: {
              background: '#12121a',
              border: '1px solid rgba(0, 255, 136, 0.2)',
              color: '#e0e0e6',
              fontFamily: 'var(--font-geist-mono), monospace',
            },
          }}
        />
      </body>
    </html>
  );
}
