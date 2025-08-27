"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import GlassCard from "@/components/GlassCard";
import { supabase } from "@/lib/supabaseClient";

export default function LoginPage() {
  // DÜZELTME: "yetili" -> "yetkili" olarak düzeltildi.
  const [activeTab, setActiveTab] = useState<"personel" | "yetkili">("personel");
  const router = useRouter();

  // Yetkili girişi için state'ler
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Personel formu için state'ler
  const [tc, setTc] = useState("");
  const [personnelEmail, setPersonnelEmail] = useState("");
  
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const { error } = await supabase.auth.signInWithPassword({
      email: email,
      password: password,
    });

    if (error) {
      setError(error.message);
    } else {
      router.push("/dashboard");
    }
    setLoading(false);
  };
  
  return (
    <div
      className="min-h-screen w-full flex items-center justify-center p-4 bg-cover bg-center"
      style={{ backgroundImage: "url('/backgrounds/bg1.jpg')" }}
    >
      <main className="w-full max-w-md">
        <GlassCard opacity={15} blurPx={16} borderRadiusPx={16}>
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-white">İK Yönetim Portalı</h1>
            <p className="text-gray-300 mt-2">İzin süreçlerinizi kolayca yönetin.</p>
          </div>

          <div className="flex bg-white/10 rounded-lg p-1 mb-6">
            <button
              onClick={() => setActiveTab("personel")}
              className={`w-1/2 p-2 rounded-md text-sm font-medium transition-colors ${
                activeTab === "personel" ? "bg-white/20 text-white" : "text-gray-300 hover:bg-white/5"
              }`}
            >
              Personel İzin Talebi
            </button>
            <button
              onClick={() => setActiveTab("yetkili")}
              className={`w-1/2 p-2 rounded-md text-sm font-medium transition-colors ${
                activeTab === "yetkili" ? "bg-white/20 text-white" : "text-gray-300 hover:bg-white/5"
              }`}
            >
              Yetkili Girişi
            </button>
          </div>

          {activeTab === "personel" ? (
            <form className="space-y-4">
              <div>
                <label htmlFor="tc" className="block text-sm font-medium text-gray-200 mb-1">
                  T.C. Kimlik Numarası
                </label>
                <input
                  type="text"
                  id="tc"
                  name="tc"
                  maxLength={11}
                  value={tc}
                  onChange={(e) => setTc(e.target.value)}
                  className="w-full bg-white/10 border border-white/20 rounded-lg p-3 text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  placeholder="11 haneli T.C. kimlik numaranız"
                />
              </div>
              <div>
                <label htmlFor="email_personel" className="block text-sm font-medium text-gray-200 mb-1">
                  E-posta Adresi
                </label>
                <input
                  type="email"
                  id="email_personel"
                  name="email"
                  value={personnelEmail}
                  onChange={(e) => setPersonnelEmail(e.target.value)}
                  className="w-full bg-white/10 border border-white/20 rounded-lg p-3 text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  placeholder="sistemde kayıtlı e-postanız"
                />
              </div>
              <button
                type="submit"
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-lg transition-colors"
              >
                İzin Talebi Oluştur
              </button>
            </form>
          ) : (
            <form className="space-y-4" onSubmit={handleLogin}>
              <div>
                <label
                  htmlFor="email_yetkili"
                  className="block text-sm font-medium text-gray-200 mb-1"
                >
                  E-posta Adresi
                </label>
                <input
                  type="email"
                  id="email_yetkili"
                  name="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-white/10 border border-white/20 rounded-lg p-3 text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  placeholder="ornek@sirket.com"
                  required
                />
              </div>
              <div>
                <label
                  htmlFor="password"
                  className="block text-sm font-medium text-gray-200 mb-1"
                >
                  Şifre
                </label>
                <input
                  type="password"
                  id="password"
                  name="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-white/10 border border-white/20 rounded-lg p-3 text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  placeholder="••••••••"
                  required
                />
              </div>
              {error && <p className="text-sm text-red-400 text-center">{error}</p>}
              <button
                type="submit"
                className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-4 rounded-lg transition-colors disabled:bg-green-800"
                disabled={loading}
              >
                {loading ? "Giriş Yapılıyor..." : "Giriş Yap"}
              </button>
            </form>
          )}
        </GlassCard>
      </main>
    </div>
  );
}