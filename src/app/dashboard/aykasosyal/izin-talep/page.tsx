// YOL: src/app/dashboard/aykasosyal/izin-talep/page.tsx

"use client";

import { useActionState, useEffect, useRef } from "react";
import { useFormStatus } from "react-dom";
import { createLeaveRequestForSocialUser } from "@/app/aykasosyal/actions";
import { useSettings } from "@/contexts/SettingsContext";
import GlassCard from "@/components/GlassCard";
import toast from "react-hot-toast";
import { CalendarPlus } from "lucide-react";

// Form gönderim butonu için yardımcı bileşen
function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button 
      type="submit" 
      disabled={pending}
      className="flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors disabled:opacity-50 font-semibold"
    >
      <CalendarPlus size={18} />
      {pending ? 'Talep Oluşturuluyor...' : 'İzin Talebi Oluştur'}
    </button>
  );
}

export default function CreateLeaveRequestPage() {
  const { tintValue, blurPx, borderRadiusPx, grainOpacity } = useSettings();
  const formRef = useRef<HTMLFormElement>(null);
  
  // Düzeltme: `requestPasswordReset` yerine `createLeaveRequestForSocialUser` kullanılacak
  const [state, formAction] = useActionState(createLeaveRequestForSocialUser, { success: false, message: '' });

  useEffect(() => {
    if (state.message) {
      if (state.success) {
        toast.success(state.message);
        formRef.current?.reset(); // Formu temizle
      } else {
        toast.error(state.message);
      }
    }
  }, [state]);

  return (
    <div className="p-4 md:p-8 text-white">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">Yeni İzin Talebi Oluştur</h1>
        <form action={formAction} ref={formRef}>
          <GlassCard {...{ tintValue, blurPx, borderRadiusPx, grainOpacity }}>
            <div className="space-y-6">
              
              <div>
                <label htmlFor="leave_type" className="block text-sm font-medium text-gray-300 mb-1">İzin Türü</label>
                <select 
                  name="leave_type" 
                  id="leave_type" 
                  required 
                  className="w-full bg-black/20 p-3 rounded-lg border border-white/10 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                >
                  <option value="">Seçiniz...</option>
                  <option value="yıllık izin">Yıllık İzin</option>
                  <option value="ücretli izin">Ücretli İzin (Mazeret)</option>
                  <option value="ücretsiz izin">Ücretsiz İzin</option>
                  <option value="raporlu">Raporlu (İstirahat)</option>
                </select>
              </div>

              <div className="flex flex-col sm:flex-row gap-4">
                <div className="w-full sm:w-1/2">
                  <label htmlFor="start_date" className="block text-sm font-medium text-gray-300 mb-1">Başlangıç Tarihi</label>
                  <input 
                    name="start_date" 
                    id="start_date" 
                    type="date" 
                    required 
                    className="w-full bg-black/20 p-3 rounded-lg border border-white/10 focus:ring-2 focus:ring-blue-500 focus:outline-none [color-scheme:dark]" 
                  />
                </div>
                <div className="w-full sm:w-1/2">
                  <label htmlFor="end_date" className="block text-sm font-medium text-gray-300 mb-1">Bitiş Tarihi</label>
                  <input 
                    name="end_date" 
                    id="end_date" 
                    type="date" 
                    required 
                    className="w-full bg-black/20 p-3 rounded-lg border border-white/10 focus:ring-2 focus:ring-blue-500 focus:outline-none [color-scheme:dark]" 
                  />
                </div>
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