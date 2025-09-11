"use client";

import { useState, useActionState, useEffect } from "react";
import { useFormStatus } from "react-dom";
import GlassCard from "@/components/GlassCard";
import { createLeaveRequest, login, type LoginState } from "./actions";
import toast from "react-hot-toast";
import Image from "next/image";

function LoginSubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button 
      type="submit" 
      disabled={pending} 
      className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-4 rounded-lg transition-colors disabled:bg-green-800 disabled:cursor-not-allowed"
    >
      {pending ? "Giriş Yapılıyor..." : "Giriş Yap"}
    </button>
  );
}

const codeSnippet = `
// Ayka Enerji İK Yönetim Portalı v2.0 Başlatılıyor...
[SYSTEM_BOOT] :: Kernel loaded. Verifying system integrity...
[SYSTEM_BOOT] :: Filecheck on /dev/sys... OK
[SYSTEM_BOOT] :: Memory integrity... PASS
[NETWORK_INIT] :: Initializing network interface (eth0)...
[NETWORK_INIT] :: Requesting DHCP lease... IP 10.20.30.5 assigned.
[NETWORK_INIT] :: Pinging gateway (10.20.30.1)... 3ms OK.
[NETWORK_INIT] :: DNS resolved. Secure connection to api.aykaenerji.com established.

// Core Services Initializing...
function initializeCoreServices() {
  console.log("[SERVICE_LOADER] :: Core services starting...");
  loadAuthenticationModule();
  setupDatabaseConnection('main_cluster');
  initializeScheduler();
  console.log("[SERVICE_LOADER] :: All core services are running.");
  return { status: "online", activeServices: 4 };
}

function loadAuthenticationModule() {
  console.log("[AUTH_MODULE] :: Authentication module loading... Done.");
  console.log("[AUTH_MODULE] :: User permission service (ACL) initialized.");
}

function setupDatabaseConnection(cluster) {
  console.log(\`[DATABASE] :: Connecting to PostgreSQL cluster: \${cluster}\`);
  console.log("[DATABASE] :: Connection successful. RLS policies enabled.");
}

function initializeScheduler() {
    console.log("[SCHEDULER] :: Task scheduler for automated reports started.");
}

// Starting services...
initializeCoreServices();

// Human Resources Module Bootstrapping
class HumanResourcesModule {
    constructor() {
        this.personnelCount = 0;
        this.pendingRequests = 0;
        console.log("[HR_MODULE] :: Human Resources module initialized.");
    }

    loadPersonnelData() {
        this.personnelCount = 584; // Simulating data load
        console.log(\`[HR_MODULE] :: \${this.personnelCount} active personnel records loaded.\`);
    }

    syncLeaveRequests() {
        this.pendingRequests = 12; // Simulating sync
        console.log(\`[HR_MODULE] :: \${this.pendingRequests} pending leave requests synced.\`);
    }

    startTimesheetGenerator() {
        console.log("[HR_MODULE] :: Automated timesheet (puantaj) generator is active.");
    }
}

const hrModule = new HumanResourcesModule();
hrModule.loadPersonnelData();
hrModule.syncLeaveRequests();
hrModule.startTimesheetGenerator();

// Frontend Initialization
console.log("[UI_ENGINE] :: Bootstrapping frontend framework (Next.js)...");
console.log("[UI_ENGINE] :: Rendering main application layout...");
console.log("[UI_ENGINE] :: Hydrating interactive components... Done.");

console.log("-----------------------------------------");
console.log("AYKA ENERJI PORTAL IS FULLY OPERATIONAL.");
console.log("SYSTEM READY. AWAITING USER AUTHENTICATION...");
// Copyright Ayka Enerji © 2025
`;

