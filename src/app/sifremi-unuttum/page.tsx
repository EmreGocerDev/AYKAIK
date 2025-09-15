"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { requestPasswordReset } from "@/app/aykasosyal/actions";
import GlassCard from "@/components/GlassCard";
import Link from "next/link";
import { Mail, ArrowLeft } from "lucide-react";

function SubmitButton() {
    const { pending } = useFormStatus();
    return (
        <button type="submit" disabled={pending} className="w-full bg-cyan-600 hover:bg-cyan-700 text-white font-bold py-3 px-4 rounded-lg disabled:opacity-50">
            {pending ? 'Gönderiliyor...' : 'Sıfırlama Bağlantısı Gönder'}
        </button>
    );
}

export default function ForgotPasswordPage() {
    // DÜZELTME: message: null -> message: ''
    const [state, formAction] = useActionState(requestPasswordReset, { success: false, message: '' });

    return (
        <div className="min-h-screen w-full flex items-center justify-center p-4 bg-gray-900" style={{ backgroundImage: "url('/wallpaper2.png')", backgroundSize: 'cover', backgroundPosition: 'center' }}>
            <main className="w-full max-w-md">
                <GlassCard tintValue={-5} blurPx={16} grainOpacity={0} borderRadiusPx={16}>
                    {state.success ? (
                        <div className="text-center">
                            <Mail size={48} className="mx-auto text-green-400 mb-4"/>
                            <h2 className="text-xl font-bold">Lütfen E-postanızı Kontrol Edin</h2>
                            <p className="text-gray-300 mt-2">{state.message}</p>
                            <Link href="/" className="mt-6 inline-flex items-center gap-2 text-cyan-400 hover:underline">
                                <ArrowLeft size={16}/> Giriş Ekranına Dön
                            </Link>
                        </div>
                    ) : (
                        <form action={formAction} className="space-y-4">
                            <h2 className="text-2xl font-bold">Şifreni mi Unuttun?</h2>
                            <p className="text-gray-300">Sorun değil. AykaSosyal hesabınıza ait e-posta adresini girin, size yeni bir şifre belirlemeniz için bir bağlantı göndereceğiz.</p>
                            <div>
                                <label htmlFor="email" className="sr-only">E-posta Adresi</label>
                                <input type="email" id="email" name="email" required className="w-full bg-white/10 border border-white/20 rounded-lg p-3 text-white" placeholder="E-posta adresiniz"/>
                            </div>
                            {state.message && <p className="text-sm text-red-400 text-center">{state.message}</p>}
                            <SubmitButton />
                            <div className="text-center">
                                <Link href="/" className="text-sm text-cyan-400 hover:underline">Giriş Ekranına Geri Dön</Link>
                            </div>
                        </form>
                    )}
                </GlassCard>
            </main>
        </div>
    );
}