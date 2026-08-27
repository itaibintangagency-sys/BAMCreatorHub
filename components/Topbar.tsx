import type { CurrentProfile } from "@/lib/get-current-profile";
import LogoutButton from "@/components/LogoutButton";

const ROLE_LABEL: Record<CurrentProfile["role"], string> = {
  super_admin: "Super Admin",
  cm: "Creator Manager",
  creator: "Creator",
};

export default function Topbar({ title, profile }: { title: string; profile: CurrentProfile }) {
  const initials = profile.name
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <div className="h-[60px] bg-white border-b border-line flex items-center justify-between px-7 sticky top-0 z-10">
      <h1 className="text-[17px] font-bold">{title}</h1>
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full bg-orange-light text-orange-dark flex items-center justify-center font-bold text-xs">
            {initials}
          </div>
          <div>
            <div className="text-[13px] font-medium leading-tight">{profile.name}</div>
            <div className="text-[11px] text-gray-400">{ROLE_LABEL[profile.role]}</div>
          </div>
        </div>
        <LogoutButton />
      </div>
    </div>
  );
}
