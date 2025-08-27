"use client";
import { supabase } from "@/lib/supabaseClient";
import GlassCard from "./GlassCard";
import toast from 'react-hot-toast';

const backgroundImages = Array.from({ length: 15 }, (_, i) => `/backgrounds/bg${i + 1}.jpg`);

type SettingsModalProps = {
  onClose: () => void;
  bg: string; setBg: (bg: string) => void;
  opacity: number; setOpacity: (opacity: number) => void;
  grainOpacity: number; setGrainOpacity: (opacity: number) => void;
  blurPx: number; setBlurPx: (px: number) => void;
  borderRadiusPx: number; setBorderRadiusPx: (px: number) => void;
};

export default function SettingsModal({ 
  onClose, 
  bg, setBg, 
  opacity, setOpacity, 
  grainOpacity, setGrainOpacity,
  blurPx, setBlurPx,
  borderRadiusPx, setBorderRadiusPx
}: SettingsModalProps) {
  
  const handleSave = async () => {
    const toastId = toast.loading('Ayarlar kaydediliyor...');
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      toast.error("Ayarları kaydetmek için giriş yapmalısınız.", { id: toastId });
      return;
    }

    const { error } = await supabase
      .from("user_settings")
      .upsert(
        {
          user_id: user.id,
          background_url: bg,
          glass_opacity: opacity,
          grain_opacity: grainOpacity,
          glass_blur_px: blurPx,
          glass_border_radius_px: borderRadiusPx,
        },
        {
          onConflict: 'user_id',
        }
      );

    if (error) {
      toast.error("Hata: " + error.message, { id: toastId });
    } else {
      toast.success("Ayarlar başarıyla kaydedildi!", { id: toastId });
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800/80 backdrop-blur-xl border border-white/20 p-6 rounded-2xl w-full max-w-2xl text-white max-h-[90vh] overflow-y-auto">
        <h2 className="text-2xl font-bold mb-4">Arayüz Ayarları</h2>

        <div className="mb-6">
          <h3 className="font-semibold mb-2">Arkaplan Seçimi</h3>
          <div className="grid grid-cols-4 sm:grid-cols-6 gap-2 max-h-48 overflow-y-auto p-1">
            {backgroundImages.map((img) => (
              <img
                key={img}
                src={img}
                alt={`Arkaplan ${img}`}
                onClick={() => setBg(img)}
                className={`w-full h-16 object-cover rounded-md cursor-pointer transition-all ${bg === img ? 'ring-2 ring-blue-500 scale-105' : 'opacity-70 hover:opacity-100'}`}
              />
            ))}
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
            <div>
                <label htmlFor="opacity" className="font-semibold mb-2 block">
                    Kart Opaklığı: {opacity}
                </label>
                <input id="opacity" type="range" min="0" max="50" step="5" value={opacity} onChange={(e) => setOpacity(Number(e.target.value))} className="w-full h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer" />
            </div>
            
            <div>
                <label htmlFor="grain" className="font-semibold mb-2 block">
                    Gren Efekti Yoğunluğu: {grainOpacity}
                </label>
                <input id="grain" type="range" min="0" max="50" step="5" value={grainOpacity} onChange={(e) => setGrainOpacity(Number(e.target.value))} className="w-full h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer" />
            </div>

            <div>
                <label htmlFor="blur" className="font-semibold mb-2 block">
                    Bulanıklık: {blurPx}px
                </label>
                <input id="blur" type="range" min="0" max="40" step="1" value={blurPx} onChange={(e) => setBlurPx(Number(e.target.value))} className="w-full h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer" />
            </div>
            
            <div>
                <label htmlFor="borderRadius" className="font-semibold mb-2 block">
                    Köşe Yumuşaklığı: {borderRadiusPx}px
                </label>
                <input id="borderRadius" type="range" min="0" max="32" step="1" value={borderRadiusPx} onChange={(e) => setBorderRadiusPx(Number(e.target.value))} className="w-full h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer" />
            </div>
        </div>

        <div className="mt-6 border-t border-white/10 pt-4">
            <h3 className="font-semibold mb-3 text-center">Önizleme</h3>
            <div
                className="p-8 rounded-lg bg-cover bg-center transition-all duration-300"
                style={{ backgroundImage: `url(${bg})` }}
            >
                <GlassCard 
                    opacity={opacity} 
                    grainOpacity={grainOpacity}
                    blurPx={blurPx}
                    borderRadiusPx={borderRadiusPx}
                >
                    <h4 className="font-bold text-lg text-white">Örnek Kart</h4>
                    <p className="text-sm text-gray-200">Ayarlarınız burada anlık olarak gösterilir.</p>
                </GlassCard>
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