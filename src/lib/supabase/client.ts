import { createBrowserClient } from '@supabase/ssr'

// GÜNCELLENDİ: Bu fonksiyon, tarayıcıda çalışacak olan Supabase istemcisini oluşturur.
// Bu, sunucu tarafında ayarlanan cookie'leri okuyabilmesini sağlar.
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}