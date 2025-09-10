"use client";

// *** YENİ: Gerekli import'lar eklendi ***
import { useState, useEffect, useMemo } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import GlassCard from "../../components/GlassCard";
import { useSettings, DEFAULT_DASHBOARD_SETTINGS } from "../../contexts/SettingsContext";
import { 
    Briefcase, CalendarCheck, Clock, UserCheck, Users, 
    PieChart, TrendingUp, UserX, Building, GripVertical,
    RefreshCw, UserPlus, UserCog, Hourglass
} from "lucide-react";
// import { Responsive, WidthProvider } from 'react-grid-layout'; // Eski import satırı kaldırıldı
import type { Layout } from 'react-grid-layout';

// *** YENİ: react-grid-layout kütüphanesi sadece tarayıcıda yüklenecek şekilde ayarlandı ***
// ssr: false -> Bu kütüphanenin sunucuda çalışmasını engeller.
// loading -> Kütüphane yüklenirken ekranda ne gösterileceğini belirtir.
const ResponsiveGridLayout = dynamic(
    () => import('react-grid-layout').then(mod => mod.WidthProvider(mod.Responsive)),
    { 
        ssr: false,
        loading: () => (
            <div className="min-h-screen flex items-center justify-center text-white text-xl">
                Dashboard Yükleniyor...
            </div>
        )
    }
);


// =================================================================================
// TİPLER VE YARDIMCI BİLEŞENLER
// =================================================================================

type UpcomingLeave = {
  id: number;
  start_date: string;
  personnel: { full_name: string } | null;
};

type AwaitingApprovalRequest = {
    id: number;
    personnel_full_name: string;
    leave_type: string;
    status: string;
};

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