export default function LoginPage() {
  const [activeTab, setActiveTab] = useState<"personel" | "yetkili">("personel");
  const [personnelFormKey, setPersonnelFormKey] = useState(0);
  const [tc, setTc] = useState("");
  const [personnelEmail, setPersonnelEmail] = useState("");
  const [displayedCode, setDisplayedCode] = useState("");
  const [isTypingComplete, setIsTypingComplete] = useState(false);

  useEffect(() => {
    let currentIndex = 0;
    let isMounted = true; 

    const type = () => {
      if (!isMounted || currentIndex >= codeSnippet.length) {
        setIsTypingComplete(true);
        return;
      }

      if (Math.random() < 0.015 && currentIndex > 10) {
        const backspaceCount = Math.floor(Math.random() * 8) + 3;
        let deleted = 0;

        const backspace = () => {
          if (deleted < backspaceCount && currentIndex > 0) {
            setDisplayedCode(prev => prev.slice(0, -1));
            currentIndex--;
            deleted++;
            setTimeout(backspace, 40); // Geri silme hızı
          } else {
            setTimeout(type, 300);
          }
        };
        
        setTimeout(backspace, 150);
        return;
      }

      const char = codeSnippet[currentIndex];
      setDisplayedCode(prev => prev + char);
      currentIndex++;
      
      let delay = Math.random() * (20 - 15) + 1; // Normal yazma hızı

      if (['.', ',', ';', '{', '}'].includes(char)) {
        delay = Math.random() * (400 - 200) + 200;
      }
      if (char === '\n') {
        delay = 100;
      }

      setTimeout(type, delay);
    };

    setTimeout(type, 500);

    return () => {
      isMounted = false;
    };
  }, []);

  const initialState: LoginState = { message: null };
  const [loginState, loginFormAction] = useActionState(login, initialState);

  const handleLeaveRequestSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const result = await createLeaveRequest(formData);

    if (result.success) {
      toast.success(result.message);
      setPersonnelFormKey(prevKey => prevKey + 1);
      setTc("");
      setPersonnelEmail("");
    } else {
      toast.error(result.message);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4 relative overflow-hidden">
      
      {/* ----- ARKA PLAN GÖRSELİ İÇİN YENİ DİV BAŞLANGICI ----- */}
      <div 
        className="absolute inset-0 bg-cover bg-center" 
        style={{ 
          backgroundImage: "url('/wallpaper2.png')",
          filter: 'blur(5px)', // SADECE BU DİV'İ BULANIKLAŞTIRIYORUZ
          transform: 'scale(1.05)' // Bulanıklık kenarlarını gizlemek için biraz büyütüyoruz
        }}
      ></div>
      {/* ----- ARKA PLAN GÖRSELİ İÇİN YENİ DİV SONU ----- */}

      {/* Kod animasyonu için div */}
      <div className="absolute inset-0 z-0 overflow-hidden">
        <pre className={`text-green-400 text-xs sm:text-sm md:text-md lg:text-lg opacity-50 font-mono whitespace-pre-wrap typing-code ${isTypingComplete ? '' : 'typing-cursor'}`}>
          {displayedCode}
        </pre>
      </div>

      <main className="w-full max-w-md relative z-10">
        <GlassCard 
          tintValue={0}
          blurPx={2} 
          borderRadiusPx={24} 
          grainOpacity={0}
        >
          <div className="flex justify-center mb-8">
            <Image
              src="/sidebarlogo.png"
              alt="Portal Logosu"
              width={240}
              height={66}
            />
          </div>
          <div className="flex bg-white/10 rounded-lg p-1 mb-6">
            <button 
              onClick={() => setActiveTab("personel")} 
              className={`w-full p-2 rounded-md text-sm font-medium transition-colors ${activeTab === "personel" ? "bg-white/20 text-white" : "text-gray-300 hover:bg-white/5"}`}
            >
              Personel İzin Talebi
            </button>
            <button 
              onClick={() => setActiveTab("yetkili")} 
              className={`w-full p-2 rounded-md text-sm font-medium transition-colors ${activeTab === "yetkili" ? "bg-white/20 text-white" : "text-gray-300 hover:bg-white/5"}`}
            >
              Yetkili Girişi
            </button>
          </div>
          {activeTab === "personel" ? (
            <form key={personnelFormKey} onSubmit={handleLeaveRequestSubmit} className="space-y-4">
              <div>
                <label htmlFor="tc" className="block text-sm font-medium text-gray-200 mb-1">T.C. Kimlik Numarası</label>
                <input type="text" id="tc" name="tc" maxLength={11} required value={tc} onChange={(e) => setTc(e.target.value)} className="w-full bg-white/10 border border-white/20 rounded-lg p-3 text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:outline-none" placeholder="11 haneli T.C. kimlik numaranız" />
              </div>
              <div>
                <label htmlFor="email_personel" className="block text-sm font-medium text-gray-200 mb-1">E-posta Adresi</label>
                <input type="email" id="email_personel" name="email_personel" required value={personnelEmail} onChange={(e) => setPersonnelEmail(e.target.value)} className="w-full bg-white/10 border border-white/20 rounded-lg p-3 text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:outline-none" placeholder="sistemde kayıtlı e-postanız" />
              </div>

              <div>
                <label htmlFor="leave_type" className="block text-sm font-medium text-gray-200 mb-1">İzin Türü</label>
                <select name="leave_type" id="leave_type" required className="w-full bg-black/20 p-3 rounded-lg border border-white/10 focus:ring-2 focus:ring-blue-500 focus:outline-none">
                  <option value="">Seçiniz...</option>
                  <option value="yıllık izin">Yıllık İzin</option>
                  <option value="ücretli izin">Ücretli İzin (Mazeret)</option>
                  <option value="ücretsiz izin">Ücretsiz İzin</option>
                  <option value="raporlu">Raporlu (İstirahat)</option>
                </select>
              </div>
  
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="w-full sm:w-1-2">
                  <label htmlFor="start_date" className="block text-sm font-medium text-gray-200 mb-1">Başlangıç Tarihi</label>
                  <input name="start_date" id="start_date" type="date" required className="w-full bg-white/10 border border-white/20 rounded-lg p-3 text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:outline-none [color-scheme:dark]" />
                </div>
                <div className="w-full sm:w-1/2">
                  <label htmlFor="end_date" className="block text-sm font-medium text-gray-200 mb-1">Bitiş Tarihi</label>
                  <input name="end_date" id="end_date" type="date" required className="w-full bg-white/10 border border-white/20 rounded-lg p-3 text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:outline-none [color-scheme:dark]" />
                </div>
              </div>
              <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-lg">
                İzin Talebi Oluştur
              </button>
            </form>
          ) : (
            <form action={loginFormAction} className="space-y-4">
                <div>
                  <label htmlFor="email_yetkili" className="block text-sm font-medium text-gray-200 mb-1">E-posta Adresi</label>
                  <input type="email" id="email_yetkili" name="email" required className="w-full bg-white/10 border border-white/20 rounded-lg p-3 text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:outline-none" placeholder="ornek@sirket.com" />
                </div>
                <div>
                  <label htmlFor="password"  className="block text-sm font-medium text-gray-200 mb-1">Şifre</label>
                  <input type="password" id="password" name="password" required className="w-full bg-white/10 border border-white/20 rounded-lg p-3 text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:outline-none" placeholder="••••••••" />
                </div>
    
                {loginState?.message && <p className="text-sm text-red-400 text-center">{loginState.message}</p>}
                <LoginSubmitButton />
             </form>
          )}
        </GlassCard>
      </main>
    </div>
  );
}