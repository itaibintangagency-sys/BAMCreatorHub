"use client";

import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

export default function LogoutButton() {
  const router = useRouter();
  const supabase = createClient();

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push("/login/internal");
    router.refresh();
  }

  return (
    <button
      onClick={handleLogout}
      className="text-xs text-ink-soft border border-line rounded-md px-3 py-1.5 hover:bg-gray-50"
    >
      Keluar
    </button>
  );
}
