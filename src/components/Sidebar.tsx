"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from 'react';
// YENİ: TrendingUp ikonu Performans başlığı için kullanılacak
import { Home, Calendar, Users, Briefcase, ChevronsLeft, ChevronsRight, Settings, Map, ClipboardList, UserCog, Bell, ChevronDown, ChevronUp, Archive, Box, MessageSquare, Wallet, TrendingUp } from 'lucide-react';
import { useSettings } from "@/contexts/SettingsContext";
import Image from "next/image";

// DEĞİŞTİRİLDİ: Performans İzleme buradan kaldırıldı.
const navLinks = [
  { name: "Ana Panel", href: "/dashboard", icon: Home },
  { name: "Bildirimler", href: "/dashboard/notifications", icon: Bell },
  { name: "İzin Talepleri", href: "/dashboard/requests", icon: Briefcase },
  { name: "Personel Listesi", href: "/dashboard/personnel", icon: Users },
  { name: "Takvim", href: "/dashboard/calendar", icon: Calendar },
  { name: "Puantaj Cetveli", href: "/dashboard/timesheet", icon: ClipboardList }
];

const inventoryLinks = [
  { name: "Stok Yönetimi", href: "/dashboard/inventory/stock", icon: Box }
];

// YENİ: Performans İzleme için yeni bir link kategorisi oluşturuldu.
const performanceLinks = [
  { name: "Günlük Performans", href: "/dashboard/performance", icon: TrendingUp }
];

const aykaKasaLink = { name: "Ayka Kasa", href: "/dashboard/ayka-kasa", icon: Wallet };

const adminLinks = [
  { name: "Kullanıcı Yönetimi", href: "/dashboard/users", icon: UserCog },
  { name: "Sistem Ayarları", href: "/dashboard/settings", icon: Settings },
  { name: "Bölgeler", href: "/dashboard/regions", icon: Map }
];

type SidebarProps = {
  mobileOpen: boolean;
  setMobileOpen: (isOpen: boolean) => void;
  isCollapsed: boolean;
  setIsCollapsed: (isCollapsed: boolean) => void;
};

