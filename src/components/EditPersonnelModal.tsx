// YOL: src/components/EditPersonnelModal.tsx

"use client";

import { useState, useEffect, FormEvent } from 'react';
import { useSettings } from '@/contexts/SettingsContext';
import { updatePersonnel } from '@/app/actions';
import { X, Save } from 'lucide-react';
import toast from 'react-hot-toast';
import GlassCard from './GlassCard';
import type { Personnel, Region } from '@/types/index';

type ModalProps = {
  personnelToEdit: Personnel;
  onClose: () => void;
  onPersonnelUpdated: () => void;
};

export default function EditPersonnelModal({ personnelToEdit, onClose, onPersonnelUpdated }: ModalProps) {
  const { supabase } = useSettings();
  const [regions, setRegions] = useState<Region[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const fetchRegions = async () => {
      const { data } = await supabase.from('regions').select('*');
      setRegions(data as Region[] || []);
    };
    fetchRegions();
  }, [supabase]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);
    const formData = new FormData(event.currentTarget);
    const result = await updatePersonnel(formData);

    if (result.success) {
      toast.success(result.message);
      onPersonnelUpdated();
      onClose();
    } else {
      toast.error(result.message);
    }
    setIsSubmitting(false);
  };

  const inputClass = "w-full bg-black/20 p-3 rounded-lg border border-white/10 focus:ring-2 focus:ring-blue-500 focus:outline-none";
  
  const formatDateForInput = (dateString?: string | null) => {
    if (!dateString) return '';
    try {
        return new Date(dateString.replace(/-/g, '/')).toISOString().split('T')[0];
    } catch {
        return '';
    }
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <GlassCard className="w-full max-w-5xl max-h-[90vh] flex flex-col">
        <div className="flex justify-between items-center mb-6 flex-shrink-0">
          <h2 className="text-2xl font-bold">Personel Düzenle</h2>
          <button type="button" onClick={onClose} className="p-2 rounded-full hover:bg-white/10 transition-colors">
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto pr-2 -mr-2">
            <input type="hidden" name="id" value={personnelToEdit.id} />
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <input name="ADI SOYADI" required defaultValue={personnelToEdit["ADI SOYADI"]} placeholder="Adı Soyadı *" className={inputClass} />
                <input name="TC. KİMLİK NUMARASI" required maxLength={11} defaultValue={personnelToEdit["TC. KİMLİK NUMARASI"]} placeholder="TC Kimlik Numarası *" className={inputClass} />
                <input name="MAİL ADRESİ" type="email" required defaultValue={personnelToEdit["MAİL ADRESİ"]} placeholder="E-posta Adresi *" className={inputClass} />
                <select name="ŞUBE" required defaultValue={personnelToEdit["ŞUBE"]} className={inputClass}>
                  <option value="">Bölge (Şube) Seçin *</option>
                  {regions.map(region => (<option key={region.id} value={region.id}>{region.name}</option>))}
                </select>
                <input name="GÖREVİ" defaultValue={personnelToEdit["GÖREVİ"] || ''} placeholder="Görevi" className={inputClass} />
                <div>
                    <label className="text-xs text-gray-400">Kıdem Tarihi</label>
                    <input name="KIDEM TARİHİ" type="date" defaultValue={formatDateForInput(personnelToEdit["KIDEM TARİHİ"])} className={`${inputClass} [color-scheme:dark]`} />
                </div>
                 <div>
                    <label className="text-xs text-gray-400">Sözleşme Tarihi</label>
                    <input name="AY-KA ENERJİ SÖZLEŞME TARİHİ" type="date" defaultValue={formatDateForInput(personnelToEdit["AY-KA ENERJİ SÖZLEŞME TARİHİ"])} className={`${inputClass} [color-scheme:dark]`} />
                </div>
                <div>
                    <label className="text-xs text-gray-400">Doğum Tarihi</label>
                    <input name="DOĞUM TARİHİ" type="date" defaultValue={formatDateForInput(personnelToEdit["DOĞUM TARİHİ"])} className={`${inputClass} [color-scheme:dark]`} />
                </div>
                <input name="DOĞUM YERİ" defaultValue={personnelToEdit["DOĞUM YERİ"] || ''} placeholder="Doğum Yeri" className={inputClass} />
                <input name="BABA ADI" defaultValue={personnelToEdit["BABA ADI"] || ''} placeholder="Baba Adı" className={inputClass} />
                <input name="MEDENİ HALİ" defaultValue={personnelToEdit["MEDENİ HALİ"] || ''} placeholder="Medeni Hali" className={inputClass} />
                <input name="EŞ GELİR DURUMU" defaultValue={personnelToEdit["EŞ GELİR DURUMU"] || ''} placeholder="Eş Gelir Durumu" className={inputClass} />
                <input name="ÇOCUK SAYISI" type="number" defaultValue={personnelToEdit["ÇOCUK SAYISI"] || 0} placeholder="Çocuk Sayısı" className={inputClass} />
                <input name="AGİ YÜZDESİ" defaultValue={personnelToEdit["AGİ YÜZDESİ"] || ''} placeholder="AGİ Yüzdesi" className={inputClass} />
                <input name="ENGEL ORANI" defaultValue={personnelToEdit["ENGEL ORANI"] || ''} placeholder="Engel Oranı" className={inputClass} />
                <input name="ŞAHSİ TEL NO" defaultValue={personnelToEdit["ŞAHSİ TEL NO"] || ''} placeholder="Şahsi Tel No" className={inputClass} />
                <input name="MEZUNİYET" defaultValue={personnelToEdit["MEZUNİYET"] || ''} placeholder="Mezuniyet" className={inputClass} />
                <input name="BÖLÜM" defaultValue={personnelToEdit["BÖLÜM"] || ''} placeholder="Bölüm" className={inputClass} />
                <input name="ASKERLİK DURUMU" defaultValue={personnelToEdit["ASKERLİK DURUMU"] || ''} placeholder="Askerlik Durumu" className={inputClass} />
                <div>
                    <label className="text-xs text-gray-400">Tecil Bitiş Tarihi</label>
                    <input name="TECİL BİTİŞ TARİHİ" type="date" defaultValue={formatDateForInput(personnelToEdit["TECİL BİTİŞ TARİHİ"])} className={`${inputClass} [color-scheme:dark]`} />
                </div>
                <input name="EHLİYET" defaultValue={personnelToEdit["EHLİYET"] || ''} placeholder="Ehliyet" className={inputClass} />
                <input name="KANGRUBU" defaultValue={personnelToEdit["KANGRUBU"] || ''} placeholder="Kan Grubu" className={inputClass} />
                <input name="IBAN NO" defaultValue={personnelToEdit["IBAN NO"] || ''} placeholder="IBAN No" className={inputClass} />
                <input name="DOĞALGAZ SAYAÇ SÖKME TAKMA BELGESİ" defaultValue={personnelToEdit["DOĞALGAZ SAYAÇ SÖKME TAKMA BELGESİ"] || ''} placeholder="Sayaç Sökme Takma Belgesi" className={inputClass} />
                <div>
                    <label className="text-xs text-gray-400">Belge Geçerlilik Tarihi</label>
                    <input name="BELGE GEÇERLİLİK TARİHİ" type="date" defaultValue={formatDateForInput(personnelToEdit["BELGE GEÇERLİLİK TARİHİ"])} className={`${inputClass} [color-scheme:dark]`} />
                </div>
                <input name="ISITMA VE DOĞALGAZ İÇ TESİSAT YAPIM BELGESİ" defaultValue={personnelToEdit["ISITMA VE DOĞALGAZ İÇ TESİSAT YAPIM BELGESİ"] || ''} placeholder="İç Tesisat Yapım Belgesi" className={inputClass} />
                 <div>
                    <label className="text-xs text-gray-400">Tesisat Belge Geçerlilik Tarihi</label>
                    <input name="TESİSAT BELGE GEÇERLİLİK TARİHİ" type="date" defaultValue={formatDateForInput(personnelToEdit["TESİSAT BELGE GEÇERLİLİK TARİHİ"])} className={`${inputClass} [color-scheme:dark]`} />
                </div>
                <div className="flex items-center gap-2 pt-5">
                    <input id="is_active_edit" name="PERSONEL AKTİF Mİ?" type="checkbox" defaultChecked={personnelToEdit["PERSONEL AKTİF Mİ?"] ?? true} className="w-5 h-5 rounded bg-gray-700 border-gray-600 text-blue-600 focus:ring-blue-500"/>
                    <label htmlFor="is_active_edit" className="text-sm font-medium">Personel Aktif</label>
                </div>
                <textarea name="ADRES" defaultValue={personnelToEdit["ADRES"] || ''} placeholder="Adres" className={`${inputClass} lg:col-span-4`} rows={2}></textarea>
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
  <span>{isSubmitting ? 'Güncelleniyor...' : 'Güncelle'}</span>
</button>
          </div>
        </form>
      </GlassCard>
    </div>
  );
}