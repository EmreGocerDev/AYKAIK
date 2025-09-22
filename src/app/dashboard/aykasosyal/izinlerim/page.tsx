// YOL: src/app/dashboard/aykasosyal/izinlerim/page.tsx

"use client";

import { useState, useEffect } from "react";
import { getMyLeaveRequests } from "@/app/aykasosyal/actions";
import { useSettings } from "@/contexts/SettingsContext";
import GlassCard from "@/components/GlassCard";
import { Briefcase, ChevronDown, ChevronUp } from "lucide-react";
import { safeNewDate } from "@/lib/utils";
import type { LeaveRequest, LeaveRequestStatus } from "@/app/dashboard/requests/page";

// Bu objeleri /dashboard/requests/page.tsx'den alabilir veya burada yeniden tanımlayabilirsiniz
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

export default function MyLeaveRequestsPage() {
  const { tintValue, blurPx, borderRadiusPx, grainOpacity } = useSettings();
  const [requests, setRequests] = useState<LeaveRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<number | null>(null);

  useEffect(() => {
    const fetchRequests = async () => {
      const data = await getMyLeaveRequests();
      setRequests(data as LeaveRequest[]);
      setLoading(false);
    };
    fetchRequests();
  }, []);

  return (
    <div className="p-4 md:p-8 text-white">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-6 flex items-center gap-3">
          <Briefcase /> İzin Taleplerim
        </h1>
        <GlassCard {...{ tintValue, blurPx, borderRadiusPx, grainOpacity }}>
          {loading ? (
            // DÜZELTME: Hata veren tırnak işaretleri kaldırıldı.
            <div className="text-center p-8">İzin talepleriniz yükleniyor...</div>
           ) : requests.length > 0 ? (
            <div className="space-y-4">
              {requests.map(req => (
                <div key={req.id} className="bg-white/5 rounded-lg">
                  <button 
                    onClick={() => setExpandedId(expandedId === req.id ? null : req.id)}
                    className="w-full text-left p-4 flex justify-between items-center"
                  >
                    <div>
                        <p className="font-semibold capitalize">{req.leave_type}</p>
                         <p className="text-sm text-gray-300">
                            {safeNewDate(req.start_date).toLocaleDateString('tr-TR')} - {safeNewDate(req.end_date).toLocaleDateString('tr-TR')}
                        </p>
                    </div>
                     <div className="flex items-center gap-4">
                        <span className={`px-2 py-1 text-xs font-semibold rounded-full border ${statusColors[req.status]}`}>
                            {statusTranslations[req.status]}
                        </span>
                        {expandedId === req.id ? <ChevronUp/> : <ChevronDown/>}
                    </div>
                  </button>
                  {expandedId === req.id && (
                    <div className="px-4 pb-4 mt-2 border-t border-white/10">
                       <h4 className="font-semibold mt-2 mb-1">İşlem Geçmişi</h4>
                        <div className="space-y-2 text-sm">
                            {req.history_log?.map((log, index) => (
                                <div key={index} className="pl-2 border-l-2 border-gray-600">
                                    <p className="font-semibold text-gray-200">{log.action} <span className="text-xs font-normal text-gray-400">- {log.actor}</span></p>
                                    <p className="text-gray-300 italic">{`"${log.notes}"`}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                   )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center p-8 text-gray-400">
              Henüz oluşturulmuş bir izin talebiniz bulunmuyor.
            </div>
          )}
        </GlassCard>
      </div>
    </div>
  );
}