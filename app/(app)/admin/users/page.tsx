import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import { createServerClient, type CookieOptions } from '@supabase/ssr'
import UserManagement from './user-management'

// ============================================================
// Halaman ini HANYA boleh diakses akun dengan is_owner = true.
// Proteksi 2 lapis:
//   1. Cek is_owner di sini (server component) -> redirect kalau bukan owner
//   2. RLS policy "Owner can manage cm_profiles" di Supabase
//      -> menolak query meski proteksi #1 berhasil di-bypass
// ============================================================

export default async function AdminUsersPage() {
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

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login/internal')
  }

  const { data: myProfile } = await supabase
    .from('cm_profiles')
    .select('role, status, is_owner')
    .eq('id', user.id)
    .maybeSingle()

  if (!myProfile || !myProfile.is_owner || myProfile.status !== 'active') {
    redirect('/dashboard')
  }

  const { data: profiles } = await supabase
    .from('cm_profiles')
    .select('row_id, nama, email, role, status, is_owner')
    .order('nama', { ascending: true })

  return (
    <div className="mx-auto max-w-4xl p-6">
      <UserManagement initialProfiles={profiles ?? []} />
    </div>
  )
}
