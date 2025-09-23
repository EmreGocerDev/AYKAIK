"use client";

import { useState, FormEvent } from 'react';
import { useSettings } from '@/contexts/SettingsContext';
import { updateRegion } from '@/app/actions';
import { X, Save } from 'lucide-react';
import toast from 'react-hot-toast';
import GlassCard from './GlassCard';

// Bölge tipini yeni alanları içerecek şekilde güncelliyoruz
type Region = { 
  id: number; 
  name: string; 
  workplace_registration_number?: string | null;
  address?: string | null;
  province?: string | null;
  sgk_province_code?: string | null;
};

export default function EditRegionModal({ region, onClose, onRegionUpdated }: { region: Region; onClose: () => void; onRegionUpdated: () => void; }) {
  const { tintValue, blurPx, borderRadiusPx, grainOpacity } = useSettings();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);
    const formData = new FormData(event.currentTarget);
    const result = await updateRegion(formData);

    if (result.success) {
      toast.success(result.message);
      onRegionUpdated();
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
          <input type="hidden" name="id" value={region.id} />
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold">Bölgeyi Düzenle</h2>
            <button type="button" onClick={onClose} className="p-2 rounded-full hover:bg-white/10"><X size={24} /></button>
          </div>
          <div className="space-y-4">
            <input name="name" required defaultValue={region.name} placeholder="Bölge Adı" className="w-full bg-black/20 p-3 rounded-lg border border-white/10" />
            <input name="workplace_registration_number" defaultValue={region.workplace_registration_number || ''} placeholder="İşyeri Sicil Numarası" className="w-full bg-black/20 p-3 rounded-lg border border-white/10" />
            <textarea name="address" defaultValue={region.address || ''} placeholder="Adres" rows={3} className="w-full bg-black/20 p-3 rounded-lg border border-white/10"></textarea>
            <div className="flex gap-4">
                <input name="province" defaultValue={region.province || ''} placeholder="Çalışılan İl" className="w-1/2 bg-black/20 p-3 rounded-lg border border-white/10" />
                <input name="sgk_province_code" defaultValue={region.sgk_province_code || ''} placeholder="SGK İl Kodu" className="w-1/2 bg-black/20 p-3 rounded-lg border border-white/10" />
            </div>
          </div>
          <div className="flex justify-end mt-6">
            <button type="submit" disabled={isSubmitting} className="btn-save-animated">
  <div className="svg-wrapper-1">
    <div className="svg-wrapper">
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="30" height="30" className="icon">
        <path d="M15 3H5a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2V7.5L16.5 3H15zm-3 13a3 3 0 11-6 0 3 3 0 016 0zM6 4h7v4H6V4z"></path>
      </svg>
    </div>
  </div>
  <span>{isSubmitting ? 'Güncelleniyor...' : 'Güncelle'}</span>
</button>
          </div>
        </form>
      </GlassCard>
    </div>
  );
}