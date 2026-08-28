"use client";

import { useMemo, useState } from "react";
import { tandaiHadir } from "./actions";

const HARI = ["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"];
const BULAN = [
  "Januari", "Februari", "Maret", "April", "Mei", "Juni",
  "Juli", "Agustus", "September", "Oktober", "November", "Desember",
];

export type WebinarItem = {
  id: string;
  title: string;
  category: string;
  event_date: string; // yyyy-mm-dd
  event_time: string | null;
  eligibility_type: "Eligible for All" | "Invite Only" | "Golden Tick Only";
  registration_link: string | null;
  recording_link: string | null;
  description: string | null;
  target_segment: string | null;
  eligible: boolean; // sudah dihitung di server component
};

export type WebinarMaterial = {
  id: string;
  webinar_id: string;
  title: string;
  file_url: string;
  material_type: string;
};

export default function WebinarCalendar({
  webinars,
  materialsByWebinar,
  isCreator,
  attendedWebinarIds,
  categoryColors,
}: {
  webinars: WebinarItem[];
  materialsByWebinar: Record<string, WebinarMaterial[]>;
  isCreator: boolean;
  attendedWebinarIds: Set<string>;
  categoryColors: Record<string, string>;
}) {
  const CATEGORY_COLOR = categoryColors;
  const today = new Date();
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth()); // 0-11
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedWebinar, setSelectedWebinar] = useState<WebinarItem | null>(null);

  const webinarsByDate = useMemo(() => {
    const map: Record<string, WebinarItem[]> = {};
    for (const w of webinars) {
      (map[w.event_date] ??= []).push(w);
    }
    return map;
  }, [webinars]);

  const grid = useMemo(() => buildMonthGrid(viewYear, viewMonth), [viewYear, viewMonth]);

  function goPrevMonth() {
    const d = new Date(viewYear, viewMonth - 1, 1);
    setViewYear(d.getFullYear());
    setViewMonth(d.getMonth());
    setSelectedDate(null);
  }
  function goNextMonth() {
    const d = new Date(viewYear, viewMonth + 1, 1);
    setViewYear(d.getFullYear());
    setViewMonth(d.getMonth());
    setSelectedDate(null);
  }

  const todayStr = today.toISOString().slice(0, 10);
  const selectedDayWebinars = selectedDate ? webinarsByDate[selectedDate] ?? [] : [];

  return (
    <div className="space-y-5">
      {/* Legend */}
      <div className="flex gap-4 flex-wrap">
        {Object.entries(CATEGORY_COLOR).map(([label, color]) => (
          <div key={label} className="flex items-center gap-1.5 text-xs text-ink-soft">
            <span className="w-2 h-2 rounded-full" style={{ background: color }} />
            {label}
          </div>
        ))}
      </div>

      {/* Kalender */}
      <div className="bg-white border border-line rounded-md overflow-hidden">
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-line">
          <button onClick={goPrevMonth} className="text-sm px-2 py-1 rounded hover:bg-gray-100">
            &larr;
          </button>
          <div className="font-bold text-[14.5px]">
            {BULAN[viewMonth]} {viewYear}
          </div>
          <button onClick={goNextMonth} className="text-sm px-2 py-1 rounded hover:bg-gray-100">
            &rarr;
          </button>
        </div>

        <div className="grid grid-cols-7 text-center text-[11px] font-semibold text-gray-400 border-b border-line">
          {HARI.map((h) => (
            <div key={h} className="py-2">{h}</div>
          ))}
        </div>

        <div className="grid grid-cols-7">
          {grid.map((cell, i) => {
            if (!cell) return <div key={i} className="h-20 border-b border-r border-line bg-gray-50/40" />;
            const dateStr = cell.toISOString().slice(0, 10);
            const dayWebinars = webinarsByDate[dateStr] ?? [];
            const isToday = dateStr === todayStr;
            const isSelected = dateStr === selectedDate;

            return (
              <button
                key={i}
                onClick={() => setSelectedDate(dateStr === selectedDate ? null : dateStr)}
                className={`h-20 border-b border-r border-line p-1.5 text-left align-top hover:bg-orange-lighter/40 transition-colors ${
                  isSelected ? "bg-orange-lighter/60" : ""
                }`}
              >
                <div
                  className={`text-[12px] w-5 h-5 flex items-center justify-center rounded-full ${
                    isToday ? "bg-orange text-white font-bold" : "text-ink-soft"
                  }`}
                >
                  {cell.getDate()}
                </div>
                <div className="flex flex-wrap gap-0.5 mt-1">
                  {dayWebinars.slice(0, 4).map((w) => (
                    <span
                      key={w.id}
                      className="w-1.5 h-1.5 rounded-full"
                      style={{ background: CATEGORY_COLOR[w.category] ?? "#999" }}
                      title={w.title}
                    />
                  ))}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* List event di tanggal terpilih */}
      {selectedDate && (
        <div className="bg-white border border-line rounded-md">
          <div className="px-5 py-3 border-b border-line font-semibold text-[13.5px]">
            Event tanggal {new Date(selectedDate).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}
          </div>
          {selectedDayWebinars.length === 0 && (
            <div className="p-5 text-sm text-ink-soft">Tidak ada webinar di tanggal ini.</div>
          )}
          {selectedDayWebinars.map((w) => (
            <button
              key={w.id}
              onClick={() => setSelectedWebinar(w)}
              className="w-full flex items-center gap-3 px-5 py-3.5 border-b border-line last:border-0 hover:bg-orange-lighter/30 text-left"
            >
              <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: CATEGORY_COLOR[w.category] }} />
              <div className="flex-1 min-w-0">
                <div className="font-medium text-[13.5px] flex items-center gap-1.5">
                  {w.title}
                  {!w.eligible && <span className="text-[10px] text-gray-400">&#128274;</span>}
                </div>
                <div className="text-[11.5px] text-ink-soft">
                  {w.category} &middot; {w.event_time ?? "-"} &middot; {w.eligibility_type}
                </div>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Modal detail */}
      {selectedWebinar && (
        <WebinarModal
          webinar={selectedWebinar}
          materials={materialsByWebinar[selectedWebinar.id] ?? []}
          isCreator={isCreator}
          alreadyAttended={attendedWebinarIds.has(selectedWebinar.id)}
          canSelfReport={selectedWebinar.event_date <= todayStr}
          categoryColors={categoryColors}
          onClose={() => setSelectedWebinar(null)}
        />
      )}
    </div>
  );
}

function WebinarModal({
  webinar,
  materials,
  isCreator,
  alreadyAttended,
  canSelfReport,
  categoryColors,
  onClose,
}: {
  webinar: WebinarItem;
  materials: WebinarMaterial[];
  isCreator: boolean;
  alreadyAttended: boolean;
  canSelfReport: boolean;
  categoryColors: Record<string, string>;
  onClose: () => void;
}) {
  const locked = !webinar.eligible;

  return (
    <div
      className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-lg max-w-md w-full p-6 space-y-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-1.5 text-[11px] text-ink-soft mb-1">
              <span className="w-2 h-2 rounded-full" style={{ background: categoryColors[webinar.category] ?? "#999" }} />
              {webinar.category}
            </div>
            <h3 className="font-bold text-[16px]">{webinar.title}</h3>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700 text-lg leading-none">
            &times;
          </button>
        </div>

        <div className="text-[13px] text-ink-soft space-y-1">
          <div>
            {new Date(webinar.event_date).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}
            {webinar.event_time ? ` &middot; ${webinar.event_time}` : ""}
          </div>
          {webinar.target_segment && <div>Segmentasi: {webinar.target_segment}</div>}
        </div>

        {locked ? (
          <div className="bg-gray-50 border border-line rounded-md p-3 text-[12.5px] text-ink-soft flex items-center gap-2">
            &#128274;
            {webinar.eligibility_type === "Golden Tick Only"
              ? "Khusus Creator dengan status Golden Tick."
              : "Khusus Creator yang diundang."}
          </div>
        ) : (
          <>
            {webinar.description && (
              <p className="text-[13px] text-ink leading-relaxed">{webinar.description}</p>
            )}

            {webinar.registration_link && (
              <a
                href={webinar.registration_link}
                target="_blank"
                rel="noopener noreferrer"
                className="block text-center bg-orange text-white text-[13.5px] font-medium py-2.5 rounded-md"
              >
                Daftar / Buka Link
              </a>
            )}

            {materials.length > 0 && (
              <div>
                <div className="text-[12px] font-semibold text-ink-soft mb-1.5">Materi & Recording</div>
                <div className="space-y-1.5">
                  {materials.map((m) => (
                    <a
                      key={m.id}
                      href={m.file_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-[12.5px] border border-line rounded-md px-3 py-2 hover:bg-gray-50"
                    >
                      &#128196; {m.title}
                    </a>
                  ))}
                </div>
              </div>
            )}

            {isCreator && (
              alreadyAttended ? (
                <div className="text-center text-[12.5px] text-green-700 bg-green-50 rounded-md py-2">
                  &#10003; Kehadiran sudah tercatat
                </div>
              ) : canSelfReport ? (
                <form action={tandaiHadir.bind(null, webinar.id)}>
                  <button
                    type="submit"
                    className="w-full border border-line text-[13px] font-medium py-2.5 rounded-md"
                  >
                    Saya hadir
                  </button>
                </form>
              ) : (
                <p className="text-center text-[11.5px] text-gray-400">
                  Tombol "Saya hadir" aktif saat/setelah acara berlangsung.
                </p>
              )
            )}
          </>
        )}
      </div>
    </div>
  );
}

// Bangun grid 7 kolom kalender bulan tsb, sel null = padding
// sebelum tanggal 1 (supaya hari pertama jatuh di kolom yang benar)
function buildMonthGrid(year: number, month: number): (Date | null)[] {
  const firstDay = new Date(year, month, 1);
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const startPad = firstDay.getDay(); // 0 = Minggu

  const cells: (Date | null)[] = [];
  for (let i = 0; i < startPad; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(new Date(year, month, d));
  return cells;
}
