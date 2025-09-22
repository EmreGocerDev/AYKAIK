// YOL: src/app/dashboard/layout.tsx

"use client";
import { useState, useEffect } from 'react';
import Sidebar from '@/components/Sidebar';
import SettingsModal from '@/components/SettingsModal';
import "react-grid-layout/css/styles.css";
import "react-resizable/css/styles.css";
import { Menu } from 'lucide-react';
import { SettingsProvider, useSettings } from '@/contexts/SettingsContext';
import { signOutUser } from '@/app/actions';
import AiAssistant from '@/components/AiAssistant';

const LoadingScreen = ({ isLoading }: { isLoading: boolean }) => (
  <div className={`loader-screen ${!isLoading ? 'hidden' : ''}`}>
    <div className="ai-matrix-loader">
      <div className="digit">0</div>
      <div className="digit">1</div>
      <div className="digit">0</div>
      <div className="digit">1</div>
      <div className="digit">1</div>
      <div className="digit">0</div>
      <div className="digit">0</div>
      <div className="digit">1</div>
      <div className="glow"></div>
    </div>
  </div>
);

function DashboardContainer({ children }: { children: React.ReactNode }) {
  const { bg, isLoading, playSound, profile } = useSettings();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    const welcomeSoundPlayed = sessionStorage.getItem('welcomeSoundPlayed');
    if (!isLoading && !welcomeSoundPlayed) {
      playSound('/sounds/login-success.mp3');
      sessionStorage.setItem('welcomeSoundPlayed', 'true');
    }
  }, [isLoading, playSound]);

  const handleLogout = async () => {
    await signOutUser();
  };

  if (!isMounted) {
    return (
      <div className="loader-screen">
         <div className="ai-matrix-loader">
          <div className="digit">0</div>
          <div className="digit">1</div>
          <div className="digit">0</div>
          <div className="digit">1</div>
          <div className="digit">1</div>
          <div className="digit">0</div>
          <div className="digit">0</div>
          <div className="digit">1</div>
          <div className="glow"></div>
        </div>
      </div>
    );
  }

  return (
    <>
      <LoadingScreen isLoading={isLoading} />
      
      <div 
        className="relative min-h-screen w-full bg-cover bg-center bg-fixed transition-all duration-500"
        style={{ backgroundImage: `url(${bg})` }}
      >
        <Sidebar 
          mobileOpen={mobileOpen} 
          setMobileOpen={setMobileOpen} 
          isCollapsed={isCollapsed}
          setIsCollapsed={setIsCollapsed}
        />
        <div className={`transition-all duration-300 ease-in-out ${isCollapsed ? 'md:pl-20' : 'md:pl-64'}`}>
          <header className="md:hidden sticky top-0 bg-gray-900/50 backdrop-blur-md p-4 border-b border-white/10 z-20 flex items-center gap-4">
              <button onClick={() => setMobileOpen(true)}>
                 <Menu className="text-white"/>
              </button>
              <h1 className="text-lg font-semibold text-white">AYKA MATRİX V0.0.2</h1>
          </header>
          <main>
            {children}
          </main>
        </div>

        <div className="fixed bottom-6 right-6 flex flex-col gap-3 z-30">
          {profile && (
            <button onClick={() => setSettingsOpen(true)} title="Arayüz Ayarları" className="p-3 rounded-full bg-white/10 backdrop-blur-md border-white/20 shadow-md hover:bg-white/20 transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 0 2.4l-.15.08a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l-.15.08a2 2 0 0 0 2.73-.73l-.22-.38a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1 0-2.4l.15-.08a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"></path><circle cx="12" cy="12" r="3"></circle></svg>
            </button>
          )}

          <AiAssistant/>
          
          <button onClick={handleLogout} title="Çıkış Yap" className="p-3 rounded-full bg-red-600/50 hover:bg-red-600/80 text-white backdrop-blur-md border-white/20 shadow-md transition-colors">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>
          </button>
        </div>

       {settingsOpen && (
         <SettingsModal onClose={() => setSettingsOpen(false)} />
       )}
      </div>
    </>
  );
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <SettingsProvider>
      <DashboardContainer>{children}</DashboardContainer>
    </SettingsProvider>
  );
}