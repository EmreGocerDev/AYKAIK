"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from 'next/navigation';
import { createAdminClient } from '@/lib/supabase/admin';
// GÜNCELLEME: Güvenli tarih fonksiyonumuzu import ediyoruz.
import { safeNewDate } from '@/lib/utils';

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
  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  if (error) {
    if (typeof window !== "undefined") {
      alert(JSON.stringify(error, null, 2));
    }
    return {
      message: 'Giriş bilgileri hatalı. Lütfen tekrar deneyin.',
    };
  }

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

// *** SORUN ÇÖZÜMÜ BAŞLANGICI ***
// Admin yetkisiyle çalışması için 'createAdminClient' kullanıldı.
export async function updateUser(formData: FormData) {
  const adminSupabase = createAdminClient();
  // YETKİLENDİRME İÇİN DEĞİŞTİRİLDİ
  const userId = formData.get('userId') as string;
  const full_name = formData.get('full_name') as string;
  const region_id = Number(formData.get('region_id'));
  if (!userId || !full_name || !region_id) {
    return { success: false, message: 'Eksik bilgi.' };
  }

  const { error } = await adminSupabase // YETKİLENDİRME İÇİN DEĞİŞTİRİLDİ
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
// *** SORUN ÇÖZÜMÜ SONU ***

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

// YENİ: Dashboard düzenini kaydetmek için server action
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