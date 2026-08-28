import Link from "next/link";
import type { CurrentProfile } from "@/lib/get-current-profile";

export default function Sidebar({ profile }: { profile: CurrentProfile }) {
  const isInternal = profile.role === "super_admin" || profile.role === "cm";

  return (
    <aside className="w-56 bg-white border-r border-line fixed top-0 bottom-0 left-0 py-5">
      <div className="flex items-center gap-2.5 px-5 pb-5 border-b border-line mb-3">
        <div className="w-8 h-8 rounded-md bg-orange text-white flex items-center justify-center font-bold text-sm">
          BA
        </div>
        <div>
          <div className="font-bold text-sm leading-tight">Creator Hub</div>
          <div className="text-[11px] text-gray-400">Bintang Agency</div>
        </div>
      </div>

      <NavLink href="/dashboard" label="Dashboard" />
      <NavLink href="/produk" label="Produk" />
      <NavLink href="/tutorial" label="Tutorial" />
      <NavLink href="/webinar" label="Jadwal Webinar" />

      {isInternal && (
        <>
          <div className="text-[11px] text-gray-400 uppercase tracking-wide px-5 mt-4 mb-1.5">
            Manajemen
          </div>
          <NavLink href="/dashboard" label="Creator Saya" />
          {profile.role === "super_admin" && profile.is_owner && (
            <NavLink href="/admin/users" label="Kelola Akun Internal" />
          )}
        </>
      )}
    </aside>
  );
}

function NavLink({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      className="flex items-center gap-2.5 px-5 py-2.5 text-[13.5px] font-medium text-ink-soft hover:bg-orange-lighter hover:text-ink"
    >
      {label}
    </Link>
  );
}
