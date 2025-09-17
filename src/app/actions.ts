"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from 'next/navigation';
import { createAdminClient } from '@/lib/supabase/admin';
// GÜNCELLEME: Güvenli tarih fonksiyonumuzu import ediyoruz.
import { safeNewDate } from '@/lib/utils';
import { cookies } from 'next/headers'; 
import { createPerformanceClient } from '@/lib/supabase/performance';
import type { DailyPerformanceRecord } from '@/types/index';

type GridLayoutItem = {
  i: string;
  x: number;
  y: number;
  w: number;
  h: number;
  minW?: number;
  maxW?: number;
  minH?: number;
  maxH?: number;
  static?: boolean;
  isDraggable?: boolean;
  isResizable?: boolean;
};
// Tipleri tanımlayalım
type HistoryEntry = {
  action: string;
  actor: string;
  timestamp: string;
  notes: string;
};
export type DashboardLayoutSettings = {
  layouts: { [breakpoint: string]: GridLayoutItem[] };
  visible: Record<string, boolean>;
};
export type LoginState = {
  message: string | null;
};
// DÜZELTME: saveTechnicalSchedule için tür tanımı
type TechnicalScheduleEntry = {
  region_id: number;
  date: string;
  start_time?: string | null;
  end_time?: string | null;
  break_hours?: number | null;
  preset_id?: number | null;
  notes?: string | null;
};
// DÜZELTME: getOvertimeReport için tür tanımı
type OvertimeRecord = {
  userName: string;
  date: string;
  scheduledStart: string;
  scheduledEnd: string;
  actualStart: string;
  actualEnd: string;
  totalOvertimeSeconds: number;
};

export async function createLeaveRequest(formData: FormData) {
  const supabase = createAdminClient();
  const rawFormData = {
    tc: formData.get("tc") as string,
    email_personel: formData.get("email_personel") as string,
    start_date: formData.get("start_date") as string,
    end_date: formData.get("end_date") as string,
    leave_type: formData.get("leave_type") as string,
  };
  const { data: personnel, error: personnelError } = await supabase
    .from("personnel")
    .select("id")
    .eq("tc_kimlik_no", rawFormData.tc)
    .eq("email", rawFormData.email_personel)
    .single();
  if (personnelError || !personnel) {
    console.error("Personel doğrulama hatası:", personnelError);
    return { success: false, message: "Personel bilgileri hatalı veya bulunamadı." };
  }
  
  const initialHistory: HistoryEntry[] = [{
    action: "Talep oluşturuldu",
    actor: "Personel",
    timestamp: new Date().toISOString(),
    notes: `Talep, personel tarafından '${rawFormData.leave_type}' türünde oluşturuldu.`
  }];
  const { error: insertError } = await supabase.from("leave_requests").insert({
    personnel_id: personnel.id,
    start_date: rawFormData.start_date,
    end_date: rawFormData.end_date,
    status: "pending",
    history_log: initialHistory,
    leave_type: rawFormData.leave_type,
  });
  if (insertError) {
    return { success: false, message: `Veritabanı hatası: ${insertError.message}` };
  }
  
  return { success: true, message: "İzin talebiniz başarıyla oluşturuldu." };
}

export async function login(prevState: LoginState, formData: FormData) {
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;
  const supabase = createClient();
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  if (error) {
    return {
      message: 'Giriş bilgileri hatalı. Lütfen tekrar deneyin.',
    };
  }

  // YENİ EKLENEN BÖLÜM BAŞLANGICI
  if (data.user) {
    // Giriş başarılıysa, AykaSosyal hesabını oluştur/kontrol et ve session başlat
    await createOrLoginSocialUserForMatrix(data.user);
  }
  // YENİ EKLENEN BÖLÜM SONU

  revalidatePath('/', 'layout');
  redirect('/dashboard');
}

