// YOL: src/app/aykasosyal/actions.ts

"use server";
import { createAdminClient } from '@/lib/supabase/admin';
import bcrypt from 'bcryptjs';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import crypto from 'crypto';
// YOL: src/app/aykasosyal/actions.ts (Dosyanın en üstüne ekleyin)

import fs from 'fs/promises';
import path from 'path';
import { Resend } from 'resend';
import PasswordResetEmail from '@/components/emails/PasswordResetEmail';
import type { HistoryEntry } from '@/app/actions';

const resend = new Resend(process.env.RESEND_API_KEY);
const SESSION_COOKIE_NAME = 'aykasosyal_session';

type ActionState = {
    success: boolean;
    message: string;
};

// =================================================================
// HELPER (YARDIMCI) FONKSİYON
// =================================================================
async function getSocialUser() {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get(SESSION_COOKIE_NAME);
    if (!sessionCookie) return null;

    try {
        const session = JSON.parse(sessionCookie.value);
        if (!session.userId) return null;
        
        const supabase = createClient();
        // DÜZELTME: Kullanılmayan 'error' değişkeni '_' ile işaretlendi.
        const { data: user, error: _error } = await supabase
            .from('social_users')
            .select('*')
            .eq('id', session.userId)
            .single();

        if (_error) return null;
        return user;
    } catch (error) {
        return null;
    }
}

// =================================================================
// AUTH (KULLANICI GİRİŞ/KAYIT) FONKSİYONLARI
// =================================================================
export async function aykaSocialRegister(prevState: ActionState, formData: FormData) {
    const supabase = createAdminClient();
    const rawFormData = {
        tc_kimlik_no: formData.get('tc_kimlik_no') as string,
        full_name: formData.get('full_name') as string,
        username: formData.get('username') as string,
        email: formData.get('email') as string,
        password: formData.get('password') as string,
    };
    if (!rawFormData.tc_kimlik_no || !rawFormData.full_name || !rawFormData.username || !rawFormData.email || !rawFormData.password) {
        return { success: false, message: 'Tüm alanlar zorunludur.' };
    }
    
    const { data: personnel, error: personnelError } = await supabase
        .from('personnel')
        .select('"TC. KİMLİK NUMARASI"')
        .eq('"TC. KİMLİK NUMARASI"', rawFormData.tc_kimlik_no.trim())
        .single();

    if (personnelError || !personnel) {
        return { success: false, message: 'Bu T.C. Kimlik Numarası sistemde kayıtlı bir personele ait değildir.' };
    }

    const { data: existingSocialUser } = await supabase
        .from('social_users')
        .select('id')
        .eq('tc_kimlik_no', rawFormData.tc_kimlik_no.trim())
        .single();
    if (existingSocialUser) {
        return { success: false, message: 'Bu T.C. Kimlik Numarası ile zaten bir AykaSosyal hesabı oluşturulmuş.' };
    }

    const password_hash = await bcrypt.hash(rawFormData.password, 10);
    const { error: insertError } = await supabase.from('social_users').insert({
        tc_kimlik_no: rawFormData.tc_kimlik_no.trim(),
        full_name: rawFormData.full_name,
        username: rawFormData.username,
        email: rawFormData.email,
        password_hash: password_hash
    });

    if (insertError) {
        if (insertError.code === '23505') {
            return { success: false, message: 'Bu kullanıcı adı veya e-posta zaten kullanılıyor.' };
        }
        return { success: false, message: `Kayıt başarısız: ${insertError.message}` };
    }

    return { success: true, message: 'Personel doğrulaması başarılı! Kaydınız oluşturuldu. Şimdi giriş yapabilirsiniz.' };
}

