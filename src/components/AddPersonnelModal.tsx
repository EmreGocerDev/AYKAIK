// YOL: src/components/AddPersonnelModal.tsx

"use client";
import { useState, useEffect, FormEvent } from 'react';
import { useSettings } from '@/contexts/SettingsContext';
import { addPersonnel } from '@/app/actions';
import { X, Save } from 'lucide-react';
import toast from 'react-hot-toast';
import GlassCard from './GlassCard';
import type { Region } from '@/types/index';

type ModalProps = {
  onClose: () => void;
  onPersonnelAdded: () => void;
};

export default function AddPersonnelModal({ onClose, onPersonnelAdded }: ModalProps) {
  const { supabase } = useSettings();
  const [regions, setRegions] = useState<Region[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const fetchRegions = async () => {
      const { data } = await supabase.from('regions').select('id, name');
      setRegions(data as Region[] || []);
    };
    fetchRegions();
  }, [supabase]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);
    const formData = new FormData(event.currentTarget);
    const result = await addPersonnel(formData);

    if (result.success) {
      toast.success(result.message);
      onPersonnelAdded();
      onClose();
    } else {
      toast.error(result.message);
    }
    setIsSubmitting(false);
  };

  const inputClass = "w-full bg-black/20 p-3 rounded-lg border border-white/10 focus:ring-2 focus:ring-blue-500 focus:outline-none";
  
  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <GlassCard className="w-full max-w-5xl max-h-[90vh] flex flex-col">
        <div className="flex justify-between items-center mb-6 flex-shrink-0">
          <h2 className="text-2xl font-bold">Yeni Personel Ekle</h2>
           <button type="button" onClick={onClose} className="p-2 rounded-full hover:bg-white/10 transition-colors"> 
            <X size={24} />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="overflow-y-auto pr-2 -mr-2 flex-1">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <input name="ADI SOYADI" required placeholder="Adı Soyadı *" className={inputClass} />
            <input name="TC. KİMLİK NUMARASI" required maxLength={11} placeholder="TC Kimlik Numarası *" className={inputClass} />
            <input name="MAİL ADRESİ" type="email" required placeholder="E-posta Adresi *" className={inputClass} />
            <select name="ŞUBE" required className={inputClass}>
              <option value="">Bölge (Şube) Seçin *</option>
              {regions.map(region => (<option key={region.id} value={region.id}>{region.name}</option>))}
            </select>
            <input name="GÖREVİ" placeholder="Görevi" className={inputClass} />
            <div>
                <label className="text-xs text-gray-400">Kıdem Tarihi</label>
                <input name="KIDEM TARİHİ" type="date" className={`${inputClass} [color-scheme:dark]`} />
            </div>
            <div>
                <label className="text-xs text-gray-400">Doğum Tarihi</label>
                <input name="DOĞUM TARİHİ" type="date" className={`${inputClass} [color-scheme:dark]`} />
            </div>
            <input name="DOĞUM YERİ" placeholder="Doğum Yeri" className={inputClass} />
            <input name="BABA ADI" placeholder="Baba Adı" className={inputClass} />
            <input name="MEDENİ HALİ" placeholder="Medeni Hali" className={inputClass} />
            <input name="EŞ GELİR DURUMU" placeholder="Eş Gelir Durumu" className={inputClass} />
            <input name="ÇOCUK SAYISI" type="number" placeholder="Çocuk Sayısı" className={inputClass} />
            <input name="AGİ YÜZDESİ" placeholder="AGİ Yüzdesi" className={inputClass} />
            <input name="ENGEL ORANI" placeholder="Engel Oranı" className={inputClass} />
            <input name="ŞAHSİ TEL NO" placeholder="Şahsi Tel No" className={inputClass} />
            <input name="MEZUNİYET" placeholder="Mezuniyet" className={inputClass} />
            <input name="BÖLÜM" placeholder="Bölüm" className={inputClass} />
            <input name="ASKERLİK DURUMU" placeholder="Askerlik Durumu" className={inputClass} />
            <div>
                <label className="text-xs text-gray-400">Tecil Bitiş Tarihi</label>
                <input name="TECİL BİTİŞ TARİHİ" type="date" className={`${inputClass} [color-scheme:dark]`} />
            </div>
            <input name="EHLİYET" placeholder="Ehliyet" className={inputClass} />
            <input name="KANGRUBU" placeholder="Kan Grubu" className={inputClass} />
            <input name="IBAN NO" placeholder="IBAN No" className={inputClass} />
            <input name="DOĞALGAZ SAYAÇ SÖKME TAKMA BELGESİ" placeholder="Sayaç Sökme Takma Belgesi" className={inputClass} />
             <div>
                <label className="text-xs text-gray-400">Belge Geçerlilik Tarihi</label>
                <input name="BELGE GEÇERLİLİK TARİHİ" type="date" className={`${inputClass} [color-scheme:dark]`} />
            </div>
            <input name="ISITMA VE DOĞALGAZ İÇ TESİSAT YAPIM BELGESİ" placeholder="İç Tesisat Yapım Belgesi" className={inputClass} />
            <div>
                <label className="text-xs text-gray-400">Tesisat Belge Geçerlilik Tarihi</label>
                <input name="TESİSAT BELGE GEÇERLİLİK TARİHİ" type="date" className={`${inputClass} [color-scheme:dark]`} />
            </div>
            <div className="flex items-center gap-2 pt-5">
                <input id="is_active_add" name="PERSONEL AKTİF Mİ?" type="checkbox" defaultChecked className="w-5 h-5 rounded bg-gray-700 border-gray-600 text-blue-600 focus:ring-blue-500"/>
                <label htmlFor="is_active_add" className="text-sm font-medium">Personel Aktif</label>
            </div>
            <textarea name="ADRES" placeholder="Adres" className={`${inputClass} lg:col-span-4`} rows={2}></textarea>
          </div>
          <div className="flex justify-end mt-8 pt-6 border-t border-white/10 flex-shrink-0">
            <button type="submit" disabled={isSubmitting} className="btn-save-animated">
  <div className="svg-wrapper-1">
    <div className="svg-wrapper">
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="30" height="30" className="icon">
        <path d="M15 3H5a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2V7.5L16.5 3H15zm-3 13a3 3 0 11-6 0 3 3 0 016 0zM6 4h7v4H6V4z"></path>
      </svg>
    </div>
  </div>
  <span>{isSubmitting ? 'Kaydediliyor...' : 'Kaydet'}</span>
</button>
          </div>
        </form>
      </GlassCard>
    </div>
  );
}