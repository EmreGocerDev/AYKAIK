import { ReactNode } from "react";

export default function GlassCard({
  children,
  opacity = 15,
  blurPx = 16,
  borderRadiusPx = 16,
  grainOpacity = 20,
  className = "",
}: {
  children: ReactNode;
  opacity?: number;
  blurPx?: number;
  borderRadiusPx?: number;
  grainOpacity?: number;
  className?: string;
}) {
  const backgroundOpacity = opacity / 100;
  const grainEffectOpacity = grainOpacity / 100;

  return (
    <div
      style={{
        backgroundColor: `rgba(255, 255, 255, ${backgroundOpacity})`,
        backdropFilter: `blur(${blurPx}px)`,
        borderRadius: `${borderRadiusPx}px`,
      }}
      className={`
        p-6 md:p-8
        border border-white/20
        shadow-lg relative overflow-hidden
        ${className} 
      `}
    >
      {/* Gren katmanı artık harici /noise.png dosyasını kullanıyor */}
      <div
        className="absolute inset-0 bg-[url('/noise.png')] pointer-events-none"
        style={{
          opacity: grainEffectOpacity,
        }}
      />
      <div className="relative z-10">{children}</div>
    </div>
  );
}