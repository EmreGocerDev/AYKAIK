"use client";

import { useSettings } from "@/contexts/SettingsContext";
import GlassCard from "./GlassCard";
import { AlertTriangle, Check, X } from "lucide-react";
import { useState } from "react";

type ConfirmModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>; // Onay fonksiyonu artık bir Promise döndürecek
  title: string;
  message: string;
};

export default function ConfirmModal({ 
  isOpen, 
  onClose, 
  onConfirm, 
  title, 
  message 
}: ConfirmModalProps) {
  const { tintValue, blurPx, borderRadiusPx, grainOpacity } = useSettings();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleConfirm = async () => {
    setIsSubmitting(true);
    await onConfirm();
    // İşlem bittikten sonra state'i sıfırla. Kapatma işlemini parent bileşen yönetecek.
    setIsSubmitting(false);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in">
      <GlassCard
        tintValue={tintValue}
        blurPx={blurPx}
        borderRadiusPx={borderRadiusPx}
        grainOpacity={grainOpacity}
        className="w-full max-w-md"
      >
        <div className="flex items-start gap-4">
          <div className="mt-1 flex-shrink-0 w-10 h-10 rounded-full bg-red-500/20 flex items-center justify-center">
            <AlertTriangle className="w-6 h-6 text-red-400" />
          </div>
          <div>
            <h3 className="text-xl font-bold">{title}</h3>
            <p className="mt-1 text-gray-300">{message}</p>
          </div>
        </div>

        <div className="flex justify-end gap-4 mt-6">
          <button 
            onClick={onClose} 
            disabled={isSubmitting}
            className="px-4 py-2 bg-gray-600 hover:bg-gray-500 rounded-lg transition-colors disabled:opacity-50"
          >
            İptal
          </button>
          <button 
            onClick={handleConfirm} 
            disabled={isSubmitting}
            className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg transition-colors disabled:opacity-50"
          >
            <Check size={16} />
            {isSubmitting ? 'İşleniyor...' : 'Onayla ve Sil'}
          </button>
        </div>
      </GlassCard>
    </div>
  );
}