export async function addPersonnel(formData: FormData) {
  const supabase = createClient();
  const { data: setting, error: settingError } = await supabase
    .from('system_settings')
    .select('value')
    .eq('key', 'default_annual_leave_days')
    .single();
  if (settingError) {
    return { success: false, message: 'Varsayılan izin günü ayarı okunamadı.' };
  }
  const defaultLeaveDays = Number(setting.value);

  const rawFormData = {
    // Mevcut Alanlar
    full_name: formData.get('full_name') as string,
    tc_kimlik_no: formData.get('tc_kimlik_no') as string,
    email: formData.get('email') as string,
    start_date: formData.get('start_date') as string,
    region_id: Number(formData.get('region_id')),
    annual_leave_days_entitled: defaultLeaveDays,
    "şube": formData.get('şube') as string,
    date_of_birth: formData.get('date_of_birth') as string,
    place_of_birth: formData.get('place_of_birth') as string,
    father_name: formData.get('father_name') as string,
    marital_status: formData.get('marital_status') as string,
    eş_gelir_durumu: formData.get('eş_gelir_durumu') as string,
    number_of_children: Number(formData.get('number_of_children')),
    agi_yüzdesi: formData.get('agi_yüzdesi') as string,
    engel_derecesi: formData.get('engel_derecesi') as string,
    address: formData.get('address') as string,
    phone_number: formData.get('phone_number') as string,
    education_level: formData.get('education_level') as string,
    "bölüm": formData.get('bölüm') as string,
    military_service_status: formData.get('military_service_status') as string,
    ehliyet: formData.get('ehliyet') as string,
    blood_type: formData.get('blood_type') as string,
    iban: formData.get('iban') as string,
    sözleşme_tarihi: formData.get('sözleşme_tarihi') as string,
    dogalgaz_sayac_sokme_takma_belgesi: formData.get('dogalgaz_sayac_sokme_takma_belgesi') as string,
    belge_geçerlilik_tarihi: formData.get('belge_geçerlilik_tarihi') as string,
    isitma_ve_dogalgaz_tesisat_belgesi: formData.get('isitma_ve_dogalgaz_tesisat_belgesi') as string,
  
    // YENİ EKLENEN ALANLAR
    department: formData.get('department') as string,
    job_title: formData.get('job_title') as string,
    employment_type: formData.get('employment_type') as string,
    sgk_number: formData.get('sgk_number') as string,
    is_active: formData.get('is_active') === 'on', // Checkbox değeri 'on' veya null gelir
    bank_name: formData.get('bank_name') as string,
    emergency_contact_name: formData.get('emergency_contact_name') as string,
    emergency_contact_phone: formData.get('emergency_contact_phone') as string,
    private_health_insurance_company: formData.get('private_health_insurance_company') as string,
    private_health_insurance_policy_number: formData.get('private_health_insurance_policy_number') as string,
  };
  if (!rawFormData.full_name || !rawFormData.tc_kimlik_no) {
    return { success: false, message: 'Ad Soyad ve T.C. Kimlik Numarası zorunludur.' };
  }

  const { error } = await supabase.from('personnel').insert([rawFormData]);

  if (error) {
    console.error("Personel ekleme hatası:", error);
    if (error.code === '23505') {
        return { success: false, message: 'Bu T.C. Kimlik Numarası veya E-posta zaten kayıtlı.' };
    }
    return { success: false, message: `Veritabanı hatası: ${error.message}` };
  }

  revalidatePath('/dashboard/personnel');
  return { success: true, message: 'Personel başarıyla eklendi.' };
}

export async function deletePersonnel(personnelId: number) {
  const supabase = createClient();
  const { error } = await supabase
    .from('personnel')
    .delete()
    .eq('id', personnelId);
  if (error) {
    console.error('Personel silme hatası:', error);
    return { success: false, message: `Veritabanı hatası: ${error.message}` };
  }

  revalidatePath('/dashboard/personnel');
  revalidatePath('/dashboard');
  return { success: true, message: 'Personel başarıyla silindi.' };
}

export async function updatePersonnel(formData: FormData) {
  const supabase = createClient();
  const id = Number(formData.get('id'));
  if (!id) {
    return { success: false, message: 'Personel ID bulunamadı.' };
  }

  const rawFormData = {
    // Mevcut Alanlar
    full_name: formData.get('full_name') as string,
    tc_kimlik_no: formData.get('tc_kimlik_no') as string,
    email: formData.get('email') as string,
    start_date: formData.get('start_date') as string,
    region_id: Number(formData.get('region_id')),
    "şube": formData.get('şube') as string,
    date_of_birth: formData.get('date_of_birth') as string,
    place_of_birth: formData.get('place_of_birth') as string,
    father_name: formData.get('father_name') as string,
    marital_status: formData.get('marital_status') as string,
    eş_gelir_durumu: formData.get('eş_gelir_durumu') as string,
    number_of_children: Number(formData.get('number_of_children')),
    agi_yüzdesi: formData.get('agi_yüzdesi') as string,
  
    engel_derecesi: formData.get('engel_derecesi') as string,
    address: formData.get('address') as string,
    phone_number: formData.get('phone_number') as string,
    education_level: formData.get('education_level') as string,
    "bölüm": formData.get('bölüm') as string,
    military_service_status: formData.get('military_service_status') as string,
    ehliyet: formData.get('ehliyet') as string,
    blood_type: formData.get('blood_type') as string,
    iban: formData.get('iban') as string,
    sözleşme_tarihi: formData.get('sözleşme_tarihi') as string,
    dogalgaz_sayac_sokme_takma_belgesi: formData.get('dogalgaz_sayac_sokme_takma_belgesi') as string,
    belge_geçerlilik_tarihi: formData.get('belge_geçerlilik_tarihi') as string,
    isitma_ve_dogalgaz_tesisat_belgesi: formData.get('isitma_ve_dogalgaz_tesisat_belgesi') as string,
    // YENİ EKLENEN ALANLAR
    
    department: formData.get('department') as string,
    job_title: formData.get('job_title') as string,
    employment_type: formData.get('employment_type') as string,
    sgk_number: formData.get('sgk_number') as string,
    is_active: formData.get('is_active') === 'on',
    bank_name: formData.get('bank_name') as string,
    emergency_contact_name: formData.get('emergency_contact_name') as string,
    emergency_contact_phone: formData.get('emergency_contact_phone') as string,
    private_health_insurance_company: formData.get('private_health_insurance_company') as string,
    private_health_insurance_policy_number: formData.get('private_health_insurance_policy_number') as string,
  };
  const { error } = await supabase
    .from('personnel')
    .update(rawFormData)
    .eq('id', id);
  if (error) {
    console.error("Personel güncelleme hatası:", error);
    if (error.code === '23505') {
      return { success: false, message: 'Bu T.C. Kimlik Numarası veya E-posta zaten başka bir personele ait.' };
    }
    return { success: false, message: `Veritabanı hatası: ${error.message}` };
  }

  revalidatePath('/dashboard/personnel');
  return { success: true, message: 'Personel bilgileri başarıyla güncellendi.' };
}

