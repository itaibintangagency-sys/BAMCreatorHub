import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/get-current-profile";
import Topbar from "@/components/Topbar";

export default async function TutorialPage() {
  const profile = await getCurrentProfile();
  if (!profile) return null;

  const supabase = createClient();
  const { data: onboarding } = await supabase
    .from("tutorials")
    .select("*")
    .eq("is_onboarding_required", true)
    .order("order_in_path");

  const { data: tutorials } = await supabase
    .from("tutorials")
    .select("*")
    .order("last_updated", { ascending: false });

  return (
    <>
      <Topbar title="Tutorial" profile={profile} />
      <div className="p-7">
        {onboarding && onboarding.length > 0 && (
          <>
            <h2 className="text-[15.5px] font-bold mb-3.5">Onboarding path wajib</h2>
            <div className="flex gap-3 mb-8 overflow-x-auto">
              {onboarding.map((t, i) => (
                <div key={t.id} className="bg-white border border-line rounded-md p-3.5 min-w-[190px]">
                  <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-xs font-bold mb-2">
                    {i + 1}
                  </div>
                  <div className="text-[12.5px] font-semibold">{t.title}</div>
                </div>
              ))}
            </div>
          </>
        )}

        <h2 className="text-[15.5px] font-bold mb-3.5">Semua tutorial</h2>
        <div className="grid grid-cols-3 gap-4">
          {tutorials?.map((t) => (
            <Link
              key={t.id}
              href={`/tutorial/${t.id}`}
              className="bg-white border border-line rounded-md overflow-hidden block"
            >
              <div className="h-24 bg-orange-lighter" />
              <div className="p-3.5">
                <div className="flex gap-1.5 mb-2">
                  <Badge>{t.category}</Badge>
                  <Badge muted>{t.level}</Badge>
                </div>
                <div className="text-[13.5px] font-semibold">{t.title}</div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </>
  );
}

function Badge({ children, muted }: { children: React.ReactNode; muted?: boolean }) {
  return (
    <span
      className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
        muted ? "bg-gray-100 text-ink-soft" : "bg-orange-light text-orange-dark"
      }`}
    >
      {children}
    </span>
  );
}
