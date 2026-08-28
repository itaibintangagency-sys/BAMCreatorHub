import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";

// ============================================================
// Callback OAuth Layer 1 (Super Admin & CM)
// ============================================================
// Pola cookies di sini SENGAJA dibuat identik dengan
// lib/supabase/server.ts (get/set/remove), bukan getAll/setAll,
// supaya konsisten dengan versi @supabase/ssr yang terpasang di
// project ini dan sesi benar-benar tersimpan untuk middleware.
// ============================================================

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/dashboard";

  if (!code) {
    return NextResponse.redirect(`${origin}/login/internal?error=missing_code`);
  }

  const cookieStore = cookies();
  const response = NextResponse.redirect(`${origin}${next}`);

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        set(name: string, value: string, options: any) {
          // Tulis ke response yang akan dikembalikan, BUKAN cookieStore
          // langsung — supaya Set-Cookie pasti menempel di redirect ini.
          response.cookies.set({ name, value, ...options });
        },
        remove(name: string, options: any) {
          response.cookies.set({ name, value: "", ...options });
        },
      },
    }
  );

  // 1. Tukar code OAuth jadi session (ini yang men-trigger set() di atas)
  const { data: sessionData, error: exchangeError } =
    await supabase.auth.exchangeCodeForSession(code);

  if (exchangeError || !sessionData.user) {
    return NextResponse.redirect(`${origin}/login/internal?error=auth_failed`);
  }

  const user = sessionData.user;
  const email = user.email;

  if (!email) {
    await supabase.auth.signOut();
    return NextResponse.redirect(`${origin}/login/internal?error=no_email`);
  }

  // 2. Cek apakah email ini terdaftar di cm_profiles.
  //    Pakai service role supaya bisa baca baris 'invited' yang
  //    id-nya masih NULL (RLS "own profile" belum berlaku untuk itu).
  const { createServiceRoleClient } = await import("@/lib/supabase/server");
  const supabaseAdmin = createServiceRoleClient();

  const { data: profile, error: profileError } = await supabaseAdmin
    .from("cm_profiles")
    .select("row_id, status, role")
    .eq("email", email)
    .maybeSingle();

  if (profileError || !profile) {
    await supabase.auth.signOut();
    return NextResponse.redirect(`${origin}/login/internal?error=not_registered`);
  }

  if (profile.status === "revoked") {
    await supabase.auth.signOut();
    return NextResponse.redirect(`${origin}/login/internal?error=access_revoked`);
  }

  if (profile.status === "invited") {
    const { error: activateError } = await supabaseAdmin
      .from("cm_profiles")
      .update({ id: user.id, status: "active" })
      .eq("row_id", profile.row_id);

    if (activateError) {
      await supabase.auth.signOut();
      return NextResponse.redirect(`${origin}/login/internal?error=activation_failed`);
    }
  }

  // Session cookies sudah menempel di `response` lewat set() di atas.
  return response;
}
