// YOL: src/app/dashboard/aykasosyal/profilim/page.tsx

"use client";

import { useState, useEffect, ReactNode } from "react";
import { getMyPersonnelInfo } from "@/app/aykasosyal/actions";
import { useSettings } from "@/contexts/SettingsContext";
import GlassCard from "@/components/GlassCard";
import { User, AlertTriangle } from "lucide-react";
import type { Personnel } from "@/types/index";

const DetailRow = ({ label, value }: { label: string, value: ReactNode }) => {
    if (value === null || value === undefined || value === '') return null;
    return (
        <div>
            <p className="text-xs text-gray-400">{label}</p>
            <p className="text-sm font-semibold">{String(value)}</p>
        </div>
    );
};

const formatDate = (dateString?: string | null) => {
    if (!dateString) return null;
    return new Date(dateString.replace(/-/g, '/')).toLocaleDateString('tr-TR');
};

export default function MyProfileInfoPage() {
  const { tintValue, blurPx, borderRadiusPx, grainOpacity } = useSettings();
  const [personnelInfo, setPersonnelInfo] = useState<Personnel | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchInfo = async () => {
      const data = await getMyPersonnelInfo();
      setPersonnelInfo(data as Personnel);
      setLoading(false);
    };
    fetchInfo();
  }, []);

  if (loading) {
      return <div className="p-8 text-center text-white">Personel bilgileriniz yükleniyor...</div>
  }

  if (!personnelInfo) {
    return (
        <div className="p-4 md:p-8 flex items-center justify-center h-[calc(100vh-140px)]">
            <GlassCard {...{ tintValue, blurPx, borderRadiusPx, grainOpacity }} className="max-w-md w-full text-center">
                <AlertTriangle className="mx-auto h-12 w-12 text-red-400" />
                <h2 className="mt-4 text-xl font-bold">Veri Bulunamadı</h2>
                <p className="text-gray-300 mt-2">Aykasosyal hesabınızla ilişkili personel kaydı bulunamadı. Lütfen İnsan Kaynakları departmanı ile iletişime geçin.</p>
            </GlassCard>
        </div>
    )
  }

  return (
    <div className="p-4 md:p-8 text-white">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-3xl font-bold mb-6 flex items-center gap-3">
            <User /> Personel Bilgilerim
        </h1>
        <div className="text-sm text-gray-300 bg-black/20 p-4 rounded-lg mb-6 border-l-4 border-cyan-500">
            Bu sayfadaki bilgiler sadece görüntüleme amaçlıdır. Bilgilerinizde bir değişiklik veya eksiklik olması durumunda lütfen İnsan Kaynakları departmanına başvurun.
        </div>

        <GlassCard {...{ tintValue, blurPx, borderRadiusPx, grainOpacity }}>
            <div className="space-y-8">
                <fieldset>
                    <legend className="text-xl font-semibold mb-4 text-cyan-400 border-b border-cyan-500/30 pb-2">Kişisel Bilgiler</legend>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-4 gap-y-6">
                        {/* GÜNCELLEME: Tüm özellik erişimleri yeni şemaya uyarlandı */}
                        <DetailRow label="Ad Soyad" value={personnelInfo["ADI SOYADI"]} />
                        <DetailRow label="T.C. Kimlik No" value={personnelInfo["TC. KİMLİK NUMARASI"]} />
                        <DetailRow label="Doğum Tarihi" value={formatDate(personnelInfo["DOĞUM TARİHİ"])} />
                        <DetailRow label="Doğum Yeri" value={personnelInfo["DOĞUM YERİ"]} />
                        <DetailRow label="Baba Adı" value={personnelInfo["BABA ADI"]} />
                        <DetailRow label="Medeni Hal" value={personnelInfo["MEDENİ HALİ"]} />
                        <DetailRow label="Çocuk Sayısı" value={personnelInfo["ÇOCUK SAYISI"]} />
                        <DetailRow label="Kan Grubu" value={personnelInfo["KANGRUBU"]} />
                    </div>
                </fieldset>

                <fieldset>
                    <legend className="text-xl font-semibold mb-4 text-cyan-400 border-b border-cyan-500/30 pb-2">İletişim Bilgileri</legend>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-6">
                        <DetailRow label="E-posta" value={personnelInfo["MAİL ADRESİ"]} />
                        <DetailRow label="Telefon Numarası" value={personnelInfo["ŞAHSİ TEL NO"]} />
                        <DetailRow label="Adres" value={personnelInfo["ADRES"]} />
                    </div>
                </fieldset>
                
                <fieldset>
                    <legend className="text-xl font-semibold mb-4 text-cyan-400 border-b border-cyan-500/30 pb-2">İstihdam Bilgileri</legend>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-4 gap-y-6">
                        <DetailRow label="Kıdem Tarihi" value={formatDate(personnelInfo["KIDEM TARİHİ"])} />
                        <DetailRow label="Görevi" value={personnelInfo["GÖREVİ"]} />
                        <DetailRow label="Yıllık İzin Hakkı" value={`${personnelInfo.annual_leave_days_entitled} gün`} />
                        <DetailRow label="Kullanılan İzin" value={`${personnelInfo.annual_leave_days_used} gün`} />
                        <DetailRow label="Kalan İzin" value={`${personnelInfo.annual_leave_days_entitled - personnelInfo.annual_leave_days_used} gün`} />
                    </div>
                </fieldset>
            </div>
        </GlassCard>
      </div>
    </div>
  );
}