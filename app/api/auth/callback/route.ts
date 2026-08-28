import { NextResponse } from "next/server";
import { createClient, createServiceRoleClient } from "@/lib/supabase/server";

// ============================================================
// Callback OAuth Layer 1 (Super Admin & CM)
// ============================================================
// SENGAJA dibuat sesederhana mungkin — pakai createClient() yang
// SAMA PERSIS dipakai di seluruh bagian lain aplikasi (termasuk
// creator-login yang sudah terbukti berfungsi). Tidak ada lagi
// object cookies/response custom.
// ============================================================

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/dashboard";

  if (!code) {
    return NextResponse.redirect(`${origin}/login/internal?error=missing_code`);
  }

  const supabase = createClient();

  // 1. Tukar code OAuth jadi session.
  //    createClient() di atas otomatis menulis cookie sesi lewat
  //    cookies().set() dari next/headers — persis seperti yang
  //    dipakai creator-login/route.ts.
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

  // 2. Cek apakah email ini terdaftar di cm_profiles (pakai service
  //    role supaya bisa baca baris 'invited' yang id-nya masih NULL)
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

  return NextResponse.redirect(`${origin}${next}`);
}