async function updateLeaveRequest(
  requestId: number, 
  newStatus: 'approved_by_coordinator' | 'rejected_by_coordinator' | 'approved' | 'rejected', 
  notes: string
) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, message: "Yetkili kullanıcı bulunamadı." };

  const { data: profile } = await supabase.from('profiles').select('full_name, role').eq('id', user.id).single();
  if (!profile) return { success: false, message: "Yetkili profili bulunamadı." };
  const { data: currentRequest, error: fetchError } = await supabase
    .from('leave_requests')
    .select('history_log, leave_type')
    .eq('id', requestId)
    .single();
  if (fetchError) return { success: false, message: "İzin talebi bulunamadı." };
  
  const actorName = profile.full_name || user.email;
  const actionTextMap = {
      approved_by_coordinator: "Koordinatör Onayladı",
      rejected_by_coordinator: "Koordinatör Reddetti",
      approved: "Nihai Onay Verildi",
      rejected: "Nihai Red Verildi"
  };
  const newHistoryEntry: HistoryEntry = {
    action: actionTextMap[newStatus],
    actor: `${actorName} (${profile.role})`,
    timestamp: new Date().toISOString(),
    notes: notes || "Not eklenmedi.",
  };
  const updatedHistoryLog = [...(currentRequest.history_log as HistoryEntry[] || []), newHistoryEntry];
  const { error: updateError } = await supabase
    .from('leave_requests')
    .update({ status: newStatus, history_log: updatedHistoryLog })
    .eq('id', requestId);
  if (updateError) return { success: false, message: `Güncelleme hatası: ${updateError.message}` };
  if (newStatus === 'approved') {
    const adminSupabase = createAdminClient();
    const { error: rpcError } = await adminSupabase.rpc('generate_timesheet_for_leave', { request_id: requestId });
    if (rpcError) {
        console.error("Puantaj güncelleme RPC hatası:", rpcError);
    }
  }
  
  revalidatePath('/dashboard/requests');
  revalidatePath('/dashboard/calendar');
  revalidatePath('/dashboard/timesheet');
  return { success: true, message: `Talep başarıyla güncellendi.` };
}

export async function coordinatorApprove(requestId: number, notes: string) {
  return updateLeaveRequest(requestId, 'approved_by_coordinator', notes);
}

export async function coordinatorReject(requestId: number, notes: string) {
  return updateLeaveRequest(requestId, 'rejected_by_coordinator', notes);
}

export async function adminApprove(requestId: number, notes: string) {
  return updateLeaveRequest(requestId, 'approved', notes);
}

export async function adminReject(requestId: number, notes: string) {
  return updateLeaveRequest(requestId, 'rejected', notes);
}

export async function updateLeaveRequestDates(formData: FormData) {
  const supabase = createClient();

  const requestId = Number(formData.get('requestId'));
  const newStartDate = formData.get('start_date') as string;
  const newEndDate = formData.get('end_date') as string;
  const originalDates = formData.get('original_dates') as string;
  if (!requestId || !newStartDate || !newEndDate) {
    return { success: false, message: 'Eksik bilgi.' };
  }
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, message: 'Yetkili kullanıcı bulunamadı.' };
  const { data: profile } = await supabase.from('profiles').select('full_name, role').eq('id', user.id).single();
  if (!profile) return { success: false, message: 'Yetkili profili bulunamadı.' };
  
  const { data: currentRequest, error: fetchError } = await supabase
    .from('leave_requests').select('history_log').eq('id', requestId).single();
  if (fetchError) return { success: false, message: 'Talep bulunamadı.' };

  const actorName = profile.full_name || user.email;
  const newHistoryEntry: HistoryEntry = {
    action: "Tarih Güncellendi",
    actor: `${actorName} (${profile.role})`,
    timestamp: new Date().toISOString(),
    // GÜNCELLEME: new Date() çağrıları safeNewDate() ile değiştirildi.
    notes: `İzin tarihi değiştirildi. Eski: ${originalDates}, Yeni: ${safeNewDate(newStartDate).toLocaleDateString('tr-TR')} - ${safeNewDate(newEndDate).toLocaleDateString('tr-TR')}`,
  };
  const updatedHistoryLog = [...(currentRequest.history_log as HistoryEntry[] || []), newHistoryEntry];
  const { error: updateError } = await supabase
    .from('leave_requests')
    .update({ 
      start_date: newStartDate, 
      end_date: newEndDate, 
      history_log: updatedHistoryLog 
    })
    .eq('id', requestId);
  if (updateError) return { success: false, message: `Güncelleme hatası: ${updateError.message}` };

  revalidatePath('/dashboard/requests');
  revalidatePath('/dashboard/calendar');
  return { success: true, message: 'İzin tarihleri güncellendi.' };
}

