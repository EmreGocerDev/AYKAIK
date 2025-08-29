import { ReactNode } from "react";

export default function GlassCard({
  children,
  tintValue = 15,
  blurPx = 16,
  borderRadiusPx = 16,
  grainOpacity = 20,
  className = "",
}: {
  children: ReactNode;
  tintValue?: number;
  blurPx?: number;
  borderRadiusPx?: number;
  grainOpacity?: number;
  className?: string;
}) {
  const grainEffectOpacity = grainOpacity / 100;

  const color = tintValue >= 0 ? '255, 255, 255' : '0, 0, 0';
  const alpha = Math.abs(tintValue) / 100;

  return (
    <div
      style={{
        backgroundColor: `rgba(${color}, ${alpha})`,
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