"use client";

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
        <button type="submit" disabled={pending} className="w-full bg-cyan-600 hover:bg-cyan-700 text-white font-bold py-3 px-4 rounded-lg disabled:opacity-50">
            {pending ? 'Kaydediliyor...' : 'Yeni Şifreyi Kaydet'}
        </button>
    );
}

export default function ResetPasswordPage() {
    // DÜZELTME: message: null -> message: ''
    const [state, formAction] = useActionState(resetPassword, { success: false, message: '' });
    const searchParams = useSearchParams();
    const token = searchParams.get('token');

    if (!token) {
        return (
             <div className="min-h-screen w-full flex items-center justify-center p-4 bg-gray-900" style={{ backgroundImage: "url('/wallpaper2.png')", backgroundSize: 'cover', backgroundPosition: 'center' }}>
                <GlassCard tintValue={-5} blurPx={16} grainOpacity={0} borderRadiusPx={16} className="text-center">
                    <h2 className="text-xl font-bold text-red-400">Geçersiz Bağlantı</h2>
                    <p className="text-gray-300 mt-2">Şifre sıfırlama bağlantısı eksik veya hatalı.</p>
                    <Link href="/sifremi-unuttum" className="mt-4 inline-block text-cyan-400 hover:underline">Tekrar deneyin</Link>
                </GlassCard>
            </div>
        )
    }

    return (
        <div className="min-h-screen w-full flex items-center justify-center p-4 bg-gray-900" style={{ backgroundImage: "url('/wallpaper2.png')", backgroundSize: 'cover', backgroundPosition: 'center' }}>
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
        </div>
    );
}