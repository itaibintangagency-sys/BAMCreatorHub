"use server";

import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/get-current-profile";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

export async function tambahWebinar(formData: FormData) {
  const profile = await getCurrentProfile();
  if (!profile || profile.role === "creator") throw new Error("Tidak punya akses.");

  const eventDate = formData.get("event_date") as string;
  const eventTime = formData.get("event_time") as string;

  // Coba susun starts_at (timestamptz) dari event_date + jam yang
  // diketik CM, kalau formatnya bisa di-parse (mis. "14:00").
  // Kalau tidak bisa di-parse, biarkan null — reminder n8n untuk
  // event ini nanti perlu diisi manual atau di-skip.
  let startsAt: string | null = null;
  const timeMatch = eventTime?.match(/(\d{1,2}):(\d{2})/);
  if (eventDate && timeMatch) {
    const [, hh, mm] = timeMatch;
    startsAt = new Date(`${eventDate}T${hh.padStart(2, "0")}:${mm}:00+07:00`).toISOString();
  }

  const supabase = createClient();
  const { error } = await supabase.from("webinars").insert({
    title: formData.get("title") as string,
    category: formData.get("category") as string,
    event_date: eventDate,
    event_time: eventTime,
    eligibility_type: formData.get("eligibility_type") as string,
    registration_link: formData.get("registration_link") as string,
    description: formData.get("description") as string,
    target_segment: formData.get("target_segment") as string,
    starts_at: startsAt,
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
