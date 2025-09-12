export type Personnel = {
  id: number;
  full_name: string;
  tc_kimlik_no: string;
  email: string;
  start_date: string; // İşe Giriş Tarihi
  region_id?: number;
  annual_leave_days_entitled: number;
  annual_leave_days_used: number;
  // Onaylanan Alanlar
  "şube"?: string | null;
  date_of_birth?: string | null; // Doğum Tarihi
  place_of_birth?: string | null; // Doğum Yeri
  father_name?: string | null; // Baba Adı
  marital_status?: string | null; // Medeni Hali
  eş_gelir_durumu?: string | null;
  number_of_children?: number | null; // Çocuk Sayısı
  agi_yüzdesi?: string | null;
  engel_derecesi?: string | null;
  address?: string | null;
  phone_number?: string | null; // Şahsi Tel No
  education_level?: string | null; // Mezuniyet (Eğitim Seviyesi)
  "bölüm"?: string | null; // Mezun olunan bölüm
  military_service_status?: string | null;
  ehliyet?: string | null;
  blood_type?: string | null; // Kan Grubu
  iban?: string | null;
  sözleşme_tarihi?: string | null;
  // Belge Alanları
  dogalgaz_sayac_sokme_takma_belgesi?: string | null;
  belge_geçerlilik_tarihi?: string | null;
  isitma_ve_dogalgaz_tesisat_belgesi?: string | null;
  
  // YENİ EKLENEN ALANLAR
  department?: string | null; // Departman
  job_title?: string | null; // Görev Ünvanı
  employment_type?: 'Tam Zamanlı' | 'Yarı Zamanlı' | 'Sözleşmeli' | 'Stajyer' | null; // Çalışma Şekli
  sgk_number?: string | null; // SGK Sicil No
  is_active?: boolean | null; // Personel Aktif mi?
  bank_name?: string | null; // Banka Adı
  emergency_contact_name?: string | null; // Acil Durum Kişisi Adı
  emergency_contact_phone?: string | null; // Acil Durum Kişisi Telefon
  private_health_insurance_company?: string | null; // Özel Sağlık Sigortası Şirketi
  private_health_insurance_policy_number?: string | null; // Poliçe Numarası
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
  // Diğer tüm dinamik alanlar (saatler ve görev tipleri) için
  [key: string]: number | string;
};