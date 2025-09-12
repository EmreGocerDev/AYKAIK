"use client";

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useSettings } from '@/contexts/SettingsContext';
import { getPerformanceDataForDateRange } from '@/app/actions';
import GlassCard from '@/components/GlassCard';
import toast from 'react-hot-toast';
import type { DailyPerformanceRecord, Region } from '@/types/index';
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine } from 'recharts';
import { TrendingUp, Activity, Clock, Users, AlertTriangle, User, Briefcase, Calendar, ChevronLeft, ChevronRight, Hash, Star, BarChart3, TrendingDown, Info, GitCompareArrows, ArrowRightLeft, UserCheck } from 'lucide-react';

// --- YARDIMCI BİLEŞENLER VE TİPLER ---

const timeSlots = Array.from({ length: 48 }, (_, i) => {
    const hour = Math.floor(i / 2).toString().padStart(2, '0');
    const minute = (i % 2 === 0 ? '00' : '30');
    return `${hour}:${minute}`;
});

type PerformanceDataInRange = { log_date: string, data: DailyPerformanceRecord[] }[];

interface ComparisonTableRow {
    job: string;
    [user: string]: string | number;
}

type ComparisonChartEntry = {
    name: string;
} & {
    [user: string]: string | number;
};

type GlassCardSettings = {
    tintValue: number;
    blurPx: number;
    borderRadiusPx: number;
    grainOpacity: number;
};

// --- ANA SAYFA BİLEŞENLERİ ---

const PerformanceNav = ({ onNavClick }: { onNavClick: (targetId: string) => void }) => {
    const navItems = [
        { id: 'kullanici-bazli', label: 'Kullanıcı Bazlı', icon: User },
        { id: 'is-bazli', label: 'İş Bazlı', icon: Briefcase },
        { id: 'ay-gun-bazli', label: 'Ay/Gün Bazlı', icon: Calendar },
        { id: 'karsilastirma', label: 'Karşılaştırma', icon: GitCompareArrows },
        { id: 'kisisel-karsilastirma', label: 'Kişisel Karşılaştırma', icon: UserCheck },
        { id: 'capraz-karsilastirma', label: 'Çapraz Karşılaştırma', icon: ArrowRightLeft },
    ];
    return (
        <div className="sticky top-[69px] md:top-0 bg-gray-900/50 backdrop-blur-md z-20">
            <div className="max-w-7xl mx-auto flex justify-center items-center gap-2 md:gap-4 p-2 flex-wrap">
                {navItems.map(item => (
                    <button key={item.id} onClick={() => onNavClick(item.id)} className="flex items-center gap-2 px-3 py-2 rounded-lg text-white hover:bg-white/10 transition-colors text-sm md:text-base">
                        <item.icon size={16} /><span className="hidden sm:inline">{item.label}</span>
                    </button>
                ))}
            </div>
        </div>
    );
};

