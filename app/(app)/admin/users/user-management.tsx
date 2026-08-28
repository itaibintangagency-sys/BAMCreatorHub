'use client'

import { useState, useTransition } from 'react'
import { inviteUser, revokeUser } from './actions'

type CmProfile = {
  row_id: string
  nama: string
  email: string
  role: 'super_admin' | 'cm'
  status: 'invited' | 'active' | 'revoked'
}

const STATUS_LABEL: Record<CmProfile['status'], string> = {
  invited: '🟡 Diundang',
  active: '🟢 Aktif',
  revoked: '⚪ Dicabut',
}

const ROLE_LABEL: Record<CmProfile['role'], string> = {
  super_admin: 'Super Admin',
  cm: 'CM',
}

export default function UserManagement({
  initialProfiles,
}: {
  initialProfiles: CmProfile[]
}) {
  const [profiles, setProfiles] = useState(initialProfiles)
  const [showForm, setShowForm] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  function handleInvite(formData: FormData) {
    setFormError(null)
    startTransition(async () => {
      const result = await inviteUser(formData)
      if (!result.success) {
        setFormError(result.error)
        return
      }
      setShowForm(false)
      // Refresh sederhana; ganti dengan re-fetch server component
      // jika ingin data selalu sinkron tanpa full reload.
      window.location.reload()
    })
  }

  function handleRevoke(rowId: string) {
    if (!confirm('Cabut akses akun ini? Akun tidak akan bisa login lagi.')) return
    startTransition(async () => {
      await revokeUser(rowId)
      setProfiles((prev) =>
        prev.map((p) => (p.row_id === rowId ? { ...p, status: 'revoked' } : p))
      )
    })
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Kelola Akun Internal</h1>
        <button
          onClick={() => setShowForm((v) => !v)}
          className="rounded-md bg-orange-600 px-4 py-2 text-sm font-medium text-white hover:bg-orange-700"
        >
          + Undang Akun Baru
        </button>
      </div>

      {showForm && (
        <form
          action={handleInvite}
          className="space-y-4 rounded-lg border border-gray-200 p-4"
        >
          <div>
            <label className="block text-sm font-medium">Nama</label>
            <input
              name="nama"
              required
              className="mt-1 w-full rounded-md border px-3 py-2 text-sm"
              placeholder="Budi Santoso"
            />
          </div>
          <div>
            <label className="block text-sm font-medium">Email Gmail</label>
            <input
              name="email"
              type="email"
              required
              className="mt-1 w-full rounded-md border px-3 py-2 text-sm"
              placeholder="budi@gmail.com"
            />
          </div>
          <div>
            <label className="block text-sm font-medium">Role</label>
            <div className="mt-1 flex gap-4 text-sm">
              <label className="flex items-center gap-2">
                <input type="radio" name="role" value="super_admin" required />
                Super Admin
              </label>
              <label className="flex items-center gap-2">
                <input type="radio" name="role" value="cm" required />
                CM
              </label>
            </div>
          </div>

          {formError && <p className="text-sm text-red-600">{formError}</p>}

          <div className="flex gap-2">
            <button
              type="submit"
              disabled={isPending}
              className="rounded-md bg-orange-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
            >
              {isPending ? 'Menyimpan...' : 'Simpan & Undang'}
            </button>
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="rounded-md border px-4 py-2 text-sm"
            >
              Batal
            </button>
          </div>
        </form>
      )}

      <table className="w-full text-left text-sm">
        <thead>
          <tr className="border-b text-gray-500">
            <th className="py-2">Nama</th>
            <th className="py-2">Email</th>
            <th className="py-2">Role</th>
            <th className="py-2">Status</th>
            <th className="py-2"></th>
          </tr>
        </thead>
        <tbody>
          {profiles.map((p) => (
            <tr key={p.row_id} className="border-b">
              <td className="py-2">{p.nama}</td>
              <td className="py-2">{p.email}</td>
              <td className="py-2">{ROLE_LABEL[p.role]}</td>
              <td className="py-2">{STATUS_LABEL[p.status]}</td>
              <td className="py-2 text-right">
                {p.status !== 'revoked' && (
                  <button
                    onClick={() => handleRevoke(p.row_id)}
                    disabled={isPending}
                    className="text-xs text-red-600 hover:underline disabled:opacity-50"
                  >
                    Hapus akses
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