const WelcomeWidget = ({ profile, glassCardProps }: { profile: {full_name: string} | null, glassCardProps: { tintValue: number; blurPx: number; borderRadiusPx: number; grainOpacity: number; } }) => {
    const [time, setTime] = useState(new Date());
    useEffect(() => {
        const timer = setInterval(() => setTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);
    const getGreeting = () => {
        const hour = time.getHours();
        if (hour < 12) return "Günaydın";
        if (hour < 18) return "İyi Günler";
        return "İyi Akşamlar";
    };
    return (
        <GlassCard {...glassCardProps} className="h-full flex flex-col justify-center items-center text-center">
            <h2 className="text-3xl font-bold">{getGreeting()}, {profile?.full_name?.split(' ')[0]}!</h2>
            <p className="text-5xl font-mono font-bold mt-2 tracking-wider">
                {time.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
            </p>
            <p className="text-lg text-gray-300 mt-1">
                {time.toLocaleDateString('tr-TR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </p>
        </GlassCard>
    );
};

// =================================================================================
// ANA DASHBOARD BİLEŞENİ
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
            
            // *** GÜNCELLENDİ: Hatalı tarih formatını düzeltecek replace eklendi ***
            const upcomingData = upcomingResult.data || [];
            // GÜNCELLENDİ: 'any' tipi kaldırılarak doğru tip tanımı yapıldı ve 
            // Supabase'den dizi olarak gelen personel verisinin ilk elemanı alındı.
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
        } catch (error) { console.error("Dashboard verileri çekilirken hata oluştu:", error);
        } 
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
        pending: <GlassCard {...glassCardProps} className="h-full flex flex-col"><div className="flex items-center gap-4"><div className="p-3 rounded-lg bg-yellow-500/10"><Briefcase size={24} className="text-yellow-400" /></div><div><p className="text-3xl font-bold text-yellow-400">{data.stats.pendingCount}</p><p className="text-sm text-gray-400">Bekleyen Talep</p></div></div></GlassCard>,
        approvedThisMonth: <GlassCard {...glassCardProps} className="h-full flex flex-col"><div className="flex items-center gap-4"><div className="p-3 rounded-lg bg-green-500/10"><CalendarCheck size={24} className="text-green-400" /></div><div><p className="text-3xl font-bold text-green-400">{data.stats.approvedThisMonthCount}</p><p className="text-sm text-gray-400">Bu Ay Onaylanan</p></div></div></GlassCard>,
        onLeaveToday: <GlassCard {...glassCardProps} className="h-full flex flex-col"><div className="flex items-center gap-4"><div className="p-3 rounded-lg bg-sky-500/10"><UserCheck size={24} className="text-sky-400" /></div><div><p className="text-3xl font-bold text-sky-400">{data.stats.onLeaveTodayCount}</p><p className="text-sm text-gray-400">Bugün İzinli</p></div></div></GlassCard>,
        awaitingFinal: <GlassCard {...glassCardProps} className="h-full flex flex-col"><div className="flex items-center gap-4"><div className="p-3 rounded-lg bg-orange-500/10"><UserX size={24} className="text-orange-400" /></div><div><p className="text-3xl font-bold text-orange-400">{data.stats.awaitingFinalApprovalCount!}</p><p className="text-sm text-gray-400">Nihai Onay Bekleyen</p></div></div></GlassCard>,
        totalPersonnel: <GlassCard {...glassCardProps} className="h-full flex flex-col"><div className="flex items-center gap-4"><div className="p-3 rounded-lg bg-indigo-500/10"><Users size={24} className="text-indigo-400" /></div><div><p className="text-3xl font-bold text-indigo-400">{data.stats.personnelCount}</p><p className="text-sm text-gray-400">{profile?.role === 'admin' ? 'Toplam Personel' : 'Bölge Personeli'}</p></div></div></GlassCard>,
        totalRegions: <GlassCard {...glassCardProps} className="h-full flex flex-col"><div className="flex items-center gap-4"><div className="p-3 rounded-lg bg-purple-500/10"><Building size={24} className="text-purple-400" /></div><div><p className="text-3xl font-bold text-purple-400">{data.stats.totalRegionsCount!}</p><p className="text-sm text-gray-400">Toplam Bölge</p></div></div></GlassCard>,
        recentRequests: (<GlassCard {...glassCardProps} className="h-full flex flex-col"><h3 className="text-lg font-semibold mb-4 flex items-center gap-2 flex-shrink-0"><Clock size={18}/> Son Talepler</h3><div className="space-y-2 overflow-y-auto flex-1">{data.recentRequests.length > 0 ? data.recentRequests.map(req => (<Link href="/dashboard/requests" key={req.id} className="block bg-white/5 p-3 rounded-lg hover:bg-white/10 transition-colors"><div className="flex justify-between items-center text-sm"><p className="font-semibold truncate pr-2">{req.personnel_full_name}</p><span className={`font-semibold px-2 py-0.5 rounded-full border text-xs whitespace-nowrap ${statusColors[req.status] || 'text-gray-400'}`}>{statusTranslations[req.status] || req.status}</span></div><p className="text-xs text-gray-400 capitalize">{req.leave_type}</p></Link>)) : <p className="text-gray-400 text-center py-4">Yeni talep yok.</p>}</div></GlassCard>),
        upcomingLeaves: (<GlassCard {...glassCardProps} className="h-full flex flex-col"><h3 className="text-lg font-semibold mb-4 flex items-center gap-2 flex-shrink-0"><TrendingUp size={18}/> Yaklaşan İzinler</h3><div className="space-y-2 overflow-y-auto flex-1">{data.upcomingLeaves.length > 0 ? data.upcomingLeaves.map(leave => (<div key={leave.id} className="bg-white/5 p-3 rounded-lg text-sm"><div className="flex justify-between items-center"><p className="font-semibold truncate pr-2">{leave.personnel?.full_name}</p><p className="text-xs text-gray-300 font-medium whitespace-nowrap">{new Date(leave.start_date.replace(/-/g, '/')).toLocaleDateString('tr-TR', { day: '2-digit', month: 'short' })}</p></div></div>)) : <p className="text-gray-400 text-center py-4">Yaklaşan izin bulunmuyor.</p>}</div></GlassCard>),
        leaveTypeDistribution: (<GlassCard {...glassCardProps} className="h-full flex flex-col"><SimpleBarChart data={data.leaveTypeDistribution} title="İzin Türü Dağılımı" /></GlassCard>),
        welcome: <WelcomeWidget profile={profile} glassCardProps={glassCardProps} />,
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
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
    {visibleWidgets.map(key => (
        <div key={key} className="min-h-[200px]">
            {allWidgets[key as keyof typeof allWidgets]}
        </div>
    ))}
</div>
      </div>
    </div>
  );
}