export async function createLeaveForPersonnel(formData: FormData) {
  const supabase = createClient();
  const personnelId = Number(formData.get('personnel_id'));
  const rawFormData = {
    start_date: formData.get('start_date') as string,
    end_date: formData.get('end_date') as string,
    reason: formData.get('reason') as string,
    leave_type: formData.get("leave_type") as string,
  };
  if (!personnelId || !rawFormData.start_date || !rawFormData.end_date || !rawFormData.leave_type) {
    return { success: false, message: 'Eksik bilgi. Lütfen tüm alanları doldurun.' };
  }
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, message: 'Yetkili kullanıcı bulunamadı.' };
  const { data: profile } = await supabase.from('profiles').select('full_name, role').eq('id', user.id).single();
  if (!profile) return { success: false, message: 'Yetkili profili bulunamadı.' };
  
  const actorName = profile.full_name || user.email;
  const actor = `${actorName} (${profile.role})`;
  const initialHistory: HistoryEntry[] = [{
    action: "Talep oluşturuldu",
    actor: actor,
    timestamp: new Date().toISOString(),
    notes: rawFormData.reason || `Talep, yetkili tarafından '${rawFormData.leave_type}' türünde oluşturuldu.`
  }];

  const { error } = await supabase.from('leave_requests').insert({
    personnel_id: personnelId,
    start_date: rawFormData.start_date,
    end_date: rawFormData.end_date,
    status: "pending",
    reason: rawFormData.reason,
    history_log: initialHistory,
    leave_type: rawFormData.leave_type,
  });
  if (error) {
    return { success: false, message: `Veritabanı hatası: ${error.message}` };
  }

  revalidatePath('/dashboard/requests');
  revalidatePath('/dashboard/calendar');
  revalidatePath('/dashboard');
  return { success: true, message: 'İzin talebi başarıyla oluşturuldu.' };
}

export async function addRegion(formData: FormData) {
  const supabase = createClient();
  const rawFormData = {
    name: formData.get('name') as string,
    workplace_registration_number: formData.get('workplace_registration_number') as string,
    address: formData.get('address') as string,
    province: formData.get('province') as string,
    sgk_province_code: formData.get('sgk_province_code') as string,
  };
  if (!rawFormData.name) return { success: false, message: 'Bölge adı boş olamaz.' };
  
  const { error } = await supabase.from('regions').insert(rawFormData);
  if (error) return { success: false, message: `Hata: ${error.message}` };
  
  revalidatePath('/dashboard/regions');
  return { success: true, message: 'Bölge başarıyla eklendi.' };
}

export async function updateRegion(formData: FormData) {
  const supabase = createClient();
  const id = Number(formData.get('id'));
  const rawFormData = {
    name: formData.get('name') as string,
    workplace_registration_number: formData.get('workplace_registration_number') as string,
    address: formData.get('address') as string,
    province: formData.get('province') as string,
    sgk_province_code: formData.get('sgk_province_code') as string,
  };
  if (!id || !rawFormData.name) return { success: false, message: 'Gerekli bilgiler eksik.' };
  const { error } = await supabase.from('regions').update(rawFormData).eq('id', id);

  if (error) return { success: false, message: `Hata: ${error.message}` };
  
  revalidatePath('/dashboard/regions');
  return { success: true, message: 'Bölge başarıyla güncellendi.' };
}

export async function deleteRegion(regionId: number) {
  const supabase = createClient();
  const { data: personnel, error: checkError } = await supabase
    .from('personnel')
    .select('id')
    .eq('region_id', regionId)
    .limit(1);
  if (checkError) return { success: false, message: `Kontrol hatası: ${checkError.message}` };
  if (personnel && personnel.length > 0) {
    return { success: false, message: 'Bu bölgede personel bulunduğu için silinemez. Önce personelleri başka bir bölgeye taşıyın.' };
  }

  const { error } = await supabase.from('regions').delete().eq('id', regionId);
  if (error) return { success: false, message: `Hata: ${error.message}` };

  revalidatePath('/dashboard/regions');
  return { success: true, message: 'Bölge başarıyla silindi.' };
}