export default function Sidebar({ mobileOpen, setMobileOpen, isCollapsed, setIsCollapsed }: SidebarProps) {
  const pathname = usePathname();
  const { profile, tintValue, grainOpacity, blurPx, notificationCount } = useSettings();
  
  const [isIkMenuOpen, setIsIkMenuOpen] = useState(false);
  const [isInventoryOpen, setIsInventoryOpen] = useState(false);
  // YENİ: Performans kategorisinin açık/kapalı durumunu tutmak için state
  const [isPerformanceOpen, setIsPerformanceOpen] = useState(false);
  
  const grainEffectOpacity = grainOpacity / 100;
  const color = tintValue >= 0 ? '255, 255, 255' : '0, 0, 0';
  const alpha = Math.abs(tintValue) / 100;

  useEffect(() => {
    if (navLinks.some(link => pathname.startsWith(link.href))) {
      setIsIkMenuOpen(true);
    }

    if (inventoryLinks.some(link => pathname.startsWith(link.href))) {
      setIsInventoryOpen(true);
    }
    
    // YENİ: Mevcut sayfa performans ile ilgiliyse, menüyü otomatik olarak açık tut
    if (performanceLinks.some(link => pathname.startsWith(link.href))) {
      setIsPerformanceOpen(true);
    }
  }, [pathname]);

  return (
    <>
      <div 
        onClick={() => setMobileOpen(false)}
        className={`fixed inset-0 bg-black/50 z-30 md:hidden transition-opacity duration-300 ${mobileOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`} 
      />

      <aside 
        className={`fixed top-0 left-0 h-screen border-r border-white/10 text-white flex flex-col z-40 transition-all duration-300 ease-in-out  
                    ${mobileOpen ? 'translate-x-0' : '-translate-x-full'} 
                    md:translate-x-0 
                    ${isCollapsed ? 'md:w-20' : 'md:w-64'} 
                    overflow-hidden`}
        style={{
           backgroundColor: `rgba(${color}, ${alpha})`,
           backdropFilter: `blur(${blurPx}px)`,
        }}
      >
        <div className="absolute inset-0 bg-[url('/noise.png')] pointer-events-none" style={{ opacity: grainEffectOpacity }} />

        <div className="relative z-10 flex flex-col h-full">
          <div className="flex items-center justify-center p-4 h-[69px] border-b border-white/10">
            <Image 
              src="/sidebarlogo.png" 
              alt="Portal Logosu" 
              width={isCollapsed ? 32 : 124}
              height={36} 
              className="transition-all duration-300 my-1"
              style={{ height: 'auto' }} 
            />
          </div>
          
          <nav className="flex-1 p-2 overflow-y-auto">
    
            {/* Ayka İK Dropdown */}
            <div>
              <div className={`transition-opacity duration-200 ${isCollapsed ? 'md:opacity-0 md:hidden' : 'opacity-100'}`}>
                  <button
                      onClick={() => setIsIkMenuOpen(!isIkMenuOpen)}
                      className={`flex items-center justify-between w-full px-4 py-3 rounded-lg text-white hover:bg-white/5 transition-colors ${isIkMenuOpen && !isCollapsed ? 'bg-white/5' : ''}`}
                  >
                      <div className="flex items-center gap-3">
                        <Users size={18} />
                        <span className="font-semibold text-sm">Ayka İnsan Kaynakları</span>
                      </div>
                      {isIkMenuOpen ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                  </button>
              </div>
              <div className={`overflow-hidden transition-all duration-300 ease-in-out ${isIkMenuOpen || isCollapsed ? 'max-h-[500px]' : 'max-h-0'}`}>
                <ul>
                  {navLinks.map((link) => {
                    const isActive = link.href === '/dashboard' ? pathname === link.href : pathname.startsWith(link.href);
                    return (
                      <li key={link.name} className="group relative">
                        <Link
                           href={link.href}
                          onClick={() => setMobileOpen(false)}
                          className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors mb-1 ${ isActive ? "bg-blue-600/30 text-white" : "text-gray-400 hover:bg-white/5 hover:text-white"} ${isCollapsed ? 'md:justify-center' : ''}`}
                        >
                          <link.icon className="w-5 h-5 flex-shrink-0" />
                          <span className={`whitespace-nowrap transition-opacity duration-200 ${isCollapsed ? 'md:opacity-0 md:hidden group-hover:md:inline-block group-hover:md:absolute group-hover:md:left-20 group-hover:md:bg-gray-800 group-hover:md:px-2 group-hover:md:py-1 group-hover:md:rounded-md' : 'opacity-100'}`}>
                            {link.name}
                          </span>
                        </Link>
                        {link.name === "Bildirimler" && notificationCount > 0 && (
                         <div className={`absolute top-2 transition-all duration-200 flex items-center justify-center text-xs font-bold text-white bg-red-600 rounded-full ${isCollapsed ? 'right-4 h-5 w-5' : 'right-4 h-6 w-6'}`}>
                                {notificationCount}
                          </div>
                        )}
                      </li>
                    );
                  })}
                </ul>
              </div>
            </div>

            <div className="px-2 my-2"><div className="border-t border-white/10"></div></div>

            {/* Envanter Dropdown */}
            <div>
              <div className={`transition-opacity duration-200 ${isCollapsed ? 'md:opacity-0 md:hidden' : 'opacity-100'}`}>
                  <button
                      onClick={() => setIsInventoryOpen(!isInventoryOpen)}
                      className={`flex items-center justify-between w-full px-4 py-3 rounded-lg text-white hover:bg-white/5 transition-colors ${isInventoryOpen && !isCollapsed ? 'bg-white/5' : ''}`}
                  >
                      <div className="flex items-center gap-3">
                        <Archive size={18} />
                        <span className="font-semibold text-sm">Envanter</span>
                      </div>
                      {isInventoryOpen ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                  </button>
              </div>
              <div className={`overflow-hidden transition-all duration-300 ease-in-out ${isInventoryOpen || isCollapsed ? 'max-h-[500px]' : 'max-h-0'}`}>
                <ul>
                    {inventoryLinks.map((link) => {
                      const isActive = pathname.startsWith(link.href);
                      return (
                        <li key={link.name} className="group relative">
                          <Link
                            href={link.href}
                            onClick={() => setMobileOpen(false)}
                            className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors mb-1 ${ isActive ? "bg-blue-600/30 text-white" : "text-gray-400 hover:bg-white/5 hover:text-white"} ${isCollapsed ? 'md:justify-center' : ''}`}
                          >
                            <link.icon className="w-5 h-5 flex-shrink-0" />
                            <span className={`whitespace-nowrap transition-opacity duration-200 ${isCollapsed ? 'md:opacity-0 md:hidden group-hover:md:inline-block group-hover:md:absolute group-hover:md:left-20 group-hover:md:bg-gray-800 group-hover:md:px-2 group-hover:md:py-1 group-hover:md:rounded-md' : 'opacity-100'}`}>
                              {link.name}
                            </span>
                          </Link>
                        </li>
                      );
                    })}
                </ul>
              </div>
            </div>
                     <div className="px-2 my-2"><div className="border-t border-white/10"></div></div>
            {/* YENİ: Performans İzleme Dropdown */}
            <div>
              <div className={`transition-opacity duration-200 ${isCollapsed ? 'md:opacity-0 md:hidden' : 'opacity-100'}`}>
                  <button
                      onClick={() => setIsPerformanceOpen(!isPerformanceOpen)}
                      className={`flex items-center justify-between w-full px-4 py-3 rounded-lg text-white hover:bg-white/5 transition-colors ${isPerformanceOpen && !isCollapsed ? 'bg-white/5' : ''}`}
                  >
                      <div className="flex items-center gap-3">
                        <TrendingUp size={18} />
                        <span className="font-semibold text-sm">Performans İzleme</span>
                      </div>
                      {isPerformanceOpen ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                  </button>
              </div>
              <div className={`overflow-hidden transition-all duration-300 ease-in-out ${isPerformanceOpen || isCollapsed ? 'max-h-[500px]' : 'max-h-0'}`}>
                <ul>
                    {performanceLinks.map((link) => {
                      const isActive = pathname.startsWith(link.href);
                      return (
                        <li key={link.name} className="group relative">
                          <Link
                            href={link.href}
                            onClick={() => setMobileOpen(false)}
                            className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors mb-1 ${ isActive ? "bg-blue-600/30 text-white" : "text-gray-400 hover:bg-white/5 hover:text-white"} ${isCollapsed ? 'md:justify-center' : ''}`}
                          >
                            <link.icon className="w-5 h-5 flex-shrink-0" />
                            <span className={`whitespace-nowrap transition-opacity duration-200 ${isCollapsed ? 'md:opacity-0 md:hidden group-hover:md:inline-block group-hover:md:absolute group-hover:md:left-20 group-hover:md:bg-gray-800 group-hover:md:px-2 group-hover:md:py-1 group-hover:md:rounded-md' : 'opacity-100'}`}>
                              {link.name}
                            </span>
                          </Link>
                        </li>
                      );
                    })}
                </ul>
              </div>
            </div>

            <div className="px-2 my-2"><div className="border-t border-white/10"></div></div>

            <ul>
              <li className="group relative">
                    <Link
                        href={aykaKasaLink.href}
                        onClick={() => setMobileOpen(false)}
                        className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors mb-1 ${ pathname.startsWith(aykaKasaLink.href) ? "bg-blue-600/30 text-white" : "text-white hover:bg-white/5"} ${isCollapsed ? 'md:justify-center' : ''}`}
                    >
                        <aykaKasaLink.icon className="w-5 h-5 flex-shrink-0" />
                        <span className={`whitespace-nowrap transition-opacity duration-200 ${isCollapsed ? 'md:opacity-0 md:hidden group-hover:md:inline-block group-hover:md:absolute group-hover:md:left-20 group-hover:md:bg-gray-800 group-hover:md:px-2 group-hover:md:py-1 group-hover:md:rounded-md' : 'opacity-100'}`}>
                        {aykaKasaLink.name}
                        </span>
                    </Link>
                </li>
            </ul>

            {profile?.role === 'admin' && (
              <>
                <div className="px-2 my-2"><div className="border-t border-white/10"></div></div>
                <div className={`px-4 mt-2 mb-2 text-xs font-semibold text-gray-200 uppercase transition-opacity duration-200 ${isCollapsed ? 'md:opacity-0 md:hidden' : 'opacity-100'}`}>Yönetim</div>
                <ul>
                   {adminLinks.map((link) => {
                    const isActive = pathname.startsWith(link.href);
                    return (
                       <li key={link.name} className="group">
                         <Link
                          href={link.href}
                          onClick={() => setMobileOpen(false)}
                          className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors mb-1 ${ isActive ? "bg-blue-600/30 text-white" : "text-gray-400 hover:bg-white/5 hover:text-white"} ${isCollapsed ? 'md:justify-center' : ''}`}
                        >
                          <link.icon className="w-5 h-5 flex-shrink-0" />
                          <span className={`whitespace-nowrap transition-opacity duration-200 ${isCollapsed ? 'md:opacity-0 md:hidden group-hover:md:inline-block group-hover:md:absolute group-hover:md:left-20 group-hover:md:bg-gray-800 group-hover:md:px-2 group-hover:md:py-1 group-hover:md:rounded-md' : 'opacity-100'}`}>
                            {link.name}
                          </span>
                        </Link>
                       </li>
                    );
                   })}
                </ul>
              </>
            )}
          </nav>
          
          <div className="p-4 border-t border-white/10">
            <button 
              onClick={() => setIsCollapsed(!isCollapsed)} 
              className="hidden md:flex items-center justify-center w-full gap-3 px-4 py-3 rounded-lg text-gray-300 hover:bg-white/5 hover:text-white transition-colors"
            >
              {isCollapsed ? <ChevronsRight className="w-5 h-5"/> : <ChevronsLeft className="w-5 h-5"/>}
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}