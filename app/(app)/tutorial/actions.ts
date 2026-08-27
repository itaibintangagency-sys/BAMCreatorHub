"use server";

import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/get-current-profile";
import { revalidatePath } from "next/cache";

export async function tandaiSelesai(materialId: string, tutorialId: string) {
  const profile = await getCurrentProfile();
  if (!profile || profile.role !== "creator") return;

  const supabase = createClient();
  await supabase.from("tutorial_progress").upsert({
    creator_id: profile.id,
    material_id: materialId,
    status: "selesai",
    completed_at: new Date().toISOString(),
  });

  revalidatePath(`/tutorial/${tutorialId}`);
}
