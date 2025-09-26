// YOL: src/components/landing/InfoCard.tsx

"use client";

import { ReactNode } from "react"; // ReactNode import ediyoruz

type InfoCardProps = {
  heading: string;
  line1: string;
  line2: string;
  color: 'blue' | 'yellow' | 'red' | 'green';
  icon: ReactNode; // icon prop'u eklendi
};

export default function InfoCard({ heading, line1, line2, color, icon }: InfoCardProps) {
  const colorClass = `card-${color}`;

  return (
    <div className={`card ${colorClass}`}>
      {/* Arkaplan İkonu */}
      <div className="absolute inset-0 flex items-center justify-center text-white opacity-10 overflow-hidden">
        {icon}
      </div>

      {/* İçerik (z-index ile ikonun üzerinde kalması sağlanıyor) */}
      <p className="heading relative z-10">{heading}</p>
      <p className="relative z-10">{line1}</p>
      <p className="relative z-10">{line2}</p>
    </div>
  );
}