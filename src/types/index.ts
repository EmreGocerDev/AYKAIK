// YOL: src/types/index.ts


export type Personnel = {
  id: number;
  
  // Uygulama için korunan alanlar
  annual_leave_days_entitled: number;
  annual_leave_days_used: number;

  // Veritabanı ile birebir aynı, özel karakterler içeren alan adları
  "ŞUBE": number;
  "GÖREVİ"?: string | null;
  "AY-KA ENERJİ SÖZLEŞME TARİHİ"?: string | null;
  "KIDEM TARİHİ"?: string | null;
  "ADI SOYADI": string;
  "TC. KİMLİK NUMARASI": string;
  "DOĞUM TARİHİ"?: string | null;
  "DOĞUM YERİ"?: string | null;
  "BABA ADI"?: string | null;
  "MEDENİ HALİ"?: string | null;
  "EŞ GELİR DURUMU"?: string | null;
  "ÇOCUK SAYISI"?: number | null;
  "AGİ YÜZDESİ"?: string | null;
  "ENGEL ORANI"?: string | null;
  "ADRES"?: string | null;
  "ŞAHSİ TEL NO"?: string | null;
  "MAİL ADRESİ": string;
  "MEZUNİYET"?: string | null;
  "BÖLÜM"?: string | null;
  "ASKERLİK DURUMU"?: string | null;
  "TECİL BİTİŞ TARİHİ"?: string | null;
  "EHLİYET"?: string | null;
  "KANGRUBU"?: string | null;
  "IBAN NO"?: string | null;
  "DOĞALGAZ SAYAÇ SÖKME TAKMA BELGESİ"?: string | null;
  "BELGE GEÇERLİLİK TARİHİ"?: string | null;
  "ISITMA VE DOĞALGAZ İÇ TESİSAT YAPIM BELGESİ"?: string | null;
  "TESİSAT BELGE GEÇERLİLİK TARİHİ"?: string | null;
  "PERSONEL AKTİF Mİ?": boolean; // <-- EKLENEN SATIR

  // İlişkisel Veri (Join ile gelebilir)
  regions?: { name: string } | null;
};
export type Region = {
    id: number;
    name: string;
    workplace_registration_number?: string | null;
    address?: string | null;
    province?: string | null;
    sgk_province_code?: string | null;
};

export type DailyPerformanceRecord = {
  date: string;
  user: string;
  total: number;
  endTime: string;
  idleTime: string;
  startTime: string;
  [key: string]: number | string;
};

export type CashAdvanceRequest = {
  id: number;
  created_at: string;
  personnel_id: number;
  amount: number;
  reason?: string | null;
  status: 'pending' | 'approved_by_coordinator' | 'rejected_by_coordinator' | 'approved' | 'rejected';
  history_log: {
    action: string;
    actor: string;
    timestamp: string;
    notes: string;
  }[];
  personnel_full_name: string; // RPC ile join edilecek
  total_count: number; // RPC ile sayım için
};