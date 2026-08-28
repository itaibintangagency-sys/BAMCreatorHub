"use client";

import { useState, useTransition } from "react";
import { tambahWebinar, addWebinarCategory } from "../actions";

type Category = { name: string; color: string };
type CreatorOption = { id: string; nama: string; creator_code: string };

export default function WebinarForm({
  categories,
  creators,
}: {
  categories: Category[];
  creators: CreatorOption[];
}) {
  const [categoryList, setCategoryList] = useState(categories);
  const [showNewCategory, setShowNewCategory] = useState(false);
  const [newCategoryError, setNewCategoryError] = useState<string | null>(null);
  const [eligibility, setEligibility] = useState("Eligible for All");
  const [selectedCreatorIds, setSelectedCreatorIds] = useState<string[]>([]);
  const [isPending, startTransition] = useTransition();

  function handleAddCategory(formData: FormData) {
    setNewCategoryError(null);
    startTransition(async () => {
      const result = await addWebinarCategory(formData);
      if (!result.success) {
        setNewCategoryError(result.error);
        return;
      }
      const name = String(formData.get("name"));
      const color = String(formData.get("color"));
      setCategoryList((prev) => [...prev, { name, color }]);
      setShowNewCategory(false);
    });
  }

  function toggleCreator(id: string) {
    setSelectedCreatorIds((prev) =>
      prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]
    );
  }

  return (
    <form action={tambahWebinar} className="p-7 max-w-xl">
      <div className="bg-white border border-line rounded-md p-6 space-y-4">
        <Field label="Judul webinar" name="title" required />

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium mb-1.5">Kategori</label>
            <select
              name="category"
              className="w-full border border-line rounded-md px-3 py-2.5 text-sm"
            >
              {categoryList.map((c) => (
                <option key={c.name} value={c.name}>
                  {c.name}
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={() => setShowNewCategory((v) => !v)}
              className="text-[11.5px] text-orange-dark mt-1.5 hover:underline"
            >
              + Tambah kategori baru
            </button>
          </div>

          <div>
            <label className="block text-xs font-medium mb-1.5">Eligibility</label>
            <select
              name="eligibility_type"
              value={eligibility}
              onChange={(e) => setEligibility(e.target.value)}
              className="w-full border border-line rounded-md px-3 py-2.5 text-sm"
            >
              <option>Eligible for All</option>
              <option>Invite Only</option>
              <option>Golden Tick Only</option>
            </select>
          </div>
        </div>

        {showNewCategory && (
          <div className="border border-dashed border-line rounded-md p-3 space-y-2">
            <form action={handleAddCategory} className="flex items-end gap-2 flex-wrap">
              <div className="flex-1 min-w-[140px]">
                <label className="block text-[11px] font-medium mb-1">Nama kategori</label>
                <input
                  name="name"
                  required
                  placeholder="Contoh: Webinar Onboarding"
                  className="w-full border border-line rounded-md px-2.5 py-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-[11px] font-medium mb-1">Warna</label>
                <input
                  name="color"
                  type="color"
                  defaultValue="#6B7280"
                  className="w-12 h-9 border border-line rounded-md"
                />
              </div>
              <button
                type="submit"
                disabled={isPending}
                className="bg-orange text-white text-xs font-medium px-3 py-2 rounded-md disabled:opacity-50"
              >
                {isPending ? "Menyimpan..." : "Simpan kategori"}
              </button>
            </form>
            {newCategoryError && (
              <p className="text-[11.5px] text-red-600">{newCategoryError}</p>
            )}
          </div>
        )}

        <div className="grid grid-cols-2 gap-4">
          <Field label="Tanggal" name="event_date" type="date" required />
          <Field label="Jam" name="event_time" placeholder="14:00 WIB" />
        </div>

        <Field label="Link registrasi" name="registration_link" placeholder="https://..." />
        <Field
          label="Segmentasi peserta (opsional)"
          name="target_segment"
          placeholder="Contoh: Semua Golden Tick tier Gold ke atas"
        />

        <div>
          <label className="block text-xs font-medium mb-1.5">Deskripsi</label>
          <textarea
            name="description"
            rows={3}
            className="w-full border border-line rounded-md px-3 py-2.5 text-sm"
          />
        </div>

        {eligibility === "Invite Only" && (
          <div>
            <label className="block text-xs font-medium mb-1.5">
              Pilih Creator yang diundang ({selectedCreatorIds.length} dipilih)
            </label>
            <div className="border border-line rounded-md max-h-48 overflow-y-auto divide-y divide-line">
              {creators.length === 0 && (
                <p className="text-xs text-ink-soft p-3">Belum ada data Creator.</p>
              )}
              {creators.map((c) => (
                <label
                  key={c.id}
                  className="flex items-center gap-2.5 px-3 py-2 text-sm hover:bg-gray-50 cursor-pointer"
                >
                  <input
                    type="checkbox"
                    name="invitee_creator_ids"
                    value={c.id}
                    checked={selectedCreatorIds.includes(c.id)}
                    onChange={() => toggleCreator(c.id)}
                  />
                  <span>{c.nama}</span>
                  <span className="text-xs text-gray-400">({c.creator_code})</span>
                </label>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="flex gap-2.5 mt-4">
        <button type="submit" className="bg-orange text-white font-bold text-[13.5px] px-5 py-2.5 rounded-md">
          Simpan jadwal
        </button>
        <a href="/webinar" className="border border-line text-[13.5px] px-5 py-2.5 rounded-md">
          Batal
        </a>
      </div>
    </form>
  );
}

function Field({
  label,
  name,
  type = "text",
  placeholder,
  required,
}: {
  label: string;
  name: string;
  type?: string;
  placeholder?: string;
  required?: boolean;
}) {
  return (
    <div>
      <label className="block text-xs font-medium mb-1.5">{label}</label>
      <input
        type={type}
        name={name}
        placeholder={placeholder}
        required={required}
        className="w-full border border-line rounded-md px-3 py-2.5 text-sm"
      />
    </div>
  );
}
