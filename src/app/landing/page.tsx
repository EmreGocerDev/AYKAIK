// YOL: src/app/landing/page.tsx

"use client";

import LandingNav from "@/components/landing/LandingNav";
import ImageSlider from "@/components/landing/ImageSlider";
import GlassCard from "@/components/GlassCard";
import Image from "next/image";
import StatsCard from "@/components/landing/StatsCard";
// DeckCard artık ServiceCarousel içinde kullanılacağı için buradan import etmeye gerek yok
import ServiceCarousel from "@/components/landing/ServiceCarousel"; // Yeni Carousel bileşenini import ediyoruz
import { ReactNode } from "react"; 
import { Zap, Flame, ShieldAlert, Replace, Building2, Car, UserCog, Users, Cpu, Wrench, Package, ListChecks, FileText, Factory } from "lucide-react";

export default function LandingPage() {
  const stats = [
    { value: "14", label: "Şehir", icon: <Building2 size={100} className="pointer-events-none" /> },
    { value: "117", label: "Araç", icon: <Car size={100} className="pointer-events-none" /> },
    { value: "1", label: "Genel Koordinatör", icon: <UserCog size={100} className="pointer-events-none" /> },
    { value: "15", label: "Koordinatör", icon: <Users size={100} className="pointer-events-none" /> },
    { value: "10", label: "Bilgi İşlem", icon: <Cpu size={100} className="pointer-events-none" /> },
  ];

  const services = [
    { title: "Altyapı Hizmetleri", icon: <Factory size={48} className="text-cyan-400"/> },
    { title: "Tesisat Kontrol", icon: <Wrench size={48} className="text-cyan-400"/> },
    { title: "Stok Yönetimi", icon: <Package size={48} className="text-cyan-400"/> },
    { title: "Proje Takibi", icon: <ListChecks size={48} className="text-cyan-400"/> },
    { title: "Sayaç Okuma", icon: <FileText size={48} className="text-cyan-400"/> },
    { title: "Fatura Dağıtım", icon: <FileText size={48} className="text-cyan-400"/> },
    { title: "Kesme & Açma", icon: <Zap size={48} className="text-cyan-400"/> },
    { title: "Kaçak Tespit", icon: <ShieldAlert size={48} className="text-cyan-400"/> },
    { title: "Sayaç Değişimi", icon: <Replace size={48} className="text-cyan-400"/> },
    { title: "Müşteri Hizmetleri", icon: <Users size={48} className="text-cyan-400"/> },
  ];

  return (
    <div className="w-full overflow-x-hidden bg-[#121212]">
      {/* ... Navigasyon ve ilk iki bölüm aynı kalıyor ... */}
      <div className="fixed top-8 w-full flex justify-center z-50"><GlassCard className="!p-0" blurPx={12} tintValue={-20} borderRadiusPx={9999}><div className="h-[64px] px-4"><LandingNav /></div></GlassCard></div>
      <div className="relative w-full h-screen"><ImageSlider /><div className="relative z-10 flex flex-col items-center justify-center h-full gap-20"><div className="w-full py-4 flex justify-center items-center bg-white/5 backdrop-blur-md border-y border-white/10"><Image src="/landing/logo.png" alt="Ayka Matrix Logo" width={400} height={200} className="h-auto" priority /></div><div className="w-full max-w-5xl flex items-center px-4 justify-between gap-4 overflow-x-auto snap-x snap-mandatory scrollbar-hide md:flex-wrap md:overflow-x-visible md:gap-0"><div className="flex-shrink-0 snap-center md:flex-shrink"><GlassCard blurPx={8} tintValue={-20} borderRadiusPx={24} className="!p-4 w-52 h-52 flex flex-col justify-end relative overflow-hidden transition-all duration-300 hover:border-blue-400/80 border-blue-400/30"><div className="absolute inset-0 flex items-center justify-center text-white opacity-10"><Zap size={120} className="pointer-events-none" /></div><h3 className="text-xl font-bold text-white relative z-10">Elektrik</h3><p className="text-sm text-gray-300 relative z-10">Sayaç Okuma ve Faturalandırma</p></GlassCard></div><div className="flex-shrink-0 snap-center md:flex-shrink"><GlassCard blurPx={8} tintValue={-20} borderRadiusPx={24} className="!p-4 w-52 h-52 flex flex-col justify-end relative overflow-hidden transition-all duration-300 hover:border-yellow-400/80 border-yellow-400/30"><div className="absolute inset-0 flex items-center justify-center text-white opacity-10"><Flame size={120} className="pointer-events-none" /></div><h3 className="text-xl font-bold text-white relative z-10">Doğalgaz</h3><p className="text-sm text-gray-300 relative z-10">Sayaç Okuma ve Faturalandırma</p></GlassCard></div><div className="flex-shrink-0 snap-center md:flex-shrink"><GlassCard blurPx={8} tintValue={-20} borderRadiusPx={24} className="!p-4 w-52 h-52 flex flex-col justify-end relative overflow-hidden transition-all duration-300 hover:border-red-400/80 border-red-400/30"><div className="absolute inset-0 flex items-center justify-center text-white opacity-10"><ShieldAlert size={120} className="pointer-events-none" /></div><h3 className="text-xl font-bold text-white relative z-10">Usulsüz</h3><p className="text-sm text-gray-300 relative z-10">Kaçak Enerji Tespiti</p></GlassCard></div><div className="flex-shrink-0 snap-center md:flex-shrink"><GlassCard blurPx={8} tintValue={-20} borderRadiusPx={24} className="!p-4 w-52 h-52 flex flex-col justify-end relative overflow-hidden transition-all duration-300 hover:border-green-400/80 border-green-400/30"><div className="absolute inset-0 flex items-center justify-center text-white opacity-10"><Replace size={120} className="pointer-events-none" /></div><h3 className="text-xl font-bold text-white relative z-10">Değişim</h3><p className="text-sm text-gray-300 relative z-10">Sayaç Değişim Hizmetleri</p></GlassCard></div></div></div></div>
      <div className="w-full min-h-screen bg-black flex flex-col items-center justify-center p-4"><div className="text-center mb-12"><h2 className="text-4xl font-bold text-white mb-2">Rakamlarla Biz</h2><p className="text-gray-400">Sürekli büyüyen operasyon ağımız.</p></div><div className="hidden md:flex flex-wrap items-center justify-center gap-10">{stats.map(stat => (<StatsCard key={stat.label} value={stat.value} label={stat.label} icon={stat.icon} />))}</div><div className="w-full flex md:hidden items-center gap-8 overflow-x-auto snap-x snap-mandatory scrollbar-hide px-4">{stats.map(stat => (<div key={stat.label} className="flex-shrink-0 snap-center"><StatsCard value={stat.value} label={stat.label} icon={stat.icon} /></div>))}</div></div>

      {/* --- ÜÇÜNCÜ BÖLÜM (HİZMET KARTLARI - YENİ CAROUSEL) --- */}
      <div className="w-full min-h-screen bg-black flex flex-col items-center justify-center p-4">
         <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-white mb-2">Hizmetlerimiz</h2>
            <p className="text-gray-400">Geniş hizmet yelpazemizle sahadayız.</p>
        </div>
        
        {/* DÜZELTME: Kartların kesilmemesi için dikeyde padding (py-20) eklendi */}
        <div className="w-full flex justify-center py-20">
          <ServiceCarousel services={services} />
        </div>
      </div>
    </div>
  );
}