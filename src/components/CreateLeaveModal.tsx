"use client";

import { useState, FormEvent } from 'react';
import { useSettings } from '@/contexts/SettingsContext';
import { createLeaveForPersonnel } from '@/app/actions';
import { X, CalendarPlus } from 'lucide-react';
import toast from 'react-hot-toast';
import GlassCard from './GlassCard';
// DÜZELTME: Personnel tipi, doğru yer olan @/types/index dosyasından import edildi.
import type { Personnel } from '@/types/index';

type ModalProps = {
  personnel: Personnel;
  onClose: () => void;
};

export default function CreateLeaveModal({ personnel, onClose }: ModalProps) {
  const { tintValue, blurPx, borderRadiusPx, grainOpacity } = useSettings();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);
    const formData = new FormData(event.currentTarget);
    const result = await createLeaveForPersonnel(formData);

    if (result.success) {
      toast.success(result.message);
      onClose();
    } else {
      toast.error(result.message);
    }
    setIsSubmitting(false);
  };
  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <GlassCard
        tintValue={tintValue}
        blurPx={blurPx}
        borderRadiusPx={borderRadiusPx}
        grainOpacity={grainOpacity}
        className="w-full max-w-lg"
      >
        <form onSubmit={handleSubmit}>
          <input type="hidden" name="personnel_id" value={personnel.id} />
          
          <div className="flex justify-between items-center mb-6">
            <div>
              <h2 className="text-2xl font-bold">İzin Talebi Oluştur</h2>
              <p className="text-gray-300">{personnel.full_name} adına</p>
            </div>
            <button type="button" onClick={onClose} className="p-2 rounded-full hover:bg-white/10 transition-colors">
              <X size={24} />
            </button>
          </div>
          
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="w-full sm:w-1/2">
                <label className="text-sm text-gray-400 mb-1 block">Başlangıç Tarihi</label>
                <input name="start_date" type="date" required className="w-full bg-black/20 p-3 rounded-lg border border-white/10 [color-scheme:dark]" />
              </div>
              <div className="w-full sm:w-1/2">
                <label className="text-sm text-gray-400 mb-1 block">Bitiş Tarihi</label>
                <input name="end_date" type="date" required className="w-full bg-black/20 p-3 rounded-lg border border-white/10 [color-scheme:dark]" />
              </div>
            </div>
            <div>
              <label className="text-sm text-gray-400 mb-1 block">İzin Türü</label>
              <select name="leave_type" required className="w-full bg-black/20 p-3 rounded-lg border border-white/10">
                <option value="">Seçiniz...</option>
                <option value="yıllık izin">Yıllık İzin</option>
                <option value="ücretli izin">Ücretli İzin (Mazeret)</option>
                <option value="ücretsiz izin">Ücretsiz İzin</option>
                <option value="raporlu">Raporlu (İstirahat)</option>
              </select>
            </div>
            <div>
              <label className="text-sm text-gray-400 mb-1 block">Açıklama (Opsiyonel)</label>
              <textarea name="reason" placeholder="İzinle ilgili açıklama..." className="w-full bg-black/20 p-3 rounded-lg border border-white/10" rows={3}></textarea>
            </div>
          </div>

          <div className="flex justify-end mt-6">
            <button type="submit" disabled={isSubmitting} className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors disabled:opacity-50">
              <CalendarPlus size={16} />
              {isSubmitting ? 'Oluşturuluyor...' : 'Talep Oluştur'}
            </button>
          </div>
        </form>
      </GlassCard>
    </div>
  );
}