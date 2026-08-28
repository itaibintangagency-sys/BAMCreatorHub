'use client'

import { useState, useTransition } from 'react'
import { inviteUser, revokeUser, updateUser, reactivateUser } from './actions'

type CmProfile = {
  row_id: string
  nama: string
  email: string
  role: 'super_admin' | 'cm'
  status: 'invited' | 'active' | 'revoked'
  is_owner: boolean
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
  const [editingRowId, setEditingRowId] = useState<string | null>(null)
  const [editError, setEditError] = useState<string | null>(null)
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

  function handleReactivate(rowId: string) {
    if (!confirm('Aktifkan kembali akses akun ini?')) return
    startTransition(async () => {
      await reactivateUser(rowId)
      setProfiles((prev) =>
        prev.map((p) => (p.row_id === rowId ? { ...p, status: 'invited' } : p))
      )
    })
  }

  function handleUpdate(formData: FormData) {
    setEditError(null)
    startTransition(async () => {
      const result = await updateUser(formData)
      if (!result.success) {
        setEditError(result.error)
        return
      }
      const rowId = String(formData.get('row_id'))
      const nama = String(formData.get('nama'))
      const role = String(formData.get('role')) as CmProfile['role']
      const isOwner = formData.get('is_owner') === 'on'
      setProfiles((prev) =>
        prev.map((p) =>
          p.row_id === rowId ? { ...p, nama, role, is_owner: isOwner } : p
        )
      )
      setEditingRowId(null)
    })
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">Kelola Akun Internal</h1>
          <p className="text-xs text-gray-500 mt-1">
            "Owner" bisa membuka & mengubah halaman ini. Super Admin biasa tidak bisa,
            meski tetap punya akses penuh ke fitur operasional lain.
          </p>
        </div>
        <button
          onClick={() => setShowForm((v) => !v)}
          className="rounded-md bg-orange-600 px-4 py-2 text-sm font-medium text-white hover:bg-orange-700 whitespace-nowrap"
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
          <div>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" name="is_owner" />
              Berikan akses "Kelola Akun Internal" (Owner)
            </label>
            <p className="text-xs text-gray-400 mt-1">
              Biasanya dicentang hanya untuk pemilik/pengelola utama. Tidak wajib,
              bisa diaktifkan belakangan lewat tombol Edit.
            </p>
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
            <th className="py-2">Owner</th>
            <th className="py-2">Status</th>
            <th className="py-2"></th>
          </tr>
        </thead>
        <tbody>
          {profiles.map((p) =>
            editingRowId === p.row_id ? (
              <tr key={p.row_id} className="border-b bg-orange-50/40">
                <td colSpan={6} className="py-3">
                  <form action={handleUpdate} className="flex flex-wrap items-center gap-3">
                    <input type="hidden" name="row_id" value={p.row_id} />
                    <input
                      name="nama"
                      defaultValue={p.nama}
                      required
                      className="rounded-md border px-2 py-1 text-sm w-40"
                    />
                    <span className="text-xs text-gray-400">{p.email}</span>
                    <select
                      name="role"
                      defaultValue={p.role}
                      className="rounded-md border px-2 py-1 text-sm"
                    >
                      <option value="super_admin">Super Admin</option>
                      <option value="cm">CM</option>
                    </select>
                    <label className="flex items-center gap-1.5 text-xs">
                      <input type="checkbox" name="is_owner" defaultChecked={p.is_owner} />
                      Owner
                    </label>
                    <button
                      type="submit"
                      disabled={isPending}
                      className="rounded-md bg-orange-600 px-3 py-1 text-xs font-medium text-white disabled:opacity-50"
                    >
                      Simpan
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setEditingRowId(null)
                        setEditError(null)
                      }}
                      className="rounded-md border px-3 py-1 text-xs"
                    >
                      Batal
                    </button>
                    {editError && <p className="w-full text-xs text-red-600">{editError}</p>}
                  </form>
                </td>
              </tr>
            ) : (
              <tr key={p.row_id} className="border-b">
                <td className="py-2">{p.nama}</td>
                <td className="py-2">{p.email}</td>
                <td className="py-2">{ROLE_LABEL[p.role]}</td>
                <td className="py-2">{p.is_owner ? '👑 Owner' : '—'}</td>
                <td className="py-2">{STATUS_LABEL[p.status]}</td>
                <td className="py-2 text-right space-x-3 whitespace-nowrap">
                  {p.status !== 'revoked' ? (
                    <>
                      <button
                        onClick={() => {
                          setEditingRowId(p.row_id)
                          setEditError(null)
                        }}
                        disabled={isPending}
                        className="text-xs text-blue-600 hover:underline disabled:opacity-50"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleRevoke(p.row_id)}
                        disabled={isPending}
                        className="text-xs text-red-600 hover:underline disabled:opacity-50"
                      >
                        Hapus akses
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={() => handleReactivate(p.row_id)}
                      disabled={isPending}
                      className="text-xs text-green-600 hover:underline disabled:opacity-50"
                    >
                      Aktifkan lagi
                    </button>
                  )}
                </td>
              </tr>
            )
          )}
        </tbody>
      </table>
    </div>
  )
}
