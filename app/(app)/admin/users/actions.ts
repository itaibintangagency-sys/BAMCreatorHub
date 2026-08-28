'use server'

import { revalidatePath } from 'next/cache'
import { cookies } from 'next/headers'
import { createServerClient, type CookieOptions } from '@supabase/ssr'

// ============================================================
// Server Actions — Kelola Akun Internal
// Semua fungsi di sini WAJIB dipanggil hanya dari halaman yang
// sudah diproteksi (lihat page.tsx — cek is_owner). Sebagai
// lapis kedua, RLS policy "Owner can manage cm_profiles" juga
// akan menolak query dari akun yang bukan owner.
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
}

export type InviteUserResult =
  | { success: true }
  | { success: false; error: string }

export async function inviteUser(formData: FormData): Promise<InviteUserResult> {
  const nama = String(formData.get('nama') ?? '').trim()
  const email = String(formData.get('email') ?? '').trim().toLowerCase()
  const role = String(formData.get('role') ?? '')
  const isOwner = formData.get('is_owner') === 'on'

  if (!nama || !email || !['super_admin', 'cm'].includes(role)) {
    return { success: false, error: 'Data tidak lengkap atau role tidak valid.' }
  }

  const supabase = await getServerSupabase()

  const { error } = await supabase.from('cm_profiles').insert({
    nama,
    email,
    role,
    status: 'invited',
    is_owner: isOwner,
  })

  if (error) {
    if (error.code === '23505') {
      return { success: false, error: 'Email ini sudah terdaftar.' }
    }
    return { success: false, error: 'Gagal menyimpan. Pastikan Anda punya akses kelola akun.' }
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

export async function reactivateUser(rowId: string): Promise<InviteUserResult> {
  const supabase = await getServerSupabase()

  // Kembalikan ke 'invited' (BUKAN langsung 'active') supaya proses
  // aktivasi id tetap lewat alur normal saat orang itu login lagi.
  const { error } = await supabase
    .from('cm_profiles')
    .update({ status: 'invited' })
    .eq('row_id', rowId)

  if (error) {
    return { success: false, error: 'Gagal mengaktifkan kembali akses.' }
  }

  revalidatePath('/admin/users')
  return { success: true }
}

export async function updateUser(formData: FormData): Promise<InviteUserResult> {
  const rowId = String(formData.get('row_id') ?? '')
  const nama = String(formData.get('nama') ?? '').trim()
  const role = String(formData.get('role') ?? '')
  const isOwner = formData.get('is_owner') === 'on'

  if (!rowId || !nama || !['super_admin', 'cm'].includes(role)) {
    return { success: false, error: 'Data tidak lengkap atau role tidak valid.' }
  }

  const supabase = await getServerSupabase()

  const { error } = await supabase
    .from('cm_profiles')
    .update({ nama, role, is_owner: isOwner })
    .eq('row_id', rowId)

  if (error) {
    return { success: false, error: 'Gagal menyimpan perubahan. Pastikan Anda punya akses kelola akun.' }
  }

  revalidatePath('/admin/users')
  return { success: true }
}