export async function updateSystemSettings(formData: FormData) {
  const supabase = createClient();
  const settingsToUpdate = [
    { key: 'default_annual_leave_days', value: formData.get('default_annual_leave_days') },
    { key: 'weekend_configuration', value: formData.get('weekend_configuration') }
  ];
  try {
    for (const setting of settingsToUpdate) {
      if (setting.value !== null) {
        let processedValue: string | number = setting.value as string;
        if (setting.key === 'default_annual_leave_days') {
          processedValue = Number(setting.value);
        }

        const { error } = await supabase
          .from('system_settings')
          .update({ value: processedValue })
          .eq('key', setting.key);
        if (error) throw error;
      }
    }
    
    revalidatePath('/dashboard/settings');
    revalidatePath('/dashboard/calendar');
    revalidatePath('/dashboard/timesheet');
    return { success: true, message: 'Ayarlar başarıyla güncellendi.' };

  } catch (error) {
    let message = 'Bilinmeyen bir hata oluştu.';
    if (error instanceof Error) {
        message = `Ayarlar güncellenemedi: ${error.message}`;
    }
    return { success: false, message };
  }
}

export async function getTechnicalSchedulePresets(regionId: number) {
    "use server";
    if (!regionId) return { success: false, data: null, message: "Bölge ID'si belirtilmedi." };
    
    const supabase = createAdminClient();
    const { data, error } = await supabase
        .from('technical_schedule_presets')
        .select('*')
        .eq('region_id', regionId)
        .order('preset_id', { ascending: true });
    if (error) {
        console.error("Teknik takvim şablonları çekme hatası:", error);
        return { success: false, data: null, message: error.message };
    }
    return { success: true, data };
}

export async function updateTechnicalScheduleSettings(formData: FormData) {
  "use server";
  const supabase = createAdminClient();
  const regionId = Number(formData.get('region_id'));
  if (!regionId) return { success: false, message: 'Bölge bilgisi eksik.' };
  try {
    const presetsToUpsert = Array.from({ length: 5 }).map((_, i) => ({
      region_id: regionId,
      preset_id: i + 1,
      name: formData.get(`preset_${i}_name`) as string,
      start_time: formData.get(`preset_${i}_start_time`) as string,
      end_time: formData.get(`preset_${i}_end_time`) as string,
      break_hours: Number(formData.get(`preset_${i}_break_hours`)),
      color: formData.get(`preset_${i}_color`) as string, // YENİ EKLENDİ
      updated_at: new Date().toISOString()
    }));
    const { error } = await supabase
      .from('technical_schedule_presets')
      .upsert(presetsToUpsert, { onConflict: 'region_id, preset_id' });
    if (error) throw error;

    revalidatePath('/dashboard/timesheet/technical-schedule-settings');
    revalidatePath('/dashboard/timesheet/technical-schedule');
    return { success: true, message: 'Teknik takvim ayarları başarıyla kaydedildi.' };
  } catch (error) {
    let message = 'Bilinmeyen bir hata oluştu.';
    if (error instanceof Error) {
      message = `Ayarlar güncellenemedi: ${error.message}`;
    }
    return { success: false, message };
  }
}

export async function createUser(formData: FormData) {
  const adminSupabase = createAdminClient();

  const email = formData.get('email') as string;
  const password = formData.get('password') as string;
  const full_name = formData.get('full_name') as string;
  const region_id = Number(formData.get('region_id'));
  if (!email || !password || !full_name || !region_id) {
    return { success: false, message: 'Tüm alanlar zorunludur.' };
  }

  // 1. Auth kullanıcısını oluştur
  const { data: authData, error: authError } = await adminSupabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });
  if (authError) {
    console.error("Auth kullanıcısı oluşturma hatası:", authError);
    return { success: false, message: `Kullanıcı oluşturulamadı: ${authError.message}` };
  }

  // 2. 'profiles' tablosuna 'upsert' ile veriyi ekle/güncelle
  const { error: profileError } = await adminSupabase.from('profiles').upsert({
    id: authData.user.id,
    full_name,
    region_id,
    role: 'coordinator',
  });
  if (profileError) {
    console.error("Profil oluşturma/güncelleme hatası:", profileError);
    await adminSupabase.auth.admin.deleteUser(authData.user.id);
    return { success: false, message: `Profil oluşturulamadı: ${profileError.message}` };
  }
  
  revalidatePath('/dashboard/users');
  return { success: true, message: 'Koordinatör başarıyla oluşturuldu.' };
}