const UserBasedView = ({ data, settings }: { data: PerformanceDataInRange, settings: GlassCardSettings }) => {
    const [currentDayIndex, setCurrentDayIndex] = useState(0);
    const [selectedUser, setSelectedUser] = useState<string>('TÜMÜ');

    useEffect(() => {
        setCurrentDayIndex(0);
        setSelectedUser('TÜMÜ');
    }, [data]);

    const currentDayData = useMemo(() => data[currentDayIndex]?.data || [], [data, currentDayIndex]);
    const availableUsers = useMemo(() => [...new Set(currentDayData.map(d => d.user))].sort(), [currentDayData]);
    const displayedUserData = useMemo(() => selectedUser === 'TÜMÜ' ? currentDayData : currentDayData.filter(d => d.user === selectedUser), [currentDayData, selectedUser]);
    
    const summaryData = useMemo(() => {
        if (displayedUserData.length === 0) return null;
        const totalActivity = displayedUserData.reduce((acc, user) => acc + user.total, 0);
        const earliestStart = displayedUserData.reduce((earliest, user) => user.startTime < earliest ? user.startTime : earliest, "23:59:59");
        const latestEnd = displayedUserData.reduce((latest, user) => user.endTime > latest ? user.endTime : latest, "00:00:00");
        return { totalActivity, workHours: `${earliestStart} - ${latestEnd}` };
    }, [displayedUserData]);

    const chartData = useMemo(() => {
        if (displayedUserData.length === 0) return [];
        if (selectedUser === 'TÜMÜ') return displayedUserData.map(d => ({ name: d.user, "Toplam Aktivite": d.total }));
        const singleUserData = displayedUserData[0];
        return timeSlots.filter(t => t >= "07:00" && t <= "21:00").map(t => ({ time: t, Aktivite: (singleUserData[t] as number) || 0 }));
    }, [displayedUserData, selectedUser]);
    
    const handleDayChange = (dir: 'next' | 'prev') => {
        if (dir === 'next') setCurrentDayIndex(i => Math.min(i + 1, data.length - 1));
        if (dir === 'prev') setCurrentDayIndex(i => Math.max(i - 1, 0));
    };

    return (
        <div id="kullanici-bazli" className="pt-8">
            <div className="flex items-center justify-between flex-wrap gap-4 mb-6">
                <h2 className="text-3xl font-bold">Kullanıcı Bazlı Günlük Analiz</h2>
                {data.length > 0 && (
                    <div className="flex items-center gap-2">
                        <button onClick={() => handleDayChange('prev')} disabled={currentDayIndex === 0} className="p-2 rounded-full hover:bg-white/10 disabled:opacity-50"><ChevronLeft/></button>
                        <span className="font-semibold text-lg">{new Date(data[currentDayIndex]?.log_date).toLocaleDateString('tr-TR', { day: '2-digit', month: 'long' })}</span>
                        <button onClick={() => handleDayChange('next')} disabled={currentDayIndex >= data.length - 1} className="p-2 rounded-full hover:bg-white/10 disabled:opacity-50"><ChevronRight/></button>
                    </div>
                )}
            </div>
            {summaryData && (
                <div className="grid grid-cols-2 gap-4 mb-6">
                    <GlassCard {...settings}><div className="text-center"><Activity className="mx-auto mb-2 text-green-400" size={28}/><p className="text-2xl font-bold">{summaryData.totalActivity}</p><p className="text-gray-400">Toplam Aktivite</p></div></GlassCard>
                    <GlassCard {...settings}><div className="text-center"><Clock className="mx-auto mb-2 text-cyan-400" size={28}/><p className="text-xl font-bold">{summaryData.workHours}</p><p className="text-gray-400">Çalışma Aralığı</p></div></GlassCard>
                </div>
            )}
            <GlassCard {...settings} className="mb-6 !p-4">
                <select value={selectedUser} onChange={e => setSelectedUser(e.target.value)} className="w-full sm:w-auto bg-black/20 py-2 px-4 rounded-lg border border-white/10">
                    <option value="TÜMÜ">Tüm Kullanıcılar</option>
                    {availableUsers.map(u => <option key={u} value={u}>{u}</option>)}
                </select>
            </GlassCard>
            <GlassCard {...settings}>
                <div style={{width:'100%',height:400}}><ResponsiveContainer><AreaChart data={chartData}><defs><linearGradient id="g-user" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#38bdf8" stopOpacity={0.8}/><stop offset="95%" stopColor="#38bdf8" stopOpacity={0}/></linearGradient></defs><CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)"/><XAxis dataKey={selectedUser==='TÜMÜ'?"name":"time"} stroke="#9ca3af" interval={selectedUser==='TÜMÜ'?0:5} angle={-35} textAnchor="end" height={60} /><YAxis stroke="#9ca3af"/><Tooltip contentStyle={{backgroundColor:'rgba(31,41,55,0.9)',borderColor:'rgba(255,255,255,0.2)'}} cursor={{stroke:'#38bdf8',strokeWidth:1}}/><Legend/><ReferenceLine x="08:00" stroke="red" strokeWidth={2} strokeDasharray="3 3"/><ReferenceLine x="18:00" stroke="red" strokeWidth={2} strokeDasharray="3 3"/><Area type="monotone" dataKey={selectedUser==='TÜMÜ'?"Toplam Aktivite":"Aktivite"} stroke="#38bdf8" fill="url(#g-user)" strokeWidth={2} dot={true} activeDot={{r:8}}/></AreaChart></ResponsiveContainer></div>
            </GlassCard>
        </div>
    );
};

const JobBasedView = ({ data, settings }: { data: PerformanceDataInRange, settings: GlassCardSettings }) => {
    const [selectedJobType, setSelectedJobType] = useState<string>('');
    
    const availableJobTypes = useMemo(() => {
        const jobs = new Set<string>();
        const keysToExclude = new Set(['date', 'user', 'total', 'endTime', 'idleTime', 'startTime', ...timeSlots]);
        data.forEach(day => day.data.forEach(rec => Object.keys(rec).forEach(key => !keysToExclude.has(key) && jobs.add(key))));
        const jobList = Array.from(jobs).sort();
        if (jobList.length > 0 && !selectedJobType) setSelectedJobType(jobList[0]);
        return jobList;
    }, [data, selectedJobType]);
    
    const jobData = useMemo(() => {
        if (!selectedJobType || data.length === 0) return { chartData: [], summary: null };
        const userTotals = new Map<string, number>();
        data.forEach(day => {
            day.data.forEach(userRecord => {
                const value = (userRecord[selectedJobType] as number) || 0;
                if (value > 0) userTotals.set(userRecord.user, (userTotals.get(userRecord.user) || 0) + value);
            });
        });
        
        const chartData = Array.from(userTotals.entries()).map(([name, value]) => ({name, value})).sort((a,b) => b.value - a.value);
        if(chartData.length === 0) return { chartData: [], summary: null };

        const totalCount = chartData.reduce((acc, item) => acc + item.value, 0);
        const mostActive = chartData[0];

        return { chartData, summary: { totalCount, userCount: chartData.length, avgPerUser: (totalCount / chartData.length).toFixed(1), mostActiveUser: `${mostActive.name} (${mostActive.value})` } };
    }, [data, selectedJobType]);

    return (
        <div id="is-bazli" className="pt-20">
            <h2 className="text-3xl font-bold mb-6">İş Bazlı Analiz (Aralık Toplamı)</h2>
            {jobData.summary && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                    <GlassCard {...settings}><div className="text-center"><Hash className="mx-auto mb-2 text-green-400" size={28}/><p className="text-2xl font-bold">{jobData.summary.totalCount}</p><p className="text-gray-400">Toplam Adet</p></div></GlassCard>
                    <GlassCard {...settings}><div className="text-center"><Users className="mx-auto mb-2 text-cyan-400" size={28}/><p className="text-2xl font-bold">{jobData.summary.userCount}</p><p className="text-gray-400">Yapan Personel</p></div></GlassCard>
                    <GlassCard {...settings}><div className="text-center"><BarChart3 className="mx-auto mb-2 text-orange-400" size={28}/><p className="text-2xl font-bold">{jobData.summary.avgPerUser}</p><p className="text-gray-400">Personel Ort.</p></div></GlassCard>
                    <GlassCard {...settings}><div className="text-center"><Star className="mx-auto mb-2 text-indigo-400" size={28}/><p className="text-xl font-bold truncate">{jobData.summary.mostActiveUser}</p><p className="text-gray-400">En Aktif</p></div></GlassCard>
                </div>
            )}
            <GlassCard {...settings} className="mb-6 !p-4">
                 <select value={selectedJobType} onChange={e => setSelectedJobType(e.target.value)} disabled={availableJobTypes.length === 0} className="w-full sm:w-auto bg-black/20 py-2 px-4 rounded-lg border border-white/10">
                    {availableJobTypes.map(job => <option key={job} value={job}>{job}</option>)}
                </select>
            </GlassCard>
            <GlassCard {...settings}>
                <h3 className="text-lg font-semibold mb-4">{selectedJobType} Dağılımı</h3>
                <div style={{width:'100%',height:400}}><ResponsiveContainer><BarChart data={jobData.chartData}><CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)"/><XAxis dataKey="name" stroke="#9ca3af" angle={-45} textAnchor="end" height={70}/><YAxis stroke="#9ca3af"/><Tooltip contentStyle={{backgroundColor:'rgba(31,41,55,0.9)',borderColor:'rgba(255,255,255,0.2)'}}/><Bar dataKey="value" name={selectedJobType} fill="#82ca9d"/></BarChart></ResponsiveContainer></div>
            </GlassCard>
        </div>
    );
};

