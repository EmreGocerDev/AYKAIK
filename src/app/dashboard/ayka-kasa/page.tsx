// src/app/dashboard/ayka-kasa/page.tsx

"use client";

import GlassCard from "@/components/GlassCard";
import { ExternalLink } from "lucide-react";
import { useSettings } from "@/contexts/SettingsContext";

const AYKA_KASA_URL = 'https://aykasa.vercel.app';

export default function AykaKasaPage() {
  const { tintValue, blurPx, borderRadiusPx, grainOpacity } = useSettings();

  return (
    <div className="p-4 md:p-8 text-white flex items-center justify-center h-[calc(100vh-69px)] md:h-screen">
      <GlassCard 
        className="max-w-xl w-full text-center"
        {...{ tintValue, blurPx, borderRadiusPx, grainOpacity }}
      >
        <h1 className="text-3xl font-bold mb-4">Ayka Kasa Uygulaması</h1>
        <p className="text-gray-300 mb-8">
          Tarayıcı güvenlik politikaları, Ayka Kasa uygulamasının bu portal içerisinden doğru bir şekilde çalışmasını engelleyebilir.
          En iyi deneyim için uygulamayı doğrudan kendi sekmesinde açın.
        </p>
        <a
          href={AYKA_KASA_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center justify-center gap-2 bg-blue-600 px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors text-white font-semibold"
        >
          <ExternalLink size={18} />
          {/* DÜZELTME: ' karakteri &apos; ile değiştirildi */}
          Ayka Kasa&apos;yı Yeni Sekmede Aç
        </a>
      </GlassCard>
    </div>
  );
}