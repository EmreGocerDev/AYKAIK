"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
// YENİ: Bell ikonu eklendi
import { Home, Calendar, Users, Briefcase, ChevronsLeft, ChevronsRight, Building2, Settings, Map, ClipboardList, UserCog, Bell } from 'lucide-react';
import { useSettings } from "@/contexts/SettingsContext";

// YENİ: Bildirimler linki eklendi
const navLinks = [
  { name: "Ana Panel", href: "/dashboard", icon: Home },
  { name: "Bildirimler", href: "/dashboard/notifications", icon: Bell },
  { name: "İzin Talepleri", href: "/dashboard/requests", icon: Briefcase },
  { name: "Personel Listesi", href: "/dashboard/personnel", icon: Users },
  { name: "Takvim", href: "/dashboard/calendar", icon: Calendar },
  { name: "Puantaj Cetveli", href: "/dashboard/timesheet", icon: ClipboardList }
];

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
  // YENİ: notificationCount context'ten alındı
  const { profile, tintValue, grainOpacity, blurPx, notificationCount } = useSettings();
  
  const grainEffectOpacity = grainOpacity / 100;
  const color = tintValue >= 0 ? '255, 255, 255' : '0, 0, 0';
  const alpha = Math.abs(tintValue) / 100;
  
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
          <div className="flex items-center justify-between p-4 h-[69px] border-b border-white/10">
            <div className={`flex items-center gap-2 overflow-hidden ${isCollapsed ? 'md:justify-center' : ''}`}>
              <Building2 className="w-8 h-8 flex-shrink-0" />
              <span className={`text-xl font-bold whitespace-nowrap transition-opacity duration-200 ${isCollapsed ? 'md:opacity-0 md:hidden' : 'opacity-100'}`}>İK Portalı</span>
            </div>
          </div>
          
          <nav className="flex-1 p-2 overflow-y-auto">
            <ul>
              {navLinks.map((link) => {
                const isActive = pathname === link.href;
                return (
                  <li key={link.name} className="group relative">
                    <Link
                      href={link.href}
                      onClick={() => setMobileOpen(false)}
                      className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors mb-2 ${
                        isActive ? "bg-blue-600/30 text-white" : "text-gray-300 hover:bg-white/5 hover:text-white"}
                         ${isCollapsed ? 'md:justify-center' : ''}`}
                    >
                      <link.icon className="w-5 h-5 flex-shrink-0" />
                      <span className={`whitespace-nowrap transition-opacity duration-200 ${isCollapsed ? 'md:opacity-0 md:hidden group-hover:md:inline-block group-hover:md:absolute group-hover:md:left-20 group-hover:md:bg-gray-800 group-hover:md:px-2 group-hover:md:py-1 group-hover:md:rounded-md' : 'opacity-100'}`}>
                        {link.name}
                      </span>
                    </Link>
                    {/* YENİ: Bildirim sayacı eklendi */}
                    {link.name === "Bildirimler" && notificationCount > 0 && (
                        <div className={`absolute top-2 transition-all duration-200 flex items-center justify-center text-xs font-bold text-white bg-red-600 rounded-full ${isCollapsed ? 'right-4 h-5 w-5' : 'right-4 h-6 w-6'}`}>
                            {notificationCount}
                        </div>
                    )}
                  </li>
                );
              })}
            </ul>

            {profile?.role === 'admin' && (
              <>
                <div className={`px-4 mt-4 mb-2 text-xs font-semibold text-gray-400 uppercase transition-opacity duration-200 ${isCollapsed ? 'md:opacity-0 md:hidden' : 'opacity-100'}`}>Yönetim</div>
                <ul>
                  {adminLinks.map((link) => {
                    const isActive = pathname === link.href;
                    return (
                      <li key={link.name} className="group">
                        <Link
                          href={link.href}
                          onClick={() => setMobileOpen(false)}
                          className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors mb-2 ${
                            isActive ? "bg-blue-600/30 text-white" : "text-gray-300 hover:bg-white/5 hover:text-white"}
                            ${isCollapsed ? 'md:justify-center' : ''}`}
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