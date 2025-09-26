// YOL: src/components/landing/DeckCard.tsx

"use client";

import { ReactNode } from "react";
import { cn } from "@/lib/utils";

type DeckCardProps = {
  icon: ReactNode;
  title: string;
  isSelected: boolean;
  onClick: () => void;
  // style prop'u kaldırıldı
};

export default function DeckCard({ icon, title, isSelected, onClick }: DeckCardProps) {
  return (
    <button
      onClick={onClick}
      className={cn("deck-card", { selected: isSelected })}
      // style prop'u kaldırıldı
    >
      {icon}
      <h3 className="font-bold text-white mt-2">{title}</h3>
    </button>
  );
}