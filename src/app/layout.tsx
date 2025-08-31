import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
// Yeni eklenenler
import { Toaster } from "react-hot-toast";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "İK Yönetim Sistemi",
  description: "Modern İK Yönetim Portalı",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="tr">
      <body className={inter.className}>
        {/* Toaster component'ini ve özelleştirmelerini buraya ekliyoruz */}
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              // Glassmorphism efekti için stil ayarları
              background: 'rgba(255, 255, 255, 0.15)',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              color: '#ffffff',
              padding: '12px',
              borderRadius: '16px',
              boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
            },
            success: {
              iconTheme: {
                primary: '#22c55e', // green-500
                secondary: '#ffffff',
              },
            },
            error: {
              iconTheme: {
                primary: '#ef4444', // red-500
                secondary: '#ffffff',
              },
            },
          }}
        />
        {children}
        
      </body>
    </html>
  );
}