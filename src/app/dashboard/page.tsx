"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import GlassCard from "@/components/GlassCard";
import { useSettings } from "@/contexts/SettingsContext"; 
import type { User } from '@supabase/supabase-js';

export default function DashboardPage() {
  const { supabase, tintValue, blurPx, borderRadiusPx, grainOpacity } = useSettings();
  
  // GÜNCELLENDİ: Sadece bu sayfaya özel state'ler kaldı
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const [pendingCount, setPendingCount] = useState<number | string>('...');
  const [approvedThisMonthCount, setApprovedThisMonthCount] = useState<number | string>('...');
  const [personnelCount, setPersonnelCount] = useState<number | string>('...');

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const now = new Date();
        const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
        const lastDayOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString();

        const [pendingResult, approvedResult, personnelResult] = await Promise.all([
          supabase.from('leave_requests').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
          supabase.from('leave_requests').select('*', { count: 'exact', head: true }).eq('status', 'approved').gte('start_date', firstDayOfMonth).lte('start_date', lastDayOfMonth),
          supabase.from('personnel').select('*', { count: 'exact', head: true })
        ]);

        if(pendingResult.error) throw pendingResult.error;
        setPendingCount(pendingResult.count ?? 0);

        if(approvedResult.error) throw approvedResult.error;
        setApprovedThisMonthCount(approvedResult.count ?? 0);

        if(personnelResult.error) throw personnelResult.error;
        setPersonnelCount(personnelResult.count ?? 0);

      } catch (error) {
        console.error("Dashboard verileri çekilirken hata oluştu:", error);
        setPendingCount('Hata');
        setApprovedThisMonthCount('Hata');
        setPersonnelCount('Hata');
      }
    };

    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUser(user);
        await fetchDashboardData();
      } else {
        router.push('/');
      }
      setLoading(false);
    };

    checkUser();
  }, [router, supabase]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900 text-white">Yükleniyor...</div>
    );
  }

  return (
    <div className="w-full min-h-screen flex items-center justify-center p-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl w-full">
        <GlassCard tintValue={tintValue} blurPx={blurPx} borderRadiusPx={borderRadiusPx} grainOpacity={grainOpacity}>
          <h2 className="text-lg font-semibold mb-2">Bekleyen İzinler</h2>
          <p className="text-3xl font-bold">{pendingCount}</p>
        </GlassCard>
        <GlassCard tintValue={tintValue} blurPx={blurPx} borderRadiusPx={borderRadiusPx} grainOpacity={grainOpacity}>
          <h2 className="text-lg font-semibold mb-2">Onaylanan İzinler (Bu Ay)</h2>
          <p className="text-3xl font-bold">{approvedThisMonthCount}</p>
        </GlassCard>
        <GlassCard tintValue={tintValue} blurPx={blurPx} borderRadiusPx={borderRadiusPx} grainOpacity={grainOpacity}>
          <h2 className="text-lg font-semibold mb-2">Toplam Personel</h2>
          <p className="text-3xl font-bold">{personnelCount}</p>
        </GlassCard>
      </div>

      {/* GÜNCELLENDİ: Butonlar ve Modal buradan kaldırıldı. */}
    </div>
  );
}