export async function aykaSocialLogin(prevState: ActionState, formData: FormData) {
    const supabase = createAdminClient();
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;

    const { data: user, error } = await supabase.from('social_users').select('id, password_hash').eq('email', email).single();
    if (error || !user) {
        return { success: false, message: 'E-posta veya şifre hatalı.' };
    }
    
    const passwordMatch = await bcrypt.compare(password, user.password_hash);
    if (!passwordMatch) {
        return { success: false, message: 'E-posta veya şifre hatalı.' };
    }

    const sessionData = { userId: user.id };
    (await cookies()).set(SESSION_COOKIE_NAME, JSON.stringify(sessionData), {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        maxAge: 60 * 60 * 24 * 7, // 1 hafta
        path: '/',
    });
    redirect('/dashboard/aykasosyal');
}

export async function aykaSocialLogout() {
    (await cookies()).delete(SESSION_COOKIE_NAME);
    redirect('/');
}

// =================================================================
// PERSONEL İZİN FONKSİYONLARI
// =================================================================
export async function createLeaveRequestForSocialUser(prevState: ActionState, formData: FormData) {
  const socialUser = await getSocialUser();
  if (!socialUser || !socialUser.tc_kimlik_no) {
    return { success: false, message: "İzin talebi oluşturmak için giriş yapmalısınız." };
  }

  const rawFormData = {
    start_date: formData.get("start_date") as string,
    end_date: formData.get("end_date") as string,
    leave_type: formData.get("leave_type") as string,
  };

  if (!rawFormData.start_date || !rawFormData.end_date || !rawFormData.leave_type) {
      return { success: false, message: 'Lütfen tüm alanları doldurun.' };
  }

  const supabase = createAdminClient();

  const { data: personnel, error: personnelError } = await supabase
    .from("personnel")
    .select("id")
    .eq('"TC. KİMLİK NUMARASI"', socialUser.tc_kimlik_no.trim())
    .single();

  if (personnelError || !personnel) {
    console.error("Personel ID bulunamadı:", personnelError);
    return { success: false, message: "Personel kaydınız bulunamadı. Lütfen İK ile iletişime geçin." };
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
  
  revalidatePath('/dashboard/aykasosyal/izinlerim');
  revalidatePath('/dashboard/calendar');

   return { success: true, message: "YENİ KOD BAŞARIYLA ÇALIŞTI! İzin talebiniz oluşturuldu." };
}

export async function getMyLeaveRequests() {
    console.log("--- YENİ getMyLeaveRequests fonksiyonu ÇALIŞIYOR ---"); 

    const socialUser = await getSocialUser();
    if (!socialUser || !socialUser.tc_kimlik_no) return [];

    const supabase = createAdminClient();

    const { data: personnel, error: personnelError } = await supabase
        .from("personnel")
        .select('id, "ADI SOYADI"')
        .eq('"TC. KİMLİK NUMARASI"', socialUser.tc_kimlik_no.trim())
        .single();
    if (personnelError || !personnel) {
        console.error("İzinleri çekerken personel kaydı bulunamadı:", personnelError);
        return [];
    }

    const personnelId = personnel.id;
    const personnelFullName = personnel["ADI SOYADI"];
    
    const { data: requests, error: requestsError } = await supabase
        .from("leave_requests")
        .select(`*`)
        .eq("personnel_id", personnelId)
        .order('created_at', { ascending: false });

    if (requestsError) {
        console.error("Kişisel izin talepleri çekilemedi:", requestsError);
        return [];
    }

    const formattedRequests = requests.map(req => ({
        ...req,
        personnel_full_name: personnelFullName,
    }));
    return formattedRequests;
}

export async function getMyPersonnelInfo() {
    const socialUser = await getSocialUser();
    if (!socialUser || !socialUser.tc_kimlik_no) {
        console.error("AykaSosyal Profilim Hatası: Oturum bilgisi veya T.C. No bulunamadı.");
        return null;
    }

    const userTc = socialUser.tc_kimlik_no.trim();
    const supabase = createAdminClient();

    const { data: personnelList, error } = await supabase
        .from("personnel")
        .select('*')
        .eq('"TC. KİMLİK NUMARASI"', userTc);

    if (error) {
        console.error("AykaSosyal Profilim Hatası: Personel sorgusunda veritabanı hatası:", error);
        return null;
    }

    if (!personnelList || personnelList.length === 0) {
        console.error(`AykaSosyal Profilim Hatası: Personel tablosunda '${userTc}' T.C. numarası ile eşleşen kayıt bulunamadı.`);
        return null;
    }
    
    if (personnelList.length > 1) {
        console.warn(`AykaSosyal Profilim Uyarısı: '${userTc}' T.C. numarası ile birden fazla (${personnelList.length}) personel kaydı bulundu. Veri tutarlılığını kontrol edin. İlk kayıt kullanılacak.`);
    }

    return personnelList[0];
}


// =================================================================
// FEED (GÖNDERİ AKIŞI) FONKSİYONLARI (DEĞİŞİKLİK YOK)
// =================================================================
// ... (dosyanın üst kısmı aynı)

// YOL: src/app/aykasosyal/actions.ts

// ... (dosyanın üstündeki diğer kodlar aynı kalacak)

export async function createSocialPost(formData: FormData) {
    const user = await getSocialUser();
    if (!user) return { success: false, message: 'Yetkisiz işlem.' };

    const content = formData.get('content') as string;
    // EKLENDİ: FormData'dan image_url'i alıyoruz
    const imageUrl = formData.get('image_url') as string | null;

    if (!content || content.trim().length === 0) {
        return { success: false, message: 'Gönderi boş olamaz.' };
    }

    const supabase = createClient();
    // EKLENDİ: image_url'i veritabanına ekliyoruz
    const { error } = await supabase.from('social_posts').insert({
        user_id: user.id,
        content: content.trim(),
        image_url: imageUrl, 
    });

    if (error) {
        return { success: false, message: `Gönderi oluşturulamadı: ${error.message}` };
    }
    revalidatePath('/dashboard/aykasosyal');
    return { success: true, message: 'Gönderi paylaşıldı!' };
}

// ... (dosyanın altındaki diğer kodlar aynı kalacak)
// ... (dosyanın geri kalanı aynı)

export async function toggleSocialLike(postId: number) {
    const user = await getSocialUser();
    if (!user) return { success: false, message: 'Beğenmek için giriş yapmalısınız.' };

    const supabase = createClient();
    const { data: existingLike, error: checkError } = await supabase.from('social_likes').select('id').eq('user_id', user.id).eq('post_id', postId).single();
    if (checkError && checkError.code !== 'PGRST116') {
        return { success: false, message: 'Bir hata oluştu.' };
    }

    if (existingLike) {
        const { error: deleteError } = await supabase.from('social_likes').delete().eq('id', existingLike.id);
        if (deleteError) return { success: false, message: 'Beğeni geri alınamadı.' };
    } else {
        const { error: insertError } = await supabase.from('social_likes').insert({ user_id: user.id, post_id: postId });
        if (insertError) return { success: false, message: 'Gönderi beğenilemedi.' };
    }
    
    revalidatePath('/dashboard/aykasosyal');
    return { success: true };
}

export async function getSocialFeed(regionId?: string) {
    const user = await getSocialUser();
    const currentUserId = user ? user.id : '00000000-0000-0000-0000-000000000000';
    const regionParam = (!regionId || regionId === 'all') ? null : Number(regionId);
    const supabase = createClient();
    
    console.log("--- getSocialFeed Fonksiyonu Çağrıldı. Parametreler:", { currentUserId, regionParam });

    const { data, error } = await supabase.rpc('get_social_feed', {
        current_user_id: currentUserId,
        filter_region_id: regionParam
    });

    if (error) {
        console.error("--- getSocialFeed RPC Hatası ---:", JSON.stringify(error, null, 2));
    } else {
        console.log("--- getSocialFeed RPC Sonucu ---:", JSON.stringify(data, null, 2));
    }

    return data || [];
}

// YOL: src/app/aykasosyal/actions.ts

export async function addSocialComment(postId: number, formData: FormData) {
    const user = await getSocialUser();
    if (!user) return { success: false, message: 'Yorum yapmak için giriş yapmalısınız.', data: null };
    
    const content = formData.get('content') as string;
    if (!content || content.trim().length === 0) {
        return { success: false, message: 'Yorum boş olamaz.', data: null };
    }
    
    const supabase = createClient();
    
    // GÜNCELLENDİ: .select() eklenerek yeni eklenen yorumun verisi geri döndürülüyor.
    const { data: newComment, error } = await supabase.from('social_comments').insert({
        user_id: user.id,
        post_id: postId,
        content: content.trim()
    }).select(`
        *,
        author:social_users(id, full_name, username, avatar_url)
    `).single();

    if (error) {
        return { success: false, message: 'Yorum eklenirken bir hata oluştu.', data: null };
    }
    
    revalidatePath('/dashboard/aykasosyal');
    return { success: true, message: 'Yorum eklendi.', data: newComment };
}

// =================================================================
// PROFILE (PROFİL) FONKSİYONLARI (DEĞİŞİKLİK YOK)
// =================================================================
// YOL: src/app/aykasosyal/actions.ts

export async function getSocialProfileForEdit() {
    const user = await getSocialUser();
    if (!user) {
        redirect('/');
    }
    return {
        full_name: user.full_name,
        username: user.username,
        bio: user.bio,
        region_id: user.region_id,
        avatar_url: user.avatar_url // Bu alanın döndürüldüğünden emin oluyoruz
    };
 } 

export async function updateSocialProfile(prevState: ActionState, formData: FormData): Promise<ActionState> {
    const user = await getSocialUser();
    if (!user) return { success: false, message: 'Yetkisiz işlem.'  };
    
    const rawFormData = {
        full_name: formData.get('full_name') as string,
        username: formData.get('username') as string,
        bio: formData.get('bio') as string,
        region_id: formData.get('region_id') ? Number(formData.get('region_id')) : null,
        // Formdan gelen avatar_url'i alıyoruz
         avatar_url: formData.get('avatar_url') as string, 
    };

    if (!rawFormData.full_name || !rawFormData.username) {
        return { success: false, message: 'Ad Soyad ve Kullanıcı Adı zorunludur.'  };
    }

    const supabase = createClient();
    
    // Veritabanını yeni avatar yolu dahil olmak üzere güncelle
    const { error } = await supabase.from('social_users').update({
        full_name: rawFormData.full_name,
        username: rawFormData.username,
        bio: rawFormData.bio,
        region_id: rawFormData.region_id,
        avatar_url: rawFormData.avatar_url // Seçilen avatarın yolu direkt kaydediliyor.
    }).eq('id', user.id);
    
    if (error) {
        if (error.code === '23505') {
            return { success: false, message: 'Bu kullanıcı adı zaten alınmış.'  };
        }
         return { success: false, message: `Profil güncellenemedi: ${error.message}` };
    }
    
    revalidatePath('/dashboard/aykasosyal/profil/duzenle');
    revalidatePath('/dashboard/aykasosyal');
    revalidatePath(`/dashboard/aykasosyal/profil/${rawFormData.username}`);
    
    return { success: true, message: 'Profil başarıyla güncellendi!'  };
}
export async function getSocialProfileByUsername(username: string) {
    const supabase = createClient();
    const currentUser = await getSocialUser();
    const currentUserId = currentUser ? currentUser.id : '00000000-0000-0000-0000-000000000000';
    
    const { data, error } = await supabase.rpc('get_user_profile_and_posts', {
        profile_username: username,
        current_user_id: currentUserId
    });
    if (error) {
        console.error("Profil verisi çekme hatası:", error);
        return null;
    }
    return data;
}


// =================================================================
// EVENT (ETKİNLİK) FONKSİYONLARI (DEĞİŞİKLİK YOK)
// =================================================================
export async function createSocialEvent(formData: FormData) {
    const user = await getSocialUser();
    if (!user) return { success: false, message: 'Yetkisiz işlem.' };

    const eventData = {
        content: formData.get('content') as string,
        title: formData.get('title') as string,
        event_datetime: formData.get('event_datetime') as string,
        location: formData.get('location') as string,
    };
    if (!eventData.content || !eventData.title || !eventData.event_datetime) {
        return { success: false, message: 'Etkinlik için açıklama, başlık ve tarih zorunludur.' };
    }

    const supabase = createAdminClient();
    const { data: post, error: postError } = await supabase.from('social_posts').insert({
        user_id: user.id,
        content: eventData.content,
        post_type: 'event'
    }).select('id').single();
    if (postError || !post) {
        return { success: false, message: `Gönderi oluşturulamadı: ${postError?.message}` };
    }

    const { error: eventError } = await supabase.from('social_events').insert({
        post_id: post.id,
        title: eventData.title,
        event_datetime: eventData.event_datetime,
        location: eventData.location,
        description: eventData.content
    });
    if (eventError) {
        await supabase.from('social_posts').delete().eq('id', post.id);
        return { success: false, message: `Etkinlik oluşturulamadı: ${eventError.message}` };
    }
    
    revalidatePath('/dashboard/aykasosyal');
    return { success: true, message: 'Etkinlik başarıyla paylaşıldı!' };
}

export async function toggleRsvpToEvent(postId: number) {
    const user = await getSocialUser();
    if (!user) return { success: false, message: 'Katılmak için giriş yapmalısınız.' };

    const supabase = createClient();
    const { data: event } = await supabase.from('social_events').select('id').eq('post_id', postId).single();
    if (!event) return { success: false, message: 'Etkinlik bulunamadı.' };

    const { data: existingRsvp } = await supabase.from('social_event_rsvps').select('id').eq('user_id', user.id).eq('event_id', event.id).single();
    if (existingRsvp) {
        await supabase.from('social_event_rsvps').delete().eq('id', existingRsvp.id);
    } else {
        await supabase.from('social_event_rsvps').insert({ user_id: user.id, event_id: event.id });
    }
    
    revalidatePath('/dashboard/aykasosyal');
    return { success: true };
}

export async function getEventDetails(postId: number) {
    const supabase = createClient();
    const { data: postData, error: postError } = await supabase
        .from('social_posts')
        .select(`
            *,
            author:social_users(*),
            event:social_events(*)
        `)
        .eq('id', postId)
        .eq('post_type', 'event')
        .single();
    if (postError || !postData || !postData.event || postData.event.length === 0) {
        console.error("Etkinlik detayı çekme hatası:", postError);
        return null;
    }

    const { data: attendeesData, error: attendeesError } = await supabase
        .rpc('get_event_attendees', { p_post_id: postId });
    if (attendeesError) {
        console.error("Katılımcı listesi çekme hatası:", attendeesError);
        return { post: postData, attendees: [] };
    }
    
    return {
        post: postData,
        attendees: attendeesData
    };
}


// =================================================================
// PASSWORD RESET (ŞİFRE SIFIRLAMA) FONKSİYONLARI (DEĞİŞİKLİK YOK)
// =================================================================
export async function requestPasswordReset(prevState: ActionState, formData: FormData) {
    const email = formData.get('email') as string;
    if (!email) {
        return { success: false, message: 'Lütfen e-posta adresinizi girin.' };
    }

    const supabase = createAdminClient();
    const { data: user } = await supabase.from('social_users').select('id').eq('email', email).single();
    if (user) {
        const token = crypto.randomBytes(32).toString('hex');
        const token_hash = crypto.createHash('sha256').update(token).digest('hex');
        const expires_at = new Date(Date.now() + 60 * 60 * 1000);

        const { error: tokenError } = await supabase.from('social_password_reset_tokens').insert({
            user_id: user.id,
            token_hash: token_hash,
            expires_at: expires_at.toISOString()
        });
        if (tokenError) {
            return { success: false, message: 'Şifre sıfırlama talebi oluşturulamadı. Lütfen tekrar deneyin.' };
        }

        const resetLink = `${process.env.NEXT_PUBLIC_APP_URL}/sifre-sifirla?token=${token}`;
        try {
            await resend.emails.send({
                from: 'AykaSosyal <onboarding@resend.dev>',
                to: email,
                subject: 'AykaSosyal Şifre Sıfırlama Talebi',
                react: PasswordResetEmail({ resetLink }),
            });
        } catch (error) {
            console.error("E-posta gönderme hatası:", error);
            return { success: false, message: 'E-posta gönderilirken bir hata oluştu.' };
        }
    }

    return { success: true, message: 'Eğer bu e-posta adresi sistemimizde kayıtlıysa, şifre sıfırlama bağlantısı gönderilmiştir.' };
}

export async function resetPassword(prevState: ActionState, formData: FormData) {
    const { password, confirmPassword, token } = Object.fromEntries(formData);
    if (!password || !token || password !== confirmPassword) {
        return { success: false, message: 'Şifreler eşleşmiyor veya eksik bilgi var.' };
    }
    if (typeof password !== 'string' || password.length < 6) {
        return { success: false, message: 'Şifreniz en az 6 karakter olmalıdır.' };
    }
    
    const hashedToken = crypto.createHash('sha256').update(token as string).digest('hex');

    const supabase = createAdminClient();
    const { data: tokenData } = await supabase
        .from('social_password_reset_tokens')
        .select('user_id, expires_at')
        .eq('token_hash', hashedToken)
        .single();
    if (!tokenData || new Date() > new Date(tokenData.expires_at)) {
        return { success: false, message: 'Bu şifre sıfırlama bağlantısı geçersiz veya süresi dolmuş.' };
    }

    const newPasswordHash = await bcrypt.hash(password, 10);
    const { error: updateError } = await supabase
        .from('social_users')
        .update({ password_hash: newPasswordHash })
        .eq('id', tokenData.user_id);
    if (updateError) {
        return { success: false, message: 'Şifre güncellenirken bir hata oluştu.' };
    }

    await supabase.from('social_password_reset_tokens').delete().eq('token_hash', hashedToken);

    redirect('/');
}

// =================================================================
// CONTENT MANAGEMENT (İÇERİK YÖNETİMİ) FONKSİYONLARI (DEĞİŞİKLİK YOK)
// =================================================================
export async function getCurrentSocialUserId() {
    const user = await getSocialUser();
    return user ? user.id : null;
}

export async function deleteSocialPost(postId: number) {
    const user = await getSocialUser();
    if (!user) return { success: false, message: 'Yetkisiz işlem.' };

    const supabase = createClient();
    const { error } = await supabase
        .from('social_posts')
        .delete()
        .eq('id', postId)
        .eq('user_id', user.id);
    if (error) {
        return { success: false, message: 'Gönderi silinirken bir hata oluştu.' };
    }

    revalidatePath('/dashboard/aykasosyal');
    revalidatePath('/dashboard/aykasosyal/profil/[username]', 'layout');
    return { success: true };
}

export async function deleteSocialComment(commentId: number) {
    const user = await getSocialUser();
    if (!user) return { success: false, message: 'Yetkisiz işlem.' };

    const supabase = createClient();
    const { error } = await supabase
        .from('social_comments')
        .delete()
        .eq('id', commentId)
        .eq('user_id', user.id);
    if (error) {
        return { success: false, message: 'Yorum silinirken bir hata oluştu.' };
    }

    revalidatePath('/dashboard/aykasosyal');
    revalidatePath('/dashboard/aykasosyal/profil/[username]', 'layout');
    revalidatePath('/dashboard/aykasosyal/etkinlik/[postId]', 'layout');
    return { success: true };
}

export async function createAdvanceRequestForSocialUser(prevState: ActionState, formData: FormData): Promise<ActionState> {
  const socialUser = await getSocialUser();
  if (!socialUser || !socialUser.tc_kimlik_no) {
    return { success: false, message: "Avans talebi oluşturmak için giriş yapmalısınız." };
  }

  const rawFormData = {
    amount: parseFloat(formData.get("amount") as string),
    reason: formData.get("reason") as string,
  };

  if (!rawFormData.amount || rawFormData.amount <= 0) {
      return { success: false, message: 'Lütfen geçerli bir miktar girin.' };
  }

  const supabase = createAdminClient();

  const { data: personnel, error: personnelError } = await supabase
    .from("personnel")
    .select("id")
    .eq('"TC. KİMLİK NUMARASI"', socialUser.tc_kimlik_no.trim())
    .single();

  if (personnelError || !personnel) {
    return { success: false, message: "Personel kaydınız bulunamadı. Lütfen İK ile iletişime geçin." };
  }

  const initialHistory: HistoryEntry[] = [{
    action: "Talep oluşturuldu",
    actor: "Personel",
    timestamp: new Date().toISOString(),
    notes: `Personel tarafından ${rawFormData.amount} TL tutarında avans talebi oluşturuldu. Sebep: ${rawFormData.reason || 'Belirtilmedi'}`
  }];

  const { error: insertError } = await supabase.from("cash_advance_requests").insert({
    personnel_id: personnel.id,
    amount: rawFormData.amount,
    reason: rawFormData.reason,
    status: "pending",
    history_log: initialHistory,
  });

  if (insertError) {
    return { success: false, message: `Veritabanı hatası: ${insertError.message}` };
  }
  
  revalidatePath('/dashboard/aykasosyal/avanslarim');
  revalidatePath('/dashboard/notifications');

   return { success: true, message: "Avans talebiniz başarıyla oluşturuldu." };
}

export async function getMyAdvanceRequests() {
    const socialUser = await getSocialUser();
    if (!socialUser || !socialUser.tc_kimlik_no) return [];

    const supabase = createAdminClient();

    const { data: personnel, error: personnelError } = await supabase
        .from("personnel")
        .select('id, "ADI SOYADI"')
        .eq('"TC. KİMLİK NUMARASI"', socialUser.tc_kimlik_no.trim())
        .single();

    if (personnelError || !personnel) {
        console.error("Avansları çekerken personel kaydı bulunamadı:", personnelError);
        return [];
    }

    const { data: requests, error: requestsError } = await supabase
        .from("cash_advance_requests")
        .select(`*`)
        .eq("personnel_id", personnel.id)
        .order('created_at', { ascending: false });

    if (requestsError) {
        console.error("Kişisel avans talepleri çekilemedi:", requestsError);
        return [];
    }

    const formattedRequests = requests.map(req => ({
        ...req,
        personnel_full_name: personnel["ADI SOYADI"],
    }));
    return formattedRequests;
}

// YOL: src/app/aykasosyal/actions.ts (Bu yeni fonksiyonu ekleyin)

// =================================================================
// AVATAR FONKSİYONLARI
// =================================================================
export async function getAvatarList() {
    "use server";
    try {
        // public/avatars klasörünün sunucudaki yolunu al
        const avatarsDirectory = path.join(process.cwd(), 'public', 'avatars');
        
        // Klasördeki tüm dosyaları oku
        const filenames = await fs.readdir(avatarsDirectory);
        
        // Sadece .png uzantılı dosyaları filtrele
        const pngFiles = filenames.filter(file => file.endsWith('.png'));
        
        // İstemcinin erişebileceği URL yollarına dönüştür (örn: /avatars/avatar-1.png)
        const avatarPaths = pngFiles.map(file => `/avatars/${file}`);
        
        return avatarPaths;
    } catch (error) {
        console.error("Avatarlar okunurken hata oluştu:", error);
        // Hata durumunda boş bir dizi döndürerek uygulamanın çökmesini engelle
        return [];
    }
}