export async function updateUser(formData: FormData) {
  const adminSupabase = createAdminClient();
  const userId = formData.get('userId') as string;
  const full_name = formData.get('full_name') as string;
  const region_id = Number(formData.get('region_id'));
  if (!userId || !full_name || !region_id) {
    return { success: false, message: 'Eksik bilgi.' };
  }

  const { error } = await adminSupabase
    .from('profiles')
    .update({ full_name, region_id })
    .eq('id', userId);
  if (error) {
    console.error("Kullanıcı güncelleme hatası:", error);
    return { success: false, message: `Güncelleme hatası: ${error.message}` };
  }

  revalidatePath('/dashboard/users');
  return { success: true, message: 'Kullanıcı bilgileri güncellendi.' };
}

export async function deleteUser(userId: string) {
  const adminSupabase = createAdminClient();
  const { error } = await adminSupabase.auth.admin.deleteUser(userId);
  if (error) {
    console.error("Kullanıcı silme hatası:", error);
    return { success: false, message: `Silme hatası: ${error.message}` };
  }
  
  revalidatePath('/dashboard/users');
  return { success: true, message: 'Kullanıcı kalıcı olarak silindi.' };
}

export async function getUserProfiles() {
  const supabase = createAdminClient();
  const { data, error } = await supabase.rpc('get_user_profiles');
  if (error) {
    console.error("Server Action getUserProfiles Hatası:", error);
  }
  
  return { data, error };
}

export async function updateUserDashboardLayout(layout: DashboardLayoutSettings) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { success: false, message: 'Kullanıcı bulunamadı.' };
  }

  const { error } = await supabase
    .from('user_settings')
    .upsert({
      user_id: user.id,
      dashboard_layout: layout,
    }, { onConflict: 'user_id' });
  if (error) {
    console.error("Dashboard layout güncelleme hatası:", error);
    return { success: false, message: 'Layout güncellenemedi.' };
  }

  revalidatePath('/dashboard');
  return { success: true };
}

const getTableNameForRegion = (regionName: string) => {
    const lowerCaseRegionName = regionName.toLowerCase();
    if (lowerCaseRegionName === 'samsun') {
        return 'performance_logs';
    }

    const sanitizedName = lowerCaseRegionName
        .replace(/ğ/g, 'g').replace(/ü/g, 'u').replace(/ş/g, 's')
        .replace(/ı/g, 'i').replace(/ö/g, 'o').replace(/ç/g, 'c')
        .replace(/\s+/g, '_');
    return `performance_logs_${sanitizedName}`;
};

export async function getAvailablePerformanceDates(regionName: string): Promise<{ success: boolean; data?: string[]; message?: string; }> {
    "use server";
    if (!regionName) return { success: false, message: "Bölge adı belirtilmedi." };
    const performanceSupabase = createPerformanceClient();
    const tableName = getTableNameForRegion(regionName);

    try {
        const { data, error } = await performanceSupabase.from(tableName).select('log_date').order('log_date', { ascending: false });
        if (error) throw error;
        return { success: true, data: data.map(item => item.log_date) };
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Bilinmeyen bir hata oluştu.';
        return { success: false, message: `Tarihler çekilirken hata: ${message}` };
    }
}

export async function getPerformanceDataForDateRange(regionName: string, startDate: string, endDate: string): Promise<{ success: boolean; data?: { log_date: string, data: DailyPerformanceRecord[] }[]; message?: string; }> {
    "use server";
    if (!regionName || !startDate || !endDate) return { success: false, message: "Bölge veya tarih aralığı belirtilmedi." };
    
    const performanceSupabase = createPerformanceClient();
    const tableName = getTableNameForRegion(regionName);
    
    try {
        const { data, error } = await performanceSupabase
            .from(tableName)
            .select('log_date, data')
            .gte('log_date', startDate)
            .lte('log_date', endDate)
            .order('log_date', { ascending: true });
        if (error) throw error;
        
        return { success: true, data: data as { log_date: string, data: DailyPerformanceRecord[] }[] };
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Bilinmeyen bir hata oluştu.';
        return { success: false, message: `Performans verisi çekilirken hata: ${message}` };
    }
}

