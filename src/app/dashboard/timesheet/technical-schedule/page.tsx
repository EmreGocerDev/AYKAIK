"use client";

import { useEffect, useState, useMemo, useCallback } from 'react';
import { useSettings } from '@/contexts/SettingsContext';
import { getTechnicalScheduleForMonth, saveTechnicalSchedule, getTechnicalSchedulePresets } from '@/app/actions';
import GlassCard from '@/components/GlassCard';
import toast from 'react-hot-toast';
import { Save, ChevronLeft, ChevronRight, Brush, Eraser } from 'lucide-react';
import type { Region } from '@/types/index';

type SchedulePreset = {
    id?: number;
    preset_id: number;
    name: string;
    start_time: string;
    end_time: string;
    break_hours: number;
    color: string;
};

type DaySchedule = {
    start_time?: string;
    end_time?: string;
    break_hours?: number;
    preset_id?: number;
};

const hexToRgba = (hex: string, alpha: number) => {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

// YENİ: Haftanın günlerini tanımlıyoruz.
const weekDays = ['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz'];

export default function TechnicalSchedulePage() {
    const { supabase, profile, tintValue, blurPx, borderRadiusPx, grainOpacity } = useSettings();
    const [regions, setRegions] = useState<Region[]>([]);
    const [selectedRegionId, setSelectedRegionId] = useState<string>('');
    const [currentDate, setCurrentDate] = useState(new Date());
    const [presets, setPresets] = useState<SchedulePreset[]>([]);
    const [schedules, setSchedules] = useState<Record<number, DaySchedule>>({});
    
    const [activePreset, setActivePreset] = useState<SchedulePreset | null | 'clear'>(null);
    const [loading, setLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);

    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const daysInMonth = useMemo(() => new Date(year, month + 1, 0).getDate(), [year, month]);
    
    // YENİ: Ayın ilk gününün haftanın hangi gününe denk geldiğini hesaplıyoruz.
    // Bu, takvimin başına kaç tane boş hücre ekleyeceğimizi belirler.
    const firstDayOfMonth = useMemo(() => {
        const dayIndex = new Date(year, month, 1).getDay(); // Pazar: 0, Pazartesi: 1...
        // Pazartesi'nin 0, Pazar'ın 6 olacağı bir sisteme çeviriyoruz.
        return (dayIndex + 6) % 7;
    }, [year, month]);

    useEffect(() => {
        const fetchRegionsData = async () => {
            const { data: regionsData } = await supabase.from('regions').select('id, name').order('name');
            if (regionsData) {
                setRegions(regionsData as Region[]);
                if (profile?.role === 'coordinator' && profile.region_id) {
                    setSelectedRegionId(profile.region_id.toString());
                } else if (regionsData.length > 0) {
                    setSelectedRegionId(regionsData[0].id.toString());
                }
            }
        };
        fetchRegionsData();
    }, [supabase, profile]);
    
    const fetchPageData = useCallback(async () => {
        if (!selectedRegionId) return;
        setLoading(true);
        const regionIdNum = Number(selectedRegionId);

        const presetsResult = await getTechnicalSchedulePresets(regionIdNum);
        setPresets(presetsResult.success && presetsResult.data ? presetsResult.data : []);
        
        const scheduleResult = await getTechnicalScheduleForMonth(regionIdNum, year, month);
        if (scheduleResult.success && scheduleResult.data) {
            const newSchedules = scheduleResult.data.reduce((acc, schedule) => {
                const day = new Date(schedule.date + 'T00:00:00Z').getUTCDate();
                acc[day] = {
                    start_time: schedule.start_time || undefined,
                    end_time: schedule.end_time || undefined,
                    break_hours: schedule.break_hours || undefined,
                    preset_id: schedule.preset_id || undefined,
                };
                return acc;
            }, {} as Record<number, DaySchedule>);
            setSchedules(newSchedules);
        } else {
            toast.error("Takvim verileri çekilemedi.");
            setSchedules({});
        }
        setLoading(false);
    }, [selectedRegionId, year, month]);

    useEffect(() => {
        fetchPageData();
    }, [fetchPageData]);

    const handleDayClick = (day: number) => {
        if (!activePreset) return;
        setSchedules(prev => {
            const newSchedules = { ...prev };
            if (activePreset === 'clear') {
                delete newSchedules[day];
            } else {
                newSchedules[day] = {
                    start_time: activePreset.start_time,
                    end_time: activePreset.end_time,
                    break_hours: activePreset.break_hours,
                    preset_id: activePreset.preset_id,
                };
            }
            return newSchedules;
        });
    };
    
    const handleSave = async () => {
        if (!selectedRegionId) return;
        setIsSaving(true);
        const dataToSave = Object.entries(schedules).map(([day, schedule]) => ({
            region_id: Number(selectedRegionId),
            date: new Date(Date.UTC(year, month, Number(day))).toISOString().split('T')[0],
            ...schedule
        }));
        
        const result = await saveTechnicalSchedule(dataToSave);
        if (result.success) {
            toast.success(result.message);
        } else {
            toast.error(result.message);
        }
        setIsSaving(false);
    };

    const changeMonth = (amount: number) => {
        setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth() + amount, 1));
    };

    return (
        <div className="p-4 md:p-8 text-white">
            <div className="max-w-7xl mx-auto">
                <h1 className="text-3xl font-bold mb-6">Teknik Zaman Menüsü</h1>
                
                <GlassCard {...{tintValue, blurPx, borderRadiusPx, grainOpacity}} className="mb-6 !p-4">
                    <div className="flex flex-wrap items-center justify-between gap-4">
                        <div className="flex items-center gap-4">
                            <label htmlFor="region-select" className="font-semibold">Bölge:</label>
                            <select
                                id="region-select"
                                value={selectedRegionId}
                                onChange={e => setSelectedRegionId(e.target.value)}
                                disabled={profile?.role === 'coordinator' || regions.length === 0}
                                className="bg-black/20 py-2 px-4 rounded-lg border border-white/10"
                            >
                                {regions.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                            </select>
                        </div>
                        <div className="flex items-center gap-2 bg-gray-800/50 p-2 rounded-lg">
                            <button onClick={() => changeMonth(-1)} className="p-2 rounded-md hover:bg-white/10"><ChevronLeft /></button>
                            <span className="text-xl font-semibold w-40 text-center">{currentDate.toLocaleDateString('tr-TR', { month: 'long', year: 'numeric' })}</span>
                            <button onClick={() => changeMonth(1)} className="p-2 rounded-md hover:bg-white/10"><ChevronRight /></button>
                        </div>
                    </div>
                </GlassCard>

                <GlassCard {...{tintValue, blurPx, borderRadiusPx, grainOpacity}} className="mb-6 !p-4">
                    <h3 className="font-semibold mb-3">Uygulanacak Şablonu Seçin (Fırça)</h3>
                    <div className="flex flex-wrap gap-2">
                        {presets.sort((a,b) => a.preset_id - b.preset_id).map(p => (
                            <button key={p.preset_id} onClick={() => setActivePreset(p)} className={`p-2 rounded-lg text-sm transition-colors border ${activePreset !== 'clear' && activePreset?.preset_id === p.preset_id ? 'ring-2 ring-offset-2 ring-offset-gray-800' : 'bg-opacity-50 hover:bg-opacity-70'}`}
                                style={{
                                    backgroundColor: hexToRgba(p.color, 0.3),
                                    borderColor: p.color,
                                    color: p.color
                                }}
                            >
                                <Brush size={16} className="inline-block mr-2" /> {p.name}
                            </button>
                        ))}
                        <button onClick={() => setActivePreset('clear')} className={`p-2 rounded-lg text-sm transition-colors ${activePreset === 'clear' ? 'bg-red-600 ring-2 ring-red-400' : 'bg-white/5 hover:bg-white/10'}`}>
                             <Eraser size={16} className="inline-block mr-2" /> Temizle
                        </button>
                    </div>
                </GlassCard>

                {loading ? (
                    <div className="text-center py-10">Takvim Yükleniyor...</div>
                ) : (
                    <GlassCard {...{tintValue, blurPx, borderRadiusPx, grainOpacity}}>
                        
                        {/* YENİ: Haftanın günlerini gösteren başlıklar */}
                        <div className="grid grid-cols-7 gap-2 mb-2">
                            {weekDays.map(day => (
                                <div key={day} className="text-center font-bold text-gray-400 pb-2">{day}</div>
                            ))}
                        </div>
                        
                        {/* GÜNCELLENDİ: Takvim ızgarası artık hizalı */}
                        <div className="grid grid-cols-7 gap-2">
                            
                            {/* YENİ: Ayın ilk gününü doğru kolona yerleştirmek için boşluklar oluşturuyoruz */}
                            {Array.from({ length: firstDayOfMonth }).map((_, i) => (
                                <div key={`placeholder-${i}`} />
                            ))}

                            {/* Mevcut günleri render etme mantığı */}
                            {Array.from({ length: daysInMonth }).map((_, i) => {
                                const day = i + 1;
                                const schedule = schedules[day];
                                const appliedPreset = schedule?.preset_id ? presets.find(p => p.preset_id === schedule.preset_id) : null;
                                
                                const dayStyle = appliedPreset ? {
                                    backgroundColor: hexToRgba(appliedPreset.color, 0.2),
                                    borderColor: hexToRgba(appliedPreset.color, 0.5)
                                } : {};

                                return (
                                    <div 
                                        key={day} 
                                        onClick={() => handleDayClick(day)}
                                        style={dayStyle}
                                        className={`h-28 flex flex-col justify-between p-2 rounded-lg border transition-colors cursor-pointer ${activePreset ? 'hover:border-blue-500' : ''} ${!appliedPreset ? 'bg-black/10 border-white/10' : ''}`}
                                    >
                                        <span className="font-bold text-lg">{day}</span>
                                        {appliedPreset && (
                                            <div className="text-xs mt-1 text-right">
                                                <p className="font-bold truncate" title={appliedPreset.name}>{appliedPreset.name}</p>
                                                <p>{schedule?.start_time} - {schedule?.end_time}</p>
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </GlassCard>
                )}
                
                <div className="flex justify-end mt-6">
                    <button onClick={handleSave} disabled={isSaving || loading || !selectedRegionId} className="btn-save-animated">
  <div className="svg-wrapper-1">
    <div className="svg-wrapper">
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="30" height="30" className="icon">
        <path d="M15 3H5a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2V7.5L16.5 3H15zm-3 13a3 3 0 11-6 0 3 3 0 016 0zM6 4h7v4H6V4z"></path>
      </svg>
    </div>
  </div>
  <span>{isSaving ? 'Kaydediliyor...' : 'Kaydet'}</span>
</button>
                </div>
            </div>
        </div>
    );
}