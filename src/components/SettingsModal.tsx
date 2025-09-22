"use client";

import GlassCard from "./GlassCard";
import toast from 'react-hot-toast';
import { createClient } from "@/lib/supabase/client";
import Image from "next/image";
import { useSettings, ALL_WIDGETS, type WidgetDefinition } from "@/contexts/SettingsContext";
import { useState } from "react";
import { PlayCircle } from "lucide-react";

const supabase = createClient();
const backgroundImages = Array.from({ length: 15 }, (_, i) => `/backgrounds/bg${i + 1}.jpg`);
const matrixThemes = [
  { id: 'matrix-green', name: 'Yeşil', color: '#22c55e' },
  { id: 'matrix-purple', name: 'Mor', color: '#a855f7' },
  { id: 'matrix-blue', name: 'Mavi', color: '#3b82f6' },
  { id: 'matrix-red', name: 'Kırmızı', color: '#ef4444' },
  { id: 'matrix-yellow', name: 'Sarı', color: '#eab308' },
];
type SettingsModalProps = {
  onClose: () => void;
};
const availableSounds = [
    { name: 'Sessiz', url: 'none' },
    { name: 'Bildirim Sesi 1 (Varsayılan)', url: '/sounds/notification1.mp3' },
    { name: 'Bildirim Sesi 2', url: '/sounds/notification2.mp3' },
    { name: 'Bildirim Sesi 3', url: '/sounds/notification3.mp3' },
];

