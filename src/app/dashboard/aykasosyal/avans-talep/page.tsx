// YOL: src/app/dashboard/aykasosyal/avans-talep/page.tsx

"use client";

import { useActionState, useEffect, useRef } from "react";   // [cite: 826]
import { useFormStatus } from "react-dom";   // [cite: 826]
import { createAdvanceRequestForSocialUser } from "@/app/aykasosyal/actions";
import { useSettings } from "@/contexts/SettingsContext";   // [cite: 827]
import GlassCard from "@/components/GlassCard";   // [cite: 827]
import toast from "react-hot-toast";   // [cite: 827]
import { Wallet } from "lucide-react";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button 
      type="submit" 
      disabled={pending}
      className="flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors disabled:opacity-50 font-semibold"
    >
      <Wallet size={18} />
      {pending ? 'Talep Gönderiliyor...' : 'Avans Talebi Gönder'}
    </button>
  );
}

export default function CreateAdvanceRequestPage() {
  const { tintValue, blurPx, borderRadiusPx, grainOpacity } = useSettings();   // [cite: 831]
  const formRef = useRef<HTMLFormElement>(null);   // [cite: 831]
  const [state, formAction] = useActionState(createAdvanceRequestForSocialUser, { success: false, message: '' });

  useEffect(() => {
    if (state.message) {
      if (state.success) {
          toast.success(state.message); // [cite: 832]
        formRef.current?.reset();   // [cite: 832]
      } else {
        toast.error(state.message);   // [cite: 832]
      }
    }
  }, [state]);   // [cite: 832]

  return (
    <div className="p-4 md:p-8 text-white">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">Yeni Avans Talebi Oluştur</h1>
        <form action={formAction} ref={formRef}>
          <GlassCard {...{ tintValue, blurPx, borderRadiusPx, grainOpacity }}>
            <div className="space-y-6">
              <div>
                 <label htmlFor="amount" className="block text-sm font-medium text-gray-300 mb-1">Talep Edilen Miktar (TL)</label>
                <input 
                  name="amount" 
                  id="amount" 
                  type="number"
                  step="0.01"
                  required 
                  placeholder="Örn: 5000"
                  className="w-full bg-black/20 p-3 rounded-lg border border-white/10 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>
               <div>
                <label htmlFor="reason" className="block text-sm font-medium text-gray-300 mb-1">Açıklama (Opsiyonel)</label>
                <textarea 
                    name="reason" 
                    id="reason" 
                    placeholder="Avans talebinizin nedenini kısaca açıklayabilirsiniz..."
                    className="w-full bg-black/20 p-3 rounded-lg border border-white/10 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    rows={4}
                />
              </div>
            </div>
          </GlassCard>
          <div className="flex justify-end mt-6">
            <SubmitButton />
          </div>
        </form>
      </div>
    </div>
  );
}