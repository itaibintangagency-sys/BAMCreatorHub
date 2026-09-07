"use client";

import { useState, useTransition } from "react";
import { tambahTutorial, addTutorialCategory, perbaruiTutorial } from "../actions";

type Category = { name: string; color: string };
type MaterialRow = { id: string | null; type: string; url: string };

type InitialValues = {
  title: string;
  category: string;
  level: string;
  description: string;
  visibility: string;
  is_onboarding_required: boolean;
  order_in_path: number | null;
};

export default function TutorialForm({
  categories,
  mode = "add",
  tutorialId,
  initialValues,
  initialMaterials,
}: {
  categories: Category[];
  mode?: "add" | "edit";
  tutorialId?: string;
  initialValues?: InitialValues;
  initialMaterials?: MaterialRow[];
}) {
  const [categoryList, setCategoryList] = useState(categories);
  const [showNewCategory, setShowNewCategory] = useState(false);
  const [newCategoryError, setNewCategoryError] = useState<string | null>(null);
  const [isOnboarding, setIsOnboarding] = useState(initialValues?.is_onboarding_required ?? false);
  const [materials, setMaterials] = useState<MaterialRow[]>(
    initialMaterials && initialMaterials.length > 0
      ? initialMaterials
      : [{ id: null, type: "video", url: "" }]
  );
  const [isPending, startTransition] = useTransition();

  const formAction = mode === "edit" && tutorialId ? perbaruiTutorial.bind(null, tutorialId) : tambahTutorial;
  const cancelHref = mode === "edit" && tutorialId ? `/tutorial/${tutorialId}` : "/tutorial";

  function handleAddCategory(formData: FormData) {
    setNewCategoryError(null);
    startTransition(async () => {
      const result = await addTutorialCategory(formData);
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

  function addMaterialRow() {
    setMaterials((prev) => [...prev, { id: null, type: "video", url: "" }]);
  }
  function removeMaterialRow(index: number) {
    setMaterials((prev) => prev.filter((_, i) => i !== index));
  }
  function updateMaterial(index: number, field: "type" | "url", value: string) {
    setMaterials((prev) => prev.map((m, i) => (i === index ? { ...m, [field]: value } : m)));
  }

  return (
    <form action={formAction} className="p-7 max-w-2xl">
      <div className="bg-white border border-line rounded-md p-6 space-y-4">
        <Field label="Judul tutorial" name="title" required defaultValue={initialValues?.title} />

        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-medium mb-1.5">Kategori</label>
            <select
              name="category"
              defaultValue={initialValues?.category}
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
            <label className="block text-xs font-medium mb-1.5">Level</label>
            <select
              name="level"
              defaultValue={initialValues?.level}
              className="w-full border border-line rounded-md px-3 py-2.5 text-sm"
            >
              <option>Basic</option>
              <option>Intermediate</option>
              <option>Advanced</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium mb-1.5">Visibility</label>
            <select
              name="visibility"
              defaultValue={initialValues?.visibility ?? "all"}
              className="w-full border border-line rounded-md px-3 py-2.5 text-sm"
            >
              <option value="all">Semua (Creator & Internal)</option>
              <option value="internal_only">Internal saja (CM/Admin)</option>
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
                  placeholder="Contoh: Onboarding Umum"
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
            {newCategoryError && <p className="text-[11.5px] text-red-600">{newCategoryError}</p>}
          </div>
        )}

        <div>
          <label className="block text-xs font-medium mb-1.5">Deskripsi</label>
          <textarea
            name="description"
            rows={3}
            defaultValue={initialValues?.description}
            className="w-full border border-line rounded-md px-3 py-2.5 text-sm"
          />
        </div>

        <div className="border border-line rounded-md p-3.5 space-y-2.5">
          <label className="flex items-center gap-2 text-sm font-medium">
            <input
              type="checkbox"
              name="is_onboarding_required"
              checked={isOnboarding}
              onChange={(e) => setIsOnboarding(e.target.checked)}
            />
            Wajib onboarding (bagian dari jalur belajar berurutan)
          </label>
          {isOnboarding && (
            <div className="max-w-[160px]">
              <label className="block text-[11px] font-medium mb-1">
                Urutan dalam onboarding path
              </label>
              <input
                type="number"
                name="order_in_path"
                min={1}
                required
                placeholder="1"
                defaultValue={initialValues?.order_in_path ?? undefined}
                className="w-full border border-line rounded-md px-2.5 py-2 text-sm"
              />
              <p className="text-[10.5px] text-gray-400 mt-1">
                Creator harus selesaikan urutan lebih kecil dulu sebelum bisa buka ini.
              </p>
            </div>
          )}
        </div>

        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="block text-xs font-medium">Materi</label>
            <button
              type="button"
              onClick={addMaterialRow}
              className="text-[11.5px] text-orange-dark hover:underline"
            >
              + Tambah materi
            </button>
          </div>
          <div className="space-y-2">
            {materials.map((m, i) => (
              <div key={m.id ?? `new-${i}`} className="flex gap-2 items-center">
                <input type="hidden" name="material_id" value={m.id ?? ""} />
                <select
                  name="material_type"
                  value={m.type}
                  onChange={(e) => updateMaterial(i, "type", e.target.value)}
                  className="border border-line rounded-md px-2 py-2 text-sm w-32 flex-shrink-0"
                >
                  <option value="video">Video</option>
                  <option value="reading">Bacaan</option>
                  <option value="quiz">Quiz</option>
                </select>
                <input
                  name="material_url"
                  value={m.url}
                  onChange={(e) => updateMaterial(i, "url", e.target.value)}
                  placeholder="https://drive.google.com/..."
                  className="flex-1 border border-line rounded-md px-3 py-2 text-sm"
                />
                {materials.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeMaterialRow(i)}
                    className="text-red-500 text-xs px-2"
                  >
                    Hapus
                  </button>
                )}
              </div>
            ))}
          </div>
          <p className="text-[10.5px] text-gray-400 mt-1.5">
            {mode === "edit"
              ? "Materi yang di-\"Hapus\" di sini akan benar-benar terhapus beserta progress Creator untuk materi itu. Materi lain yang tidak diubah, progress-nya tetap aman."
              : "Tautan Google Drive akan otomatis tampil sebagai preview di halaman detail."}
          </p>
        </div>
      </div>

      <div className="flex gap-2.5 mt-4">
        <button type="submit" className="bg-orange text-white font-bold text-[13.5px] px-5 py-2.5 rounded-md">
          {mode === "edit" ? "Simpan perubahan" : "Simpan tutorial"}
        </button>
        <a href={cancelHref} className="border border-line text-[13.5px] px-5 py-2.5 rounded-md">
          Batal
        </a>
      </div>
    </form>
  );
}

function Field({
  label,
  name,
  required,
  defaultValue,
}: {
  label: string;
  name: string;
  required?: boolean;
  defaultValue?: string;
}) {
  return (
    <div>
      <label className="block text-xs font-medium mb-1.5">{label}</label>
      <input
        name={name}
        required={required}
        defaultValue={defaultValue}
        className="w-full border border-line rounded-md px-3 py-2.5 text-sm"
      />
    </div>
  );
}
