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

  // Kumpulkan semua cookie yang Supabase ingin set
  const cookiesToSet: string[] = [];

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        set(name: string, value: string, options: any) {
          // Simpan ke cookieStore (untuk implicit response)
          cookieStore.set({ name, value, ...options });
          // JUGA kumpulkan sebagai raw Set-Cookie header string
          const parts = [`${name}=${encodeURIComponent(value)}`];
          if (options.path) parts.push(`Path=${options.path}`);
          if (options.maxAge) parts.push(`Max-Age=${options.maxAge}`);
          if (options.domain) parts.push(`Domain=${options.domain}`);
          if (options.secure) parts.push("Secure");
          if (options.httpOnly) parts.push("HttpOnly");
          if (options.sameSite) parts.push(`SameSite=${options.sameSite}`);
          cookiesToSet.push(parts.join("; "));
        },
        remove(name: string, options: any) {
          cookieStore.set({ name, value: "", ...options });
          const parts = [`${name}=`, "Max-Age=0"];
          if (options.path) parts.push(`Path=${options.path}`);
          cookiesToSet.push(parts.join("; "));
        },
      },
    }
  );

  // Exchange code → session
  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    return NextResponse.redirect(`${origin}/login/internal?error=exchange_failed`);
  }

  // =================================================================
  // KUNCI PERBAIKAN: Jangan pakai NextResponse.redirect()
  // Kirim halaman HTML biasa (200) dengan Set-Cookie header EKSPLISIT.
  // Browser PASTI memproses Set-Cookie pada response 200.
  // Lalu <meta http-equiv="refresh"> redirect ke /dashboard SETELAH
  // cookie tersimpan.
  // =================================================================
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta http-equiv="refresh" content="0;url=${origin}/dashboard" />
      </head>
      <body>
        <p>Logging in...</p>
      </body>
    </html>
  `;

  const headers = new Headers();
  headers.set("Content-Type", "text/html; charset=utf-8");
  // Pasang setiap cookie sebagai Set-Cookie header terpisah
  for (const cookie of cookiesToSet) {
    headers.append("Set-Cookie", cookie);
  }

  return new NextResponse(html, { status: 200, headers });
}
