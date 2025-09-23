// YOL: src/components/AvatarEditorModal.tsx

"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { X, CheckCircle } from "lucide-react";
import GlassCard from "./GlassCard";
import { useSettings } from "@/contexts/SettingsContext";
import { getAvatarList } from "@/app/aykasosyal/actions"; // Sunucudan avatar listesini çekecek yeni action

type ModalProps = {
  onClose: () => void;
  onSave: (newUrl: string) => void;
  currentAvatarUrl: string | null;
};

export default function AvatarEditorModal({ onClose, onSave, currentAvatarUrl }: ModalProps) {
  const { tintValue, blurPx, borderRadiusPx, grainOpacity } = useSettings();
  
  // State'ler
  const [availableAvatars, setAvailableAvatars] = useState<string[]>([]);
  const [selectedAvatar, setSelectedAvatar] = useState<string | null>(currentAvatarUrl);
  const [loading, setLoading] = useState(true);

  // Bileşen yüklendiğinde sunucudan avatar listesini al
  useEffect(() => {
    const fetchAvatars = async () => {
      setLoading(true);
      const avatarPaths = await getAvatarList();
      setAvailableAvatars(avatarPaths);
      setLoading(false);
    };
    fetchAvatars();
  }, []);

  const handleSave = () => {
    if (selectedAvatar) {
      onSave(selectedAvatar);
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-modal-open">
      <GlassCard 
        {...{ tintValue, blurPx, borderRadiusPx, grainOpacity }}
        className="w-full max-w-2xl max-h-[90vh] flex flex-col"
      >
        {/* Başlık ve Kapatma Butonu */}
        <div className="flex justify-between items-center mb-6 flex-shrink-0">
          <h2 className="text-2xl font-bold">Profil Fotoğrafı Seç</h2>
          <button type="button" onClick={onClose} className="p-2 rounded-full hover:bg-white/10 transition-colors">
            <X size={24} />
          </button>
        </div>

        {/* Avatar Listesi (Kaydırılabilir Alan) */}
        <div className="flex-1 overflow-y-auto pr-2 -mr-2">
          {loading ? (
            <div className="text-center py-10 text-gray-400">Avatarlar yükleniyor...</div>
          ) : availableAvatars.length > 0 ? (
            <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 gap-4">
              {availableAvatars.map((avatarUrl) => (
                <div key={avatarUrl} className="relative cursor-pointer" onClick={() => setSelectedAvatar(avatarUrl)}>
                  <Image
                    src={avatarUrl}
                    alt={`Avatar ${avatarUrl}`}
                    width={100}
                    height={100}
                    className={`w-full aspect-square object-cover rounded-full transition-all duration-200 ${
                      selectedAvatar === avatarUrl 
                        ? 'ring-4 ring-blue-500 scale-105' 
                        : 'ring-2 ring-transparent hover:ring-blue-500/50'
                    }`}
                  />
                  {selectedAvatar === avatarUrl && (
                    <div className="absolute bottom-0 right-0 bg-blue-500 rounded-full p-1 text-white">
                      <CheckCircle size={16} />
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-10 text-gray-400">
              <p>Gösterilecek avatar bulunamadı.</p>
              <p className="text-sm">Lütfen `public/avatars` klasörüne `.png` dosyaları eklediğinizden emin olun.</p>
            </div>
          )}
        </div>

        {/* Kaydet Butonu */}
        <div className="flex justify-end mt-8 pt-6 border-t border-white/10 flex-shrink-0">
          <button onClick={handleSave} className="btn-save-animated">
            <div className="svg-wrapper-1">
              <div className="svg-wrapper">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="30" height="30" className="icon">
                  <path d="M15 3H5a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2V7.5L16.5 3H15zm-3 13a3 3 0 11-6 0 3 3 0 016 0zM6 4h7v4H6V4z"></path>
                </svg>
              </div>
            </div>
            <span>Seçileni Kaydet</span>
          </button>
        </div>
      </GlassCard>
    </div>
  );
}