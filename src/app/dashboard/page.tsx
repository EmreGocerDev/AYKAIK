"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import GlassCard from "@/components/GlassCard";
import SettingsModal from "@/components/SettingsModal";
import { supabase } from "@/lib/supabaseClient";

export default function DashboardPage() {
  // Arayüz ayarları için state'ler
  const [bg, setBg] = useState("/backgrounds/bg1.jpg");
  const [opacity, setOpacity] = useState(15);
  const [grainOpacity, setGrainOpacity] = useState(20);
  const [blurPx, setBlurPx] = useState(16);
  const [borderRadiusPx, setBorderRadiusPx] = useState(16);
  
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/");
  };

  useEffect(() => {
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push("/");
        return;
      }
      
      const { data } = await supabase
        .from("user_settings")
        .select("*")
        .eq("user_id", user.id)
        .single();

      if (data) {
        setBg(data.background_url || "/backgrounds/bg1.jpg");
        setOpacity(data.glass_opacity || 15);
        setGrainOpacity(data.grain_opacity || 20);
        setBlurPx(data.glass_blur_px || 16);
        setBorderRadiusPx(data.glass_border_radius_px || 16);
      }
      setLoading(false);
    };

    checkUser();
  }, [router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900 text-white">Yükleniyor...</div>
    );
  }

  return (
    <div
      className="min-h-screen bg-cover bg-center flex items-center justify-center p-6 transition-all duration-500"
      style={{ backgroundImage: `url(${bg})` }}
    >
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-6xl w-full">
        <GlassCard opacity={opacity} blurPx={blurPx} borderRadiusPx={borderRadiusPx} grainOpacity={grainOpacity}>
          <h2 className="text-lg font-semibold mb-2">Bekleyen İzinler</h2>
          <p className="text-3xl font-bold">5</p>
        </GlassCard>
        <GlassCard opacity={opacity} blurPx={blurPx} borderRadiusPx={borderRadiusPx} grainOpacity={grainOpacity}>
          <h2 className="text-lg font-semibold mb-2">Onaylanan İzinler (Bu Ay)</h2>
          <p className="text-3xl font-bold">12</p>
        </GlassCard>
        <GlassCard opacity={opacity} blurPx={blurPx} borderRadiusPx={borderRadiusPx} grainOpacity={grainOpacity}>
          <h2 className="text-lg font-semibold mb-2">Toplam Personel</h2>
          <p className="text-3xl font-bold">350+</p>
        </GlassCard>
      </div>

      <div className="fixed bottom-6 right-6 flex flex-col gap-3">
        <button onClick={handleLogout} title="Çıkış Yap" className="p-3 rounded-full bg-red-600/50 hover:bg-red-600/80 text-white backdrop-blur-md border border-white/20 shadow-md transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>
        </button>
        <button onClick={() => setSettingsOpen(true)} title="Arayüz Ayarları" className="p-3 rounded-full bg-white/10 backdrop-blur-md border border-white/20 shadow-md hover:bg-white/20 transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 0 2.4l-.15.08a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.38a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1 0-2.4l.15-.08a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"></path><circle cx="12" cy="12" r="3"></circle></svg>
        </button>
      </div>

      {settingsOpen && (
        <SettingsModal
          onClose={() => setSettingsOpen(false)}
          bg={bg} setBg={setBg}
          opacity={opacity} setOpacity={setOpacity}
          grainOpacity={grainOpacity} setGrainOpacity={setGrainOpacity}
          blurPx={blurPx} setBlurPx={setBlurPx}
          borderRadiusPx={borderRadiusPx} setBorderRadiusPx={setBorderRadiusPx}
        />
      )}
    </div>
  );
}