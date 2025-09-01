"use client";

import { useEffect, useState, useCallback } from 'react';
import { useSettings } from '@/contexts/SettingsContext';
import { MoreHorizontal, Filter, X, Search } from 'lucide-react';
import GlassCard from '@/components/GlassCard';
import RequestDetailsModal from '@/components/RequestDetailsModal';
import Pagination from '@/components/Pagination';
import toast from 'react-hot-toast';
// GÜNCELLEME: Güvenli tarih fonksiyonunu import ediyoruz.
import { safeNewDate } from '@/lib/utils';

export type LeaveRequestStatus = 'pending' | 'approved_by_coordinator' | 'rejected_by_coordinator' | 'approved' | 'rejected';

type HistoryEntry = {
  action: string;
  actor: string;
  timestamp: string;
  notes: string;
};
export type LeaveRequest = {
  id: number;
  start_date: string;
  end_date: string;
  status: LeaveRequestStatus;
  created_at: string;
  history_log: HistoryEntry[];
  leave_type: string;
  personnel_full_name: string; 
  total_count: number;
};

type Region = { id: number; name: string; };

const PAGE_SIZE = 10;
const statusColors: { [key in LeaveRequestStatus]: string } = {
  pending: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30',
  approved_by_coordinator: 'bg-sky-500/20 text-sky-300 border-sky-500/30',
  rejected_by_coordinator: 'bg-orange-500/20 text-orange-300 border-orange-500/30',
  approved: 'bg-green-500/20 text-green-300 border-green-500/30',
  rejected: 'bg-red-500/20 text-red-300 border-red-500/30',
};
const statusTranslations: { [key in LeaveRequestStatus]: string } = {
  pending: 'Beklemede',
  approved_by_coordinator: 'Koordinatör Onayladı',
  rejected_by_coordinator: 'Koordinatör Reddetti',
  approved: 'Onaylandı',
  rejected: 'Reddedildi',
};
const leaveTypes = [
    { value: 'yıllık izin', label: 'Yıllık İzin' },
    { value: 'ücretli izin', label: 'Ücretli İzin (Mazeret)' },
    { value: 'ücretsiz izin', label: 'Ücretsiz İzin' },
    { value: 'raporlu', label: 'Raporlu (İstirahat)' },
];
export default function LeaveRequestsPage() {
  const { supabase, tintValue, blurPx, borderRadiusPx, grainOpacity } = useSettings();
  const [requests, setRequests] = useState<LeaveRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState<LeaveRequest | null>(null);
  const [regions, setRegions] = useState<Region[]>([]);
  const [selectedRegion, setSelectedRegion] = useState<string>('');
  const [selectedLeaveType, setSelectedLeaveType] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [totalRequests, setTotalRequests] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState(searchQuery);

  useEffect(() => {
    const fetchRegions = async () => {
      const { data, error } = await supabase.from('regions').select('id, name');
      if (error) toast.error("Bölgeler yüklenemedi.");
      else setRegions(data);
    };
    fetchRegions();
  }, [supabase]);

  const fetchLeaveRequests = useCallback(async (page: number, regionId: string, search: string, leaveType: string) => {
    setLoading(true);
    const from = (page - 1) * PAGE_SIZE;
    
    const { data, error } = await supabase.rpc('search_leave_requests', {
        region_filter_id: regionId ? Number(regionId) : null,
        search_query: search || null,
        leave_type_filter: leaveType || null,
        limit_val: PAGE_SIZE,
        offset_val: from
    });

    if (error) {
      console.error("İzin talepleri çekilirken RPC hatası:", error);
      toast.error("İzin talepleri yüklenemedi.");
      setRequests([]);
      setTotalRequests(0);
    } else {
      setRequests(data as LeaveRequest[]);
      setTotalRequests(data?.[0]?.total_count || 0);
    }
    setLoading(false);
  }, [supabase]);

  useEffect(() => {
      const timer = setTimeout(() => {
          setDebouncedSearchQuery(searchQuery);
          setCurrentPage(1);
      }, 300);
      return () => clearTimeout(timer);
  }, [searchQuery]);

  useEffect(() => {
      setCurrentPage(1);
  }, [selectedRegion, selectedLeaveType]);

  useEffect(() => {
    fetchLeaveRequests(currentPage, selectedRegion, debouncedSearchQuery, selectedLeaveType);
  }, [currentPage, selectedRegion, debouncedSearchQuery, selectedLeaveType, fetchLeaveRequests]);

  const handleModalClose = () => {
    setSelectedRequest(null);
    fetchLeaveRequests(currentPage, selectedRegion, debouncedSearchQuery, selectedLeaveType);
  }

  const clearFilters = () => {
    setSelectedRegion('');
    setSearchQuery('');
    setSelectedLeaveType('');
  };

  return (
    <>
      <div className="p-4 md:p-8 text-white">
        <div className="max-w-7xl mx-auto">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-3xl font-bold">İzin Talepleri</h1>
          </div>
          
          <GlassCard
            tintValue={tintValue}
            blurPx={blurPx}
            borderRadiusPx={borderRadiusPx}
            grainOpacity={grainOpacity}
            className="mb-6 !p-4"
          >
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-2 text-lg font-semibold">
                 <Filter size={20} />
                <h3>Filtreler</h3>
              </div>
              <div className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto">
                <div className="relative w-full sm:w-auto">
                  <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Personel ara..."
                    className="w-full sm:w-64 bg-black/20 py-2 pl-10 pr-4 rounded-lg border border-white/10"
                  />
                </div>
                <select
                  value={selectedLeaveType}
                  onChange={(e) => setSelectedLeaveType(e.target.value)}
                  className="w-full sm:w-auto bg-black/20 py-2 px-4 rounded-lg border border-white/10"
                >
                   <option value="">Tüm İzin Türleri</option>
                  {leaveTypes.map(type => (
                    <option key={type.value} value={type.value}>{type.label}</option>
                  ))}
                </select>
                <select
                  value={selectedRegion}
                  onChange={(e) => setSelectedRegion(e.target.value)}
                  className="w-full sm:w-auto bg-black/20 py-2 px-4 rounded-lg border border-white/10"
                >
                   <option value="">Tüm Bölgeler</option>
                  {regions.map(region => (
                    <option key={region.id} value={region.id}>{region.name}</option>
                  ))}
                </select>
                {(selectedRegion || searchQuery || selectedLeaveType) && (
                  <button onClick={clearFilters} className="flex items-center gap-2 text-sm text-gray-400 hover:text-white">
                    <X size={16}/> Temizle
                  </button>
                )}
              </div>
            </div>
          </GlassCard>

          {loading ? (
            <div className="text-center py-10">Yükleniyor...</div>
          ) : (
            <GlassCard
              tintValue={tintValue}
              blurPx={blurPx}
              borderRadiusPx={borderRadiusPx}
              grainOpacity={grainOpacity}
              className="!p-0 overflow-hidden" 
            >
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="border-b border-white/10 text-sm text-gray-400">
                    <tr>
                       <th className="p-4">Personel</th>
                      <th className="p-4 hidden md:table-cell">Başlangıç Tarihi</th>
                      <th className="p-4 hidden md:table-cell">Bitiş Tarihi</th>
                      <th className="p-4">Durum</th>
                       <th className="p-4 text-right">İşlemler</th>
                    </tr>
                  </thead>
                  <tbody>
                    {requests.length > 0 ? (
                      requests.map((request) => (
                        <tr key={request.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                          <td className="p-4 font-semibold">
                             {request.personnel_full_name || 'Bilinmeyen Personel'}
                          </td>
                          {/* GÜNCELLEME: Tarih gösterimleri safeNewDate ile güvenli hale getirildi. */}
                          <td className="p-4 hidden md:table-cell">{safeNewDate(request.start_date).toLocaleDateString('tr-TR')}</td>
                          <td className="p-4 hidden md:table-cell">{safeNewDate(request.end_date).toLocaleDateString('tr-TR')}</td>
                           <td className="p-4">
                            <span className={`px-2 py-1 text-xs font-semibold rounded-full border ${statusColors[request.status]}`}>
                              {statusTranslations[request.status]}
                             </span>
                          </td>
                          <td className="p-4 text-right">
                            <button 
                              onClick={() => setSelectedRequest(request)} 
                              className="p-2 rounded-full hover:bg-white/10"
                            >
                               <MoreHorizontal size={20} />
                            </button>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={5} className="text-center p-8 text-gray-400">
                           Filtrelerle eşleşen izin talebi bulunamadı.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
              <Pagination
                currentPage={currentPage}
                totalCount={totalRequests}
                pageSize={PAGE_SIZE}
                onPageChange={(page) => setCurrentPage(page)}
              />
            </GlassCard>
          )}
        </div>
      </div>
      
      {selectedRequest && (
        <RequestDetailsModal 
          request={selectedRequest} 
          onClose={handleModalClose} 
        />
      )}
    </>
  );
}