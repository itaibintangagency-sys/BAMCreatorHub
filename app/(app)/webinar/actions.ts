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
  const eligibilityType = formData.get("eligibility_type") as string;

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
  const { data: newWebinar, error } = await supabase
    .from("webinars")
    .insert({
      title: formData.get("title") as string,
      category: formData.get("category") as string,
      event_date: eventDate,
      event_time: eventTime,
      eligibility_type: eligibilityType,
      registration_link: formData.get("registration_link") as string,
      description: formData.get("description") as string,
      target_segment: formData.get("target_segment") as string,
      starts_at: startsAt,
      created_by: profile.id,
    })
    .select("id")
    .single();

  if (error) throw new Error(error.message);

  // Kalau Invite Only, simpan whitelist Creator yang dipilih di form
  if (eligibilityType === "Invite Only") {
    const inviteeIds = formData.getAll("invitee_creator_ids") as string[];
    if (inviteeIds.length > 0) {
      const rows = inviteeIds.map((creatorId) => ({
        webinar_id: newWebinar.id,
        creator_id: creatorId,
        invited_by: profile.id,
      }));
      const { error: inviteError } = await supabase.from("webinar_invitees").insert(rows);
      if (inviteError) throw new Error(inviteError.message);
    }
  }

  redirect("/webinar");
}

export async function addWebinarCategory(formData: FormData): Promise<
  { success: true } | { success: false; error: string }
> {
  const profile = await getCurrentProfile();
  if (!profile || profile.role === "creator") {
    return { success: false, error: "Tidak punya akses." };
  }

  const name = String(formData.get("name") ?? "").trim();
  const color = String(formData.get("color") ?? "#6B7280");

  if (!name) {
    return { success: false, error: "Nama kategori tidak boleh kosong." };
  }

  const supabase = createClient();
  const { error } = await supabase.from("webinar_categories").insert({ name, color });

  if (error) {
    if (error.code === "23505") {
      return { success: false, error: "Kategori dengan nama ini sudah ada." };
    }
    return { success: false, error: error.message };
  }

  revalidatePath("/webinar/tambah");
  return { success: true };
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
