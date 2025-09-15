"use server";

import { createAdminClient } from '@/lib/supabase/admin';
import bcrypt from 'bcryptjs';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';

const SESSION_COOKIE_NAME = 'aykasosyal_session';

// =================================================================
// HELPER (YARDIMCI) FONKSİYON
// =================================================================

// Oturum açmış sosyal medya kullanıcısını getiren yardımcı fonksiyon
async function getSocialUser() {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get(SESSION_COOKIE_NAME);

    if (!sessionCookie) {
        return null;
    }

    try {
        const session = JSON.parse(sessionCookie.value);
        if (!session.userId) return null;
        
        const supabase = createClient();
        const { data: user, error } = await supabase
            .from('social_users')
            .select('*') // Profil işlemleri için tüm alanları seçiyoruz
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

export async function aykaSocialRegister(prevState: any, formData: FormData) {
    const supabase = createAdminClient();
    const rawFormData = {
        full_name: formData.get('full_name') as string,
        username: formData.get('username') as string,
        email: formData.get('email') as string,
        password: formData.get('password') as string,
    };

    if (!rawFormData.full_name || !rawFormData.username || !rawFormData.email || !rawFormData.password) {
        return { success: false, message: 'Tüm alanlar zorunludur.' };
    }

    const password_hash = await bcrypt.hash(rawFormData.password, 10);

    const { error } = await supabase.from('social_users').insert({
        full_name: rawFormData.full_name,
        username: rawFormData.username,
        email: rawFormData.email,
        password_hash: password_hash
    });

    if (error) {
        if (error.code === '23505') {
            return { success: false, message: 'Bu kullanıcı adı veya e-posta zaten kullanılıyor.' };
        }
        return { success: false, message: `Kayıt başarısız: ${error.message}` };
    }

    return { success: true, message: 'Kayıt başarılı! Şimdi giriş yapabilirsiniz.' };
}

export async function aykaSocialLogin(prevState: any, formData: FormData) {
    const supabase = createAdminClient();
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;

    const { data: user, error } = await supabase
        .from('social_users')
        .select('id, password_hash')
        .eq('email', email)
        .single();

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
    
    const { data: existingLike, error: checkError } = await supabase
        .from('social_likes')
        .select('id')
        .eq('user_id', user.id)
        .eq('post_id', postId)
        .single();

    if (checkError && checkError.code !== 'PGRST116') {
        return { success: false, message: 'Bir hata oluştu.' };
    }

    if (existingLike) {
        const { error: deleteError } = await supabase
            .from('social_likes')
            .delete()
            .eq('id', existingLike.id);
        if (deleteError) return { success: false, message: 'Beğeni geri alınamadı.' };
    } else {
        const { error: insertError } = await supabase
            .from('social_likes')
            .insert({ user_id: user.id, post_id: postId });
        if (insertError) return { success: false, message: 'Gönderi beğenilemedi.' };
    }

    revalidatePath('/dashboard/aykasosyal');
    return { success: true };
}

export async function getSocialFeed() {
    const user = await getSocialUser();
    if (!user) {
        const NULL_UUID = '00000000-0000-0000-0000-000000000000';
        const supabase = createClient();
        const { data, error } = await supabase.rpc('get_social_feed', { current_user_id: NULL_UUID });
        if(error) console.error("Feed Error:", error);
        return data || [];
    }
    
    const supabase = createClient();
    const { data, error } = await supabase.rpc('get_social_feed', { current_user_id: user.id });
    if(error) console.error("Feed Error:", error);
    return data || [];
}

// =================================================================
// PROFILE (PROFİL DÜZENLEME) FONKSİYONLARI
// =================================================================

export async function getSocialProfileForEdit() {
    const user = await getSocialUser();
    if (!user) {
        redirect('/'); // Kullanıcı yoksa ana sayfaya yönlendir
    }
    return {
        full_name: user.full_name,
        username: user.username,
        bio: user.bio,
        region_id: user.region_id
    };
}

export async function updateSocialProfile(prevState: any, formData: FormData) {
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
    const { error } = await supabase
        .from('social_users')
        .update({
            full_name: rawFormData.full_name,
            username: rawFormData.username,
            bio: rawFormData.bio,
            region_id: rawFormData.region_id
        })
        .eq('id', user.id);

    if (error) {
        if (error.code === '23505') {
            return { success: false, message: 'Bu kullanıcı adı zaten alınmış.' };
        }
        return { success: false, message: `Profil güncellenemedi: ${error.message}` };
    }
    
    revalidatePath('/dashboard/aykasosyal/profil/duzenle');
    return { success: true, message: 'Profil başarıyla güncellendi!' };
}