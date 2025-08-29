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
  const { supabase, tintValue, blurPx, borderRadiusPx, grainOpacity } = useSettings();
  const [regions, setRegions] = useState<Region[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  useEffect(() => {
    const fetchRegions = async () => {
      const { data, error } = await supabase.from('regions').select('*');
      if (error) toast.error('Bölgeler yüklenemedi.');
      else setRegions(data as Region[]);
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
        return new Date(dateString).toISOString().split('T')[0];
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (_e) {
        return '';
    }
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <GlassCard
        tintValue={tintValue}
        blurPx={blurPx}
        borderRadiusPx={borderRadiusPx}
        grainOpacity={grainOpacity}
        className="w-full max-w-4xl max-h-[90vh] flex flex-col"
      >
        <div className="flex justify-between items-center mb-6 flex-shrink-0">
          <h2 className="text-2xl font-bold">Personel Düzenle</h2>
          <button type="button" onClick={onClose} className="p-2 rounded-full hover:bg-white/10 transition-colors">
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto pr-2 -mr-2">
            <input type="hidden" name="id" value={personnelToEdit.id} />
            <div className="space-y-6">

              <fieldset>
                <legend className="text-lg font-semibold mb-2 text-white/80">Kişisel Bilgiler</legend>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <input name="full_name" required defaultValue={personnelToEdit.full_name} placeholder="Adı Soyadı" className={inputClass} />
                  <input name="tc_kimlik_no" required maxLength={11} defaultValue={personnelToEdit.tc_kimlik_no} placeholder="TC Kimlik Numarası" className={inputClass} />
                  <input name="father_name" defaultValue={personnelToEdit.father_name || ''} placeholder="Baba Adı" className={inputClass} />
                  <div>
                      <label className="text-sm text-gray-400 mb-1 block">Doğum Tarihi</label>
                      <input name="date_of_birth" type="date" defaultValue={formatDateForInput(personnelToEdit.date_of_birth)} className={`${inputClass} [color-scheme:dark]`} />
                  </div>
                  <input name="place_of_birth" defaultValue={personnelToEdit.place_of_birth || ''} placeholder="Doğum Yeri" className={inputClass} />
                  <select name="marital_status" defaultValue={personnelToEdit.marital_status || ''} className={inputClass}>
                      <option value="">Medeni Hali...</option>
                      <option value="Bekar">Bekar</option>
                      <option value="Evli">Evli</option>
                  </select>
                  <select name="eş_gelir_durumu" defaultValue={personnelToEdit.eş_gelir_durumu || ''} className={inputClass}>
                      <option value="">Eş Gelir Durumu...</option>
                      <option value="Yok">Yok</option>
                      <option value="Var">Var</option>
                  </select>
                  <input name="number_of_children" type="number" defaultValue={personnelToEdit.number_of_children || 0} placeholder="Çocuk Sayısı" className={inputClass} />
                  <input name="agi_yüzdesi" defaultValue={personnelToEdit.agi_yüzdesi || ''} placeholder="AGİ Yüzdesi" className={inputClass} />
                  <input name="engel_derecesi" defaultValue={personnelToEdit.engel_derecesi || ''} placeholder="Engel Derecesi" className={inputClass} />
                  <input name="blood_type" defaultValue={personnelToEdit.blood_type || ''} placeholder="Kan Grubu" className={inputClass} />
                </div>
              </fieldset>

              <fieldset>
                <legend className="text-lg font-semibold mb-2 text-white/80">İletişim Bilgileri</legend>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <input name="phone_number" defaultValue={personnelToEdit.phone_number || ''} placeholder="Şahsi Tel No" className={inputClass} />
                  <input name="email" type="email" defaultValue={personnelToEdit.email} placeholder="E-posta Adresi" className={inputClass} />
                  <textarea name="address" defaultValue={personnelToEdit.address || ''} placeholder="Adres" className={inputClass} rows={2}></textarea>
                  <input name="iban" defaultValue={personnelToEdit.iban || ''} placeholder="IBAN" className={inputClass} />
                </div>
              </fieldset>

              <fieldset>
                <legend className="text-lg font-semibold mb-2 text-white/80">İstihdam ve Eğitim</legend>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <select name="region_id" required defaultValue={personnelToEdit.region_id || ''} className={inputClass}>
                    <option value="">Bölge Seçin...</option>
                    {regions.map(region => (<option key={region.id} value={region.id}>{region.name}</option>))}
                  </select>
                  <input name="şube" defaultValue={personnelToEdit["şube"] || ''} placeholder="Şube" className={inputClass} />
                  <div>
                      <label className="text-sm text-gray-400 mb-1 block">İşe Giriş Tarihi</label>
                      <input name="start_date" type="date" required defaultValue={formatDateForInput(personnelToEdit.start_date)} className={`${inputClass} [color-scheme:dark]`} />
                  </div>
                  <input name="education_level" defaultValue={personnelToEdit.education_level || ''} placeholder="Mezuniyet (Eğitim Seviyesi)" className={inputClass} />
                  <input name="bölüm" defaultValue={personnelToEdit["bölüm"] || ''} placeholder="Mezun Olduğu Bölüm" className={inputClass} />
                  <select name="military_service_status" defaultValue={personnelToEdit.military_service_status || ''} className={inputClass}>
                      <option value="">Askerlik Durumu...</option>
                      <option value="Yapıldı">Yapıldı</option>
                      <option value="Tecilli">Tecilli</option>
                      <option value="Muaf">Muaf</option>
                  </select>
                  <input name="ehliyet" defaultValue={personnelToEdit.ehliyet || ''} placeholder="Ehliyet" className={inputClass} />
                  <div>
                      <label className="text-sm text-gray-400 mb-1 block">Sözleşme Tarihi</label>
                      <input name="sözleşme_tarihi" type="date" defaultValue={formatDateForInput(personnelToEdit.sözleşme_tarihi)} className={`${inputClass} [color-scheme:dark]`} />
                  </div>
                </div>
              </fieldset>

              <fieldset>
                <legend className="text-lg font-semibold mb-2 text-white/80">Mesleki Belgeler</legend>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <input name="dogalgaz_sayac_sokme_takma_belgesi" defaultValue={personnelToEdit.dogalgaz_sayac_sokme_takma_belgesi || ''} placeholder="Doğalgaz Sayaç Belgesi" className={inputClass} />
                  <input name="isitma_ve_dogalgaz_tesisat_belgesi" defaultValue={personnelToEdit.isitma_ve_dogalgaz_tesisat_belgesi || ''} placeholder="Doğalgaz Tesisat Belgesi" className={inputClass} />
                  <div>
                      <label className="text-sm text-gray-400 mb-1 block">Belge Geçerlilik Tarihi</label>
                      <input name="belge_geçerlilik_tarihi" type="date" defaultValue={formatDateForInput(personnelToEdit.belge_geçerlilik_tarihi)} className={`${inputClass} [color-scheme:dark]`} />
                  </div>
                </div>
              </fieldset>

          </div>

          <div className="flex justify-end mt-8 pt-6 border-t border-white/10 flex-shrink-0">
            <button type="submit" disabled={isSubmitting} className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors disabled:opacity-50">
              <Save size={16} />
              {isSubmitting ? 'Güncelleniyor...' : 'Güncelle'}
            </button>
          </div>
        </form>
      </GlassCard>
    </div>
  );
}