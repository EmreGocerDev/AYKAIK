"use client";

import { useState, useEffect } from "react";
import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import GlassCard from "@/components/GlassCard";
import { login, type LoginState } from "./actions";
import { aykaSocialLogin, aykaSocialRegister } from "./aykasosyal/actions"; 
import toast from "react-hot-toast";
import Image from "next/image";
import Link from "next/link";

// --- YARDIMCI BİLEŞENLER ---

// İK Portalı için Giriş Butonu
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

// AykaSosyal için Giriş/Kayıt Butonu
function AykaSocialSubmitButton({ mode }: { mode: 'login' | 'register' }) {
    const { pending } = useFormStatus();
    const text = mode === 'login' ? 'Giriş Yap' : 'Kayıt Ol';
    const pendingText = mode === 'login' ? 'Giriş Yapılıyor...' : 'Kayıt Olunuyor...';

    return (
        <button type="submit" disabled={pending} className="w-full bg-cyan-600 hover:bg-cyan-700 text-white font-bold py-3 px-4 rounded-lg transition-colors disabled:bg-cyan-800 disabled:cursor-not-allowed">
            {pending ? pendingText : text}
        </button>
    );
}

// AykaSosyal için tam işlevsel form bileşeni
function AykaSocialLoginRegisterForm() {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [loginState, loginAction] = useActionState(aykaSocialLogin, { success: false, message: '' });
  const [registerState, registerAction] = useActionState(aykaSocialRegister, { success: false, message: '' });

  useEffect(() => {
    if (registerState.success) {
      toast.success(registerState.message || "Kayıt başarılı!");
      setMode('login');
    }
  }, [registerState]);

  return (
    <div className="space-y-4">
      <h3 className="text-xl font-bold text-center text-white">
        AykaSosyal&apos;e {mode === 'login' ? 'Giriş Yap' : 'Kayıt Ol'}
      </h3>
      {mode === 'login' ? (
        <form action={loginAction} className="space-y-4">
          <input type="email" name="email" required className="w-full bg-white/10 border border-white/20 rounded-lg p-3 text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:outline-none" placeholder="E-posta Adresiniz" />
          <input type="password" name="password" required 
            className="w-full bg-white/10 border border-white/20 rounded-lg p-3 text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:outline-none" placeholder="Şifreniz" />
          {loginState?.message && !loginState.success && <p className="text-sm text-red-400 text-center">{loginState.message}</p>}
          <AykaSocialSubmitButton mode="login" />
          <p className="text-center text-sm text-gray-300">
            Hesabın yok mu?{' '}
            <button type="button" onClick={() => setMode('register')} className="font-semibold text-cyan-400 hover:underline">Kayıt Ol</button>
          </p>
        </form>
      ) : (
        <form action={registerAction} className="space-y-4">
          <input name="tc_kimlik_no" required maxLength={11} className="w-full bg-white/10 border border-white/20 rounded-lg p-3 text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:outline-none" placeholder="T.C. Kimlik Numaranız" />
          <input name="full_name" required className="w-full bg-white/10 border border-white/20 rounded-lg p-3 text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:outline-none" placeholder="Adınız Soyadınız" />
          <input name="username" required className="w-full bg-white/10 border border-white/20 rounded-lg p-3 text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:outline-none" placeholder="Kullanıcı Adı (benzersiz)" />
          <input type="email" name="email" required className="w-full bg-white/10 border border-white/20 rounded-lg p-3 text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:outline-none" placeholder="E-posta Adresiniz" />
          <input type="password" name="password" required className="w-full bg-white/10 border border-white/20 rounded-lg p-3 text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:outline-none" placeholder="Şifreniz" />
          {registerState?.message && !registerState.success && <p className="text-sm text-red-400 text-center">{registerState.message}</p>}
          <AykaSocialSubmitButton mode="register" />
          <p className="text-center text-sm text-gray-300">
            Zaten bir hesabın var mı?{' '}
            <button type="button" onClick={() => setMode('login')} className="font-semibold text-cyan-400 hover:underline">Giriş Yap</button>
          </p>
        </form>
      )}
       <p className="text-center text-xs text-gray-400 mt-2">
            <Link href="/sifremi-unuttum" className="hover:underline">Şifremi unuttum</Link>
       </p>
    </div>
  );
}

// --- ANA LOGIN SAYFASI BİLEŞENİ ---

const codeSnippet = `
// Ayka Enerji İK Yönetim Portalı v2.0 Başlatılıyor...
[SYSTEM_BOOT] :: Kernel loaded.
Verifying system integrity...
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
        this.personnelCount = 584;
        console.log(\`[HR_MODULE] :: \${this.personnelCount} active personnel records loaded.\`);
    }
    syncLeaveRequests() {
        this.pendingRequests = 12;
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
  // Varsayılan sekme "yetkili" olarak değiştirildi.
  const [activeTab, setActiveTab] = useState<"yetkili" | "aykasosyal">("yetkili");
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
            setTimeout(backspace, 40);
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
      let delay = Math.random() * (20 - 15) + 1;
      
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

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4 relative overflow-hidden">
      <div 
        className="absolute inset-0 bg-cover bg-center" 
        style={{ backgroundImage: "url('/wallpaper2.png')", filter: 'blur(5px)', transform: 'scale(1.05)' }}
      ></div>

      <div className="absolute inset-0 z-0 overflow-hidden">
        <pre className={`text-green-400 text-xs sm:text-sm md:text-md lg:text-lg opacity-50 font-mono whitespace-pre-wrap typing-code ${isTypingComplete ? '' : 'typing-cursor'}`}>
          {displayedCode}
        </pre>
      </div>

      <main className="w-full max-w-md relative z-10">
        <GlassCard 
          tintValue={0} blurPx={2} borderRadiusPx={24} grainOpacity={0}
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
            {/* İzin Talebi sekmesi kaldırıldı */}
            <button 
              onClick={() => setActiveTab("yetkili")} 
              className={`w-full p-2 rounded-md text-sm font-medium transition-colors ${activeTab === "yetkili" ? "bg-white/20 text-white" : "text-gray-300 hover:bg-white/5"}`}
            >
              Yetkili Girişi
            </button>
            <button 
              onClick={() => setActiveTab("aykasosyal")} 
              className={`w-full p-2 rounded-md text-sm font-medium transition-colors ${activeTab === "aykasosyal" ? "bg-white/20 text-white" : "text-gray-300 hover:bg-white/5"}`}
            >
              AykaSosyal
            </button>
          </div>
          {/* İzin talebi formu ve mantığı kaldırıldı */}
          {activeTab === 'yetkili' ? (
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
          ) : (
            <AykaSocialLoginRegisterForm />
          )}
        </GlassCard>
      </main>
   </div>
  );
}