'use server'

import { revalidatePath } from 'next/cache'
import { cookies } from 'next/headers'
import { createServerClient } from '@supabase/ssr'

// ============================================================
// Server Actions — Kelola Akun Internal
// Semua fungsi di sini WAJIB dipanggil hanya dari halaman yang
// sudah diproteksi middleware role super_admin (lihat catatan
// di page.tsx). Sebagai lapis kedua, RLS policy "Super admin can
// manage cm_profiles" juga akan menolak query dari role lain.
// ============================================================

async function getServerSupabase() {
  const cookieStore = await cookies()
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          )
        },
      },
    }
  )
}

export type InviteUserResult =
  | { success: true }
  | { success: false; error: string }

export async function inviteUser(formData: FormData): Promise<InviteUserResult> {
  const nama = String(formData.get('nama') ?? '').trim()
  const email = String(formData.get('email') ?? '').trim().toLowerCase()
  const role = String(formData.get('role') ?? '')

  if (!nama || !email || !['super_admin', 'cm'].includes(role)) {
    return { success: false, error: 'Data tidak lengkap atau role tidak valid.' }
  }

  const supabase = await getServerSupabase()

  const { error } = await supabase.from('cm_profiles').insert({
    nama,
    email,
    role,
    status: 'invited',
  })

  if (error) {
    if (error.code === '23505') {
      // unique_cm_email violation
      return { success: false, error: 'Email ini sudah terdaftar.' }
    }
    return { success: false, error: 'Gagal menyimpan. Pastikan Anda login sebagai Super Admin.' }
  }

  revalidatePath('/admin/users')
  return { success: true }
}

export async function revokeUser(rowId: string): Promise<InviteUserResult> {
  const supabase = await getServerSupabase()

  const { error } = await supabase
    .from('cm_profiles')
    .update({ status: 'revoked' })
    .eq('row_id', rowId)

  if (error) {
    return { success: false, error: 'Gagal mencabut akses.' }
  }

  revalidatePath('/admin/users')
  return { success: true }
}
