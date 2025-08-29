import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          request.cookies.set({ name, value, ...options })
          response = NextResponse.next({ request: { headers: request.headers } })
          response.cookies.set({ name, value, ...options })
        },
        remove(name: string, options: CookieOptions) {
          request.cookies.set({ name, value: '', ...options })
          response = NextResponse.next({ request: { headers: request.headers } })
          response.cookies.set({ name, value: '', ...options })
        },
      },
    }
  )

  // KONTROL NOKTASI 3: Middleware'de kullanıcıyı kontrol edelim
  const { data: { user } } = await supabase.auth.getUser();
  
  const { pathname } = request.nextUrl;
  console.log(`3. Middleware çalıştı. Gidilen yol: ${pathname}. Kullanıcı durumu:`, user ? user.email : "Kullanıcı YOK");

  // Korunan sayfa kontrolü
  if (!user && pathname.startsWith('/dashboard')) {
    console.log("4. Kullanıcı YOK ve dashboard'a gitmeye çalışıyor. Login'e yönlendiriliyor.");
    const url = request.nextUrl.clone()
    url.pathname = '/'
    return NextResponse.redirect(url)
  }

  // Zaten giriş yapmış kullanıcı anasayfaya giderse dashboard'a yönlendir
  if (user && pathname === '/') {
    console.log("4. Kullanıcı VAR ve anasayfaya gitmeye çalışıyor. Dashboard'a yönlendiriliyor.");
    const url = request.nextUrl.clone()
    url.pathname = '/dashboard'
    return NextResponse.redirect(url)
  }

  return response
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
}