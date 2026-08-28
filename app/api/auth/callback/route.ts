import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");

  if (!code) {
    return NextResponse.redirect(`${origin}/login/internal?error=no_code`);
  }

  const cookieStore = cookies();

  // Kumpulkan semua cookie yang Supabase ingin set lewat setAll — ini
  // interface yang direkomendasikan resmi oleh @supabase/ssr, dan yang
  // benar menangani token panjang yang dipecah jadi beberapa cookie
  // (sb-xxx-auth-token.0, .1, dst). Interface get/set/remove satu-satu
  // yang dipakai sebelumnya tidak diam-diam salah menangani kasus ini.
  let cookiesToSet: { name: string; value: string; options: any }[] = [];

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          // Baca dari cookieStore — bisa akses httpOnly cookies termasuk PKCE code_verifier
          return cookieStore.getAll();
        },
        setAll(cookiesFromSupabase: { name: string; value: string; options: any }[]) {
          cookiesToSet = cookiesFromSupabase;
        },
      },
    }
  );

  // Exchange code di SERVER (hanya server bisa baca PKCE code_verifier)
  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    return NextResponse.redirect(
      `${origin}/login/internal?error=exchange_failed&detail=${encodeURIComponent(error.message)}`
    );
  }

  // ================================================================
  // Tetap kembalikan HTML 200 (bukan redirect 307) sebagai lapisan
  // pertahanan tambahan — beberapa proxy/edge cache lebih konsisten
  // memproses Set-Cookie pada response 200 dibanding pada redirect.
  // ================================================================
  const html = `<!DOCTYPE html>
<html>
<head><title>Logging in...</title></head>
<body>
  <p>Logging in...</p>
  <script>window.location.replace("/dashboard");</script>
</body>
</html>`;

  const response = new NextResponse(html, {
    status: 200,
    headers: { "Content-Type": "text/html; charset=utf-8" },
  });

  for (const { name, value, options } of cookiesToSet) {
    response.cookies.set(name, value, options);
  }

  return response;
}
