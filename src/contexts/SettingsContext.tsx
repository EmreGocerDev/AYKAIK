"use client";

import { createContext, useState, useEffect, useContext, ReactNode } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { SupabaseClient, User } from '@supabase/supabase-js';
import toast from 'react-hot-toast';
import { updateUserDashboardLayout, type DashboardLayoutSettings } from '@/app/actions';
import type { Layout } from 'react-grid-layout';

const supabase = createClient();

type Profile = {
  full_name: string;
  role: string;
  region_id: number | null;
};
type WeekendConfiguration = 'sunday_only' | 'saturday_sunday';

type UserSettings = {
    user_id: string;
    background_url: string | null;
    glass_opacity: number | null;
    grain_opacity: number | null;
    glass_blur_px: number | null;
    glass_border_radius_px: number | null;
    dashboard_layout: DashboardLayoutSettings | null;
    notification_sound_url: string | null;
};

export type WidgetDefinition = {
    id: string;
    name: string;
    description: string;
};
export const ALL_WIDGETS: WidgetDefinition[] = [
  { id: 'welcome', name: 'Karşılama Paneli', description: 'Günün saatine göre selamlama ve anlık saati gösterir.'},
  { id: 'quickActions', name: 'Hızlı İşlemler', description: 'Sık kullanılan görevlere hızlı erişim butonları sağlar.'},
  { id: 'awaitingApproval', name: 'Onay Bekleyenler', description: 'Rolünüze göre işlem yapmanız gereken talepleri gösterir.'},
  { id: 'rejectedLeaves', name: 'Reddedilen Talepler', description: 'Son 60 gün içinde reddedilmiş izin taleplerini listeler.'},
  { id: 'recentRequests', name: 'Son Talepler', description: 'Onay bekleyen veya yakın zamanda işlem görmüş son 5 izin talebini gösterir.' },
  { id: 'upcomingLeaves', name: 'Yaklaşan İzinler', description: 'Gelecek 7 gün içinde başlayacak olan onaylanmış izinleri listeler.' },
  { id: 'leaveTypeDistribution', name: 'İzin Türü Dağılımı', description: 'Talep edilen izinlerin türlerine göre dağılımını bir grafikle gösterir.' },
  { id: 'monthlyLeaveRate', name: 'Aylık İzin Oranı', description: 'Bu ay izin kullanan personellerin toplam personele oranını gösterir.' },
  { id: 'leaveStatusDistribution', name: 'İzin Durumları Dağılımı', description: 'Bekleyen ve nihai onay bekleyen talep sayılarını karşılaştırır.' },
];
export const DEFAULT_DASHBOARD_SETTINGS: DashboardLayoutSettings = {
  layouts: {
    lg: [
      { i: 'welcome', x: 0, y: 0, w: 12, h: 3, minW: 6, minH: 3 },
      { i: 'quickActions', x: 0, y: 3, w: 12, h: 2, minW: 6, minH: 2, maxH: 2 },
      { i: 'pending', x: 0, y: 5, w: 4, h: 2, maxH: 2 },
      { i: 'approvedThisMonth', x: 4, y: 5, w: 4, h: 2, maxH: 2 },
      { i: 'onLeaveToday', x: 8, y: 5, w: 4, h: 2, maxH: 2 },
      { i: 'awaitingFinal', x: 0, y: 7, w: 4, h: 2, maxH: 2 },
      { i: 'totalPersonnel', x: 4, y: 7, w: 4, h: 2, maxH: 2 },
      { i: 'totalRegions', x: 8, y: 7, w: 4, h: 2, maxH: 2 },
      { i: 'awaitingApproval', x: 0, y: 9, w: 6, h: 5, minW: 4, minH: 5, maxH: 5 },
      { i: 'rejectedLeaves', x: 6, y: 9, w: 6, h: 5, minW: 4, minH: 5, maxH: 5 },
      { i: 'recentRequests', x: 0, y: 14, w: 4, h: 5, minW: 3, minH: 4, maxH: 5 },
      { i: 'upcomingLeaves', x: 4, y: 14, w: 4, h: 5, minW: 3, minH: 4, maxH: 5 },
      { i: 'leaveTypeDistribution', x: 8, y: 14, w: 4, h: 5, minW: 3, minH: 4, maxH: 5 },
      { i: 'monthlyLeaveRate', x: 0, y: 19, w: 6, h: 5, minW: 4, minH: 5, maxH: 5 },
      { i: 'leaveStatusDistribution', x: 6, y: 19, w: 6, h: 5, minW: 4, minH: 5, maxH: 5 },
    ],
  },
  visible: {
    pending: true, approvedThisMonth: true, onLeaveToday: true,
    awaitingFinal: true, totalPersonnel: true, totalRegions: true,
    awaitingApproval: true, rejectedLeaves: true,
    recentRequests: true, upcomingLeaves: true, leaveTypeDistribution: true,
    monthlyLeaveRate: true, leaveStatusDistribution: true,
    welcome: true, quickActions: true,
  }
};
type SettingsContextType = {
  supabase: SupabaseClient;
  user: User | null;
  profile: Profile | null;
  notificationCount: number;
  setNotificationCount: (count: number) => void;
  weekendConfiguration: WeekendConfiguration;
  bg: string;
  setBg: (bg: string) => void;
  tintValue: number;
  setTintValue: (value: number) => void;
  grainOpacity: number;
  setGrainOpacity: (opacity: number) => void;
  blurPx: number;
  setBlurPx: (px: number) => void;
  borderRadiusPx: number;
  setBorderRadiusPx: (px: number) => void;
  dashboardLayout: DashboardLayoutSettings;
  setDashboardLayout: (layout: DashboardLayoutSettings) => void;
  notificationSoundUrl: string;
  setNotificationSoundUrl: (url: string) => void;
};

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [notificationCount, setNotificationCount] = useState(0);
  const [bg, setBg] = useState("/backgrounds/bg1.jpg");
  const [tintValue, setTintValue] = useState(15);
  const [grainOpacity, setGrainOpacity] = useState(20);
  const [blurPx, setBlurPx] = useState(16);
  const [borderRadiusPx, setBorderRadiusPx] = useState(16);
  const [weekendConfiguration, setWeekendConfiguration] = useState<WeekendConfiguration>('saturday_sunday');
  const [dashboardLayout, setDashboardLayoutState] = useState<DashboardLayoutSettings>(DEFAULT_DASHBOARD_SETTINGS);
  const [notificationSoundUrl, setNotificationSoundUrl] = useState('/sounds/notification1.mp3');
  const [audioContext, setAudioContext] = useState<AudioContext | null>(null);
  
  useEffect(() => {
    if (typeof window !== 'undefined' && !audioContext) {
        setAudioContext(new window.AudioContext());
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const unlockAudio = () => {
        if (audioContext && audioContext.state === 'suspended') {
            audioContext.resume().then(() => {
                console.log('Ses çalma izni kullanıcı etkileşimi ile aktive edildi!');
            });
            document.removeEventListener('click', unlockAudio);
            document.removeEventListener('keydown', unlockAudio);
        }
    };
    document.addEventListener('click', unlockAudio);
    document.addEventListener('keydown', unlockAudio);
    return () => {
        document.removeEventListener('click', unlockAudio);
        document.removeEventListener('keydown', unlockAudio);
    };
  }, [audioContext]);

  useEffect(() => {
    const fetchInitialData = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUser(user);
        const [profileRes, settingsRes, weekendRes] = await Promise.all([
          supabase.from("profiles").select('*').eq('id', user.id).single(),
          supabase.from("user_settings").select("*").eq("user_id", user.id).single(),
          supabase.from("system_settings").select("value").eq("key", "weekend_configuration").single()
        ]);
        if (profileRes.data) {
            setProfile(profileRes.data);
            const { data: count, error } = await supabase.rpc('get_notification_count', {
                user_role: profileRes.data.role,
                user_region_id: profileRes.data.region_id
            });
            if (!error) { setNotificationCount(count); }
        }
        if (weekendRes.data) setWeekendConfiguration(weekendRes.data.value as WeekendConfiguration);
        if (settingsRes.data) {
          const userSettings = settingsRes.data as UserSettings;
          setBg(userSettings.background_url || "/backgrounds/bg1.jpg");
          setTintValue(userSettings.glass_opacity === null ? 15 : userSettings.glass_opacity);
          setGrainOpacity(userSettings.grain_opacity === null ? 20 : userSettings.grain_opacity);
          setBlurPx(userSettings.glass_blur_px === null ? 16 : userSettings.glass_blur_px);
          setBorderRadiusPx(userSettings.glass_border_radius_px === null ? 16 : userSettings.glass_border_radius_px);
          setNotificationSoundUrl(userSettings.notification_sound_url || '/sounds/notification1.mp3');
          if (userSettings.dashboard_layout && typeof userSettings.dashboard_layout === 'object') {
            const savedSettings = userSettings.dashboard_layout as Partial<DashboardLayoutSettings>;
            const defaultLayoutMap = new Map((DEFAULT_DASHBOARD_SETTINGS.layouts.lg || []).map(item => [item.i, item]));
            const savedLayouts = savedSettings.layouts?.lg || [];
            const mergedLayouts = savedLayouts.map(savedItem => {
                const defaultItem = defaultLayoutMap.get(savedItem.i);
                return { ...defaultItem, ...savedItem };
            });
            defaultLayoutMap.forEach((defaultItem, key) => {
                if (!mergedLayouts.some(item => item.i === key)) {
                    mergedLayouts.push(defaultItem);
                }
            });
            const validatedSettings: DashboardLayoutSettings = {
              layouts: { ...DEFAULT_DASHBOARD_SETTINGS.layouts, ...savedSettings.layouts, lg: mergedLayouts as Layout[] },
              visible: { ...DEFAULT_DASHBOARD_SETTINGS.visible, ...savedSettings.visible },
            };
            setDashboardLayoutState(validatedSettings);
          }
        }
      }
    };
    fetchInitialData();
  }, []);

  useEffect(() => {
    if (user) {
      const profileChannel = supabase.channel('realtime-profile-update').on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'profiles', filter: `id=eq.${user.id}`}, (payload) => {
        console.log('Kullanıcı profili sunucudan güncellendi:', payload.new);
        toast.success('Yetkileriniz bir yönetici tarafından güncellendi. Sayfa yenileniyor...', { duration: 5000, id: 'profile-update-toast' });
        setTimeout(() => { window.location.reload(); }, 3000);
      }).subscribe();
      return () => { supabase.removeChannel(profileChannel); };
    }
  }, [user]);
  
  const setDashboardLayout = (newLayout: DashboardLayoutSettings) => {
    setDashboardLayoutState(newLayout);
    updateUserDashboardLayout(newLayout);
  };
  
  useEffect(() => {
    if (typeof window === 'undefined' || !user || !profile) { return; }
    if (Notification.permission !== 'granted' && Notification.permission !== 'denied') {
      Notification.requestPermission().then(permission => {
        if (permission === 'granted') { toast.success('Bildirimlere izin verildi!'); }
      });
    }
    
    const showNotification = (title: string, options: NotificationOptions) => {
      if (Notification.permission === 'granted') {
        if (notificationSoundUrl !== 'none' && audioContext && audioContext.state === 'running') {
          const notificationSound = new Audio(notificationSoundUrl);
          notificationSound.play().catch(error => {
            console.error("Özel bildirim sesi çalınamadı (tarayıcı etkileşim izni bekliyor olabilir):", error);
          });
          new Notification(title, { ...options, silent: true });
        } else {
          new Notification(title, { ...options, silent: notificationSoundUrl === 'none' });
        }
      }
    };
    
    const channel = supabase.channel('leave-request-notifications').on('postgres_changes', { event: '*', schema: 'public', table: 'leave_requests' }, async (payload) => {
      
      const { data: count, error } = await supabase.rpc('get_notification_count', { user_role: profile.role, user_region_id: profile.region_id });
      if (!error) { setNotificationCount(count); }
      if (payload.eventType === 'INSERT' && profile.role === 'coordinator') {
        const newRequest = payload.new as { personnel_id: number };
        const { data: personnel } = await supabase.from('personnel').select('region_id, full_name').eq('id', newRequest.personnel_id).single();
        if (personnel && personnel.region_id === profile.region_id) {
          showNotification('Yeni İzin Talebi', { body: `${personnel.full_name} yeni bir izin talebinde bulundu.`, icon: '/favicon.ico' });
        }
      }
      if (payload.eventType === 'UPDATE' && profile.role === 'admin') {
        const updatedRequest = payload.new as { status: string, personnel_id: number };
        const oldRequest = payload.old as { status: string };
        const isApprovedByCoordinator = updatedRequest.status === 'approved_by_coordinator';
        if (isApprovedByCoordinator && updatedRequest.status !== oldRequest.status) {
           const { data: personnel } = await supabase.from('personnel').select('full_name').eq('id', updatedRequest.personnel_id).single();
           const statusText = isApprovedByCoordinator ? 'onaylandı' : 'reddedildi';
          showNotification(`Koordinatör İşlemi`, { body: `${personnel?.full_name || 'Bir personelin'} izin talebi koordinatör tarafından ${statusText}.`, icon: '/favicon.ico' });
        }
      }
    }).subscribe();
      
    return () => { supabase.removeChannel(channel); };
  }, [user, profile, notificationSoundUrl, audioContext]);

  const value = {
    supabase,
    user,
    profile,
    notificationCount,
    setNotificationCount,
    weekendConfiguration,
    bg, setBg,
    tintValue, setTintValue,
    grainOpacity, setGrainOpacity,
    blurPx, setBlurPx,
    borderRadiusPx, setBorderRadiusPx,
    dashboardLayout,
    setDashboardLayout,
    notificationSoundUrl,
    setNotificationSoundUrl,
  };
  
  return (
    <SettingsContext.Provider value={value}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const context = useContext(SettingsContext);
  if (context === undefined) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
}