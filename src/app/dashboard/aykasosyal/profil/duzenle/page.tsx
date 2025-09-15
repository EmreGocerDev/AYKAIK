"use client";
import { useEffect, useState, useActionState } from "react";
import { useFormStatus } from "react-dom";
import { getSocialProfileForEdit, updateSocialProfile } from "@/app/aykasosyal/actions";
import { useSettings } from "@/contexts/SettingsContext";
import GlassCard from "@/components/GlassCard";
import { Save } from "lucide-react";
import toast from "react-hot-toast";
import type { Region } from "@/types/index";

// Formun durumunu göstermek için yardımcı component
function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className="flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors disabled:opacity-50 font-semibold">
      <Save size={18} />
      {pending ? 'Kaydediliyor...' : 'Değişiklikleri Kaydet'}
    </button>
  );
}

export default function EditProfilePage() {
  const { supabase, tintValue, blurPx, borderRadiusPx, grainOpacity } = useSettings();
  const [regions, setRegions] = useState<Region[]>([]);
  const [profileData, setProfileData] = useState<{
    full_name: string;
    username: string;
    bio: string | null;
    region_id: number | null;
  } | null>(null);

 const [state, formAction] = useActionState(updateSocialProfile, { success: false, message: '' });

  useEffect(() => {
    // Sayfa yüklendiğinde hem bölgeleri hem de mevcut profil verilerini çek
    const loadInitialData = async () => {
      const [regionsRes, profileRes] = await Promise.all([
        supabase.from('regions').select('id, name'),
        getSocialProfileForEdit()
      ]);

      if (regionsRes.data) {
        setRegions(regionsRes.data as Region[]);
      }
      if (profileRes) {
        setProfileData(profileRes);
      }
    };
    loadInitialData();
  }, [supabase]);
  
  // Form action'dan gelen sonucu toast ile göster
  useEffect(() => {
    if (state.message) {
      if (state.success) {
        toast.success(state.message);
      } else {
        toast.error(state.message);
      }
    }
  }, [state]);

  if (!profileData) {
    return <div className="p-8 text-white text-center">Profil bilgileri yükleniyor...</div>;
  }

  return (
    <div className="p-4 md:p-8">
      <div className="max-w-3xl mx-auto text-white">
        <h1 className="text-3xl font-bold mb-6">Profilini Düzenle</h1>
        <form action={formAction}>
          <GlassCard {...{ tintValue, blurPx, borderRadiusPx, grainOpacity }}>
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="full_name" className="block text-sm font-medium text-gray-300 mb-1">Ad Soyad</label>
                  <input id="full_name" name="full_name" type="text" defaultValue={profileData.full_name} required className="w-full bg-black/20 p-3 rounded-lg border border-white/10" />
                </div>
                <div>
                  <label htmlFor="username" className="block text-sm font-medium text-gray-300 mb-1">Kullanıcı Adı</label>
                  <input id="username" name="username" type="text" defaultValue={profileData.username} required className="w-full bg-black/20 p-3 rounded-lg border border-white/10" />
                </div>
              </div>
              <div>
                <label htmlFor="bio" className="block text-sm font-medium text-gray-300 mb-1">Hakkında</label>
                <textarea id="bio" name="bio" defaultValue={profileData.bio || ''} rows={4} className="w-full bg-black/20 p-3 rounded-lg border border-white/10"></textarea>
              </div>
              <div>
                <label htmlFor="region_id" className="block text-sm font-medium text-gray-300 mb-1">Bölge</label>
                <select id="region_id" name="region_id" defaultValue={profileData.region_id || ''} className="w-full bg-black/20 p-3 rounded-lg border border-white/10">
                  <option value="">Bölge Seçilmemiş</option>
                  {regions.map(region => (
                    <option key={region.id} value={region.id}>{region.name}</option>
                  ))}
                </select>
              </div>
            </div>
          </GlassCard>
          <div className="flex justify-end mt-6">
            <SubmitButton />
          </div>
        </form>
      </div>
    </div>
  );
}