"use client";

import { useState, useRef, useActionState } from "react";
import { useFormStatus } from "react-dom";
import GlassCard from "@/components/GlassCard";
import { createLeaveRequest, login, type LoginState } from "./actions";
import toast from "react-hot-toast";

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

export default function LoginPage() {
  const [activeTab, setActiveTab] = useState<"personel" | "yetkili">("personel");
  const [personnelFormKey, setPersonnelFormKey] = useState(0);
  const [tc, setTc] = useState("");
  const [personnelEmail, setPersonnelEmail] = useState("");

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
    <div className="min-h-screen w-full flex items-center justify-center p-4 bg-cover bg-center" style={{ backgroundImage: "url('/wallpaper1.png')" }}>
      <main className="w-full max-w-md">
        {/* GÜNCELLENDİ: GlassCard stilleri isteğiniz doğrultusunda değiştirildi. */}
        <GlassCard 
          tintValue={15} 
          blurPx={50} 
          borderRadiusPx={24} 
          grainOpacity={0}
        >
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-white">İK Yönetim Portalı</h1>
            <p className="text-gray-300 mt-2">İzin süreçlerinizi kolayca yönetin.</p>
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