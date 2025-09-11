"use client";

import { useState, useEffect, useMemo } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import GlassCard from "../../components/GlassCard";
import { useSettings, DEFAULT_DASHBOARD_SETTINGS } from "../../contexts/SettingsContext";
import { 
    Briefcase, CalendarCheck, Clock, UserCheck, Users, 
    PieChart, TrendingUp, UserX, Building, GripVertical,
    RefreshCw, UserPlus, UserCog, Hourglass, MapPin, Edit
} from "lucide-react";
import type { Layout } from 'react-grid-layout';
import { WiDaySunny, WiNightClear, WiCloudy, WiRain, WiSnow, WiThunderstorm } from 'react-icons/wi';
import toast from 'react-hot-toast';

const ResponsiveGridLayout = dynamic(
    () => import('react-grid-layout').then(mod => mod.WidthProvider(mod.Responsive)),
    { 
        ssr: false,
        loading: () => <div className="min-h-screen flex items-center justify-center text-white text-xl">Dashboard Yükleniyor...</div>
    }
);

// DÜZELTME 1: 'any' yerine kullanılacak olan net tip tanımı
type GlassCardProps = {
    tintValue: number;
    blurPx: number;
    borderRadiusPx: number;
    grainOpacity: number;
};

// =================================================================================
// TİPLER VE YARDIMCI BİLEŞENLER (Bu bölümü kendi dosyanızdaki gibi bırakın)
// =================================================================================
type UpcomingLeave = { id: number; start_date: string; personnel: { full_name: string } | null; };
type AwaitingApprovalRequest = { id: number; personnel_full_name: string; leave_type: string; status: string; };
type DashboardData = {
  stats: {
    pendingCount: number;
    approvedThisMonthCount: number;
    personnelCount: number;
    onLeaveTodayCount: number;
    awaitingFinalApprovalCount?: number;
    totalRegionsCount?: number;
  };
  recentRequests: {
    id: number;
    personnel_full_name: string;
    leave_type: string;
    status: string;
  }[];
  upcomingLeaves: UpcomingLeave[];
  leaveTypeDistribution: { name: string; count: number }[];
};
const statusTranslations: { [key: string]: string } = {
  pending: 'Beklemede',
  approved_by_coordinator: 'Koordinatör Onayladı',
  approved: 'Onaylandı',
  rejected: 'Reddedildi',
  rejected_by_coordinator: 'Koordinatör Reddetti'
};
const statusColors: { [key: string]: string } = {
  pending: 'text-yellow-400 border-yellow-500/20 bg-yellow-500/10',
  approved_by_coordinator: 'text-sky-400 border-sky-500/20 bg-sky-500/10',
  approved: 'text-green-400 border-green-500/20 bg-green-500/10',
  rejected: 'text-red-400 border-red-500/20 bg-red-500/10',
  rejected_by_coordinator: 'text-orange-400 border-orange-500/20 bg-orange-500/10'
};
const SimpleBarChart = ({ data, title }: { data: { name: string; count: number }[], title: string }) => {
    const total = data.reduce((sum, item) => sum + item.count, 0);
    if (total === 0) return <p className="text-gray-400 text-center py-4">Gösterilecek veri yok.</p>;
    const colors = ['bg-yellow-500', 'bg-orange-500', 'bg-sky-500', 'bg-purple-500'];
    return (
        <div>
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2"><PieChart size={18}/> {title}</h3>
            <div className="space-y-3 text-sm">
                {data.map((item, index) => (
                    <div key={item.name}>
                        <div className="flex justify-between mb-1">
                            <span className="capitalize font-medium text-gray-300">{item.name}</span>
                            <span className="font-bold">{item.count}</span>
                        </div>
                        <div className="w-full bg-gray-700/50 rounded-full h-2.5">
                            <div className={`${colors[index % colors.length]} h-2.5 rounded-full`} style={{ width: `${(item.count / total) * 100}%` }}></div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};


// =================================================================================
// YARDIMCI WIDGET'LARIN TANIMLANMASI
// =================================================================================

const WelcomeWidget = ({ profile, glassCardProps }: { profile: {full_name: string} | null, glassCardProps: GlassCardProps }) => {
    const [time, setTime] = useState(new Date());

    useEffect(() => {
        const timer = setInterval(() => setTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    const greetings = [ "Merhaba", "Hoş geldiniz", "İyi çalışmalar", "Harika bir gün dilerim" ];
    const getGreeting = () => {
        const hour = time.getHours();
        if (hour < 5) return "İyi geceler"; if (hour < 12) return "Günaydın";
        if (hour < 18) return "İyi günler"; return "İyi akşamlar";
    };
    // DÜZELTME 2: 'greetings' bağımlılık dizisine eklendi
    const randomGreeting = useMemo(() => greetings[Math.floor(Math.random() * greetings.length)], [greetings]);

    return (
        <GlassCard {...glassCardProps} className="h-full flex flex-col justify-center items-center text-center">
            <h2 className="text-3xl font-bold">{getGreeting()}, {profile?.full_name?.split(' ')[0]}!</h2>
            <p className="text-gray-300">{randomGreeting}</p>
            <p className="text-6xl font-sans font-thin mt-2 tracking-wider">
                {time.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}
            </p>
            <p className="text-lg text-gray-300 mt-2">
                {time.toLocaleDateString('tr-TR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </p>
        </GlassCard>
    );
};

// DÜZELTME 3: 'any' yerine oluşturduğumuz tip kullanıldı
const WeatherWidget = ({ glassCardProps }: { glassCardProps: GlassCardProps }) => {
    const [weather, setWeather] = useState<{ temp: number; description: string; icon: string } | null>(null);
    const [city, setCity] = useState<string | null>(null);
    const [isEditingLocation, setIsEditingLocation] = useState<boolean>(false);
    const [manualCityInput, setManualCityInput] = useState<string>("");

    const weatherIconMap: { [key: string]: React.ReactNode } = {
        '01d': <WiDaySunny size={64} />, '01n': <WiNightClear size={64} />, '02d': <WiCloudy size={64} />, 
        '02n': <WiCloudy size={64} />, '03d': <WiCloudy size={64} />, '03n': <WiCloudy size={64} />,
        '04d': <WiCloudy size={64} />, '04n': <WiCloudy size={64} />, '09d': <WiRain size={64} />, 
        '09n': <WiRain size={64} />, '10d': <WiRain size={64} />, '10n': <WiRain size={64} />,
        '11d': <WiThunderstorm size={64} />, '11n': <WiThunderstorm size={64} />, '13d': <WiSnow size={64} />, 
        '13n': <WiSnow size={64} />, '50d': <WiCloudy size={64} />, '50n': <WiCloudy size={64} />,
    };

    const fetchWeather = async (query: {lat: number, lon: number} | {city: string}) => {
        const API_KEY = 'KENDI_API_ANAHTARINIZ_BURADA_YAZILI_OLMALI'; // API Anahtarınızı buraya yazın
        let url = '';
        if ('city' in query) {
            url = `https://api.openweathermap.org/data/2.5/weather?q=${query.city}&appid=${API_KEY}&units=metric&lang=tr`;
        } else {
            url = `https://api.openweathermap.org/data/2.5/weather?lat=${query.lat}&lon=${query.lon}&appid=${API_KEY}&units=metric&lang=tr`;
        }
        try {
            const response = await fetch(url);
            const data = await response.json();
            if (response.ok && data.weather && data.main) {
                setWeather({ temp: Math.round(data.main.temp), description: data.weather[0].description, icon: data.weather[0].icon });
                setCity(data.name); setManualCityInput(data.name);
            } else { toast.error(`Hava durumu alınamadı: ${data.message || 'Bilinmeyen API hatası'}`); }
        } catch (err) { 
            // DÜZELTME 4: Yakalanan hata konsola yazdırıldı
            console.error("Hava durumu verisi çekilirken bir hata oluştu:", err);
            toast.error("Hava durumu sunucusuna bağlanılamadı."); 
        }
    };

    useEffect(() => {
        navigator.geolocation.getCurrentPosition(
            (position) => fetchWeather({ lat: position.coords.latitude, lon: position.coords.longitude }),
            () => { 
                toast.error(`Konum izni alınamadı, varsayılan olarak İstanbul gösteriliyor.`); 
                fetchWeather({ city: 'Istanbul' }); 
            }
        );
    }, []);

    const handleCitySubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (manualCityInput.trim()) {
            fetchWeather({ city: manualCityInput.trim() });
            setIsEditingLocation(false);
        } else { toast.error("Lütfen bir şehir adı girin."); }
    };

    return (
        <GlassCard {...glassCardProps} className="h-full flex flex-col justify-between text-center">
            {!weather ? (
                 <div className="h-full flex items-center justify-center text-sm text-gray-400">
                    Hava durumu bilgisi yükleniyor...
                </div>
            ) : (
                <>
                    <div className="flex-1 flex flex-col justify-center items-center">
                        {weatherIconMap[weather.icon]}
                        <p className="text-5xl font-bold mt-2">{weather.temp}°C</p>
                        <p className="text-lg text-gray-300 capitalize">{weather.description}</p>
                    </div>
                    <div className="w-full text-center pt-2 border-t border-white/10">
                        <div className="w-full flex justify-center items-center gap-2">
                            <MapPin size={16} className="text-gray-400" />
                            {!isEditingLocation ? (
                                <div className="flex items-center gap-2">
                                    <span className="font-semibold text-lg">{city}</span>
                                    <button onClick={() => setIsEditingLocation(true)} className="p-1 rounded-full hover:bg-white/10" title="Şehri Değiştir">
                                        <Edit size={16} />
                                    </button>
                                </div>
                            ) : (
                                <form onSubmit={handleCitySubmit} className="flex items-center gap-2">
                                    <input
                                        type="text" value={manualCityInput} onChange={(e) => setManualCityInput(e.target.value)}
                                        className="bg-black/20 text-white text-center rounded-md px-2 py-1 border border-white/20 w-32 focus:outline-none focus:ring-1 focus:ring-blue-500" autoFocus
                                    />
                                    <button type="submit" className="p-1 rounded-full bg-green-600 hover:bg-green-700 text-white">Kaydet</button>
                                    <button type="button" onClick={() => setIsEditingLocation(false)} className="p-1 rounded-full bg-red-600 hover:bg-red-700 text-white">İptal</button>
                                </form>
                            )}
                        </div>
                    </div>
                </>
            )}
        </GlassCard>
    );
};


// =================================================================================
// ANA DASHBOARD SAYFA BİLEŞENİ
// =================================================================================

export default function DashboardPage() {
  const { supabase, profile, tintValue, blurPx, borderRadiusPx, grainOpacity, dashboardLayout, setDashboardLayout } = useSettings();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<DashboardData | null>(null);
  const [awaitingApprovalData, setAwaitingApprovalData] = useState<AwaitingApprovalRequest[]>([]);
  const [isMounted, setIsMounted] = useState(false);
  
  useEffect(() => {
    setIsMounted(true);
    const fetchDashboardData = async () => {
        if (!profile) return;
        setLoading(true);
        try {
            const now = new Date();
            const todayUTC = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate())).toISOString().split('T')[0];
            const next7Days = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 7)).toISOString().split('T')[0];
            const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
            
            let personnelIdsForCoordinator: number[] | null = null;
            if (profile.role === 'coordinator' && profile.region_id) {
                const { data: regionPersonnel, error } = await supabase.from('personnel').select('id').eq('region_id', profile.region_id);
                if (error) throw error;
                personnelIdsForCoordinator = regionPersonnel?.map(p => p.id) ?? [];
            }
    
            let pendingQuery = supabase.from('leave_requests').select('id', { count: 'exact', head: true }).eq('status', 'pending');
            if (personnelIdsForCoordinator !== null) {
                pendingQuery = personnelIdsForCoordinator.length > 0 ? pendingQuery.in('personnel_id', personnelIdsForCoordinator) : pendingQuery.eq('id', -1);
            }
    
            let approvedQuery = supabase.from('leave_requests').select('id', { count: 'exact', head: true }).eq('status', 'approved').gte('start_date', firstDayOfMonth);
            if (personnelIdsForCoordinator !== null) {
                approvedQuery = personnelIdsForCoordinator.length > 0 ? approvedQuery.in('personnel_id', personnelIdsForCoordinator) : approvedQuery.eq('id', -1);
            }
    
            let personnelQuery = supabase.from('personnel').select('id', { count: 'exact', head: true });
            if (profile.role === 'coordinator' && profile.region_id) {
                personnelQuery = personnelQuery.eq('region_id', profile.region_id);
            }
    
            let onLeaveQuery = supabase.from('leave_requests').select('id', { count: 'exact', head: true }).eq('status', 'approved').lte('start_date', todayUTC).gte('end_date', todayUTC);
            if (personnelIdsForCoordinator !== null) {
                onLeaveQuery = personnelIdsForCoordinator.length > 0 ? onLeaveQuery.in('personnel_id', personnelIdsForCoordinator) : onLeaveQuery.eq('id', -1);
            }
            
            const recentPromise = supabase.rpc('search_leave_requests', { limit_val: 5, offset_val: 0, region_filter_id: profile.role === 'coordinator' ? profile.region_id : null, search_query: null, leave_type_filter: null });
            let upcomingQuery = supabase.from('leave_requests').select('id, start_date, personnel(full_name)').eq('status', 'approved').gte('start_date', todayUTC).lte('start_date', next7Days).order('start_date');
            if (personnelIdsForCoordinator !== null) {
                upcomingQuery = personnelIdsForCoordinator.length > 0 ? upcomingQuery.in('personnel_id', personnelIdsForCoordinator) : upcomingQuery.eq('id', -1);
            }
            
            let leaveTypeQuery = supabase.from('leave_requests').select('leave_type').neq('status', 'rejected');
            if (personnelIdsForCoordinator !== null) {
                leaveTypeQuery = personnelIdsForCoordinator.length > 0 ? leaveTypeQuery.in('personnel_id', personnelIdsForCoordinator) : leaveTypeQuery.eq('id', -1);
            }
            
            const awaitingFinalPromise = profile.role === 'admin' ? supabase.from('leave_requests').select('id', { count: 'exact', head: true }).eq('status', 'approved_by_coordinator') : Promise.resolve({ data: null, error: null, count: 0 });
            const regionsPromise = profile.role === 'admin' ? supabase.from('regions').select('id', { count: 'exact', head: true }) : Promise.resolve({ data: null, error: null, count: 0 });
            const awaitingApprovalPromise = supabase.rpc('get_notifications', { user_role: profile.role, user_region_id: profile.region_id });
            const [
                pendingResult, approvedResult, personnelResult, onLeaveQueryRes, recentResult,
                upcomingResult, leaveTypeResult, awaitingFinalResult, regionsResult, awaitingApprovalResult
            ] = await Promise.all([
                pendingQuery, approvedQuery, personnelQuery, onLeaveQuery, recentPromise,
                upcomingQuery, leaveTypeQuery, awaitingFinalPromise, regionsPromise, awaitingApprovalPromise
            ]);
    
            const results = [pendingResult, approvedResult, personnelResult, onLeaveQueryRes, recentResult, upcomingResult, leaveTypeResult, awaitingFinalResult, regionsResult, awaitingApprovalResult];
            for (const result of results) { if (result.error) throw result.error; }
            
            if (awaitingApprovalResult.data) {
                setAwaitingApprovalData(awaitingApprovalResult.data as AwaitingApprovalRequest[]);
            }

            const counts: {[key: string]: number} = {};
            if (leaveTypeResult.data) {
                for (const { leave_type } of leaveTypeResult.data) { if(leave_type) counts[leave_type] = (counts[leave_type] || 0) + 1; }
            }
            
            const leaveTypeDistribution = Object.entries(counts).map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count);
            const upcomingData = upcomingResult.data || [];
            const transformedUpcomingLeaves = upcomingData.map((item: { id: number; start_date: string; personnel: { full_name: string; }[] | null }) => ({
                id: item.id,
                start_date: item.start_date,
                personnel: (item.personnel && item.personnel.length > 0) ? item.personnel[0] : null
            }));
            setData({
                stats: {
                    pendingCount: pendingResult.count ?? 0,
                    approvedThisMonthCount: approvedResult.count ?? 0,
                    personnelCount: personnelResult.count ?? 0,
                    onLeaveTodayCount: onLeaveQueryRes.count ?? 0,
                    awaitingFinalApprovalCount: awaitingFinalResult.count ?? 0,
                    totalRegionsCount: regionsResult.count ?? 0
                },
                recentRequests: recentResult.data as DashboardData['recentRequests'] ?? [],
                upcomingLeaves: transformedUpcomingLeaves,
                leaveTypeDistribution: leaveTypeDistribution,
            } as DashboardData);
        } catch (error) { console.error("Dashboard verileri çekilirken hata oluştu:", error); } 
        finally { setLoading(false); }
    };
    if (profile) { fetchDashboardData(); }
  }, [profile, supabase]);


  const allWidgets = useMemo(() => {
    if (!data) return {};
    const glassCardProps = { tintValue, blurPx, borderRadiusPx, grainOpacity };

    const monthlyLeavePercentage = data.stats.personnelCount > 0 
        ? Math.round((data.stats.approvedThisMonthCount / data.stats.personnelCount) * 100) 
        : 0;

    const leaveStatusData = [
        { name: 'Beklemede', count: data.stats.pendingCount },
    ];
    if (profile?.role === 'admin' && data.stats.awaitingFinalApprovalCount) {
        leaveStatusData.push({ name: 'Nihai Onay Bekliyor', count: data.stats.awaitingFinalApprovalCount });
    }
    
    const awaitingApprovalWidget = (
        <GlassCard {...glassCardProps} className="h-full flex flex-col">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2 flex-shrink-0">
                <Hourglass size={18}/> Onay Bekleyen Talepler
             </h3>
             <div className="space-y-2 overflow-y-auto flex-1">
                {awaitingApprovalData.length > 0 ? (
                    awaitingApprovalData.slice(0, 5).map(req => (
                        <Link href="/dashboard/notifications" key={req.id} className="block bg-white/5 p-3 rounded-lg hover:bg-white/10 transition-colors">
                            <div className="flex justify-between items-center text-sm">
                                <p className="font-semibold truncate pr-2">{req.personnel_full_name}</p>
                                <span className="text-xs text-gray-400 capitalize">{req.leave_type}</span>
                            </div>
                        </Link>
                    ))
                ) : (
                    <p className="text-gray-400 text-center py-4">İşlem bekleyen talep yok.</p>
                )}
            </div>
            {awaitingApprovalData.length > 5 && (
                <Link href="/dashboard/notifications" className="text-center text-sm mt-4 text-blue-400 hover:underline">
                    Tümünü Gör ({awaitingApprovalData.length})
                </Link>
            )}
        </GlassCard>
     );

    return {
        welcome: <WelcomeWidget profile={profile} glassCardProps={glassCardProps} />,
        weather: <WeatherWidget glassCardProps={glassCardProps} />,
        pending: <GlassCard {...glassCardProps} className="h-full flex flex-col"><div className="flex items-center gap-4"><div className="p-3 rounded-lg bg-yellow-500/10"><Briefcase size={24} className="text-yellow-400" /></div><div><p className="text-3xl font-bold text-yellow-400">{data.stats.pendingCount}</p><p className="text-sm text-gray-400">Bekleyen Talep</p></div></div></GlassCard>,
        approvedThisMonth: <GlassCard {...glassCardProps} className="h-full flex flex-col"><div className="flex items-center gap-4"><div className="p-3 rounded-lg bg-green-500/10"><CalendarCheck size={24} className="text-green-400" /></div><div><p className="text-3xl font-bold text-green-400">{data.stats.approvedThisMonthCount}</p><p className="text-sm text-gray-400">Bu Ay Onaylanan</p></div></div></GlassCard>,
        onLeaveToday: <GlassCard {...glassCardProps} className="h-full flex flex-col"><div className="flex items-center gap-4"><div className="p-3 rounded-lg bg-sky-500/10"><UserCheck size={24} className="text-sky-400" /></div><div><p className="text-3xl font-bold text-sky-400">{data.stats.onLeaveTodayCount}</p><p className="text-sm text-gray-400">Bugün İzinli</p></div></div></GlassCard>,
        awaitingFinal: <GlassCard {...glassCardProps} className="h-full flex flex-col"><div className="flex items-center gap-4"><div className="p-3 rounded-lg bg-orange-500/10"><UserX size={24} className="text-orange-400" /></div><div><p className="text-3xl font-bold text-orange-400">{data.stats.awaitingFinalApprovalCount!}</p><p className="text-sm text-gray-400">Nihai Onay Bekleyen</p></div></div></GlassCard>,
        totalPersonnel: <GlassCard {...glassCardProps} className="h-full flex flex-col"><div className="flex items-center gap-4"><div className="p-3 rounded-lg bg-indigo-500/10"><Users size={24} className="text-indigo-400" /></div><div><p className="text-3xl font-bold text-indigo-400">{data.stats.personnelCount}</p><p className="text-sm text-gray-400">{profile?.role === 'admin' ? 'Toplam Personel' : 'Bölge Personeli'}</p></div></div></GlassCard>,
        totalRegions: <GlassCard {...glassCardProps} className="h-full flex flex-col"><div className="flex items-center gap-4"><div className="p-3 rounded-lg bg-purple-500/10"><Building size={24} className="text-purple-400" /></div><div><p className="text-3xl font-bold text-purple-400">{data.stats.totalRegionsCount!}</p><p className="text-sm text-gray-400">Toplam Bölge</p></div></div></GlassCard>,
        recentRequests: (<GlassCard {...glassCardProps} className="h-full flex flex-col"><h3 className="text-lg font-semibold mb-4 flex items-center gap-2 flex-shrink-0"><Clock size={18}/> Son Talepler</h3><div className="space-y-2 overflow-y-auto flex-1">{data.recentRequests.length > 0 ? data.recentRequests.map(req => (<Link href="/dashboard/requests" key={req.id} className="block bg-white/5 p-3 rounded-lg hover:bg-white/10 transition-colors"><div className="flex justify-between items-center text-sm"><p className="font-semibold truncate pr-2">{req.personnel_full_name}</p><span className={`font-semibold px-2 py-0.5 rounded-full border text-xs whitespace-nowrap ${statusColors[req.status] || 'text-gray-400'}`}>{statusTranslations[req.status] || req.status}</span></div><p className="text-xs text-gray-400 capitalize">{req.leave_type}</p></Link>)) : <p className="text-gray-400 text-center py-4">Yeni talep yok.</p>}</div></GlassCard>),
        upcomingLeaves: (<GlassCard {...glassCardProps} className="h-full flex flex-col"><h3 className="text-lg font-semibold mb-4 flex items-center gap-2 flex-shrink-0"><TrendingUp size={18}/> Yaklaşan İzinler</h3><div className="space-y-2 overflow-y-auto flex-1">{data.upcomingLeaves.length > 0 ? data.upcomingLeaves.map(leave => (<div key={leave.id} className="bg-white/5 p-3 rounded-lg text-sm"><div className="flex justify-between items-center"><p className="font-semibold truncate pr-2">{leave.personnel?.full_name}</p><p className="text-xs text-gray-300 font-medium whitespace-nowrap">{new Date(leave.start_date.replace(/-/g, '/')).toLocaleDateString('tr-TR', { day: '2-digit', month: 'short' })}</p></div></div>)) : <p className="text-gray-400 text-center py-4">Yaklaşan izin bulunmuyor.</p>}</div></GlassCard>),
        leaveTypeDistribution: (<GlassCard {...glassCardProps} className="h-full flex flex-col"><SimpleBarChart data={data.leaveTypeDistribution} title="İzin Türü Dağılımı" /></GlassCard>),
        quickActions: (
            <GlassCard {...glassCardProps} className="h-full flex flex-col justify-center">
                <div className="flex flex-row items-center justify-center gap-4 flex-wrap">
                    <Link href="/dashboard/personnel" className="flex flex-col items-center justify-center bg-white/5 rounded-lg p-3 text-center hover:bg-white/10 transition-colors w-20 h-20 sm:w-24 sm:h-24">
                        <UserPlus className="w-8 h-8 text-blue-400" />
                        <span className="text-xs font-semibold mt-2">Personel Ekle</span>
                    </Link>
                    <Link href="/dashboard/requests" className="flex flex-col items-center justify-center bg-white/5 rounded-lg p-3 text-center hover:bg-white/10 transition-colors w-20 h-20 sm:w-24 sm:h-24">
                        <Briefcase className="w-8 h-8 text-green-400" />
                        <span className="text-xs font-semibold mt-2">İzinleri Görüntüle</span>
                    </Link>
                    {profile?.role === 'admin' && (
                         <Link href="/dashboard/users" className="flex flex-col items-center justify-center bg-white/5 rounded-lg p-3 text-center hover:bg-white/10 transition-colors w-20 h-20 sm:w-24 sm:h-24">
                            <UserCog className="w-8 h-8 text-purple-400" />
                            <span className="text-xs font-semibold mt-2">Kullanıcı Yönet</span>
                        </Link>
                    )}
                </div>
            </GlassCard>
        ),
        monthlyLeaveRate: (
             <GlassCard {...glassCardProps} className="h-full flex flex-col">
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2 flex-shrink-0"><TrendingUp size={18}/> Aylık İzin Oranı</h3>
                <div className="flex flex-col items-center justify-center flex-1">
                    <div className="text-5xl font-bold text-cyan-400">{monthlyLeavePercentage}%</div>
                    <p className="text-gray-400 mt-2 text-center">Bu ay {data.stats.personnelCount} personelden {data.stats.approvedThisMonthCount} tanesi izin kullandı.</p>
                    <div className="w-full bg-gray-700/50 rounded-full h-4 mt-4">
                        <div className="bg-cyan-500 h-4 rounded-full" style={{ width: `${monthlyLeavePercentage}%` }}></div>
                    </div>
                </div>
             </GlassCard>
        ),
        leaveStatusDistribution: (
            <GlassCard {...glassCardProps} className="h-full flex flex-col">
                <SimpleBarChart data={leaveStatusData} title="İzin Durumları Dağılımı" />
            </GlassCard>
        ),
        awaitingApproval: awaitingApprovalWidget,
    };
  }, [data, profile, tintValue, blurPx, borderRadiusPx, grainOpacity, awaitingApprovalData]);

  const handleLayoutChange = (currentLayout: Layout[], allLayouts: { [key: string]: Layout[] }) => {
    if (isMounted) {
      setDashboardLayout({
        ...dashboardLayout,
        layouts: allLayouts
      });
    }
  };

  if (loading || !data || !isMounted) {
    return <div className="min-h-screen flex items-center justify-center text-white">Ana Panel Yükleniyor...</div>;
  }
  
  const visibleWidgets = Object.keys(allWidgets).filter(key => {
    const isVisible = dashboardLayout.visible[key] ?? true;
    if (!isVisible) return false;
    if (profile?.role !== 'admin' && ['awaitingFinal', 'totalRegions', 'leaveStatusDistribution'].includes(key)) return false;
    return true;
  });
  return (
    <div className="w-full min-h-screen p-4 md:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl md:text-4xl font-bold text-white">Ayka Enerji İnsan Kaynakları Kokpiti</h1>
                </div>
                <button
                    onClick={() => setDashboardLayout(DEFAULT_DASHBOARD_SETTINGS)}
                    className="flex items-center gap-2 bg-white/10 px-4 py-2 rounded-lg hover:bg-white/20 transition-colors"
                    title="Paneli Sıfırla"
                >
                    <RefreshCw size={16} />
                    <span>Sıfırla</span>
                </button>
            </div>
        </div>
        
         <ResponsiveGridLayout
           className="layout"
            layouts={dashboardLayout.layouts}
            breakpoints={{ lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 }}
            cols={{ lg: 12, md: 10, sm: 6, xs: 4, xxs: 2 }}
            rowHeight={50}
            onLayoutChange={handleLayoutChange}
            isDraggable={true}
            isResizable={true}
            draggableHandle=".drag-handle"
            isBounded={true}
        >
            {visibleWidgets.map(key => (
                <div key={key} className="relative group bg-transparent">
                    <div className="drag-handle absolute top-2 right-2 p-2 text-white/40 group-hover:text-white/80 cursor-grab active:cursor-grabbing transition-colors z-10">
                        <GripVertical />
                    </div>
                    <div className="h-full w-full">
                        {allWidgets[key as keyof typeof allWidgets]}
                    </div>
                </div>
            ))}
        </ResponsiveGridLayout>
      </div>
    </div>
  );
}