type AggregatedRegionData = {
  regionName: string;
  totalActivity: number;
  jobCounts: { [key: string]: number };
};
export async function getAllRegionsPerformanceData(
  startDate: string,
  endDate: string
): Promise<{
  success: boolean;
  data?: AggregatedRegionData[];
  message?: string;
}> {
  "use server";
  try {
    const mainSupabase = createClient();
    const { data: regions, error: regionsError } = await mainSupabase.from('regions').select('name');
    if (regionsError) throw new Error(`Bölgeler çekilirken hata: ${regionsError.message}`);
    if (!regions || regions.length === 0) return { success: true, data: [] };

    const performanceSupabase = createPerformanceClient();
    const dataPromises = regions.map(region => {
      const tableName = getTableNameForRegion(region.name);
      return performanceSupabase
        .from(tableName)
        .select('data')
        .gte('log_date', startDate)
        .lte('log_date', endDate)
        .then(response => ({
          regionName: region.name,
          ...response
        }));
    });
    const results = await Promise.all(dataPromises);

    const aggregatedData: { [key: string]: { totalActivity: number, jobCounts: { [job: string]: number } } } = {};
    const keysToExclude = new Set(['date', 'user', 'total', 'endTime', 'idleTime', 'startTime', ...Array.from({ length: 48 }, (_, i) => `${Math.floor(i / 2).toString().padStart(2, '0')}:${i % 2 === 0 ? '00' : '30'}`)]);
    for (const result of results) {
      if (result.error) {
        console.warn(`'${result.regionName}' bölgesi için veri çekilirken hata oluştu:`, result.error.message);
        continue;
      }

      if (result.data) {
        for (const record of result.data as { data: DailyPerformanceRecord[] }[]) {
          const dailyRecords = record.data;
          for (const dailyRecord of dailyRecords) {
            if (!aggregatedData[result.regionName]) {
              aggregatedData[result.regionName] = { totalActivity: 0, jobCounts: {} };
            }
            aggregatedData[result.regionName].totalActivity += dailyRecord.total || 0;
            for (const [key, value] of Object.entries(dailyRecord)) {
              if (!keysToExclude.has(key) && typeof value === 'number') {
                const currentJobCount = aggregatedData[result.regionName].jobCounts[key] || 0;
                aggregatedData[result.regionName].jobCounts[key] = currentJobCount + value;
              }
            }
          }
        }
      }
    }

    const finalData = Object.entries(aggregatedData).map(([regionName, values]) => ({
      regionName,
      ...values
    }));
    return { success: true, data: finalData };

  } catch (error) {
    const message = error instanceof Error ? error.message : 'Bilinmeyen bir hata oluştu.';
    return { success: false, message: `Tüm bölgelerin performans verisi çekilirken hata: ${message}` };
  }
}