const MonthDayBasedView = ({ data, settings }: { data: PerformanceDataInRange, settings: GlassCardSettings }) => {
    const monthData = useMemo(() => {
        if(data.length === 0) return { chartData: [], summary: null };
        const chartData = data.map(day => ({ date: new Date(day.log_date).toLocaleDateString('tr-TR', { day: '2-digit', month: 'short' }), "Toplam Aktivite": day.data.reduce((acc, user) => acc + user.total, 0) }));
        const totalActivity = chartData.reduce((acc, day) => acc + day["Toplam Aktivite"], 0);
        const busiestDay = chartData.reduce((max, day) => day["Toplam Aktivite"] > max["Toplam Aktivite"] ? day : max, chartData[0]);
        const quietestDay = chartData.reduce((min, day) => day["Toplam Aktivite"] < min["Toplam Aktivite"] ? day : min, chartData[0]);
        return { chartData, summary: { totalActivity, dailyAvg: (totalActivity / chartData.length).toFixed(0), busiestDay: `${busiestDay.date} (${busiestDay["Toplam Aktivite"]})`, quietestDay: `${quietestDay.date} (${quietestDay["Toplam Aktivite"]})` } };
    }, [data]);

    return (
        <div id="ay-gun-bazli" className="pt-20">
            <h2 className="text-3xl font-bold mb-6">Tarih Aralığı Genel Bakış</h2>
            {monthData.summary && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                    <GlassCard {...settings}><div className="text-center"><Activity className="mx-auto mb-2 text-green-400" size={28}/><p className="text-2xl font-bold">{monthData.summary.totalActivity}</p><p className="text-gray-400">Toplam Aktivite</p></div></GlassCard>
                    <GlassCard {...settings}><div className="text-center"><BarChart3 className="mx-auto mb-2 text-cyan-400" size={28}/><p className="text-2xl font-bold">{monthData.summary.dailyAvg}</p><p className="text-gray-400">Günlük Ortalama</p></div></GlassCard>
                    <GlassCard {...settings}><div className="text-center"><TrendingUp className="mx-auto mb-2 text-orange-400" size={28}/><p className="text-xl font-bold truncate">{monthData.summary.busiestDay}</p><p className="text-gray-400">En Yoğun Gün</p></div></GlassCard>
                    <GlassCard {...settings}><div className="text-center"><TrendingDown className="mx-auto mb-2 text-indigo-400" size={28}/><p className="text-xl font-bold truncate">{monthData.summary.quietestDay}</p><p className="text-gray-400">En Düşük Gün</p></div></GlassCard>
                </div>
            )}
            <GlassCard {...settings}><div style={{width:'100%',height:400}}><ResponsiveContainer><BarChart data={monthData.chartData}><CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)"/><XAxis dataKey="date" stroke="#9ca3af"/><YAxis stroke="#9ca3af"/><Tooltip contentStyle={{backgroundColor:'rgba(31,41,55,0.9)',borderColor:'rgba(255,255,255,0.2)'}}/><Legend/><Bar dataKey="Toplam Aktivite" fill="#ffc658"/></BarChart></ResponsiveContainer></div></GlassCard>
        </div>
    );
};

