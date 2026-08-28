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

  // Kumpulkan semua cookie yang Supabase ingin set — JANGAN tulis
  // ke cookieStore langsung, kumpulkan dulu untuk ditaruh di response.
  const cookiesToSet: { name: string; value: string; options: any }[] = [];

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          // BACA dari cookieStore — ini bisa akses httpOnly cookies
          // termasuk PKCE code_verifier
          return cookieStore.get(name)?.value;
        },
        set(name: string, value: string, options: any) {
          // KUMPULKAN, jangan langsung tulis
          cookiesToSet.push({ name, value, options });
        },
        remove(name: string, options: any) {
          cookiesToSet.push({ name, value: "", options: { ...options, maxAge: 0 } });
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
  // KUNCI: Kembalikan HTML 200 (BUKAN redirect 307).
  // Browser PASTI memproses Set-Cookie pada response 200.
  // Setelah cookie tersimpan, JavaScript redirect ke /dashboard.
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

  // Taruh SEMUA cookie yang dikumpulkan ke response object ini.
  // Karena response-nya 200 (bukan redirect), browser PASTI
  // memproses Set-Cookie headers sebelum menjalankan JavaScript.
  for (const { name, value, options } of cookiesToSet) {
    response.cookies.set({ name, value, ...options });
  }

  return response;
}
