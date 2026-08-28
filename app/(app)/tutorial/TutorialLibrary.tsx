"use client";

import { useMemo, useState } from "react";
import Link from "next/link";

export type TutorialItem = {
  id: string;
  title: string;
  category: string;
  level: "Basic" | "Intermediate" | "Advanced" | null;
  description: string | null;
  is_onboarding_required: boolean;
  order_in_path: number | null;
  last_updated: string;
  status: "belum" | "sedang" | "selesai" | "tanpa_materi";
};

type Category = { name: string; color: string };

const LEVEL_COLOR: Record<string, string> = {
  Basic: "bg-green-100 text-green-700",
  Intermediate: "bg-amber-100 text-amber-700",
  Advanced: "bg-red-100 text-red-700",
};

const STATUS_LABEL: Record<TutorialItem["status"], string> = {
  belum: "Belum dimulai",
  sedang: "Sedang berjalan",
  selesai: "Selesai",
  tanpa_materi: "",
};

export default function TutorialLibrary({
  tutorials,
  categories,
  isCreator,
  initialCategory = null,
}: {
  tutorials: TutorialItem[];
  categories: Category[];
  isCreator: boolean;
  initialCategory?: string | null;
}) {
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState<string | null>(initialCategory);

  const onboardingList = useMemo(
    () =>
      tutorials
        .filter((t) => t.is_onboarding_required)
        .sort((a, b) => (a.order_in_path ?? 0) - (b.order_in_path ?? 0)),
    [tutorials]
  );

  // Kunci berurutan: index-0 selalu terbuka, sisanya butuh yang
  // sebelumnya berstatus 'selesai' (hanya berlaku utk Creator)
  const lockedMap = useMemo(() => {
    const map: Record<string, boolean> = {};
    let previousDone = true;
    for (const t of onboardingList) {
      map[t.id] = isCreator ? !previousDone : false;
      previousDone = t.status === "selesai";
    }
    return map;
  }, [onboardingList, isCreator]);

  const doneCount = onboardingList.filter((t) => t.status === "selesai").length;
  const progressPercent =
    onboardingList.length > 0 ? Math.round((doneCount / onboardingList.length) * 100) : 0;

  const searchLower = search.trim().toLowerCase();
  const filtered = tutorials.filter((t) => {
    const matchSearch = !searchLower || t.title.toLowerCase().includes(searchLower);
    const matchCategory = !activeCategory || t.category === activeCategory;
    return matchSearch && matchCategory;
  });

  const isRecentlyUpdated = (dateStr: string) => {
    const diffDays = (Date.now() - new Date(dateStr).getTime()) / (1000 * 60 * 60 * 24);
    return diffDays <= 14;
  };

  return (
    <div className="space-y-7">
      {/* Onboarding path */}
      {onboardingList.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-[15.5px] font-bold">Onboarding path wajib</h2>
            {isCreator && (
              <span className="text-[11.5px] text-ink-soft">
                {doneCount}/{onboardingList.length} selesai
              </span>
            )}
          </div>
          {isCreator && (
            <div className="w-full h-1.5 bg-gray-100 rounded-full mb-3.5 overflow-hidden">
              <div
                className="h-full bg-orange rounded-full transition-all"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          )}
          <div className="flex gap-3 overflow-x-auto pb-1">
            {onboardingList.map((t, i) => {
              const locked = lockedMap[t.id];
              const content = (
                <div
                  className={`bg-white border rounded-md p-3.5 min-w-[190px] flex-shrink-0 ${
                    locked ? "border-line opacity-50" : "border-line"
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
                        t.status === "selesai"
                          ? "bg-green-100 text-green-700"
                          : "bg-gray-100 text-ink-soft"
                      }`}
                    >
                      {t.status === "selesai" ? "\u2713" : i + 1}
                    </div>
                    {locked && <span className="text-gray-400 text-xs">&#128274;</span>}
                  </div>
                  <div className="text-[12.5px] font-semibold">{t.title}</div>
                  {isCreator && !locked && (
                    <div className="text-[10.5px] text-ink-soft mt-1">{STATUS_LABEL[t.status]}</div>
                  )}
                </div>
              );
              return locked ? (
                <div key={t.id}>{content}</div>
              ) : (
                <Link key={t.id} href={`/tutorial/${t.id}`}>
                  {content}
                </Link>
              );
            })}
          </div>
        </div>
      )}

      {/* Search & filter kategori */}
      <div className="space-y-3">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Cari tutorial..."
          className="w-full max-w-sm border border-line rounded-md px-3 py-2.5 text-sm"
        />

        <div className="flex gap-1.5 flex-wrap">
          <CategoryTab
            label="Semua"
            active={activeCategory === null}
            onClick={() => setActiveCategory(null)}
          />
          {categories.map((c) => (
            <CategoryTab
              key={c.name}
              label={c.name}
              color={c.color}
              active={activeCategory === c.name}
              onClick={() => setActiveCategory(c.name)}
            />
          ))}
        </div>
      </div>

      {/* Grid tutorial */}
      <div>
        <h2 className="text-[15.5px] font-bold mb-3.5">
          {activeCategory ?? "Semua tutorial"} ({filtered.length})
        </h2>
        <div className="grid grid-cols-3 gap-4">
          {filtered.map((t) => (
            <Link
              key={t.id}
              href={`/tutorial/${t.id}`}
              className="bg-white border border-line rounded-md overflow-hidden block hover:shadow-sm transition-shadow"
            >
              <div className="h-24 bg-orange-lighter relative">
                {isRecentlyUpdated(t.last_updated) && (
                  <span className="absolute top-2 right-2 bg-white text-[10px] font-bold px-2 py-0.5 rounded-full text-orange-dark shadow-sm">
                    Baru diperbarui
                  </span>
                )}
              </div>
              <div className="p-3.5">
                <div className="flex gap-1.5 mb-2 flex-wrap">
                  <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-orange-light text-orange-dark">
                    {t.category}
                  </span>
                  {t.level && (
                    <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${LEVEL_COLOR[t.level]}`}>
                      {t.level}
                    </span>
                  )}
                </div>
                <div className="text-[13.5px] font-semibold mb-1">{t.title}</div>
                {isCreator && t.status !== "tanpa_materi" && (
                  <div className="flex items-center gap-1.5 text-[11px] text-ink-soft">
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${
                        t.status === "selesai"
                          ? "bg-green-500"
                          : t.status === "sedang"
                          ? "bg-amber-500"
                          : "bg-gray-300"
                      }`}
                    />
                    {STATUS_LABEL[t.status]}
                  </div>
                )}
              </div>
            </Link>
          ))}
          {filtered.length === 0 && (
            <p className="text-sm text-ink-soft col-span-3">Tidak ada tutorial yang cocok.</p>
          )}
        </div>
      </div>
    </div>
  );
}

function CategoryTab({
  label,
  color,
  active,
  onClick,
}: {
  label: string;
  color?: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-1.5 text-[12.5px] font-medium px-3 py-1.5 rounded-full border ${
        active ? "bg-orange text-white border-orange" : "border-line text-ink-soft hover:bg-gray-50"
      }`}
    >
      {color && !active && <span className="w-1.5 h-1.5 rounded-full" style={{ background: color }} />}
      {label}
    </button>
  );
}
