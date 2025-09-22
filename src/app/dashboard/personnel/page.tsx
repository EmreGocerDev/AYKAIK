// YOL: src/app/dashboard/personnel/page.tsx

"use client";

import { useEffect, useState, useCallback, Fragment, ReactNode } from 'react';
import { useSettings } from '@/contexts/SettingsContext';
import { Plus, Edit, Trash2, CalendarPlus, ChevronDown, ChevronUp } from 'lucide-react';
import GlassCard from '@/components/GlassCard';
import AddPersonnelModal from '@/components/AddPersonnelModal';
import EditPersonnelModal from '@/components/EditPersonnelModal';
import ConfirmModal from '@/components/ConfirmModal';
import CreateLeaveModal from '@/components/CreateLeaveModal';
import Pagination from '@/components/Pagination';
import { deletePersonnel } from '@/app/actions';
import toast from 'react-hot-toast';
import type { Personnel } from '@/types/index';

const PAGE_SIZE = 10;
const DetailRow = ({ label, value }: { label: string, value: ReactNode }) => {
    if (value === null || value === undefined || value === '') return null;
    return (
        <div>
            <p className="text-xs text-gray-400">{label}</p>
            <p className="text-sm font-semibold">{String(value)}</p>
        </div>
    );
};

export default function PersonnelPage() {
  const { supabase, profile, tintValue, blurPx, borderRadiusPx, grainOpacity } = useSettings();
  const [personnelList, setPersonnelList] = useState<Personnel[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalPersonnel, setTotalPersonnel] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [personnelToDelete, setPersonnelToDelete] = useState<Personnel | null>(null);
  const [personnelToEdit, setPersonnelToEdit] = useState<Personnel | null>(null);
  const [personnelForLeave, setPersonnelForLeave] = useState<Personnel | null>(null);
  const [expandedRowId, setExpandedRowId] = useState<number | null>(null);

  const fetchPersonnel = useCallback(async (page: number) => {
    setLoading(true);
    const from = (page - 1) * PAGE_SIZE;
    const to = from + PAGE_SIZE - 1;

    let query = supabase
      .from('personnel')
      .select('*, regions(name)', { count: 'exact' });

    if (profile && profile.role === 'coordinator' && profile.region_id) {
      query = query.eq('"ŞUBE"', profile.region_id);
    }

    const { data, error, count } = await query
      .order('"ADI SOYADI"', { ascending: true })
      .range(from, to);

    if (error) {
      toast.error("Personel listesi yüklenemedi.");
      console.error(error);
    } else {
      setPersonnelList(data as Personnel[]);
      setTotalPersonnel(count || 0);
    }
    setLoading(false);
  }, [supabase, profile]);

  useEffect(() => {
    if (profile) {
      fetchPersonnel(currentPage);
    }
  }, [fetchPersonnel, currentPage, profile]);

  const refreshList = () => {
    if (profile) {
      fetchPersonnel(currentPage);
    }
  };

  const handleConfirmDelete = async () => {
    if (!personnelToDelete) return;
    const toastId = toast.loading('Personel siliniyor...');
    const result = await deletePersonnel(personnelToDelete.id);
    if (result.success) {
      toast.success(result.message, { id: toastId });
      if (personnelList.length === 1 && currentPage > 1) {
        setCurrentPage(currentPage - 1);
      } else {
        refreshList();
      }
    } else {
      toast.error(result.message, { id: toastId });
    }
    setPersonnelToDelete(null);
  };

  return (
    <>
      <div className="p-4 md:p-8 text-white">
        <div className="max-w-7xl mx-auto">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-3xl font-bold">Personel Listesi</h1>
            {/* YETKİ KONTROLÜ: Bu butonu sadece adminler görebilir */}
            {profile?.role === 'admin' && (
              <button 
                onClick={() => setIsAddModalOpen(true)}
                className="flex items-center gap-2 bg-blue-600 px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Plus size={16} />
                <span>Yeni Personel Ekle</span>
              </button>
            )}
          </div>
          
          {loading ? (
            <div className="text-center py-10">Personel listesi yükleniyor...</div>
          ) : (
            <GlassCard
              tintValue={tintValue} blurPx={blurPx} borderRadiusPx={borderRadiusPx} grainOpacity={grainOpacity}
              className="!p-0 overflow-hidden" 
            >
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="border-b border-white/10 text-sm text-gray-400">
                    <tr>
                       <th className="p-4 w-8"></th>
                       <th className="p-4">Ad Soyad</th>
                       <th className="p-4 hidden md:table-cell">Bölge (Şube)</th>
                       <th className="p-4 hidden md:table-cell">Görevi</th>
                       <th className="p-4 hidden lg:table-cell">Telefon</th>
                       <th className="p-4 hidden lg:table-cell">Yıllık İzin (Kalan/Hak)</th>
                       <th className="p-4 text-right">İşlemler</th>
                    </tr>
                  </thead>
                  
                  {personnelList.length > 0 ? (
                    personnelList.map((person) => {
                     const remainingDays = person.annual_leave_days_entitled - person.annual_leave_days_used;
                     const isExpanded = expandedRowId === person.id;
                     return (
                       <tbody key={person.id} className="border-b border-white/5">
                        <tr className="hover:bg-white/5 transition-colors">
                          <td className="p-4 text-center">
                            <button onClick={() => setExpandedRowId(isExpanded ? null : person.id)} className="p-2 rounded-full hover:bg-white/10">
                              {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                            </button>
                          </td>
                          <td className="p-4 font-semibold">{person["ADI SOYADI"]}</td>
                          <td className="p-4 hidden md:table-cell">{person.regions?.name || '-'}</td>
                          <td className="p-4 hidden md:table-cell">{person["GÖREVİ"] || '-'}</td>
                          <td className="p-4 hidden lg:table-cell">{person["ŞAHSİ TEL NO"] || '-'}</td>
                          <td className="p-4 hidden lg:table-cell">
                            <span className={`font-bold ${remainingDays > 5 ? 'text-green-400' : 'text-yellow-400'}`}>
                              {remainingDays}
                            </span>
                            <span className="text-gray-400"> / {person.annual_leave_days_entitled} gün</span>
                          </td>
                          <td className="p-4 text-right">
                              <div className="flex items-center justify-end gap-2">
                                <button onClick={() => setPersonnelForLeave(person)} className="p-2 rounded-md hover:bg-white/10 transition-colors" title="İzin Oluştur">
                                  <CalendarPlus size={16} />
                                </button>
                                {/* YETKİ KONTROLÜ: Bu butonları sadece adminler görebilir */}
                                {profile?.role === 'admin' && (
                                  <>
                                    <button onClick={() => setPersonnelToEdit(person)} className="p-2 rounded-md hover:bg-white/10 transition-colors" title="Düzenle">
                                      <Edit size={16} />
                                    </button>
                                    <button onClick={() => setPersonnelToDelete(person)} className="p-2 rounded-md text-red-400 hover:bg-red-500/10 transition-colors" title="Sil">
                                      <Trash2 size={16} />
                                    </button>
                                  </>
                                )}
                              </div>
                          </td>
                        </tr>
                        {isExpanded && (
                          <tr className="bg-black/20">
                            <td colSpan={7} className="p-4">
                              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-x-4 gap-y-6">
                                <DetailRow label="TC Kimlik No" value={person["TC. KİMLİK NUMARASI"]} />
                                <DetailRow label="Mail Adresi" value={person["MAİL ADRESİ"]} />
                                <DetailRow label="Kıdem Tarihi" value={person["KIDEM TARİHİ"]} />
                                <DetailRow label="Askerlik" value={person["ASKERLİK DURUMU"]} />
                                <DetailRow label="Ehliyet" value={person["EHLİYET"]} />
                                <DetailRow label="IBAN" value={person["IBAN NO"]} />
                                <div className="col-span-full">
                                  <DetailRow label="Adres" value={person["ADRES"]} />
                                </div>
                               </div>
                            </td>
                          </tr>
                        )}
                       </tbody>
                     );
                   })
                  ) : (
                    <tbody>
                      <tr>
                        <td colSpan={7} className="text-center p-8 text-gray-400">
                          Sistemde kayıtlı personel bulunamadı.
                        </td>
                      </tr>
                    </tbody>
                  )}
                </table>
              </div>
              <Pagination
                currentPage={currentPage} totalCount={totalPersonnel} pageSize={PAGE_SIZE}
                onPageChange={(page) => setCurrentPage(page)}
              />
            </GlassCard>
          )}
        </div>
      </div>
      
      {isAddModalOpen && <AddPersonnelModal onClose={() => setIsAddModalOpen(false)} onPersonnelAdded={refreshList} />}
      {personnelToEdit && <EditPersonnelModal personnelToEdit={personnelToEdit} onClose={() => setPersonnelToEdit(null)} onPersonnelUpdated={refreshList} />}
      <ConfirmModal isOpen={!!personnelToDelete} onClose={() => setPersonnelToDelete(null)} onConfirm={handleConfirmDelete} title="Personeli Sil" message={`'${personnelToDelete?.["ADI SOYADI"]}' adlı personeli kalıcı olarak silmek istediğinizden emin misiniz?`} />
      {personnelForLeave && <CreateLeaveModal personnel={personnelForLeave} onClose={() => setPersonnelForLeave(null)} />}
    </>
  );
}