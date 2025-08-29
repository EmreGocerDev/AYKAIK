import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'

export function createClient() {
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        // GÜNCELLENDİ: 'cookies()' fonksiyonu her kullanımda 'await' ile bekleniyor.
        async get(name: string) {
          return (await cookies()).get(name)?.value
        },
        async set(name: string, value: string, options: CookieOptions) {
          try {
            (await cookies()).set({ name, value, ...options })
          } catch (error) {
            // Server Action ve Route Handler'lar cookie ayarlayabilir,
            // ancak Server Component'ler ayarlayamaz. Bu yüzden bu hata normaldir.
          }
        },
        async remove(name: string, options: CookieOptions) {
          try {
            (await cookies()).set({ name, value: '', ...options })
          } catch (error) {
            // Yukarıdakiyle aynı.
          }
        },
      },
    }
  )
}