import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/get-current-profile";
import Topbar from "@/components/Topbar";
import WebinarCalendar, { type WebinarItem, type WebinarMaterial } from "./WebinarCalendar";

export default async function WebinarPage() {
  const profile = await getCurrentProfile();
  if (!profile) return null;

  const supabase = createClient();
  const isInternal = profile.role !== "creator";
  const isCreator = profile.role === "creator";

  // Ambil semua webinar (skala masih kecil — puluhan event/tahun,
  // aman di-fetch sekaligus supaya navigasi bulan di kalender tidak
  // perlu round-trip fetch ulang tiap ganti bulan)
  const { data: webinarsRaw } = await supabase
    .from("webinars")
    .select("*")
    .order("event_date");

  // Kalau Creator: ambil daftar webinar yang dia diundang (utk
  // eligibility_type = 'Invite Only') + status kehadiran dia
  let invitedWebinarIds = new Set<string>();
  let attendedWebinarIds = new Set<string>();

  if (isCreator) {
    const [{ data: invites }, { data: attendance }] = await Promise.all([
      supabase.from("webinar_invitees").select("webinar_id").eq("creator_id", profile.id),
      supabase.from("webinar_attendance").select("webinar_id").eq("creator_id", profile.id),
    ]);
    invitedWebinarIds = new Set((invites ?? []).map((i) => i.webinar_id));
    attendedWebinarIds = new Set((attendance ?? []).map((a) => a.webinar_id));
  }

  function computeEligible(w: { eligibility_type: string; id: string }): boolean {
    if (isInternal) return true; // Super Admin & CM selalu bisa lihat semua
    if (w.eligibility_type === "Eligible for All") return true;
    if (w.eligibility_type === "Golden Tick Only") {
      return isCreator && profile.role === "creator" ? profile.status_golden_tick : false;
    }
    if (w.eligibility_type === "Invite Only") {
      return invitedWebinarIds.has(w.id);
    }
    return false;
  }

  const webinars: WebinarItem[] = (webinarsRaw ?? []).map((w) => ({
    id: w.id,
    title: w.title,
    category: w.category,
    event_date: w.event_date,
    event_time: w.event_time,
    eligibility_type: w.eligibility_type,
    registration_link: w.registration_link,
    recording_link: w.recording_link,
    description: w.description,
    target_segment: w.target_segment,
    eligible: computeEligible(w),
  }));

  // Materi hanya perlu di-fetch untuk webinar yang MEMANG eligible
  // (RLS webinar_materials sudah menolak baris yang tidak eligible,
  // tapi kita filter dulu di query supaya tidak buang request untuk
  // event yang pasti terkunci)
  const eligibleIds = webinars.filter((w) => w.eligible).map((w) => w.id);

  const materialsByWebinar: Record<string, WebinarMaterial[]> = {};
  if (eligibleIds.length > 0) {
    const { data: materials } = await supabase
      .from("webinar_materials")
      .select("id, webinar_id, title, file_url, material_type")
      .in("webinar_id", eligibleIds);

    for (const m of materials ?? []) {
      (materialsByWebinar[m.webinar_id] ??= []).push(m);
    }
  }

  return (
    <>
      <Topbar title="Jadwal Webinar" profile={profile} />
      <div className="p-7">
        <div className="flex justify-end mb-4">
          {isInternal && (
            <Link
              href="/webinar/tambah"
              className="bg-orange text-white text-[13.5px] font-medium px-4 py-2 rounded-md whitespace-nowrap"
            >
              + Tambah Webinar
            </Link>
          )}
        </div>

        <WebinarCalendar
          webinars={webinars}
          materialsByWebinar={materialsByWebinar}
          isCreator={isCreator}
          attendedWebinarIds={attendedWebinarIds}
        />
      </div>
    </>
  );
}
