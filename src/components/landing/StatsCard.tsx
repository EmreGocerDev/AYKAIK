// YOL: src/components/landing/StatsCard.tsx

"use client";

import { ReactNode } from "react"; // ReactNode import ediyoruz

type StatsCardProps = {
  value: string;
  label: string;
  icon: ReactNode; // icon prop'u eklendi
};

export default function StatsCard({ value, label, icon }: StatsCardProps) {
  return (
    <div className="stats-container noselect">
      <div className="stats-canvas">
        {/* 3D efekt için 25 adet görünmez tracker div'i */}
        {Array.from({ length: 25 }).map((_, i) => (
          <div key={i} className={`stats-tracker tr-${i + 1}`}></div>
        ))}
        
        <div id="stats-card">
          {/* Arkaplan İkonu */}
          <div className="absolute inset-0 flex items-center justify-center text-white opacity-10 overflow-hidden">
            {icon}
          </div>

          {/* Kartın içeriği (z-index ile ikonun üzerinde kalıyor) */}
          <div className="relative z-10 text-center">
            <p className="stats-number">{value}</p>
            <p className="stats-label">{label}</p>
          </div>
        </div>
      </div>
    </div>
  );
}