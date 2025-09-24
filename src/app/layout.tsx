// YOL: src/app/layout.tsx

import type { Metadata } from "next";
import { inter, bebasNeue, robotoSlab, sourceCodePro, playfairDisplay, bungee, exo2, permanentMarker } from "@/lib/fonts";
import "./globals.css";
import { Toaster } from "react-hot-toast";
import DynamicTitle from "@/components/DynamicTitle"; // Bu bileşeni önceki adımda oluşturmuştuk

export const metadata: Metadata = {
  title: "AYKA MATRİX'e bağlandınız.",
  description: "Modern İK Yönetim Portalı",
  icons: {
    icon: '/topbarlogo.ico',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="tr">
      <head>
        {/*
          Tarayıcı üst bar rengini SİYAH yapar.
          Bu en iyi mobil cihazlarda görünür.
        */}
        <meta name="theme-color" content="#000000" />
      </head>
      <body className={`${inter.variable} ${bebasNeue.variable} ${robotoSlab.variable} ${sourceCodePro.variable} ${playfairDisplay.variable} ${bungee.variable} ${exo2.variable} ${permanentMarker.variable}`}>
        <DynamicTitle
          activeTitle="AYKA MATRİX'e bağlandınız."
          inactiveTitle="AYKA MATRİX'ten ayrıldınız. "
        />
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