"use server";

import { createAdminClient } from '@/lib/supabase/admin';
import bcrypt from 'bcryptjs';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import crypto from 'crypto';

import { Resend } from 'resend';
import PasswordResetEmail from '@/components/emails/PasswordResetEmail';
// YENİ: Resend istemcisini başlat
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
        const { data: user, error } = await supabase
            .from('social_users')
            .select('*')
            .eq('id', session.userId)
            .single();
        if (error) return null;
        return user;
    } catch (error) {
        return null;
    }
}

// =================================================================
// AUTH (KULLANICI GİRİŞ/KAYIT) FONKSİYONLARI
// =================================================================
// ... (aykaSocialRegister, aykaSocialLogin, aykaSocialLogout fonksiyonları burada, değişmedi)
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
    
    // 1. KONTROL: Girilen TC, personel listesinde var mı?
    const { data: personnel, error: personnelError } = await supabase
        .from('personnel')
        .select('tc_kimlik_no')
        .eq('tc_kimlik_no', rawFormData.tc_kimlik_no)
        .single();
    if (personnelError || !personnel) {
        return { success: false, message: 'Bu T.C. Kimlik Numarası sistemde kayıtlı bir personele ait değildir.' };
    }

    // 2. KONTROL: Bu TC ile daha önce sosyal hesap açılmış mı?
    const { data: existingSocialUser } = await supabase
        .from('social_users')
        .select('id')
        .eq('tc_kimlik_no', rawFormData.tc_kimlik_no)
        .single();
    if (existingSocialUser) {
        return { success: false, message: 'Bu T.C. Kimlik Numarası ile zaten bir AykaSosyal hesabı oluşturulmuş.' };
    }

    // KONTROLLER TAMAM, YENİ KULLANICIYI OLUŞTUR
    const password_hash = await bcrypt.hash(rawFormData.password, 10);
    const { error: insertError } = await supabase.from('social_users').insert({
        tc_kimlik_no: rawFormData.tc_kimlik_no, // TC'yi de ekliyoruz
        full_name: rawFormData.full_name,
        username: rawFormData.username,
        email: rawFormData.email,
        password_hash: password_hash
    });
    if (insertError) {
        if (insertError.code === '23505') { // unique constraint violation
            // Bu hata username veya email için de gelebilir
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
// FEED (GÖNDERİ AKIŞI) FONKSİYONLARI
// =================================================================
// ... (createSocialPost, toggleSocialLike, getSocialFeed fonksiyonları burada, değişmedi)
export async function createSocialPost(formData: FormData) {
    const user = await getSocialUser();
    if (!user) return { success: false, message: 'Yetkisiz işlem.' };
    const content = formData.get('content') as string;
    if (!content || content.trim().length === 0) {
        return { success: false, message: 'Gönderi boş olamaz.' };
    }
    const supabase = createClient();
    const { error } = await supabase.from('social_posts').insert({
        user_id: user.id,
        content: content.trim()
    });
    if (error) {
        return { success: false, message: `Gönderi oluşturulamadı: ${error.message}` };
    }
    revalidatePath('/dashboard/aykasosyal');
    return { success: true, message: 'Gönderi paylaşıldı!' };
}
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
    const { data, error } = await supabase.rpc('get_social_feed', {
        current_user_id: currentUserId,
        filter_region_id: regionParam
    });
    if(error) console.error("Feed Error:", error);
    return data || [];
}
export async function addSocialComment(postId: number, formData: FormData) {
    const user = await getSocialUser();
    if (!user) return { success: false, message: 'Yorum yapmak için giriş yapmalısınız.' };
    const content = formData.get('content') as string;
    if (!content || content.trim().length === 0) {
        return { success: false, message: 'Yorum boş olamaz.' };
    }
    const supabase = createClient();
    const { error } = await supabase.from('social_comments').insert({
        user_id: user.id,
        post_id: postId,
        content: content.trim()
    });
    if (error) {
        return { success: false, message: 'Yorum eklenirken bir hata oluştu.' };
    }
    revalidatePath('/dashboard/aykasosyal');
    return { success: true, message: 'Yorum eklendi.' };
}

// =================================================================
// PROFILE (PROFİL) FONKSİYONLARI
// =================================================================
// ... (getSocialProfileForEdit, updateSocialProfile fonksiyonları burada, değişmedi)
export async function getSocialProfileForEdit() {
    const user = await getSocialUser();
    if (!user) {
        redirect('/');
    }
    return {
        full_name: user.full_name,
        username: user.username,
        bio: user.bio,
        region_id: user.region_id
    };
}
export async function updateSocialProfile(prevState: ActionState, formData: FormData) {
    const user = await getSocialUser();
    if (!user) return { success: false, message: 'Yetkisiz işlem.' };
    const rawFormData = {
        full_name: formData.get('full_name') as string,
        username: formData.get('username') as string,
        bio: formData.get('bio') as string,
        region_id: formData.get('region_id') ? Number(formData.get('region_id')) : null
    };
    if (!rawFormData.full_name || !rawFormData.username) {
        return { success: false, message: 'Ad Soyad ve Kullanıcı Adı zorunludur.' };
    }
    const supabase = createClient();
    const { error } = await supabase.from('social_users').update({
        full_name: rawFormData.full_name,
        username: rawFormData.username,
        bio: rawFormData.bio,
        region_id: rawFormData.region_id
    }).eq('id', user.id);
    if (error) {
        if (error.code === '23505') {
            return { success: false, message: 'Bu kullanıcı adı zaten alınmış.' };
        }
        return { success: false, message: `Profil güncellenemedi: ${error.message}` };
    }
    revalidatePath('/dashboard/aykasosyal/profil/duzenle');
    return { success: true, message: 'Profil başarıyla güncellendi!' };
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
// EVENT (ETKİNLİK) FONKSİYONLARI
// =================================================================
// ... (createSocialEvent, toggleRsvpToEvent fonksiyonları burada, değişmedi)
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


// getEventDetails fonksiyonu güncellendi
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
    // DÜZELTME: Hata kontrolü daha güvenli hale getirildi.
    // Artık event listesinin boş olup olmadığını kontrol ediyoruz.
    if (postError || !postData || !postData.event || postData.event.length === 0) {
        console.error("Etkinlik detayı çekme hatası:", postError);
        return null;
    }

    const { data: attendeesData, error: attendeesError } = await supabase
        .rpc('get_event_attendees', { p_post_id: postId });
    if (attendeesError) {
        console.error("Katılımcı listesi çekme hatası:", attendeesError);
        return { post: postData, attendees: [] }; // Katılımcılar olmasa da sayfa çalışsın
    }
    
    return {
        post: postData,
        attendees: attendeesData
    };
}
export async function requestPasswordReset(prevState: ActionState, formData: FormData) {
    const email = formData.get('email') as string;
    if (!email) {
        return { success: false, message: 'Lütfen e-posta adresinizi girin.' };
    }

    const supabase = createAdminClient();
    const { data: user } = await supabase.from('social_users').select('id').eq('email', email).single();
    if (user) {
        // Kullanıcı varsa token oluştur ve e-posta gönder
        const token = crypto.randomBytes(32).toString('hex');
        const token_hash = crypto.createHash('sha256').update(token).digest('hex');
        const expires_at = new Date(Date.now() + 60 * 60 * 1000); // 1 saat geçerli

        const { error: tokenError } = await supabase.from('social_password_reset_tokens').insert({
            user_id: user.id,
            token_hash: token_hash,
            expires_at: expires_at.toISOString()
        });
        if (tokenError) {
            return { success: false, message: 'Şifre sıfırlama talebi oluşturulamadı. Lütfen tekrar deneyin.' };
        }

        // YENİ: Gerçek E-posta Gönderme Kodu
        const resetLink = `${process.env.NEXT_PUBLIC_APP_URL}/sifre-sifirla?token=${token}`;
        try {
            await resend.emails.send({
                from: 'AykaSosyal <onboarding@resend.dev>', // Test için bu adresi kullanıyoruz
                to: email,
                subject: 'AykaSosyal Şifre Sıfırlama Talebi',
                react: PasswordResetEmail({ resetLink }),
      
            });
        } catch (error) {
            console.error("E-posta gönderme hatası:", error);
            return { success: false, message: 'E-posta gönderilirken bir hata oluştu.' };
        }
    }

    // Her durumda (kullanıcı bulunsun veya bulunmasın) aynı mesajı göstererek
    // e-posta adreslerinin sistemde olup olmadığı bilgisini sızdırmamış oluruz.
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
    // 1. Token veritabanında var mı ve geçerli mi?
    const { data: tokenData } = await supabase
        .from('social_password_reset_tokens')
        .select('user_id, expires_at')
        .eq('token_hash', hashedToken)
        .single();
    if (!tokenData || new Date() > new Date(tokenData.expires_at)) {
        return { success: false, message: 'Bu şifre sıfırlama bağlantısı geçersiz veya süresi dolmuş.' };
    }

    // 2. Yeni şifreyi hash'le ve güncelle
    const newPasswordHash = await bcrypt.hash(password, 10);
    const { error: updateError } = await supabase
        .from('social_users')
        .update({ password_hash: newPasswordHash })
        .eq('id', tokenData.user_id);
    if (updateError) {
        return { success: false, message: 'Şifre güncellenirken bir hata oluştu.' };
    }

    // 3. Kullanılmış token'ı sil
    await supabase.from('social_password_reset_tokens').delete().eq('token_hash', hashedToken);

    redirect('/');
    // Başarılı olunca ana sayfaya (giriş ekranına) yönlendir.
}
// ... dosyanızdaki diğer tüm fonksiyonların altına ekleyin

// =================================================================
// CONTENT MANAGEMENT (İÇERİK YÖNETİMİ) FONKSİYONLARI
// =================================================================

// Arayüzde mevcut kullanıcının ID'sini almak için basit bir fonksiyon
export async function getCurrentSocialUserId() {
    const user = await getSocialUser();
    return user ? user.id : null;
}

export async function deleteSocialPost(postId: number) {
    const user = await getSocialUser();
    if (!user) return { success: false, message: 'Yetkisiz işlem.' };

    const supabase = createClient();
    // Silme işleminden önce gönderinin sahibinin mevcut kullanıcı olduğunu teyit et
    const { error } = await supabase
        .from('social_posts')
        .delete()
        .eq('id', postId)
        .eq('user_id', user.id); // EN ÖNEMLİ GÜVENLİK KONTROLÜ

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
    // Yorumun sahibinin mevcut kullanıcı olduğunu teyit et
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