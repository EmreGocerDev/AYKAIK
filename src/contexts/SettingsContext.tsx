// YOL: src/contexts/SettingsContext.tsx

"use client";

import { createContext, useState, useEffect, useContext, ReactNode, useCallback  } from 'react';
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
// YENİ: Veritabanı user_settings tablosu için tip tanımına yeni alanlar eklendi
type UserSettings = {
    user_id: string;
    background_url: string | null;
    glass_opacity: number | null;
    grain_opacity: number | null;
    glass_blur_px: number | null;
    glass_border_radius_px: number | null;
    dashboard_layout: DashboardLayoutSettings | null;
    notification_sound_url: string | null;
    matrix_density: number | null; // YENİ
    matrix_speed: number | null;   // YENİ
     matrix_color_theme: string | null; 
};
export type WidgetDefinition = {
    id: string;
    name: string;
    description: string;
};
export const ALL_WIDGETS: WidgetDefinition[] = [
  { id: 'welcome', name: 'Karşılama Paneli', description: 'Günün saatine göre selamlama ve anlık saati gösterir.'},
  { id: 'weather', name: 'Hava Durumu', description: 'Bulunduğunuz konuma göre anlık hava durumu bilgisi gösterir.'},
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
      { i: 'welcome', x: 0, y: 0, w: 6, h: 4, minW: 4, minH: 4 },
      { i: 'weather', x: 6, y: 0, w: 3, h: 4, minW: 2, minH: 4 },
      { i: 'quickActions', x: 9, y: 0, w: 3, h: 4, minW: 3, minH: 4 },
      { i: 'pending', x: 0, y: 4, w: 3, h: 2, maxH: 2 },
      { i: 'approvedThisMonth', x: 3, y: 4, w: 3, h: 2, maxH: 2 },
      { i: 'onLeaveToday', x: 6, y: 4, w: 3, h: 2, maxH: 2 },
      { i: 'totalPersonnel', x: 9, y: 4, w: 3, h: 2, maxH: 2 },
      { i: 'awaitingFinal', x: 0, y: 6, w: 3, h: 2, maxH: 2 },
      { i: 'totalRegions', x: 3, y: 6, w: 3, h: 2, maxH: 2 },
      { i: 'awaitingApproval', x: 0, y: 8, w: 6, h: 5, minW: 4, minH: 5, maxH: 5 },
      { i: 'recentRequests', x: 6, y: 8, w: 3, h: 5, minW: 3, minH: 4, maxH: 5 },
      { i: 'upcomingLeaves', x: 9, y: 8, w: 3, h: 5, minW: 3, minH: 4, maxH: 5 },
      { i: 'leaveTypeDistribution', x: 0, y: 13, w: 6, h: 5, minW: 4, minH: 5, maxH: 5 },
      { i: 'leaveStatusDistribution', x: 6, y: 13, w: 6, h: 5, minW: 4, minH: 5, maxH: 5 },
      { i: 'monthlyLeaveRate', x: 0, y: 18, w: 6, h: 5, minW: 4, minH: 5, maxH: 5 },
      { i: 'rejectedLeaves', x: 6, y: 18, w: 6, h: 5, minW: 4, minH: 5, maxH: 5 },
    ],
  },
  visible: {
    pending: true, approvedThisMonth: true, onLeaveToday: true, 
    awaitingFinal: true, totalPersonnel: true, totalRegions: true,
    awaitingApproval: true, rejectedLeaves: true, weather: true, 
    recentRequests: true, upcomingLeaves: true, leaveTypeDistribution: true,
    monthlyLeaveRate: true, leaveStatusDistribution: true,
    welcome: true, quickActions: true,
  }
};
// YENİ: Context tipine yeni ayarlar eklendi
type SettingsContextType = {
  supabase: SupabaseClient;
  user: User | null;
  profile: Profile | null;
  isLoading: boolean;
  notificationCount: number;
  setNotificationCount: (count: number) => void;
  playSound: (url: string) => void;
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
  matrixDensity: number; // YENİ
  setMatrixDensity: (density: number) => void; // YENİ
  matrixSpeed: number; // YENİ
  setMatrixSpeed: (speed: number) => void; // YENİ
  matrixColorTheme: string; // YENİ
  setMatrixColorTheme: (theme: string) => void; // YENİ
};

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
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
  
  
  // YENİ: Matrix ayarları için state'ler
  const [matrixDensity, setMatrixDensity] = useState(50);
  const [matrixSpeed, setMatrixSpeed] = useState(4);

  
  const [matrixColorTheme, setMatrixColorTheme] = useState('matrix-green');

  
  const playSound = useCallback((url: string) => {
      if (typeof window === 'undefined' || !audioContext || audioContext.state === 'suspended' || url === 'none') {
          return;
      }
      try {
          const audio = new Audio(url);
          audio.play().catch(e => console.error("Ses çalma hatası:", e));
      } catch (e) {
          console.error("Audio nesnesi oluşturma hatası:", e);
      }
  }, [audioContext]);
  useEffect(() => {
    if (typeof window !== 'undefined' && !audioContext) {
        setAudioContext(new window.AudioContext());
    }
  }, [audioContext]);
  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          setUser(user);
          const [profileRes, settingsRes, weekendRes] = await Promise.all([
            supabase.from("profiles").select('*').eq('id', user.id).single(),
            supabase.from("user_settings").select("*").eq("user_id", user.id).single(),
            supabase.from("system_settings").select("value").eq("key", "weekend_configuration").single()
          ]);
    
          if (profileRes.data) {
              setProfile(profileRes.data as Profile);
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
            
            // YENİ: Kayıtlı matrix ayarlarını yükle
            setMatrixDensity(userSettings.matrix_density ?? 50);
            setMatrixSpeed(userSettings.matrix_speed ?? 4);
             setMatrixColorTheme(userSettings.matrix_color_theme ?? 'matrix-green');


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
        } else {
          setProfile(null);
          setUser(null);
          setBg("/backgrounds/bg8.jpg"); 
          setTintValue(-5);
          setBlurPx(16);
          setGrainOpacity(0);
          setBorderRadiusPx(16);
        }
      } catch (error) {
        console.error("Başlangıç verileri çekilirken hata:", error);
      } finally {
        setIsLoading(false); 
      }
    };
    fetchInitialData();
  }, [audioContext]);
  
  const setDashboardLayout = (newLayout: DashboardLayoutSettings) => {
    setDashboardLayoutState(newLayout);
    if (user) { 
        updateUserDashboardLayout(newLayout);
    }
  };

  const value = {
    supabase,
    user,
    profile,
    isLoading,
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
    playSound, 
    setNotificationSoundUrl,
    matrixDensity, // YENİ
    setMatrixDensity, // YENİ
    matrixSpeed, // YENİ
    setMatrixSpeed, // YENİ
    matrixColorTheme, // YENİ
    setMatrixColorTheme, // YENİ
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