import { createClient } from '@supabase/supabase-js';

// Bu istemci, service_role anahtarını kullanarak RLS'i atlar.
// SADECE GÜVENLİ SUNUCU ORTAMLARINDA (Server Actions) KULLANILMALIDIR.
export const createAdminClient = () => {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error('Supabase URL veya Service Role Key bulunamadı.');
  }

  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  );
};