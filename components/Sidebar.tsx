"use client";

import Link from "next/link";
import type { CurrentProfile } from "@/lib/get-current-profile";
import { useSidebar } from "./SidebarContext";

export default function Sidebar({ profile }: { profile: CurrentProfile }) {
  const { open, close } = useSidebar();
  const isInternal = profile.role === "super_admin" || profile.role === "cm";

  return (
    <>
      {/* Overlay gelap, cuma muncul di mobile saat sidebar terbuka */}
      {open && (
        <div
          className="fixed inset-0 bg-black/40 z-30 md:hidden"
          onClick={close}
          aria-hidden="true"
        />
      )}

      <aside
        className={`w-64 md:w-56 bg-white border-r border-line fixed top-0 bottom-0 left-0 py-5 z-40
          transform transition-transform duration-200 ease-in-out overflow-y-auto
          ${open ? "translate-x-0" : "-translate-x-full"} md:translate-x-0`}
      >
        <div className="flex items-center justify-between px-5 pb-5 border-b border-line mb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-md bg-orange text-white flex items-center justify-center font-bold text-sm flex-shrink-0">
              BA
            </div>
            <div>
              <div className="font-bold text-sm leading-tight">Creator Hub</div>
              <div className="text-[11px] text-gray-400">Bintang Agency</div>
            </div>
          </div>
          <button
            onClick={close}
            className="md:hidden text-gray-400 hover:text-ink text-xl leading-none px-1"
            aria-label="Tutup menu"
          >
            &times;
          </button>
        </div>

        <NavLink href="/dashboard" label="Dashboard" onNavigate={close} />
        <NavLink href="/produk" label="Produk" onNavigate={close} />
        <NavLink href="/tutorial" label="Tutorial" onNavigate={close} />
        <NavLink href="/webinar" label="Jadwal Webinar" onNavigate={close} />

        {isInternal && (
          <>
            <div className="text-[11px] text-gray-400 uppercase tracking-wide px-5 mt-4 mb-1.5">
              Manajemen
            </div>
            <NavLink href="/dashboard" label="Creator Saya" onNavigate={close} />
            {profile.role === "super_admin" && profile.is_owner && (
              <NavLink href="/admin/users" label="Kelola Akun Internal" onNavigate={close} />
            )}
          </>
        )}
      </aside>
    </>
  );
}

function NavLink({
  href,
  label,
  onNavigate,
}: {
  href: string;
  label: string;
  onNavigate: () => void;
}) {
  return (
    <Link
      href={href}
      onClick={onNavigate}
      className="flex items-center gap-2.5 px-5 py-2.5 text-[13.5px] font-medium text-ink-soft hover:bg-orange-lighter hover:text-ink"
    >
      {label}
    </Link>
  );
}
