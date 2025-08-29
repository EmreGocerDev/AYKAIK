"use client";

import { useEffect, useState, useCallback } from 'react';
import { useSettings } from '@/contexts/SettingsContext';
import { Plus, Edit, Trash2, FileDown } from 'lucide-react';
import GlassCard from '@/components/GlassCard';
import AddRegionModal from '@/components/AddRegionModal';
import EditRegionModal from '@/components/EditRegionModal';
import ConfirmModal from '@/components/ConfirmModal';
import { deleteRegion } from '@/app/actions';
import toast from 'react-hot-toast';
import * as XLSX from 'xlsx';

type Region = { 
  id: number; 
  name: string; 
  workplace_registration_number?: string | null;
  address?: string | null;
  province?: string | null;
  sgk_province_code?: string | null;
};

export default function RegionsPage() {
  const { supabase, tintValue, blurPx, borderRadiusPx, grainOpacity } = useSettings();
  const [regions, setRegions] = useState<Region[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [regionToEdit, setRegionToEdit] = useState<Region | null>(null);
  const [regionToDelete, setRegionToDelete] = useState<Region | null>(null);
  const fetchRegions = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase.from('regions').select('*').order('name');
    if (error) toast.error('Bölgeler yüklenemedi.');
    else setRegions(data as Region[]);
    setLoading(false);
  }, [supabase]);
  useEffect(() => { fetchRegions() }, [fetchRegions]);

  const handleConfirmDelete = async () => {
    if (!regionToDelete) return;
    const toastId = toast.loading('Bölge siliniyor...');
    const result = await deleteRegion(regionToDelete.id);
    if (result.success) {
      toast.success(result.message, { id: toastId });
      fetchRegions();
    } else {
      toast.error(result.message, { id: toastId });
    }
    setRegionToDelete(null);
  };
  const handleExportToExcel = () => {
    if (regions.length === 0) {
      toast.error("Aktarılacak veri bulunmuyor.");
      return;
    }

    const dataToExport = regions.map((region, index) => ({
      'SIRA NO': index + 1,
      'BÖLGE ADI': region.name,
      'İŞYERİ SİCİL NUMARASI': region.workplace_registration_number || '',
      'ADRES': region.address || '',
      'ÇALIŞILAN İL': region.province || '',
      'SGK İL KODU': region.sgk_province_code || ''
    }));
    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Bölgeler');
    XLSX.writeFile(workbook, 'Bölgeler_Listesi.xlsx');
  };
  return (
    <>
      <div className="p-4 md:p-8 text-white">
        <div className="max-w-4xl mx-auto">
          <div className="flex flex-wrap justify-between items-center mb-6 gap-4">
            <h1 className="text-3xl font-bold">Bölge Yönetimi</h1>
            <div className="flex gap-2">
              <button 
                onClick={() => setIsAddModalOpen(true)} className="flex items-center gap-2 bg-blue-600 px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
                <Plus size={16} />
                <span>Yeni Bölge Ekle</span>
              </button>
              <button 
                onClick={handleExportToExcel} 
                disabled={regions.length === 0}
                className="flex items-center gap-2 bg-green-600 px-4 py-2 rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <FileDown size={16} />
                <span>Excel&apos;e Aktar</span>
              </button>
            </div>
          </div>
          
          <GlassCard {...{tintValue, blurPx, borderRadiusPx, grainOpacity}}>
            {loading ? <div className="text-center p-4">Yükleniyor...</div> : (
              <div className="space-y-4">
                {regions.map(region => (
                  <div key={region.id} className="p-4 bg-white/5 rounded-lg flex justify-between items-start">
                    <div className="space-y-2">
                      <h3 className="font-bold text-lg text-white">{region.name}</h3>
                      {region.workplace_registration_number && <p className="text-sm text-gray-300"><span className="font-semibold text-gray-400">İşyeri Sicil No:</span> {region.workplace_registration_number}</p>}
                      {region.province && <p className="text-sm text-gray-300"><span className="font-semibold text-gray-400">İl / SGK Kodu:</span> {region.province} / {region.sgk_province_code || 'N/A'}</p>}
                      {region.address && <p className="text-sm text-gray-300"><span className="font-semibold text-gray-400">Adres:</span> {region.address}</p>}
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0 ml-4">
                      <button onClick={() => setRegionToEdit(region)} className="p-2 hover:bg-white/10 rounded-md" title="Düzenle"><Edit size={16} /></button>
                      <button onClick={() => setRegionToDelete(region)} className="p-2 text-red-400 hover:bg-red-500/10 rounded-md" title="Sil"><Trash2 size={16} /></button>
                    </div>
                  </div>
                ))}
              </div>
            )}
            {regions.length === 0 && !loading && <p className="text-center text-gray-400 p-4">Henüz bölge eklenmemiş.</p>}
          </GlassCard>
        </div>
      </div>
      
      {isAddModalOpen && <AddRegionModal onClose={() => setIsAddModalOpen(false)} onRegionAdded={fetchRegions} />}
      {regionToEdit && <EditRegionModal region={regionToEdit} onClose={() => setRegionToEdit(null)} onRegionUpdated={fetchRegions} />}
      <ConfirmModal
        isOpen={!!regionToDelete}
        onClose={() => setRegionToDelete(null)}
        onConfirm={handleConfirmDelete}
        title="Bölgeyi Sil"
        message={`“${regionToDelete?.name}” adlı bölgeyi silmek istediğinizden emin misiniz?`}
      />
    </>
  );
}