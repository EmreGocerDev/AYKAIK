"use client";

import GlassCard from "@/components/GlassCard";

export default function FeedbackPage() {
  return (
    <div className="p-4 md:p-8 text-white">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">Geri Bildirim</h1>
        <GlassCard>
          <div className="text-center py-8">
            <p className="text-lg">Bu sayfa kullanıcı geri bildirimleri için ayrılmıştır.</p>
            <p className="text-gray-400 mt-2">İçerik ve formlar yakında eklenecektir.</p>
          </div>
        </GlassCard>
      </div>
    </div>
  );
}