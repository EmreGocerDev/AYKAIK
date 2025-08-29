"use client";

import { createContext, useState, useEffect, useContext, ReactNode } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { SupabaseClient, User } from '@supabase/supabase-js';

const supabase = createClient();

type Profile = {
  full_name: string;
  role: string;
  region_id: number | null;
};

// YENİ: Hafta sonu ayarı için tip
type WeekendConfiguration = 'sunday_only' | 'saturday_sunday';

type SettingsContextType = {
  supabase: SupabaseClient;
  user: User | null;
  profile: Profile | null;
  weekendConfiguration: WeekendConfiguration; // YENİ
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
};

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [bg, setBg] = useState("/backgrounds/bg1.jpg");
  const [tintValue, setTintValue] = useState(15);  
  const [grainOpacity, setGrainOpacity] = useState(20);
  const [blurPx, setBlurPx] = useState(16);
  const [borderRadiusPx, setBorderRadiusPx] = useState(16);
  // YENİ: Hafta sonu ayarı için state
  const [weekendConfiguration, setWeekendConfiguration] = useState<WeekendConfiguration>('saturday_sunday');

  useEffect(() => {
    const fetchInitialData = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUser(user);

        // Kullanıcı profili ve ayarlarını paralel olarak çek
        const [profileRes, settingsRes, weekendRes] = await Promise.all([
          supabase.from("profiles").select('*').eq('id', user.id).single(),
          supabase.from("user_settings").select("*").eq("user_id", user.id).single(),
          supabase.from("system_settings").select("value").eq("key", "weekend_configuration").single()
        ]);

        if (profileRes.data) setProfile(profileRes.data);
        if (weekendRes.data) setWeekendConfiguration(weekendRes.data.value as WeekendConfiguration);
        
        if (settingsRes.data) {
          const userSettings = settingsRes.data;
          setBg(userSettings.background_url || "/backgrounds/bg1.jpg");
          setTintValue(userSettings.glass_opacity === null ? 15 : userSettings.glass_opacity);
          setGrainOpacity(userSettings.grain_opacity === null ? 20 : userSettings.grain_opacity);
          setBlurPx(userSettings.glass_blur_px === null ? 16 : userSettings.glass_blur_px);
          setBorderRadiusPx(userSettings.glass_border_radius_px === null ? 16 : userSettings.glass_border_radius_px);
        }
      }
    };
    fetchInitialData();
  }, []);

  const value = {
    supabase,
    user,
    profile,
    weekendConfiguration, // YENİ
    bg, setBg,
    tintValue, setTintValue,
    grainOpacity, setGrainOpacity,
    blurPx, setBlurPx,
    borderRadiusPx, setBorderRadiusPx
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
