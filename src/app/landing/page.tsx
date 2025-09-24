// YOL: src/app/landing/page.tsx

"use client";

import Link from "next/link";

export default function LandingPage() {
  return (
    // DÜZELTME: Videoyu kapatan "bg-white" sınıfı buradan kaldırıldı.
    <div className="relative min-h-screen w-full flex flex-col items-center justify-center overflow-hidden">
      {/* Arka Plan Videosu */}
      <video
        autoPlay
        muted
        playsInline
        className="absolute top-0 left-0 w-full h-full object-cover -z-10"
      >
        <source src="/videos/background.mp4" type="video/mp4" />
        Tarayıcınız video etiketini desteklemiyor.
      </video>

      {/* Sayfa İçeriği - Tüm yazılar siyah */}
      <div className="relative z-10 text-center p-8">
        <h1 className="text-4xl md:text-6xl font-bold text-black">
          AYKA ENERJİ
        </h1>
        <p className="mt-4 text-lg md:text-xl text-black max-w-2xl mx-auto">
          Ayka Matrix
        </p>
        <div className="mt-8">
          
        </div>
      </div>
    </div>
  );
}