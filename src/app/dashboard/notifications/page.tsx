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
    
    const { data, error } = await supabase.rpc('get_notifications', {
        user_role: profile.role,
        user_region_id: profile.region_id
    });

    if (error) {
        console.error("Bildirimler çekilirken hata:", error);
    } else {
       setNotifications(data as Notification[]);
    }
    // Only set loading to false after the first fetch attempt.
    if(loading) setLoading(false);
  }, [supabase, profile, loading]);

  // Combined effect for fetching initial data and setting up realtime subscription.
  // This ensures that whenever the user's profile changes, both the initial data
  // is re-fetched and the realtime subscription is updated correctly.
  useEffect(() => {
    if (!profile) {
      setLoading(false); // Ensure loading state is turned off if no profile is found.
      return;
    }

    // Fetch initial notifications for the current user profile.
    fetchNotifications();

    // Set up a realtime subscription to re-fetch when the underlying data changes.
    const channel = supabase
      .channel('realtime-notifications-page')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'leave_requests' },
        (payload) => {
          // A change occurred in leave requests, re-fetch the notifications
          // to ensure the list is always up-to-date. The `get_notifications` RPC
          // will handle the logic of what is relevant to the current user.
          console.log('İzin taleplerinde değişiklik algılandı, liste güncelleniyor.', payload);
          fetchNotifications();
        }
      )
      .subscribe();

    // Clean up the subscription when the component unmounts or the profile changes.
    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase, profile, fetchNotifications]);


  const handleModalClose = () => {
    setSelectedRequest(null);
    fetchNotifications();
    // Update the global counter immediately after an action.
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