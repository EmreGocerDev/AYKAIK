import { createClient } from '@supabase/supabase-js';

// Bu istemci, performans veritabanına bağlanmak için kullanılacak.
// Sadece güvenli sunucu ortamlarında (Server Actions) kullanılmalıdır.
export const createPerformanceClient = () => {
  if (!process.env.NEXT_PUBLIC_PERFORMANCE_SUPABASE_URL || !process.env.NEXT_PUBLIC_PERFORMANCE_SUPABASE_ANON_KEY) {
    throw new Error('Performans Supabase URL veya Anon Key bulunamadı.');
  }

  // İkinci projeniz için yeni bir Supabase istemcisi oluşturun
  return createClient(
    process.env.NEXT_PUBLIC_PERFORMANCE_SUPABASE_URL,
    process.env.NEXT_PUBLIC_PERFORMANCE_SUPABASE_ANON_KEY,
    {
      auth: {
        // Bu istemci genellikle sadece veri sorgulayacağı için session yönetimine gerek yok
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  );
};