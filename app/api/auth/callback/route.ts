import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");

  if (!code) {
    return NextResponse.redirect(`${origin}/login/internal?error=no_code`);
  }

  // Buat redirect response DULUAN — semua cookie akan ditulis ke object INI
  const redirectUrl = `${origin}/dashboard`;
  const response = NextResponse.redirect(redirectUrl);

  // Baca cookie dari request yang masuk
  const cookieStore = cookies();

  // Buat Supabase client yang MENULIS cookie ke response object di atas
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        set(name: string, value: string, options: any) {
          // KUNCI: tulis ke response, BUKAN ke cookieStore
          response.cookies.set({ name, value, ...options });
        },
        remove(name: string, options: any) {
          response.cookies.set({ name, value: "", ...options });
        },
      },
    }
  );

  // Exchange code → session. Ini men-trigger set() di atas,
  // yang menulis session cookies langsung ke response.
  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    return NextResponse.redirect(`${origin}/login/internal?error=exchange_failed`);
  }

  // Response ini SUDAH membawa cookie session di header-nya.
  return response;
}
