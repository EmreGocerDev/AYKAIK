"use client";

import { useState, FormEvent } from 'react';
import { useSettings } from '@/contexts/SettingsContext';
import { addRegion } from '@/app/actions';
import { X, Save } from 'lucide-react';
import toast from 'react-hot-toast';
import GlassCard from './GlassCard';

export default function AddRegionModal({ onClose, onRegionAdded }: { onClose: () => void; onRegionAdded: () => void; }) {
  const { tintValue, blurPx, borderRadiusPx, grainOpacity } = useSettings();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);
    const formData = new FormData(event.currentTarget);
    const result = await addRegion(formData);

    if (result.success) {
      toast.success(result.message);
      onRegionAdded();
      onClose();
    } else {
      toast.error(result.message);
    }
    setIsSubmitting(false);
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <GlassCard {...{tintValue, blurPx, borderRadiusPx, grainOpacity}} className="w-full max-w-lg">
        <form onSubmit={handleSubmit}>
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold">Yeni Bölge Ekle</h2>
            <button type="button" onClick={onClose} className="p-2 rounded-full hover:bg-white/10"><X size={24} /></button>
          </div>
          <div className="space-y-4">
            <input name="name" required placeholder="Bölge Adı" className="w-full bg-black/20 p-3 rounded-lg border border-white/10" />
            <input name="workplace_registration_number" placeholder="İşyeri Sicil Numarası" className="w-full bg-black/20 p-3 rounded-lg border border-white/10" />
            <textarea name="address" placeholder="Adres" rows={3} className="w-full bg-black/20 p-3 rounded-lg border border-white/10"></textarea>
            <div className="flex gap-4">
                <input name="province" placeholder="Çalışılan İl" className="w-1/2 bg-black/20 p-3 rounded-lg border border-white/10" />
                <input name="sgk_province_code" placeholder="SGK İl Kodu" className="w-1/2 bg-black/20 p-3 rounded-lg border border-white/10" />
            </div>
          </div>
          <div className="flex justify-end mt-6">
            <button type="submit" disabled={isSubmitting} className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors disabled:opacity-50">
              <Save size={16} />
              {isSubmitting ? 'Kaydediliyor...' : 'Kaydet'}
            </button>
          </div>
        </form>
      </GlassCard>
    </div>
  );
}