export async function getTechnicalScheduleForMonth(regionId: number, year: number, month: number) {
  "use server";
  const supabase = createAdminClient();
  const startDate = new Date(Date.UTC(year, month, 1)).toISOString();
  const endDate = new Date(Date.UTC(year, month + 1, 0)).toISOString();
  const { data, error } = await supabase
    .from('technical_schedules')
    .select('date, start_time, end_time, break_hours, preset_id') // preset_id eklendi
    .eq('region_id', regionId)
    .gte('date', startDate)
    .lte('date', endDate);
  if (error) {
    console.error("Teknik takvim verisi çekme hatası:", error);
    return { success: false, data: null, message: error.message };
  }
  return { success: true, data, message: 'Veri başarıyla çekildi.' };
}
// YENİ: Teknik takvim verilerini toplu olarak kaydeder/günceller
export async function saveTechnicalSchedule(schedules: TechnicalScheduleEntry[]){
    "use server";
    const supabase = createAdminClient();
    
    const dataToUpsert = schedules.map(s => ({
        region_id: s.region_id,
        date: s.date,
        start_time: s.start_time || null,
        end_time: s.end_time || null,
        break_hours: s.break_hours || null,
        notes: s.notes || null,
        preset_id: s.preset_id || null // preset_id eklendi
    }));
    const { error } = await supabase
        .from('technical_schedules')
        .upsert(dataToUpsert, { onConflict: 'region_id,date' });
    if (error) {
        console.error("Teknik takvim kaydetme hatası:", error);
        return { success: false, message: `Kayıt hatası: ${error.message}` };
    }
    
    revalidatePath('/dashboard/timesheet/technical-schedule');
    return { success: true, message: 'Takvim başarıyla güncellendi.' };
}
export async function getOvertimeReport(regionName: string, startDate: string, endDate: string) {
    "use server";
    const mainSupabase = createAdminClient();
    const performanceSupabase = createPerformanceClient();

    try {
        const { data: region, error: regionError } = await mainSupabase.from('regions').select('id').eq('name', regionName).single();
        if (regionError || !region) throw new Error("Bölge bulunamadı.");

        const { data: schedules, error: schedulesError } = await mainSupabase
            .from('technical_schedules')
            .select('date, start_time, end_time')
            .eq('region_id', region.id)
            .gte('date', startDate)
            .lte('date', endDate);
        if (schedulesError) throw schedulesError;

        const scheduleMap = new Map(schedules.map(s => [s.date, { start: s.start_time, end: s.end_time }]));
        const getTableNameForRegion = (name: string) => {
            const lowerCaseRegionName = name.toLowerCase();
            if (lowerCaseRegionName === 'samsun') return 'performance_logs';
            const sanitizedName = lowerCaseRegionName
                .replace(/ğ/g, 'g').replace(/ü/g, 'u').replace(/ş/g, 's')
                .replace(/ı/g, 'i').replace(/ö/g, 'o').replace(/ç/g, 'c')
                .replace(/\s+/g, '_');
            return `performance_logs_${sanitizedName}`;
        };
        const tableName = getTableNameForRegion(regionName);

        const { data: performanceLogs, error: performanceError } = await performanceSupabase
            .from(tableName)
            .select('log_date, data')
            .gte('log_date', startDate)
            .lte('log_date', endDate);
        if (performanceError) throw performanceError;

        const timeStringToSeconds = (timeStr: string = "00:00:00"): number => {
            const [hours, minutes, seconds] = timeStr.split(':').map(Number);
            return (hours * 3600) + (minutes * 60) + (seconds || 0);
        };

        const overtimeRecords: OvertimeRecord[] = [];
        for (const dayLog of performanceLogs) {
            const date = dayLog.log_date;
            const dailySchedule = scheduleMap.get(date);

            if (!dailySchedule || !dailySchedule.start || !dailySchedule.end) continue;
            
            const scheduledStartSeconds = timeStringToSeconds(dailySchedule.start);
            const scheduledEndSeconds = timeStringToSeconds(dailySchedule.end);
            for (const userRecord of (dayLog.data as DailyPerformanceRecord[])) {
                const actualStartSeconds = timeStringToSeconds(userRecord.startTime);
                const actualEndSeconds = timeStringToSeconds(userRecord.endTime);

                let earlyStartOvertime = 0;
                if (actualStartSeconds < scheduledStartSeconds) {
                    earlyStartOvertime = scheduledStartSeconds - actualStartSeconds;
                }

                let lateFinishOvertime = 0;
                if (actualEndSeconds > scheduledEndSeconds) {
                    lateFinishOvertime = actualEndSeconds - scheduledEndSeconds;
                }

                const totalOvertime = earlyStartOvertime + lateFinishOvertime;
                overtimeRecords.push({
                    userName: userRecord.user,
                    date: date,
                    scheduledStart: dailySchedule.start,
                    scheduledEnd: dailySchedule.end,
                
                    actualStart: userRecord.startTime,
                    actualEnd: userRecord.endTime,
                    totalOvertimeSeconds: totalOvertime
                });
            }
        }

        return { success: true, data: overtimeRecords };
    } catch (error) {
        let message = 'Bilinmeyen bir hata oluştu.';
        if (error instanceof Error) message = error.message;
        console.error("Fazla mesai raporu hatası:", message);
        return { success: false, message: `Rapor oluşturulamadı: ${message}` };
    }
}
// DÜZELTME: 'any' tipini kullanmaktan kaçınmak için Matrix kullanıcı tipi tanımlandı.
type MatrixUser = {
  id: string;
  email?: string;
  user_metadata: {
    full_name?: string;
    [key: string]: unknown;
  };
};
async function createOrLoginSocialUserForMatrix(matrixUser: MatrixUser) {
  const adminSupabase = createAdminClient();
  // 1. Mevcut bir sosyal medya hesabı var mı diye kontrol et
  let { data: socialUser } = await adminSupabase
    .from('social_users')
    .select('id')
    .eq('matrix_user_id', matrixUser.id)
    .single();
  // 2. Eğer sosyal medya hesabı yoksa, oluştur
  if (!socialUser) {
    const { data: newSocialUser, error } = await adminSupabase
      .from('social_users')
      .insert({
        matrix_user_id: matrixUser.id,
        email: matrixUser.email || 'email-yok@ayka.com', // E-posta zorunlu olduğu için
        full_name: matrixUser.user_metadata.full_name || 'İsimsiz Kullanıcı',
        // Kullanıcı adı e-postanın @'den önceki kısmı olabilir, veya rastgele
        username: matrixUser.email?.split('@')[0] || `kullanici_${Math.random().toString(36).substring(2, 8)}`,
        // Bu hesaplar şifre ile giriş yapmayacağı için password_hash'i geçici bir değerle dolduruyoruz.
        password_hash: '$2a$10$NotRealPasswordHashForMatrixUser'
      })
      .select('id')
      .single();
    if (error) {
      console.error("Otomatik sosyal hesap oluşturma hatası:", error);
      return; // Hata olsa bile ana girişi engelleme
    }
    socialUser = newSocialUser;
  }
  
  // 3. AykaSosyal için session cookie'sini oluştur
  if (socialUser) {
    const sessionData = { userId: socialUser.id };
    (await cookies()).set('aykasosyal_session', JSON.stringify(sessionData), {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        maxAge: 60 * 60 * 24 * 7, // 1 hafta
        path: '/',
    });
  }
}

export async function signOutUser() {
  // AykaSosyal için oluşturduğumuz özel cookie'yi silelim
  const cookieStore = await cookies();
  // DÜZELTME: await eklendi
  cookieStore.delete('aykasosyal_session');

  // Supabase'in kendi oturumunu (İK Portalı) kapatalım
  const supabase = createClient();
  await supabase.auth.signOut();
  // Kullanıcıyı ana giriş sayfasına yönlendirelim
  redirect('/');
}