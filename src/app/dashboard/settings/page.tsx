"use client";

import { useEffect, useState, FormEvent } from 'react';
import { useSettings } from '@/contexts/SettingsContext';
import { updateSystemSettings } from '@/app/actions';
import GlassCard from '@/components/GlassCard';
import toast from 'react-hot-toast';

type SystemSettings = {
    default_annual_leave_days: string;
    weekend_configuration: 'sunday_only' | 'saturday_sunday';
};

export default function AdminSettingsPage() {
  const { supabase, tintValue, blurPx, borderRadiusPx, grainOpacity } = useSettings();
  const [loading, setLoading] = useState(true);
  const [settings, setSettings] = useState<SystemSettings | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const fetchSettings = async () => {
      const { data, error } = await supabase.from('system_settings').select('key, value');
      if (data) {
        const settingsObject = data.reduce((acc, { key, value }) => {
          acc[key] = value;
          return acc;
        }, {} as any);
        setSettings(settingsObject);
      }
      setLoading(false);
    };
    fetchSettings();
  }, [supabase]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);
    const formData = new FormData(event.currentTarget);
    const result = await updateSystemSettings(formData);
    if (result.success) {
      toast.success(result.message);
    } else {
      toast.error(result.message);
    }
    setIsSubmitting(false);
  };

  if (loading) return <div className="p-8 text-white">Ayarlar yükleniyor...</div>;

  return (
    <div className="p-4 md:p-8">
      <div className="max-w-4xl mx-auto text-white">
        <h1 className="text-3xl font-bold mb-6">Sistem Ayarları</h1>
        <form onSubmit={handleSubmit}>
          <GlassCard {...{tintValue, blurPx, borderRadiusPx, grainOpacity}}>
            <div className="space-y-6">
              <div>
                <label htmlFor="leaveDays" className="block text-lg font-semibold mb-2">Varsayılan Yıllık İzin Hakkı</label>
                <p className="text-sm text-gray-400 mb-2">Yeni eklenen her personele otomatik olarak atanacak olan yıllık izin günü sayısı.</p>
                <input
                  id="leaveDays"
                  name="default_annual_leave_days"
                  type="number"
                  defaultValue={settings?.default_annual_leave_days}
                  required
                  className="w-full md:w-1/3 bg-black/20 p-3 rounded-lg border border-white/10"
                />
              </div>
              
              {/* YENİ: Hafta Sonu Ayarı */}
              <div>
                <label className="block text-lg font-semibold mb-2">Hafta Sonu Tatili</label>
                <p className="text-sm text-gray-400 mb-2">Puantaj ve iş günü hesaplamalarında hangi günlerin hafta sonu olarak sayılacağını seçin.</p>
                <div className="flex gap-6">
                    <label className="flex items-center gap-2">
                        <input type="radio" name="weekend_configuration" value="saturday_sunday" defaultChecked={settings?.weekend_configuration === 'saturday_sunday'} className="w-4 h-4 text-blue-600 bg-gray-700 border-gray-600 focus:ring-blue-500"/>
                        <span>Cumartesi ve Pazar</span>
                    </label>
                    <label className="flex items-center gap-2">
                        <input type="radio" name="weekend_configuration" value="sunday_only" defaultChecked={settings?.weekend_configuration === 'sunday_only'} className="w-4 h-4 text-blue-600 bg-gray-700 border-gray-600 focus:ring-blue-500"/>
                        <span>Sadece Pazar</span>
                    </label>
                </div>
              </div>
            </div>
          </GlassCard>
          
          <div className="flex justify-end mt-6">
            <button type="submit" disabled={isSubmitting} className="px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors disabled:opacity-50 font-semibold">
              {isSubmitting ? 'Kaydediliyor...' : 'Ayarları Kaydet'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
