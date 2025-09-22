// YOL: src/app/dashboard/aykasosyal/avanslarim/page.tsx

"use client";

import { useState, useEffect } from "react";
import { getMyAdvanceRequests } from "@/app/aykasosyal/actions";
import { useSettings } from "@/contexts/SettingsContext";
import GlassCard from "@/components/GlassCard";
import { Wallet, ChevronDown, ChevronUp } from "lucide-react";
import { safeNewDate } from "@/lib/utils";
import type { CashAdvanceRequest } from "@/types/index";

type AdvanceStatus = CashAdvanceRequest['status'];
const statusColors: { [key in AdvanceStatus]: string } = {
  pending: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30',
  approved_by_coordinator: 'bg-sky-500/20 text-sky-300 border-sky-500/30',
  rejected_by_coordinator: 'bg-orange-500/20 text-orange-300 border-orange-500/30',
  approved: 'bg-green-500/20 text-green-300 border-green-500/30',
  rejected: 'bg-red-500/20 text-red-300 border-red-500/30',
};

const statusTranslations: { [key in AdvanceStatus]: string } = {
  pending: 'Beklemede',
  approved_by_coordinator: 'Koordinatör Onayladı',
  rejected_by_coordinator: 'Koordinatör Reddetti',
  approved: 'Onaylandı',
  rejected: 'Reddedildi',
};

export default function MyAdvanceRequestsPage() {
  const { tintValue, blurPx, borderRadiusPx, grainOpacity } = useSettings();
  const [requests, setRequests] = useState<CashAdvanceRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<number | null>(null);

  useEffect(() => {
    const fetchRequests = async () => {
      const data = await getMyAdvanceRequests();
      setRequests(data as CashAdvanceRequest[]);
      setLoading(false);
    };
    fetchRequests();
  }, []);

  return (
    <div className="p-4 md:p-8 text-white">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-6 flex items-center gap-3">
          <Wallet /> Avans Taleplerim
        </h1>
        <GlassCard {...{ tintValue, blurPx, borderRadiusPx, grainOpacity }}>
          {loading ? (
               // DÜZELTME: Hata veren tırnak işaretleri kaldırıldı.
               <div className="text-center p-8">Avans talepleriniz yükleniyor...</div>
           ) : requests.length > 0 ? (
            <div className="space-y-4">
              {requests.map(req => (
                <div key={req.id} className="bg-white/5 rounded-lg">
                  <button 
                    onClick={() => setExpandedId(expandedId === req.id ? null : req.id)}
                    className="w-full text-left p-4 flex justify-between items-center"
                  >
                    <div>
                         <p className="font-semibold">{req.amount.toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' })}</p>
                         <p className="text-sm text-gray-300">
                            Talep Tarihi: {safeNewDate(req.created_at).toLocaleDateString('tr-TR')}
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
                                    <p className="text-xs text-gray-500 mt-1">{safeNewDate(log.timestamp).toLocaleString('tr-TR')}</p>
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
              Henüz oluşturulmuş bir avans talebiniz bulunmuyor.
            </div>
          )}
        </GlassCard>
      </div>
    </div>
  );
}