"use client";

import { useEffect, useState, useCallback } from 'react';
import { useSettings } from '@/contexts/SettingsContext';
import GlassCard from '@/components/GlassCard';
import RequestDetailsModal from '@/components/RequestDetailsModal';
import { Bell, Check, ThumbsDown, Hourglass } from 'lucide-react';
import type { LeaveRequest } from '../requests/page';

type Notification = Omit<LeaveRequest, 'total_count'>;

export default function NotificationsPage() {
  const { supabase, profile, tintValue, blurPx, borderRadiusPx, grainOpacity, setNotificationCount } = useSettings();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState<LeaveRequest | null>(null);

  const statusInfo: { [key: string]: { icon: React.ReactNode, color: string, text: string } } = {
    pending: { icon: <Hourglass size={16} />, color: "text-yellow-400", text: "Onay Bekliyor" },
    approved_by_coordinator: { icon: <Check size={16} />, color: "text-sky-400", text: "Koordinatör Onayladı" },
    rejected_by_coordinator: { icon: <ThumbsDown size={16} />, color: "text-orange-400", text: "Koordinatör Reddetti" },
  };

  const fetchNotifications = useCallback(async () => {
    if (!profile) return;
    // Veri çekilirken tekrar loading state'ini true yapmıyoruz ki arayüzde zıplama olmasın.
    // Sadece ilk yüklemede true olacak.
    // setLoading(true); 
    const { data, error } = await supabase.rpc('get_notifications', {
        user_role: profile.role,
        user_region_id: profile.region_id
    });

    if (error) {
        console.error("Bildirimler çekilirken hata:", error);
    } else {
        setNotifications(data as Notification[]);
    }
    setLoading(false); // Sadece ilk yükleme ve manuel refresh sonrası için.
  }, [supabase, profile]);

  // İlk veri çekme işlemi
  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);
  
  // YENİ: Supabase Realtime ile anlık güncelleme
  useEffect(() => {
    if (!profile) return;

    const channel = supabase
      .channel('realtime-notifications-page')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'leave_requests' },
        (payload) => {
          // Gelen değişikliğin bu kullanıcıyı ilgilendirip ilgilendirmediğini kontrol et
          // ve listeyi yeniden çek. Bu, en basit ve en güvenilir yöntemdir.
          console.log('Yeni izin talebi değişikliği algılandı, liste güncelleniyor.', payload);
          fetchNotifications();
        }
      )
      .subscribe();

    // Component DOM'dan kaldırıldığında channel aboneliğini bitir
    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase, profile, fetchNotifications]);

  const handleModalClose = () => {
    setSelectedRequest(null);
    fetchNotifications(); // Liste anlık güncellensin
    // Sayacı da anlık güncelleyelim
    if(profile) {
        supabase.rpc('get_notification_count', {
            user_role: profile.role,
            user_region_id: profile.region_id
        }).then(({ data }) => setNotificationCount(data));
    }
  };

  const pageTitle = profile?.role === 'admin' ? "İşlem Bekleyen Talepler" : "Bölgenizdeki Onay Bekleyen Talepler";

  return (
    <>
      <div className="p-4 md:p-8 text-white">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-3 mb-6">
            <Bell className="w-8 h-8"/>
            <h1 className="text-3xl font-bold">{pageTitle}</h1>
          </div>
          
          <GlassCard {...{ tintValue, blurPx, borderRadiusPx, grainOpacity }}>
            {loading ? (
              <div className="text-center p-8">Bildirimler yükleniyor...</div>
            ) : notifications.length > 0 ? (
              <div className="space-y-4">
                {notifications.map(req => (
                  <button 
                    key={req.id} 
                    onClick={() => setSelectedRequest(req as LeaveRequest)}
                    className="w-full text-left p-4 bg-white/5 rounded-lg flex flex-col sm:flex-row justify-between sm:items-center gap-2 hover:bg-white/10 transition-colors"
                  >
                    <div className="flex-1">
                        <p className="font-bold text-lg">{req.personnel_full_name}</p>
                        <p className="text-sm text-gray-300 capitalize">{req.leave_type}</p>
                    </div>
                    <div className="flex-1 text-left sm:text-center">
                        <p className="text-sm text-gray-400">İzin Tarihleri</p>
                        <p className="font-semibold">{new Date(req.start_date).toLocaleDateString('tr-TR')} - {new Date(req.end_date).toLocaleDateString('tr-TR')}</p>
                    </div>
                    <div className={`flex items-center gap-2 font-semibold ${statusInfo[req.status]?.color || 'text-gray-400'}`}>
                        {statusInfo[req.status]?.icon}
                        <span>{statusInfo[req.status]?.text || req.status}</span>
                    </div>
                  </button>
                ))}
              </div>
            ) : (
              <div className="text-center p-8 text-gray-400">Gösterilecek bildirim bulunmuyor.</div>
            )}
          </GlassCard>
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