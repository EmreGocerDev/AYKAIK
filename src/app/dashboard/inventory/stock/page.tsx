"use client";

import GlassCard from "@/components/GlassCard";

export default function StockManagementPage() {
  return (
    <div className="p-4 md:p-8 text-white">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">Stok Yönetimi</h1>
        <GlassCard>
          <div className="text-center py-8">
            <p className="text-lg">Bu sayfa stok yönetimi için ayrılmıştır.</p>
            <p className="text-gray-400 mt-2">Envanter takip özellikleri yakında eklenecektir.</p>
          </div>
        </GlassCard>
      </div>
    </div>
  );
}