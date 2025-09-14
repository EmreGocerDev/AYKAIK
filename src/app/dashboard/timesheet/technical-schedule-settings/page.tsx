"use client";

import { useEffect, useState, FormEvent, useCallback } from 'react';
import { useSettings } from '@/contexts/SettingsContext';
import { updateTechnicalScheduleSettings, getTechnicalSchedulePresets } from '@/app/actions';
import GlassCard from '@/components/GlassCard';
import toast from 'react-hot-toast';
import { Save } from 'lucide-react';
import type { Region } from '@/types/index';

type SchedulePreset = {
    id?: number;
    region_id: number;
    preset_id: number;
    name: string;
    start_time: string;
    end_time: string;
    break_hours: number;
    color: string;
};

const defaultColors = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'];

export default function TechnicalScheduleSettingsPage() {
    const { supabase, profile, tintValue, blurPx, borderRadiusPx, grainOpacity } = useSettings();
    const [loading, setLoading] = useState(true);
    const [regions, setRegions] = useState<Region[]>([]);
    const [selectedRegionId, setSelectedRegionId] = useState<string>('');
    const [presets, setPresets] = useState<SchedulePreset[]>([]);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Fetch regions for admin dropdown
    useEffect(() => {
        if (profile?.role !== 'admin') return;
        const fetchRegions = async () => {
            const { data } = await supabase.from('regions').select('id, name').order('name');
            if (data) {
                setRegions(data as Region[]);
                if (data.length > 0) setSelectedRegionId(data[0].id.toString());
            }
        };
        fetchRegions();
    }, [supabase, profile]);

    // Set region for coordinator
    useEffect(() => {
        if (profile?.role === 'coordinator' && profile.region_id) {
            setSelectedRegionId(profile.region_id.toString());
        }
    }, [profile]);
    
    // Fetch presets when region changes
    const fetchPresets = useCallback(async () => {
        if (!selectedRegionId) {
            setLoading(false);
            return;
        };
        setLoading(true);
        const result = await getTechnicalSchedulePresets(Number(selectedRegionId));

        if (result.success && result.data && result.data.length > 0) {
            setPresets(result.data as SchedulePreset[]);
        } else {
             setPresets(Array.from({ length: 5 }).map((_, i) => ({
                preset_id: i + 1,
                region_id: Number(selectedRegionId),
                name: `Şablon ${i + 1}`,
                start_time: '08:00',
                end_time: '18:00',
                break_hours: 1.5,
                color: defaultColors[i],
            })));
        }
        setLoading(false);

    }, [selectedRegionId]);
    
    useEffect(() => {
        fetchPresets();
    }, [fetchPresets]);

    const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setIsSubmitting(true);
        const formData = new FormData(event.currentTarget);
        formData.append('region_id', selectedRegionId);
        const result = await updateTechnicalScheduleSettings(formData);
        if (result.success) {
            toast.success(result.message);
        } else {
            toast.error(result.message);
        }
        setIsSubmitting(false);
    };

    return (
        <div className="p-4 md:p-8">
            <div className="max-w-4xl mx-auto text-white">
                <h1 className="text-3xl font-bold mb-2">Teknik Takvim Ayarları</h1>
                <p className="text-gray-300 mb-6">
                    Bölgelere özel, renk kodlu çalışma saati şablonları oluşturun.
                </p>

                {profile?.role === 'admin' && (
                    <GlassCard {...{ tintValue, blurPx, borderRadiusPx, grainOpacity }} className="mb-6 !p-4">
                        <label htmlFor="region-select" className="font-semibold mr-4">Ayarları Düzenlenecek Bölge:</label>
                        <select
                            id="region-select"
                            value={selectedRegionId}
                            onChange={e => setSelectedRegionId(e.target.value)}
                            className="bg-black/20 py-2 px-4 rounded-lg border border-white/10"
                        >
                            {regions.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                        </select>
                    </GlassCard>
                )}

                {loading ? <div className="p-8 text-center">Yükleniyor...</div> : (
                    <form onSubmit={handleSubmit}>
                        <GlassCard {...{ tintValue, blurPx, borderRadiusPx, grainOpacity }}>
                            <div className="space-y-6">
                                {presets.sort((a,b) => a.preset_id - b.preset_id).map((preset, index) => (
                                    <div key={preset.preset_id} className="p-4 bg-white/5 rounded-lg border-l-4" style={{ borderColor: preset.color }}>
                                        <div className="flex justify-between items-start">
                                            <h3 className="text-lg font-semibold mb-3" style={{ color: preset.color }}>Şablon {preset.preset_id}</h3>
                                            <input
                                                name={`preset_${index}_color`}
                                                type="color"
                                                defaultValue={preset.color}
                                                className="w-10 h-10 bg-transparent border-none cursor-pointer"
                                            />
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                            <div className="md:col-span-2">
                                                <label className="text-sm text-gray-400 mb-1 block">Şablon Adı</label>
                                                <input
                                                    name={`preset_${index}_name`}
                                                    defaultValue={preset.name}
                                                    className="w-full bg-black/20 p-2 rounded-lg border border-white/10"
                                                    placeholder="Örn: Standart Mesai"
                                                />
                                            </div>
                                            <div>
                                                <label className="text-sm text-gray-400 mb-1 block">Başlangıç Saati</label>
                                                <input
                                                    name={`preset_${index}_start_time`}
                                                    type="time"
                                                    defaultValue={preset.start_time}
                                                    className="w-full bg-black/20 p-2 rounded-lg border border-white/10 [color-scheme:dark]"
                                                />
                                            </div>
                                            <div>
                                                <label className="text-sm text-gray-400 mb-1 block">Bitiş Saati</label>
                                                <input
                                                    name={`preset_${index}_end_time`}
                                                    type="time"
                                                    defaultValue={preset.end_time}
                                                    className="w-full bg-black/20 p-2 rounded-lg border border-white/10 [color-scheme:dark]"
                                                />
                                            </div>
                                            <div className="md:col-span-4">
                                                <label className="text-sm text-gray-400 mb-1 block">Mola Süresi (saat)</label>
                                                <input
                                                    name={`preset_${index}_break_hours`}
                                                    type="number"
                                                    step="0.01"
                                                    defaultValue={preset.break_hours}
                                                    className="w-full md:w-1/4 bg-black/20 p-2 rounded-lg border border-white/10"
                                                    placeholder="Örn: 1.5"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </GlassCard>

                        <div className="flex justify-end mt-6">
                            <button type="submit" disabled={isSubmitting || !selectedRegionId} className="flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors disabled:opacity-50 font-semibold">
                                <Save size={18} />
                                {isSubmitting ? 'Kaydediliyor...' : 'Ayarları Kaydet'}
                            </button>
                        </div>
                    </form>
                )}
            </div>
        </div>
    );
}