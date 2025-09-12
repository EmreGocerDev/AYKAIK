// src/app/dashboard/total-performance/page.tsx

"use client";

import { useState, useMemo, useCallback } from 'react';
import { useSettings } from '@/contexts/SettingsContext';
import { getAllRegionsPerformanceData } from '@/app/actions';
import GlassCard from '@/components/GlassCard';
import toast from 'react-hot-toast';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { AlertTriangle, BarChart3, CheckCircle } from 'lucide-react';

type RegionPerformanceData = {
    regionName: string;
    totalActivity: number;
    jobCounts: { [job: string]: number };
};

export default function TotalPerformancePage() {
    const { tintValue, blurPx, borderRadiusPx, grainOpacity } = useSettings();
    const glassCardSettings = { tintValue, blurPx, borderRadiusPx, grainOpacity };

    const [loading, setLoading] = useState(false);
    const [dateRange, setDateRange] = useState({ start: new Date().toISOString().split('T')[0], end: new Date().toISOString().split('T')[0] });
    const [performanceData, setPerformanceData] = useState<RegionPerformanceData[]>([]);

    const handleFetchData = useCallback(async () => {
        setLoading(true);
        setPerformanceData([]);
        const result = await getAllRegionsPerformanceData(dateRange.start, dateRange.end);
        if (result.success && result.data) {
            const sortedData = result.data.sort((a: RegionPerformanceData, b: RegionPerformanceData) => b.totalActivity - a.totalActivity);
            setPerformanceData(sortedData);
            if (result.data.length === 0) {
                toast.error('Seçili aralıkta hiçbir bölge için veri bulunamadı.');
            }
        } else {
            toast.error(result.message || 'Veri çekilemedi.');
        }
        setLoading(false);
    }, [dateRange]);
    
    const grandTotalJobCounts = useMemo(() => {
        if (performanceData.length === 0) return [];
        const allJobCounts: { [job: string]: number } = {};
        performanceData.forEach(region => {
            Object.entries(region.jobCounts).forEach(([job, count]) => {
                allJobCounts[job] = (allJobCounts[job] || 0) + count;
            });
        });
        return Object.entries(allJobCounts).sort((a, b) => b[1] - a[1]);
    }, [performanceData]);


    return (
        <div className="p-4 md:p-8 text-white">
            <div className="max-w-7xl mx-auto">
                <h1 className="text-3xl font-bold mb-6">Tüm Bölgeler Performans Raporu</h1>
                
                <GlassCard {...glassCardSettings} className="mb-6 !p-4 sticky top-0 md:top-[69px] z-20">
                     <div className="flex flex-wrap items-center justify-between gap-4">
                        <div className="flex items-center gap-2">
                             <input type="date" value={dateRange.start} onChange={e => setDateRange(p => ({...p, start: e.target.value}))} className="bg-black/20 p-2 rounded-lg border border-white/10"/>
                             <span className="font-semibold">/</span>
                             <input type="date" value={dateRange.end} onChange={e => setDateRange(p => ({...p, end: e.target.value}))} className="bg-black/20 p-2 rounded-lg border border-white/10"/>
                        </div>
                        <button onClick={handleFetchData} disabled={loading} className="px-6 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg font-semibold w-full sm:w-auto">
                            {loading ? 'Yükleniyor...' : 'Raporu Oluştur'}
                        </button>
                    </div>
                </GlassCard>

                {loading && <div className="text-center py-10">Tüm bölgeler için veriler toplanıyor, bu işlem biraz zaman alabilir...</div>}

                {!loading && performanceData.length === 0 && (
                  <GlassCard {...glassCardSettings}>
                         <div className="text-center py-20 text-gray-400">
                            <AlertTriangle size={48} className="mx-auto mb-4" />
                            <p className="text-lg">Başlamak için bir tarih aralığı seçip &quot;Raporu Oluştur&quot; butonuna basınız.</p>
                         </div>
                  </GlassCard>
                )}

                {!loading && performanceData.length > 0 && (
                    <div className="space-y-8">
                        {performanceData.map((region, index) => {
                           const allJobs = Object.entries(region.jobCounts);
                           
                           // NİHAİ DÜZELTME: Filtre, SADECE 'sayacokuma' ile tam eşleşecek şekilde güncellendi.
                           const chartData = allJobs
                                .filter(([job]) => job.toLowerCase() !== 'sayacokuma')
                                .map(([name, value]) => ({ name, value }))
                                .sort((a, b) => a.name.localeCompare(b.name));
                           
                           const sortedJobDetails = allJobs.sort((a,b) => b[1] - a[1]);

                            return (
                                <GlassCard key={region.regionName} {...glassCardSettings}>
                                    <div className="flex flex-col sm:flex-row justify-between sm:items-center mb-4 gap-4">
                                        <h2 className="text-2xl font-bold flex items-center gap-3">
                                            <span className="text-blue-400">#{index + 1}</span> {region.regionName}
                                        </h2>
                                        <div className="text-right bg-black/20 p-3 rounded-lg">
                                            <p className="text-gray-400 text-sm">Toplam Aktivite</p>
                                            <p className="text-2xl font-bold text-green-400">{region.totalActivity.toLocaleString()}</p>
                                        </div>
                                    </div>
                                    
                                    <h3 className="text-lg font-semibold mb-2">İşlerin Dağılımı (Sayaç Okuma Hariç)</h3>
                                    <div style={{ width: '100%', height: 350 }}>
                                         <ResponsiveContainer>
                                            <AreaChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 80 }}>
                                                <defs>
                                                    <linearGradient id={`gradient-${index}`} x1="0" y1="0" x2="0" y2="1">
                                                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/>
                                                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                                                    </linearGradient>
                                                </defs>
                                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)"/>
                                                <XAxis dataKey="name" angle={-45} textAnchor="end" interval={0} stroke="#9ca3af" tick={{ fontSize: 12 }} />
                                                <YAxis stroke="#9ca3af"/>
                                                <Tooltip contentStyle={{backgroundColor:'rgba(31,41,55,0.9)',borderColor:'rgba(255,255,255,0.2)'}} cursor={{stroke: '#3b82f6', strokeWidth: 1}}/>
                                                <Area type="monotone" dataKey="value" name="Adet" stroke="#60a5fa" fill={`url(#gradient-${index})`} strokeWidth={2} dot={{ r: 4 }} activeDot={{ r: 8 }} />
                                            </AreaChart>
                                        </ResponsiveContainer>
                                    </div>

                                    <div className="mt-6 pt-4 border-t border-white/10">
                                         <h3 className="text-lg font-semibold mb-4 flex items-center gap-2"><BarChart3 size={18} />Tüm İşlerin Detaylı Dökümü</h3>
                                         <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                                            {sortedJobDetails.map(([job, count]) => {
                                                const isSayacOkuma = job.toLowerCase() === 'sayacokuma';
                                                return (
                                                    <div key={job} className={`p-3 rounded-lg text-center ${isSayacOkuma ? 'bg-amber-500/10 ring-1 ring-amber-500/30' : 'bg-black/20'}`}>
                                                        <p className={`font-bold text-xl ${isSayacOkuma ? 'text-amber-300' : 'text-white'}`}>{count}</p>
                                                        <p className="text-sm text-gray-400 truncate" title={job}>{job}</p>
                                                    </div>
                                                );
                                            })}
                                         </div>
                                    </div>
                                </GlassCard>
                            )
                        })}
                        
                        <GlassCard {...glassCardSettings}>
                            <h2 className="text-2xl font-bold mb-4 flex items-center gap-3"><CheckCircle size={24} className="text-green-400" />Tüm Bölgeler Genel Toplam</h2>
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                                {grandTotalJobCounts.map(([job, count]) => {
                                    const isSayacOkuma = job.toLowerCase() === 'sayacokuma';
                                    return (
                                        <div key={job} className={`p-4 rounded-lg text-center shadow-lg ${isSayacOkuma ? 'bg-amber-500/20' : 'bg-white/5'}`}>
                                            <p className={`font-bold ${isSayacOkuma ? 'text-3xl text-amber-300' : 'text-2xl text-cyan-300'}`}>{count as number}</p>
                                            <p className={`truncate ${isSayacOkuma ? 'text-md text-white font-semibold' : 'text-sm text-gray-200'}`} title={job}>{job}</p>
                                        </div>
                                    );
                                })}
                            </div>
                        </GlassCard>
                    </div>
                )}
            </div>
        </div>
    );
}