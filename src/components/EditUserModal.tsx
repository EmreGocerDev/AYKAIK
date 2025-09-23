"use client";

import { useState, FormEvent, useEffect } from 'react';
import { useSettings } from '@/contexts/SettingsContext';
import { updateUser } from '@/app/actions';
import { X, Save } from 'lucide-react';
import toast from 'react-hot-toast';
import GlassCard from './GlassCard';
import type { Region } from '@/types/index';

type UserProfile = {
  id: string;
  full_name: string;
  role: string;
  region_id: number;
  email: string;
};

type ModalProps = {
  user: UserProfile;
  onClose: () => void;
  onUserUpdated: () => void;
};

export default function EditUserModal({ user, onClose, onUserUpdated }: ModalProps) {
  const { supabase, tintValue, blurPx, borderRadiusPx, grainOpacity } = useSettings();
  const [regions, setRegions] = useState<Region[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  useEffect(() => {
    const fetchRegions = async () => {
      const { data, error } = await supabase.from('regions').select('id, name');
      if (error) toast.error('Bölgeler yüklenemedi.');
      else setRegions(data as Region[]);
    };
    fetchRegions();
  }, [supabase]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);
    const formData = new FormData(event.currentTarget);
    const result = await updateUser(formData);

    if (result.success) {
      toast.success(result.message);
      onUserUpdated();
      onClose();
    } else {
      toast.error(result.message);
    }
    setIsSubmitting(false);
  };

  const inputClass = "w-full bg-black/20 p-3 rounded-lg border border-white/10";

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <GlassCard {...{tintValue, blurPx, borderRadiusPx, grainOpacity}} className="w-full max-w-lg">
        <form onSubmit={handleSubmit}>
          <input type="hidden" name="userId" value={user.id} />
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold">Kullanıcıyı Düzenle</h2>
            <button type="button" onClick={onClose} className="p-2 rounded-full hover:bg-white/10"><X size={24} /></button>
          </div>
          <div className="space-y-4">
            <input name="full_name" required defaultValue={user.full_name} placeholder="Ad Soyad" className={inputClass} />
            <input type="email" value={user.email} disabled placeholder="E-posta Adresi" className={`${inputClass} bg-gray-700/50 cursor-not-allowed`} />
            <input value={user.role.toUpperCase()} disabled className={`${inputClass} bg-gray-700/50 cursor-not-allowed`} />
            <select name="region_id" required defaultValue={user.region_id} className={inputClass}>
                <option value="">Bölge Seçiniz...</option>
                {regions.map(region => (
                    <option key={region.id} value={region.id}>{region.name}</option>
                ))}
            </select>
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