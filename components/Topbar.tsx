"use client";

import type { CurrentProfile } from "@/lib/get-current-profile";
import LogoutButton from "@/components/LogoutButton";
import { useSidebar } from "./SidebarContext";

const ROLE_LABEL: Record<CurrentProfile["role"], string> = {
  super_admin: "Super Admin",
  cm: "Creator Manager",
  creator: "Creator",
};

export default function Topbar({ title, profile }: { title: string; profile: CurrentProfile }) {
  const { toggle } = useSidebar();

  const initials = profile.name
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <div className="h-[56px] md:h-[60px] bg-white border-b border-line flex items-center justify-between px-3 md:px-7 sticky top-0 z-20">
      <div className="flex items-center gap-2 md:gap-3 min-w-0">
        <button
          onClick={toggle}
          className="md:hidden flex-shrink-0 w-9 h-9 flex items-center justify-center text-ink-soft"
          aria-label="Buka menu"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M3 6h18M3 12h18M3 18h18" />
          </svg>
        </button>
        <h1 className="text-[15px] md:text-[17px] font-bold truncate">{title}</h1>
      </div>

      <div className="flex items-center gap-2 md:gap-4 flex-shrink-0">
        <div className="hidden sm:flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full bg-orange-light text-orange-dark flex items-center justify-center font-bold text-xs flex-shrink-0">
            {initials}
          </div>
          <div>
            <div className="text-[13px] font-medium leading-tight">{profile.name}</div>
            <div className="text-[11px] text-gray-400">{ROLE_LABEL[profile.role]}</div>
          </div>
        </div>
        {/* Versi ringkas avatar-only untuk layar sangat kecil */}
        <div className="sm:hidden w-8 h-8 rounded-full bg-orange-light text-orange-dark flex items-center justify-center font-bold text-xs flex-shrink-0">
          {initials}
        </div>
        <LogoutButton />
      </div>
    </div>
  );
}
