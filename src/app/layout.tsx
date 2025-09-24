// YOL: src/app/layout.tsx

import type { Metadata } from "next";
// Fontları buradan import etmeye devam ediyoruz
import { inter, bebasNeue, robotoSlab, sourceCodePro, playfairDisplay, bungee, exo2, permanentMarker } from "@/lib/fonts";
import "./globals.css";
import { Toaster } from "react-hot-toast";

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
      {/* KESİNLİKLE BU ŞEKİLDE OLMALI: Tüm fontlar ".variable" ile eklenmeli */}
      <body className={`${inter.variable} ${bebasNeue.variable} ${robotoSlab.variable} ${sourceCodePro.variable} ${playfairDisplay.variable} ${bungee.variable} ${exo2.variable} ${permanentMarker.variable}`}>
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
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
                primary: '#22c55e',
                secondary: '#ffffff',
              },
            },
            error: {
              iconTheme: {
                primary: '#ef4444',
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