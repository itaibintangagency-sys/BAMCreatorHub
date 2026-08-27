import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/get-current-profile";
import Topbar from "@/components/Topbar";
import { tandaiHadir } from "./actions";

const CATEGORY_COLOR: Record<string, string> = {
  "Non SVTC": "#EE4D2D",
  "Bintang Next Level": "#7C3AED",
  "Golden Tick Acceleration": "#F59E0B",
  "Golden Tick Shopee Pusat": "#059669",
};

export default async function WebinarPage() {
  const profile = await getCurrentProfile();
  if (!profile) return null;

  const supabase = createClient();
  const isInternal = profile.role !== "creator";

  const { data: webinars } = await supabase
    .from("webinars")
    .select("*")
    .gte("event_date", new Date().toISOString().slice(0, 10))
    .order("event_date");

  return (
    <>
      <Topbar title="Jadwal Webinar" profile={profile} />
      <div className="p-7">
        <div className="flex justify-between items-center mb-5">
          <div className="flex gap-4 flex-wrap">
            {Object.entries(CATEGORY_COLOR).map(([label, color]) => (
              <div key={label} className="flex items-center gap-1.5 text-xs text-ink-soft">
                <span className="w-2 h-2 rounded-full" style={{ background: color }} />
                {label}
              </div>
            ))}
          </div>
          {isInternal && (
            <Link
              href="/webinar/tambah"
              className="bg-orange text-white text-[13.5px] font-medium px-4 py-2 rounded-md whitespace-nowrap"
            >
              + Tambah Webinar
            </Link>
          )}
        </div>

        <div className="bg-white border border-line rounded-md">
          {webinars?.map((w) => (
            <div key={w.id} className="flex items-center gap-4 px-5 py-4 border-b border-line last:border-0">
              <div className="w-16 text-center bg-orange-light rounded-md py-1.5 flex-shrink-0">
                <div className="text-[10px] font-bold text-orange-dark">
                  {new Date(w.event_date).toLocaleDateString("id-ID", { month: "short" }).toUpperCase()}
                </div>
                <div className="text-lg font-black text-orange-dark">
                  {new Date(w.event_date).getDate()}
                </div>
              </div>
              <div className="flex-1">
                <div className="font-semibold text-[13.5px]">{w.title}</div>
                <div className="text-[11.5px] text-ink-soft flex items-center gap-1.5 mt-0.5">
                  <span className="w-1.5 h-1.5 rounded-full" style={{ background: CATEGORY_COLOR[w.category] }} />
                  {w.category} &middot; {w.event_time} &middot; {w.eligibility_type}
                </div>
              </div>
              {profile.role === "creator" && (
                <form action={tandaiHadir.bind(null, w.id)}>
                  <button
                    type="submit"
                    className="border border-line text-xs font-medium px-3 py-1.5 rounded-md"
                  >
                    Saya hadir
                  </button>
                </form>
              )}
            </div>
          ))}
          {(!webinars || webinars.length === 0) && (
            <div className="p-6 text-sm text-ink-soft">Belum ada jadwal webinar mendatang.</div>
          )}
        </div>
      </div>
    </>
  );
}
