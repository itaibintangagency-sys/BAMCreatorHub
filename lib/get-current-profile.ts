import { createClient } from '@/lib/supabase/server'

// ============================================================
// getCurrentProfile()
// ============================================================
// PENTING: urutan pengecekan sengaja cm_profiles DULU, baru
// fallback ke creators. Ini karena satu user seharusnya HANYA
// ada di salah satu tabel (cm_profiles ATAU creators), tapi
// kalau suatu saat ada data ganda/nyasar seperti kasus kemarin
// (akun Super Admin ikut ter-insert ke creators), urutan ini
// memastikan role internal (Super Admin/CM) tetap menang.
//
// Bentuk return value distandarkan supaya konsumennya
// (dashboard, middleware, dst) selalu bisa baca `profile.role`
// tanpa perlu tahu dari tabel mana asalnya.
// ============================================================

export type CurrentProfile =
  | {
      role: 'super_admin' | 'cm'
      id: string
      name: string
      email: string
    }
  | {
      role: 'creator'
      id: string
      name: string
      creator_code: string
      assigned_cm_id: string | null
    }

export async function getCurrentProfile(): Promise<CurrentProfile | null> {
  const supabase = createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    console.log('[getCurrentProfile] user null dari auth.getUser()')
    return null
  }

  // 1. Cek cm_profiles DULU (Layer 1: Super Admin & CM)
  const { data: cmProfile, error: cmError, status: cmStatus } = await supabase
    .from('cm_profiles')
    .select('id, nama, email, role, status')
    .eq('id', user.id)
    .eq('status', 'active')
    .maybeSingle()

  console.log(
    '[getCurrentProfile] user.id=',
    user.id,
    'cmProfile=',
    cmProfile,
    'cmError=',
    cmError?.message,
    cmError?.code,
    'httpStatus=',
    cmStatus
  )

  if (cmProfile) {
    return {
      role: cmProfile.role as 'super_admin' | 'cm',
      id: cmProfile.id,
      name: cmProfile.nama,
      email: cmProfile.email,
    }
  }

  // 2. Baru fallback ke creators (Layer 2)
  const { data: creator, error: crError } = await supabase
    .from('creators')
    .select('id, nama, creator_code, assigned_cm_id')
    .eq('id', user.id)
    .maybeSingle()

  console.log('[getCurrentProfile] creator=', creator, 'crError=', crError?.message)

  if (creator) {
    return {
      role: 'creator',
      id: creator.id,
      name: creator.nama,
      creator_code: creator.creator_code,
      assigned_cm_id: creator.assigned_cm_id,
    }
  }

  // 3. Tidak ditemukan di keduanya -> bukan user yang valid
  console.log('[getCurrentProfile] tidak ketemu di cm_profiles maupun creators -> return null')
  return null
}