const ComparisonView = ({ data, settings }: { data: PerformanceDataInRange, settings: GlassCardSettings }) => {
    const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
    
    const availableUsers = useMemo(() => {
        const users = new Set<string>();
        data.forEach(day => day.data.forEach(rec => users.add(rec.user)));
        return Array.from(users).sort();
    }, [data]);

    const handleUserSelection = (user: string) => {
        setSelectedUsers(prev => prev.includes(user) ? prev.filter(u => u !== user) : [...prev, user]);
    };

    const comparisonData = useMemo(() => {
        if (selectedUsers.length === 0 || data.length === 0) return { chartData: [], tableData: { headers: [], rows: [] } };
        const jobTotalsByUser = new Map<string, Map<string, number>>();
        const allJobTypes = new Set<string>();
        const keysToExclude = new Set(['date', 'user', 'total', 'endTime', 'idleTime', 'startTime', ...timeSlots]);

        data.forEach(day => {
            day.data.forEach(record => {
                if (selectedUsers.includes(record.user)) {
                    if (!jobTotalsByUser.has(record.user)) jobTotalsByUser.set(record.user, new Map());
                    const userMap = jobTotalsByUser.get(record.user)!;
                    Object.entries(record).forEach(([key, value]) => {
                        if (!keysToExclude.has(key)) {
                            allJobTypes.add(key);
                            userMap.set(key, (userMap.get(key) || 0) + (value as number));
                        }
                    });
                }
            });
        });

        const sortedJobTypes = Array.from(allJobTypes).sort();
        const chartData = sortedJobTypes.map(job => {
            const entry: ComparisonChartEntry = { name: job };
            selectedUsers.forEach(user => entry[user] = jobTotalsByUser.get(user)?.get(job) || 0);
            return entry;
        });
        const tableData = {
            headers: ['İş Tipi', ...selectedUsers],
            rows: sortedJobTypes.map(job => ({ job, ...Object.fromEntries(selectedUsers.map(user => [user, jobTotalsByUser.get(user)?.get(job) || 0])) })) as ComparisonTableRow[]
        };
        return { chartData, tableData };
    }, [data, selectedUsers]);

    const chartColors = ['#8884d8', '#82ca9d', '#ffc658', '#ff8042', '#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

    return (
        <div id="karsilastirma" className="pt-20">
            <h2 className="text-3xl font-bold mb-6">Kullanıcı Karşılaştırma (Aralık Toplamı)</h2>
            <GlassCard {...settings} className="mb-6 !p-4">
                 <div className="flex justify-between items-center">
                    <p className="font-semibold">Karşılaştırılacak Kullanıcıları Seçin:</p>
                    {selectedUsers.length > 0 && <button onClick={() => setSelectedUsers([])} className="text-sm bg-red-500/20 hover:bg-red-500/40 px-3 py-1 rounded-md">Seçimi Kaldır</button>}
                </div>
                <div className="flex flex-wrap gap-3 mt-3">
                    {availableUsers.map(user => (
                        <label key={user} className="flex items-center gap-2 p-2 bg-white/5 rounded-md cursor-pointer hover:bg-white/10">
                            <input type="checkbox" checked={selectedUsers.includes(user)} onChange={() => handleUserSelection(user)} className="w-4 h-4 text-blue-500 bg-gray-700 border-gray-600 rounded focus:ring-blue-600"/>{user}
                        </label>
                    ))}
                </div>
            </GlassCard>
            {selectedUsers.length > 0 && (
                <>
                    <GlassCard {...settings} className="mb-6">
                        <h3 className="text-lg font-semibold mb-4">Grafiksel Karşılaştırma</h3>
                        <div style={{width:'100%',height:400}}><ResponsiveContainer><BarChart data={comparisonData.chartData}><CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)"/><XAxis dataKey="name" stroke="#9ca3af" angle={-45} textAnchor="end" height={70}/><YAxis stroke="#9ca3af"/><Tooltip contentStyle={{backgroundColor:'rgba(31,41,55,0.9)',borderColor:'rgba(255,255,255,0.2)'}}/><Legend/>
                            {selectedUsers.map((user, index) => <Bar key={user} dataKey={user} fill={chartColors[index % chartColors.length]} />)}
                        </BarChart></ResponsiveContainer></div>
                    </GlassCard>
                    <GlassCard {...settings}>
                        <h3 className="text-lg font-semibold mb-4">Detaylı Karşılaştırma Tablosu</h3>
                        <div className="overflow-x-auto"><table className="w-full text-left text-sm"><thead><tr className="border-b border-white/20">{comparisonData.tableData.headers.map(h => <th key={h} className="p-2 whitespace-nowrap">{h}</th>)}</tr></thead><tbody>{comparisonData.tableData.rows.map(row => (<tr key={row.job} className="border-b border-white/10"><td className="p-2 font-semibold whitespace-nowrap">{row.job}</td>{selectedUsers.map(user => <td key={user} className="p-2 text-center">{row[user]}</td>)}</tr>))}</tbody></table></div>
                    </GlassCard>
                </>
            )}
        </div>
    );
};

