"use client";

import { Suspense } from 'react'; // Suspense'i import ediyoruz
import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { resetPassword } from "@/app/aykasosyal/actions";
import GlassCard from "@/components/GlassCard";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { KeyRound } from "lucide-react";

function SubmitButton() {
    const { pending } = useFormStatus();
    return (
        <button type="submit" disabled={pending} className="btn-save-animated w-full justify-center">
  <div className="svg-wrapper-1">
    <div className="svg-wrapper">
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="30" height="30" className="icon">
        <path d="M15 3H5a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2V7.5L16.5 3H15zm-3 13a3 3 0 11-6 0 3 3 0 016 0zM6 4h7v4H6V4z"></path>
      </svg>
    </div>
  </div>
  <span>{pending ? 'Kaydediliyor...' : 'Kaydet'}</span>
</button>
    );
}

// 1. ADIM: Sayfanın tüm mantığını ayrı bir bileşene taşıdık.
// useSearchParams artık bu bileşenin içinde olduğu için sorun çözülecek.
function ResetPasswordForm() {
    const [state, formAction] = useActionState(resetPassword, { success: false, message: '' });
    const searchParams = useSearchParams();
    const token = searchParams.get('token');

    if (!token) {
        return (
            <GlassCard tintValue={-5} blurPx={16} grainOpacity={0} borderRadiusPx={16} className="text-center">
                <h2 className="text-xl font-bold text-red-400">Geçersiz Bağlantı</h2>
                <p className="text-gray-300 mt-2">Şifre sıfırlama bağlantısı eksik veya hatalı.</p>
                <Link href="/sifremi-unuttum" className="mt-4 inline-block text-cyan-400 hover:underline">Tekrar deneyin</Link>
            </GlassCard>
        )
    }

    return (
        <main className="w-full max-w-md">
             <GlassCard tintValue={-5} blurPx={16} grainOpacity={0} borderRadiusPx={16}>
                 <form action={formAction} className="space-y-4">
                    <KeyRound size={40} className="mx-auto text-cyan-400"/>
                    <h2 className="text-2xl font-bold text-center">Yeni Şifre Belirle</h2>
                    <input type="hidden" name="token" value={token} />
                    <div>
                        <label htmlFor="password">Yeni Şifre</label>
                        <input type="password" name="password" required className="w-full bg-white/10 border border-white/20 rounded-lg p-3 mt-1"/>
                    </div>
                    <div>
                        <label htmlFor="confirmPassword">Yeni Şifre (Tekrar)</label>
                        <input type="password" name="confirmPassword" required className="w-full bg-white/10 border border-white/20 rounded-lg p-3 mt-1"/>
                    </div>
                    {state.message && !state.success && <p className="text-sm text-red-400 text-center">{state.message}</p>}
                    <SubmitButton/>
                </form>
             </GlassCard>
        </main>
    );
}

// 2. ADIM: Ana sayfa bileşenimiz artık Suspense sarmalayıcısını içeriyor.
export default function ResetPasswordPage() {
    // Bu ana bileşen artık useSearchParams kullanmıyor.
    return (
        <div className="min-h-screen w-full flex items-center justify-center p-4 bg-gray-900" style={{ backgroundImage: "url('/wallpaper2.png')", backgroundSize: 'cover', backgroundPosition: 'center' }}>
            <Suspense fallback={<div className="text-white text-xl">Yükleniyor...</div>}>
                <ResetPasswordForm />
            </Suspense>
        </div>
    );
}