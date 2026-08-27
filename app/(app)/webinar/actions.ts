"use server";

import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/get-current-profile";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

export async function tambahWebinar(formData: FormData) {
  const profile = await getCurrentProfile();
  if (!profile || profile.role === "creator") throw new Error("Tidak punya akses.");

  const supabase = createClient();
  const { error } = await supabase.from("webinars").insert({
    title: formData.get("title") as string,
    category: formData.get("category") as string,
    event_date: formData.get("event_date") as string,
    event_time: formData.get("event_time") as string,
    eligibility_type: formData.get("eligibility_type") as string,
    registration_link: formData.get("registration_link") as string,
    description: formData.get("description") as string,
    created_by: profile.id,
  });
  if (error) throw new Error(error.message);

  redirect("/webinar");
}

export async function tandaiHadir(webinarId: string) {
  const profile = await getCurrentProfile();
  if (!profile || profile.role !== "creator") return;

  const supabase = createClient();
  await supabase.from("webinar_attendance").upsert({
    creator_id: profile.id,
    webinar_id: webinarId,
    reported_at: new Date().toISOString(),
  });

  revalidatePath("/webinar");
}