const PersonalComparisonView = ({ region, settings }: { region: Region, settings: GlassCardSettings }) => {
    const [loading, setLoading] = useState(false);
    const [dateRange1, setDateRange1] = useState({ start: '', end: '' });
    const [dateRange2, setDateRange2] = useState({ start: '', end: '' });
    const [data1, setData1] = useState<PerformanceDataInRange>([]);
    const [data2, setData2] = useState<PerformanceDataInRange>([]);
    const [selectedUser, setSelectedUser] = useState<string>('');

    const handleFetchData = useCallback(async () => {
        if (!dateRange1.start || !dateRange1.end || !dateRange2.start || !dateRange2.end) {
            toast.error("Lütfen her iki tarih aralığını da tam olarak seçin.");
            return;
        }
        setLoading(true);
        const [result1, result2] = await Promise.all([
            getPerformanceDataForDateRange(region.name, dateRange1.start, dateRange1.end),
            getPerformanceDataForDateRange(region.name, dateRange2.start, dateRange2.end)
        ]);
        if (result1.success && result1.data) setData1(result1.data); else toast.error("1. Tarih Aralığı için veri çekilemedi.");
        if (result2.success && result2.data) setData2(result2.data); else toast.error("2. Tarih Aralığı için veri çekilemedi.");
        setLoading(false);
    }, [region.name, dateRange1, dateRange2]);

    const availableUsers = useMemo(() => {
        const users = new Set<string>();
        [...data1, ...data2].forEach(day => day.data.forEach(rec => users.add(rec.user)));
        const userList = Array.from(users).sort();
        if(userList.length > 0 && !selectedUser) setSelectedUser(userList[0]);
        return userList;
    }, [data1, data2, selectedUser]);
    
    const comparisonData = useMemo(() => {
        if (!selectedUser) return { chartData: [], tableData: [] };
        const keysToExclude = new Set(['date', 'user', 'total', 'endTime', 'idleTime', 'startTime', ...timeSlots]);
        const totals1 = new Map<string, number>();
        const totals2 = new Map<string, number>();
        const allJobTypes = new Set<string>();

        const aggregateData = (data: PerformanceDataInRange, totalsMap: Map<string, number>) => {
            data.forEach(day => day.data.forEach(rec => {
                if (rec.user === selectedUser) {
                    Object.entries(rec).forEach(([key, value]) => {
                        if (!keysToExclude.has(key)) {
                            allJobTypes.add(key);
                            totalsMap.set(key, (totalsMap.get(key) || 0) + (value as number));
                        }
                    });
                }
            }));
        };

        aggregateData(data1, totals1);
        aggregateData(data2, totals2);
        
        const sortedJobTypes = Array.from(allJobTypes).sort();
        const chartData = sortedJobTypes.map(job => ({ name: job, "1. Aralık Toplamı": totals1.get(job) || 0, "2. Aralık Toplamı": totals2.get(job) || 0 }));
        const tableData = sortedJobTypes.map(job => {
            const val1 = totals1.get(job) || 0;
            const val2 = totals2.get(job) || 0;
            const change = val1 > 0 ? ((val2 - val1) / val1) * 100 : (val2 > 0 ? Infinity : 0);
            return { job, val1, val2, change };
        });
        return { chartData, tableData };
    }, [data1, data2, selectedUser]);
    
    return (
        <div id="kisisel-karsilastirma" className="pt-20">
            <h2 className="text-3xl font-bold mb-6">Kişisel Karşılaştırma (İki Farklı Dönem)</h2>
            <GlassCard {...settings} className="mb-6 !p-4">
                 <div className="flex flex-wrap items-center gap-4">
                     <div className="flex items-center gap-2 p-2 border border-white/10 rounded-lg">
                        <span className="font-semibold text-cyan-400">1. Aralık:</span>
                        <input type="date" value={dateRange1.start} onChange={e => setDateRange1(p => ({...p, start: e.target.value}))} className="bg-black/20 p-2 rounded-lg"/>
                        <input type="date" value={dateRange1.end} onChange={e => setDateRange1(p => ({...p, end: e.target.value}))} className="bg-black/20 p-2 rounded-lg"/>
                     </div>
                      <div className="flex items-center gap-2 p-2 border border-white/10 rounded-lg">
                        <span className="font-semibold text-orange-400">2. Aralık:</span>
                        <input type="date" value={dateRange2.start} onChange={e => setDateRange2(p => ({...p, start: e.target.value}))} className="bg-black/20 p-2 rounded-lg"/>
                        <input type="date" value={dateRange2.end} onChange={e => setDateRange2(p => ({...p, end: e.target.value}))} className="bg-black/20 p-2 rounded-lg"/>
                     </div>
                     <button onClick={handleFetchData} disabled={loading} className="px-6 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg">{loading ? 'Yükleniyor...' : 'Verileri Karşılaştır'}</button>
                </div>
            </GlassCard>
            {!loading && (data1.length > 0 || data2.length > 0) && (
                <>
                    <GlassCard {...settings} className="mb-6 !p-4">
                        <label htmlFor="cross-comp-user" className="font-semibold mb-2 block">Karşılaştırılacak Kullanıcıyı Seçin:</label>
                        <select id="cross-comp-user" value={selectedUser} onChange={e => setSelectedUser(e.target.value)} className="w-full sm:w-auto bg-black/20 py-2 px-4 rounded-lg border border-white/10">
                            {availableUsers.map(user => <option key={user} value={user}>{user}</option>)}
                        </select>
                    </GlassCard>
                    <GlassCard {...settings} className="mb-6">
                        <h3 className="text-lg font-semibold mb-4">Grafiksel Karşılaştırma: {selectedUser}</h3>
                        <div style={{width:'100%',height:400}}><ResponsiveContainer><BarChart data={comparisonData.chartData}><CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)"/><XAxis dataKey="name" stroke="#9ca3af" angle={-45} textAnchor="end" height={70}/><YAxis stroke="#9ca3af"/><Tooltip contentStyle={{backgroundColor:'rgba(31,41,55,0.9)',borderColor:'rgba(255,255,255,0.2)'}}/><Legend/>
                            <Bar dataKey="1. Aralık Toplamı" fill="#38bdf8"/>
                            <Bar dataKey="2. Aralık Toplamı" fill="#f97316"/>
                        </BarChart></ResponsiveContainer></div>
                    </GlassCard>
                     <GlassCard {...settings}>
                        <h3 className="text-lg font-semibold mb-4">Detaylı Karşılaştırma Tablosu: {selectedUser}</h3>
                        <div className="overflow-x-auto"><table className="w-full text-left"><thead><tr className="border-b border-white/20"><th className="p-2">İş Tipi</th><th className="p-2 text-right">1. Aralık Toplamı</th><th className="p-2 text-right">2. Aralık Toplamı</th><th className="p-2 text-right">Değişim (%)</th></tr></thead><tbody>{comparisonData.tableData.map(row => (<tr key={row.job} className="border-b border-white/10 text-sm"><td className="p-2 font-semibold">{row.job}</td><td className="p-2 text-right">{row.val1}</td><td className="p-2 text-right">{row.val2}</td><td className={`p-2 text-right font-bold ${row.change > 0 ? 'text-green-400' : row.change < 0 ? 'text-red-400' : ''}`}>{isFinite(row.change) ? `${row.change > 0 ? '+' : ''}${row.change.toFixed(1)}%` : 'N/A'}</td></tr>))}</tbody></table></div>
                    </GlassCard>
                </>
            )}
        </div>
    );
};

