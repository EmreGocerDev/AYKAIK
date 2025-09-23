// YOL: src/app/dashboard/aykasosyal/profil/duzenle/page.tsx

"use client";
import { useEffect, useState, useActionState } from "react";
import { useFormStatus } from "react-dom";
import { getSocialProfileForEdit, updateSocialProfile } from "@/app/aykasosyal/actions";
import { useSettings } from "@/contexts/SettingsContext";
import GlassCard from "@/components/GlassCard";
import { Edit } from "lucide-react";
import toast from "react-hot-toast";
import type { Region } from "@/types/index";
import Image from "next/image";
import AvatarEditorModal from "@/components/AvatarEditorModal";

// Sadece geçerli, yerel avatar URL'lerini döndüren yardımcı fonksiyon
const getValidAvatarUrl = (url: string | null | undefined): string | null => {
  if (url && url.startsWith('/')) {
    return url;
  }
  return null; // Geçersiz veya eski formatlı URL'ler için null döndür
};

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className="btn-save-animated">
      <div className="svg-wrapper-1">
        <div className="svg-wrapper">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="30" height="30" className="icon">
            <path d="M15 3H5a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2V7.5L16.5 3H15zm-3 13a3 3 0 11-6 0 3 3 0 016 0zM6 4h7v4H6V4z"></path>
          </svg>
        </div>
       </div>
      <span>{pending ? 'Kaydediliyor...' : 'Değişiklikleri Kaydet'}</span>
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
    avatar_url: string | null;
  } | null>(null);
  
  const [selectedAvatarUrl, setSelectedAvatarUrl] = useState<string | null>(null);
  const [isEditorOpen, setIsEditorOpen] = useState(false);

  const [state, formAction] = useActionState(updateSocialProfile, { success: false, message: '' });

  useEffect(() => {
    const loadInitialData = async () => {
      const [regionsRes, profileRes] = await Promise.all([
        supabase.from('regions').select('id, name'),
        getSocialProfileForEdit()
      ]);
      if (regionsRes.data) setRegions(regionsRes.data as Region[]);
      if (profileRes) {
        const data = profileRes;
        setProfileData(data);
        // GÜNCELLENDİ: Sadece geçerli URL'leri state'e ata
        setSelectedAvatarUrl(getValidAvatarUrl(data.avatar_url));
      }
     };
    loadInitialData();
  }, [supabase]);

  useEffect(() => {
    if (state.message) {
      if (state.success) toast.success(state.message);
      else toast.error(state.message);
    }
  }, [state]);

  const handleSaveAvatar = (newUrl: string) => {
    setSelectedAvatarUrl(newUrl);
    setIsEditorOpen(false);
  };

  if (!profileData) {
    return <div className="p-8 text-white text-center">Profil bilgileri yükleniyor...</div>;
  }

  return (
    <>
      <div className="p-4 md:p-8">
        <div className="max-w-3xl mx-auto text-white">
          <h1 className="text-3xl font-bold mb-6">Profilini Düzenle</h1>
          <form action={formAction}>
            <input type="hidden" name="avatar_url" value={selectedAvatarUrl || ''} />
            <GlassCard {...{ tintValue, blurPx, borderRadiusPx, grainOpacity }}>
               <div className="space-y-6">
                <div className="flex justify-center">
                  <div className="relative">
                    {/* GÜNCELLENDİ: Koşullu render kaldırıldı, src doğrudan kullanılıyor */}
                    <Image
                      src={selectedAvatarUrl || '/default-avatar.png'}
                      alt="Profil Fotoğrafı"
                      width={128}
                      height={128}
                      className="w-32 h-32 rounded-full object-cover ring-2 ring-white/20 bg-gray-700"
                      onError={(e) => { e.currentTarget.src = '/default-avatar.png'; }}
                    />
                    <button
                      type="button"
                      onClick={() => setIsEditorOpen(true)}
                      className="absolute bottom-1 right-1 bg-gray-900/80 p-2 rounded-full hover:bg-gray-700 transition-colors"
                      title="Avatarı Değiştir"
                    >
                      <Edit size={16} />
                    </button>
                  </div>
                </div>
                
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

      {isEditorOpen && (
        <AvatarEditorModal 
          onClose={() => setIsEditorOpen(false)} 
          onSave={handleSaveAvatar}
          currentAvatarUrl={selectedAvatarUrl}
        />
      )}
    </>
  );
}