export default function SettingsModal({ onClose }: SettingsModalProps) {
  const { 
    bg, setBg, 
    tintValue, setTintValue, 
    grainOpacity, setGrainOpacity,
    blurPx, setBlurPx,
    borderRadiusPx, setBorderRadiusPx,
    dashboardLayout, setDashboardLayout,
    notificationSoundUrl, setNotificationSoundUrl,
    matrixDensity, setMatrixDensity, // BU SATIRI EKLEYİN
    matrixSpeed, setMatrixSpeed  ,    // BU SATIRI EKLEYİN
     matrixColorTheme, setMatrixColorTheme 
  } = useSettings();



  const [localLayout, setLocalLayout] = useState(dashboardLayout);
const playSound = (url: string) => {
    if (url !== 'none') {
        const audio = new Audio(url);
        audio.play();
    }
  };
  const handleVisibilityChange = (id: string, isVisible: boolean) => {
    setLocalLayout(prev => ({
      ...prev,
      visible: {
        ...prev.visible,
        [id]: isVisible,
      }
    }));
    
  };
  
  const handleSave = async () => {
    const toastId = toast.loading('Ayarlar kaydediliyor...');
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      toast.error("Ayarları kaydetmek için giriş yapmalısınız.", { id: toastId });
      return;
    }

    setDashboardLayout(localLayout);

    const { error } = await supabase
      .from("user_settings")
      .upsert({
          user_id: user.id,
          background_url: bg,
          glass_opacity: tintValue,
          grain_opacity: grainOpacity,
          glass_blur_px: blurPx,
          glass_border_radius_px: borderRadiusPx,
          notification_sound_url: notificationSoundUrl,
          matrix_density: matrixDensity, 
          matrix_speed: matrixSpeed,    
           matrix_color_theme: matrixColorTheme,  
        },{ onConflict: 'user_id' });

        
    if (error) { toast.error("Hata: " + error.message, { id: toastId }); } 
    else { toast.success("Ayarlar başarıyla kaydedildi!", { id: toastId }); onClose(); }
  };
  
  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800/80 backdrop-blur-xl border border-white/20 p-6 rounded-2xl w-full max-w-2xl text-white max-h-[90vh] overflow-y-auto">
        <h2 className="text-2xl font-bold mb-4">Arayüz Ayarları</h2>
        
        <div className="mb-6">
          <h3 className="font-semibold mb-2">Arkaplan Seçimi</h3>
          <div className="grid grid-cols-4 sm:grid-cols-6 gap-2 max-h-48 overflow-y-auto p-1">
             {backgroundImages.map((img) => (
              <Image
                key={img}
                src={img}
                alt={`Arkaplan ${img}`}
                width={128}
                height={72}
                onClick={() => setBg(img)}
                className={`w-full h-16 object-cover rounded-md cursor-pointer transition-all ${bg === img ? 'ring-2 ring-blue-500 scale-105' : 'opacity-70 hover:opacity-100'}`}
              />
            ))}
            {matrixThemes.map((theme) => (
                  <div
                    key={theme.id}
                    onClick={() => {
                      setBg('matrix');
                      setMatrixColorTheme(theme.id);
                    }}
                    title={`Matrix Efekti (${theme.name})`}
                    style={{ '--theme-color': theme.color } as React.CSSProperties}
                    className={`w-full h-16 rounded-md cursor-pointer transition-all flex items-center justify-center bg-black text-[var(--theme-color)] font-mono text-xs p-1 border border-transparent hover:border-[var(--theme-color)] ${bg === 'matrix' && matrixColorTheme === theme.id ? 'ring-2 ring-blue-500 scale-105' : 'opacity-70 hover:opacity-100'}`}
                  >
                    MATRIX
                  </div>
                ))}
          </div>
           {/* YENİ EKLENECEK BLOK BAŞLANGICI */}
            {bg.startsWith('matrix') && (
              <div className="my-6 p-4 rounded-lg bg-black/20 border border-white/10 space-y-4 animate-in fade-in">
                <h3 className="font-semibold text-center text-lg text-green-400">Matrix Ayarları</h3>
                <div>
                    <label htmlFor="matrixDensity" className="font-semibold mb-2 block">Yazı Yoğunluğu (Az ← → Çok): {matrixDensity}%</label>
                    <input id="matrixDensity" type="range" min="80" max="100" step="5" value={matrixDensity} onChange={(e) => setMatrixDensity(Number(e.target.value))} className="w-full h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer" />
                </div>
                <div>
                    <label htmlFor="matrixSpeed" className="font-semibold mb-2 block">Animasyon Hızı (Yavaş ← → Hızlı): {matrixSpeed}</label>
                    <input id="matrixSpeed" type="range" min="0.5" max="5" step="0.1" value={matrixSpeed} onChange={(e) => setMatrixSpeed(Number(e.target.value))} className="w-full h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer" />
                </div>
              </div>
            )}
            {/* YENİ EKLENECEK BLOK SONU */}
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
            <div>
                 <label htmlFor="tintValue" className="font-semibold mb-2 block">Kart Rengi (Siyah ← 0 → Beyaz): {tintValue}</label>
                 <input id="tintValue" type="range" min="-50" max="50" step="5" value={tintValue} onChange={(e) => setTintValue(Number(e.target.value))} className="w-full h-2 bg-gradient-to-r from-gray-800 via-gray-500 to-gray-200 rounded-lg appearance-none cursor-pointer" />
            </div>
            <div>
                <label htmlFor="grain" className="font-semibold mb-2 block">Gren Efekti Yoğunluğu: {grainOpacity}</label>
                <input id="grain" type="range" min="0" max="50" step="5" value={grainOpacity} onChange={(e) => setGrainOpacity(Number(e.target.value))} className="w-full h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer" />
            </div>
            <div>
                <label htmlFor="blur" className="font-semibold mb-2 block">Bulanıklık: {blurPx}px</label>
                 <input id="blur" type="range" min="0" max="40" step="1" value={blurPx} onChange={(e) => setBlurPx(Number(e.target.value))} className="w-full h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer" />
            </div>
            <div>
                 <label htmlFor="borderRadius" className="font-semibold mb-2 block">Köşe Yumuşaklığı: {borderRadiusPx}px</label>
                <input id="borderRadius" type="range" min="0" max="32" step="1" value={borderRadiusPx} onChange={(e) => setBorderRadiusPx(Number(e.target.value))} className="w-full h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer" />
            </div>
        </div>

        <div className="mt-6 border-t border-white/10 pt-4">
            <h3 className="font-semibold mb-3 text-center">Önizleme</h3>
            <div className="p-8 rounded-lg bg-cover bg-center transition-all duration-300" style={{ backgroundImage: `url(${bg})` }}>
                <GlassCard tintValue={tintValue} grainOpacity={grainOpacity} blurPx={blurPx} borderRadiusPx={borderRadiusPx}>
                    <h4 className="font-bold text-lg text-white">Örnek Kart</h4>
                    <p className="text-sm text-gray-200">Ayarlarınız burada anlık olarak gösterilir.</p>
                </GlassCard>
            </div>
        </div>
        <div className="mt-6 border-t border-white/10 pt-4">
            <h3 className="font-semibold mb-2">Bildirim Sesi</h3>
            <div className="space-y-2">
                {availableSounds.map((sound) => (
                    <label key={sound.url} className="flex items-center justify-between p-3 bg-white/5 rounded-lg cursor-pointer">
                        <div className="flex items-center gap-3">
                            <input
                                type="radio"
                                name="notification-sound"
                                value={sound.url}
                                checked={notificationSoundUrl === sound.url}
                                onChange={(e) => setNotificationSoundUrl(e.target.value)}
                                className="w-5 h-5 text-blue-600 bg-gray-700 border-gray-600 focus:ring-blue-500"
                            />
                            <span>{sound.name}</span>
                        </div>
                        {sound.url !== 'none' && (
                             <button type="button" onClick={() => playSound(sound.url)} className="p-2 rounded-full hover:bg-white/10" title="Sesi Dinle">
                                <PlayCircle size={20} />
                            </button>
                        )}
                    </label>
                ))}
            </div>
        </div>
        <div className="mt-6 border-t border-white/10 pt-4">
            <h3 className="font-semibold mb-2">Dashboard Widget ları</h3>
            <div className="grid grid-cols-1 gap-4">
                {ALL_WIDGETS.map((widget: WidgetDefinition) => (
                    <div key={widget.id} className="p-3 bg-white/5 rounded-md">
                        <label className="flex items-center gap-3">
                            <input 
                                type="checkbox"
                                checked={localLayout.visible[widget.id] ?? true}
                                onChange={(e) => handleVisibilityChange(widget.id, e.target.checked)}
                                className="w-5 h-5 rounded bg-gray-700 border-gray-600 text-blue-600 focus:ring-blue-500 flex-shrink-0"
                            />
                            <div>
                                <span className="font-medium">{widget.name}</span>
                                <p className="text-xs text-gray-400">{widget.description}</p>
                            </div>
                        </label>
                    </div>
                ))}
            </div>
        </div>

        <div className="flex justify-end gap-4 mt-6">
          <button onClick={onClose} className="bg-gray-600 hover:bg-gray-500 px-4 py-2 rounded-lg">İptal</button>
          <button onClick={handleSave} className="bg-blue-600 hover:bg-blue-500 px-4 py-2 rounded-lg">Kaydet</button>
        </div>
      </div>
    </div>
  );
}