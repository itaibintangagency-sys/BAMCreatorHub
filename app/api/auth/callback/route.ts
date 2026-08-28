import { NextResponse } from "next/server";
import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { type NextRequest } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase/server";

// response dibuat SEKALI di awal, cookie ditulis LANGSUNG ke situ
// lewat setAll, lalu response yang SAMA di-return di semua jalur —
// pola ini WAJIB dipertahankan (lihat catatan proyek soal cookie).
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");

  if (!code) {
    return NextResponse.redirect(`${origin}/login/internal?error=no_code`);
  }

  // Response ini akan dipakai untuk jalur SUKSES (Location: /dashboard,
  // membawa cookie session dari setAll di bawah). Untuk jalur GAGAL
  // (email tak terdaftar/revoked/dst), kita sengaja return response
  // BARU tanpa cookie — supaya orang yang ditolak tidak ikut membawa
  // sesi tersimpan di browser.
  const response = NextResponse.redirect(`${origin}/dashboard`);

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet: { name: string; value: string; options: CookieOptions }[]) {
          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options);
          });
        },
      },
    }
  );

  const { data: sessionData, error: exchangeError } =
    await supabase.auth.exchangeCodeForSession(code);

  if (exchangeError || !sessionData.user) {
    console.error("[auth/callback] exchange gagal:", exchangeError?.message);
    return NextResponse.redirect(
      `${origin}/login/internal?error=exchange_failed&detail=${encodeURIComponent(
        exchangeError?.message ?? "no user"
      )}`
    );
  }

  const email = sessionData.user.email;

  if (!email) {
    return NextResponse.redirect(`${origin}/login/internal?error=no_email`);
  }

  // Cek cm_profiles pakai service role — supaya bisa baca baris
  // 'invited' yang id-nya masih NULL (RLS normal tidak mengizinkan itu).
  const supabaseAdmin = createServiceRoleClient();

  const { data: profile, error: profileError } = await supabaseAdmin
    .from("cm_profiles")
    .select("row_id, status")
    .eq("email", email)
    .maybeSingle();

  if (profileError || !profile) {
    console.error("[auth/callback] email tidak terdaftar di cm_profiles:", email);
    return NextResponse.redirect(`${origin}/login/internal?error=not_registered`);
  }

  if (profile.status === "revoked") {
    return NextResponse.redirect(`${origin}/login/internal?error=access_revoked`);
  }

  if (profile.status === "invited") {
    const { error: activateError } = await supabaseAdmin
      .from("cm_profiles")
      .update({ id: sessionData.user.id, status: "active" })
      .eq("row_id", profile.row_id);

    if (activateError) {
      console.error("[auth/callback] gagal aktivasi:", activateError.message);
      return NextResponse.redirect(`${origin}/login/internal?error=activation_failed`);
    }
  }

  // response ini SUDAH membawa cookie session (dari setAll di atas)
  // DAN Location-nya sudah /dashboard sejak awal.
  return response;
}
