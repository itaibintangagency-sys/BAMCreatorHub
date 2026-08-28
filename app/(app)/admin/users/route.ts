import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createServerClient, type CookieOptions } from '@supabase/ssr'

// ============================================================
// Callback OAuth Layer 1 (Super Admin & CM)
// ============================================================
// Setelah Google berhasil autentikasi, Supabase mengirim user
// ke sini dengan ?code=... Kita tukar code jadi session, LALU
// cek apakah email ini terdaftar di cm_profiles.
//
// - Terdaftar & status 'invited'  -> aktivasi (isi id, set 'active')
// - Terdaftar & status 'active'   -> lanjut normal
// - Terdaftar & status 'revoked'  -> tolak, sign out
// - Tidak terdaftar sama sekali   -> tolak, sign out
// ============================================================

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/dashboard'

  if (!code) {
    return NextResponse.redirect(`${origin}/login/internal?error=missing_code`)
  }

  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(
          cookiesToSet: { name: string; value: string; options: CookieOptions }[]
        ) {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          )
        },
      },
    }
  )

  // 1. Tukar code OAuth jadi session
  const { data: sessionData, error: exchangeError } =
    await supabase.auth.exchangeCodeForSession(code)

  if (exchangeError || !sessionData.user) {
    return NextResponse.redirect(`${origin}/login/internal?error=auth_failed`)
  }

  const user = sessionData.user
  const email = user.email

  if (!email) {
    await supabase.auth.signOut()
    return NextResponse.redirect(`${origin}/login/internal?error=no_email`)
  }

  // 2. Cek apakah email ini terdaftar di cm_profiles
  //    (pakai service role di sini agar bisa baca baris 'invited'
  //     yang belum punya id — RLS policy "own profile" belum berlaku
  //     untuk baris yang id-nya masih NULL)
  const supabaseAdmin = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { cookies: { getAll: () => [], setAll: () => {} } }
  )

  const { data: profile, error: profileError } = await supabaseAdmin
    .from('cm_profiles')
    .select('row_id, status, role')
    .eq('email', email)
    .maybeSingle()

  if (profileError || !profile) {
    // Email tidak terdaftar sama sekali -> tolak akses
    await supabase.auth.signOut()
    return NextResponse.redirect(
      `${origin}/login/internal?error=not_registered`
    )
  }

  if (profile.status === 'revoked') {
    await supabase.auth.signOut()
    return NextResponse.redirect(`${origin}/login/internal?error=access_revoked`)
  }

  if (profile.status === 'invited') {
    // Aktivasi: isi id dengan auth.users.id yang baru dibuat + set active
    const { error: activateError } = await supabaseAdmin
      .from('cm_profiles')
      .update({ id: user.id, status: 'active' })
      .eq('row_id', profile.row_id)

    if (activateError) {
      await supabase.auth.signOut()
      return NextResponse.redirect(
        `${origin}/login/internal?error=activation_failed`
      )
    }
  }

  // status sudah 'active' (baru diaktivasi atau memang sudah lama aktif)
  return NextResponse.redirect(`${origin}${next}`)
}