const CrossComparisonView = ({ region, settings }: { region: Region, settings: GlassCardSettings }) => {
    const [loading, setLoading] = useState(false);
    const [dateRange1, setDateRange1] = useState({ start: '', end: '' });
    const [dateRange2, setDateRange2] = useState({ start: '', end: '' });
    const [data1, setData1] = useState<PerformanceDataInRange>([]);
    const [data2, setData2] = useState<PerformanceDataInRange>([]);
    const [selectedUsers1, setSelectedUsers1] = useState<string[]>([]);
    const [selectedUsers2, setSelectedUsers2] = useState<string[]>([]);
    
    const handleFetchData = useCallback(async () => {
        if (!dateRange1.start || !dateRange1.end || !dateRange2.start || !dateRange2.end) {
            toast.error("Lütfen her iki tarih aralığını da tam olarak seçin.");
            return;
        }
        setLoading(true);
        const [result1, result2] = await Promise.all([
            getPerformanceDataForDateRange(region.name, dateRange1.start, dateRange1.end),
            getPerformanceDataForDateRange(region.name, dateRange2.start, dateRange2.end)
        ]);
        if (result1.success && result1.data) setData1(result1.data); else toast.error("1. Tarih Aralığı için veri çekilemedi.");
        if (result2.success && result2.data) setData2(result2.data); else toast.error("2. Tarih Aralığı için veri çekilemedi.");
        setLoading(false);
    }, [region.name, dateRange1, dateRange2]);
    
    const availableUsers1 = useMemo(() => Array.from(new Set(data1.flatMap(d => d.data.map(r => r.user)))).sort(), [data1]);
    const availableUsers2 = useMemo(() => Array.from(new Set(data2.flatMap(d => d.data.map(r => r.user)))).sort(), [data2]);
    
    const handleUserSelection = (user: string, group: 1 | 2) => {
        const set = group === 1 ? setSelectedUsers1 : setSelectedUsers2;
        set(prev => prev.includes(user) ? prev.filter(u => u !== user) : [...prev, user]);
    };

    const comparisonData = useMemo(() => {
        if (selectedUsers1.length === 0 || selectedUsers2.length === 0) return { chartData: [], tableData: [] };
        const keysToExclude = new Set(['date', 'user', 'total', 'endTime', 'idleTime', 'startTime', ...timeSlots]);
        
        const aggregateGroup = (data: PerformanceDataInRange, users: string[]): Map<string, number> => {
            const totals = new Map<string, number>();
            data.forEach(day => day.data.forEach(rec => {
                if (users.includes(rec.user)) {
                    Object.entries(rec).forEach(([key, value]) => {
                        if (!keysToExclude.has(key)) {
                            totals.set(key, (totals.get(key) || 0) + (value as number));
                        }
                    });
                }
            }));
            return totals;
        };

        const totals1 = aggregateGroup(data1, selectedUsers1);
        const totals2 = aggregateGroup(data2, selectedUsers2);
        const allJobTypes = new Set([...totals1.keys(), ...totals2.keys()]);
        const sortedJobTypes = Array.from(allJobTypes).sort();

        const chartData = sortedJobTypes.map(job => ({ name: job, "Grup 1 Toplamı": totals1.get(job) || 0, "Grup 2 Toplamı": totals2.get(job) || 0 }));
        const tableData = sortedJobTypes.map(job => {
            const val1 = totals1.get(job) || 0;
            const val2 = totals2.get(job) || 0;
            const change = val1 > 0 ? ((val2 - val1) / val1) * 100 : (val2 > 0 ? Infinity : 0);
            return { job, val1, val2, change };
        });
        return { chartData, tableData };
    }, [data1, data2, selectedUsers1, selectedUsers2]);

    return (
        <div id="capraz-karsilastirma" className="pt-20">
            <h2 className="text-3xl font-bold mb-6">Çapraz Karşılaştırma (Çoklu Grup & Dönem)</h2>
            <GlassCard {...settings} className="mb-6 !p-4">
                 <div className="flex flex-wrap items-center gap-4">
                     <div className="flex items-center gap-2 p-2 border border-white/10 rounded-lg">
                        <span className="font-semibold text-cyan-400">1. Aralık:</span>
                        <input type="date" value={dateRange1.start} onChange={e => setDateRange1(p => ({...p, start: e.target.value}))} className="bg-black/20 p-2 rounded-lg"/>
                        <input type="date" value={dateRange1.end} onChange={e => setDateRange1(p => ({...p, end: e.target.value}))} className="bg-black/20 p-2 rounded-lg"/>
                     </div>
                      <div className="flex items-center gap-2 p-2 border border-white/10 rounded-lg">
                        <span className="font-semibold text-orange-400">2. Aralık:</span>
                        <input type="date" value={dateRange2.start} onChange={e => setDateRange2(p => ({...p, start: e.target.value}))} className="bg-black/20 p-2 rounded-lg"/>
                        <input type="date" value={dateRange2.end} onChange={e => setDateRange2(p => ({...p, end: e.target.value}))} className="bg-black/20 p-2 rounded-lg"/>
                     </div>
                     <button onClick={handleFetchData} disabled={loading} className="px-6 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg">{loading ? 'Yükleniyor...' : 'Verileri Karşılaştır'}</button>
                </div>
            </GlassCard>
            {!loading && (data1.length > 0 || data2.length > 0) && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <GlassCard {...settings} className="!p-4">
                        <div className="flex justify-between items-center mb-2"><p className="font-semibold">Grup 1 Kullanıcıları ({selectedUsers1.length})</p><button onClick={() => setSelectedUsers1([])} className="text-xs bg-red-500/20 px-2 py-1 rounded">Temizle</button></div>
                        <div className="flex flex-wrap gap-3 max-h-32 overflow-y-auto">{availableUsers1.map(u=><label key={u} className="flex items-center gap-2 p-1.5 bg-white/5 rounded-md cursor-pointer hover:bg-white/10"><input type="checkbox" checked={selectedUsers1.includes(u)} onChange={()=>handleUserSelection(u, 1)} className="w-4 h-4 text-cyan-500 bg-gray-700 border-gray-600 rounded focus:ring-cyan-600"/>{u}</label>)}</div>
                    </GlassCard>
                    <GlassCard {...settings} className="!p-4">
                         <div className="flex justify-between items-center mb-2"><p className="font-semibold">Grup 2 Kullanıcıları ({selectedUsers2.length})</p><button onClick={() => setSelectedUsers2([])} className="text-xs bg-red-500/20 px-2 py-1 rounded">Temizle</button></div>
                         <div className="flex flex-wrap gap-3 max-h-32 overflow-y-auto">{availableUsers2.map(u=><label key={u} className="flex items-center gap-2 p-1.5 bg-white/5 rounded-md cursor-pointer hover:bg-white/10"><input type="checkbox" checked={selectedUsers2.includes(u)} onChange={()=>handleUserSelection(u, 2)} className="w-4 h-4 text-orange-500 bg-gray-700 border-gray-600 rounded focus:ring-orange-600"/>{u}</label>)}</div>
                    </GlassCard>
                </div>
            )}
            {!loading && comparisonData.chartData.length > 0 && (
                 <>
                    <GlassCard {...settings} className="my-6">
                        <h3 className="text-lg font-semibold mb-4">Grupların Grafiksel Karşılaştırması</h3>
                        <div style={{width:'100%',height:400}}><ResponsiveContainer><BarChart data={comparisonData.chartData}><CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)"/><XAxis dataKey="name" stroke="#9ca3af" angle={-45} textAnchor="end" height={70}/><YAxis stroke="#9ca3af"/><Tooltip contentStyle={{backgroundColor:'rgba(31,41,55,0.9)',borderColor:'rgba(255,255,255,0.2)'}}/><Legend/>
                            <Bar dataKey="Grup 1 Toplamı" fill="#38bdf8"/>
                            <Bar dataKey="Grup 2 Toplamı" fill="#f97316"/>
                        </BarChart></ResponsiveContainer></div>
                    </GlassCard>
                     <GlassCard {...settings}>
                        <h3 className="text-lg font-semibold mb-4">Grupların Detaylı Karşılaştırma Tablosu</h3>
                        <div className="overflow-x-auto"><table className="w-full text-left"><thead><tr className="border-b border-white/20"><th className="p-2">İş Tipi</th><th className="p-2 text-right">Grup 1 Toplamı</th><th className="p-2 text-right">Grup 2 Toplamı</th><th className="p-2 text-right">Değişim (%)</th></tr></thead><tbody>{comparisonData.tableData.map(row => (<tr key={row.job} className="border-b border-white/10 text-sm"><td className="p-2 font-semibold">{row.job}</td><td className="p-2 text-right">{row.val1}</td><td className="p-2 text-right">{row.val2}</td><td className={`p-2 text-right font-bold ${row.change > 0 ? 'text-green-400' : row.change < 0 ? 'text-red-400' : ''}`}>{isFinite(row.change) ? `${row.change > 0 ? '+' : ''}${row.change.toFixed(1)}%` : 'N/A'}</td></tr>))}</tbody></table></div>
                    </GlassCard>
                </>
            )}
        </div>
    );
};


