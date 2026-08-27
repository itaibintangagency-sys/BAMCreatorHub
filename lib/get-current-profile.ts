import { createClient } from "@/lib/supabase/server";

export type CurrentProfile = {
  id: string;
  name: string;
  role: "super_admin" | "cm" | "creator";
};

// Dipanggil di Server Component / layout. Cek dulu ke cm_profiles
// (Layer 1 - internal), kalau tidak ketemu berarti Creator (Layer 2).
export async function getCurrentProfile(): Promise<CurrentProfile | null> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: cmProfile } = await supabase
    .from("cm_profiles")
    .select("id, nama, role")
    .eq("id", user.id)
    .maybeSingle();

  if (cmProfile) {
    return { id: cmProfile.id, name: cmProfile.nama, role: cmProfile.role };
  }

  const { data: creatorProfile } = await supabase
    .from("creators")
    .select("id, nama")
    .eq("id", user.id)
    .maybeSingle();

  if (creatorProfile) {
    return { id: creatorProfile.id, name: creatorProfile.nama, role: "creator" };
  }

  return null;
}