export default function PerformancePage() {
    const { supabase, tintValue, blurPx, borderRadiusPx, grainOpacity } = useSettings();
    const glassCardSettings = { tintValue, blurPx, borderRadiusPx, grainOpacity };
    
    const [regions, setRegions] = useState<Region[]>([]);
    const [selectedRegion, setSelectedRegion] = useState<Region | null>(null);
    const [loading, setLoading] = useState(false);
    const [dateRange, setDateRange] = useState({ start: new Date().toISOString().split('T')[0], end: new Date().toISOString().split('T')[0] });
    const [allDataInRange, setAllDataInRange] = useState<PerformanceDataInRange>([]);

    useEffect(() => {
        supabase.from('regions').select('id, name').then(({ data }) => setRegions(data as Region[]));
    }, [supabase]);
    
    const handleNavClick = (targetId: string) => document.getElementById(targetId)?.scrollIntoView({ behavior: 'smooth', block: 'start' });

    const getDateRangePreset = (preset: 'today' | 'week' | 'month' | 'year') => {
        const end = new Date();
        let start = new Date();
        switch (preset) {
            case 'today': break;
            case 'week':
                const day = start.getDay();
                const diff = start.getDate() - day + (day === 0 ? -6 : 1);
                start.setDate(diff);
                break;
            case 'month': start.setDate(1); break;
            case 'year': start = new Date(start.getFullYear(), 0, 1); break;
        }
        setDateRange({ start: start.toISOString().split('T')[0], end: end.toISOString().split('T')[0] });
    };
    
    const handleFetchData = useCallback(async () => {
        if (!selectedRegion) return;
        setLoading(true);
        const result = await getPerformanceDataForDateRange(selectedRegion.name, dateRange.start, dateRange.end);
        if (result.success && result.data) {
            setAllDataInRange(result.data);
            if (result.data.length === 0) toast.error('Seçili aralıkta veri bulunamadı.');
        } else {
            toast.error(result.message || 'Veri çekilemedi.');
        }
        setLoading(false);
    }, [selectedRegion, dateRange]);

    if (!selectedRegion) {
        return (
            <div className="p-4 md:p-8 text-white flex items-center justify-center h-[calc(100vh-69px)] md:h-screen">
                <GlassCard {...glassCardSettings} className="max-w-md w-full text-center">
                    <h1 className="text-2xl font-bold mb-2">Performans Raporu</h1>
                    <p className="text-gray-400 mb-6">Lütfen verilerini görmek istediğiniz bölgeyi seçin.</p>
                    <select onChange={e => setSelectedRegion(regions.find(r=>r.id===parseInt(e.target.value)) || null)} defaultValue="" className="w-full bg-black/20 py-3 px-4 rounded-lg border border-white/10 text-center text-lg">
                        <option value="" disabled>Bölge Seçiniz...</option>
                        {regions.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                    </select>
                </GlassCard>
            </div>
        );
    }
    
    return (
        <div className="p-4 md:p-8 text-white">
            <PerformanceNav onNavClick={handleNavClick} />
            <div className="max-w-7xl mx-auto">
                <div className="flex justify-between items-center mb-6">
                    <h1 className="text-xl font-bold">Bölge: {selectedRegion.name}</h1>
                    <button onClick={() => setSelectedRegion(null)} className="text-sm text-gray-400 hover:text-white">Bölge Değiştir</button>
                </div>

                <GlassCard {...glassCardSettings} className="mb-6 !p-4">
                     <div className="flex flex-wrap items-center gap-4">
                        <div className="flex items-center gap-2 flex-wrap">
                             <button onClick={() => getDateRangePreset('today')} className="bg-white/5 px-3 py-1 rounded text-sm hover:bg-white/10">Bugün</button>
                             <button onClick={() => getDateRangePreset('week')} className="bg-white/5 px-3 py-1 rounded text-sm hover:bg-white/10">Bu Hafta</button>
                             <button onClick={() => getDateRangePreset('month')} className="bg-white/5 px-3 py-1 rounded text-sm hover:bg-white/10">Bu Ay</button>
                             <button onClick={() => getDateRangePreset('year')} title="Bu işlem biraz uzun sürebilir." className="bg-white/5 px-3 py-1 rounded text-sm hover:bg-white/10 flex items-center gap-1">Bu Yıl <Info size={14}/></button>
                        </div>
                        <div className="flex items-center gap-2">
                             <input type="date" value={dateRange.start} onChange={e => setDateRange(p => ({...p, start: e.target.value}))} className="bg-black/20 p-2 rounded-lg"/>
                             <input type="date" value={dateRange.end} onChange={e => setDateRange(p => ({...p, end: e.target.value}))} className="bg-black/20 p-2 rounded-lg"/>
                        </div>
                        <button onClick={handleFetchData} disabled={loading} className="px-6 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg">{loading ? 'Yükleniyor...' : 'Veri Getir'}</button>
                    </div>
                </GlassCard>
                
                {loading && <div className="text-center py-10">Veriler Yükleniyor...</div>}

                {!loading && allDataInRange.length === 0 && (
                    <GlassCard {...glassCardSettings}>
                         <div className="text-center py-20 text-gray-400"><AlertTriangle size={48} className="mx-auto mb-4" /><p className="text-lg">Başlamak için bir tarih aralığı seçip &quot;Veri Getir&quot; butonuna basınız.</p></div>
                    </GlassCard>
                )}

                {!loading && allDataInRange.length > 0 && (
                    <>
                        <UserBasedView data={allDataInRange} settings={glassCardSettings} />
                        <JobBasedView data={allDataInRange} settings={glassCardSettings} />
                        <MonthDayBasedView data={allDataInRange} settings={glassCardSettings} />
                        <ComparisonView data={allDataInRange} settings={glassCardSettings} />
                        <PersonalComparisonView region={selectedRegion} settings={glassCardSettings} />
                        <CrossComparisonView region={selectedRegion} settings={glassCardSettings} />
                    </>
                )}
            </div>
        </div>
    );
}