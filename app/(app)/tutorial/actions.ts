"use server";

import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/get-current-profile";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function tandaiSelesai(materialId: string, tutorialId: string) {
  const profile = await getCurrentProfile();
  if (!profile || profile.role !== "creator") return;

  const supabase = createClient();
  await supabase.from("tutorial_progress").upsert({
    creator_id: profile.id,
    material_id: materialId,
    status: "selesai",
    completed_at: new Date().toISOString(),
  });

  revalidatePath(`/tutorial/${tutorialId}`);
  revalidatePath("/tutorial");
}

export async function addTutorialCategory(formData: FormData): Promise<
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
  const { error } = await supabase.from("tutorial_categories").insert({ name, color });

  if (error) {
    if (error.code === "23505") {
      return { success: false, error: "Kategori dengan nama ini sudah ada." };
    }
    return { success: false, error: error.message };
  }

  revalidatePath("/tutorial/tambah");
  return { success: true };
}

export async function tambahTutorial(formData: FormData) {
  const profile = await getCurrentProfile();
  if (!profile || profile.role === "creator") throw new Error("Tidak punya akses.");

  const supabase = createClient();

  const isOnboarding = formData.get("is_onboarding_required") === "on";
  const orderInPathRaw = formData.get("order_in_path") as string;

  const { data: newTutorial, error } = await supabase
    .from("tutorials")
    .insert({
      title: formData.get("title") as string,
      category: formData.get("category") as string,
      level: formData.get("level") as string,
      description: formData.get("description") as string,
      visibility: formData.get("visibility") as string,
      is_onboarding_required: isOnboarding,
      order_in_path: orderInPathRaw ? parseInt(orderInPathRaw, 10) : null,
      last_updated: new Date().toISOString(),
    })
    .select("id")
    .single();

  if (error) throw new Error(error.message);

  // Materi: dikirim sebagai array paralel material_type[] & material_url[]
  const materialTypes = formData.getAll("material_type") as string[];
  const materialUrls = formData.getAll("material_url") as string[];

  const materialRows = materialTypes
    .map((type, i) => ({ type, content_url: materialUrls[i] }))
    .filter((m) => m.content_url && m.content_url.trim() !== "")
    .map((m, i) => ({
      tutorial_id: newTutorial.id,
      order_index: i,
      type: m.type,
      content_url: m.content_url,
    }));

  if (materialRows.length > 0) {
    const { error: matError } = await supabase.from("tutorial_materials").insert(materialRows);
    if (matError) throw new Error(matError.message);
  }

  redirect("/tutorial");
}

export async function perbaruiTutorial(tutorialId: string, formData: FormData) {
  const profile = await getCurrentProfile();
  if (!profile || profile.role === "creator") throw new Error("Tidak punya akses.");

  const supabase = createClient();

  const isOnboarding = formData.get("is_onboarding_required") === "on";
  const orderInPathRaw = formData.get("order_in_path") as string;

  const { error: tutorialError } = await supabase
    .from("tutorials")
    .update({
      title: formData.get("title") as string,
      category: formData.get("category") as string,
      level: formData.get("level") as string,
      description: formData.get("description") as string,
      visibility: formData.get("visibility") as string,
      is_onboarding_required: isOnboarding,
      order_in_path: orderInPathRaw ? parseInt(orderInPathRaw, 10) : null,
      last_updated: new Date().toISOString(),
    })
    .eq("id", tutorialId);

  if (tutorialError) throw new Error(tutorialError.message);

  // Materi dikirim sebagai 3 array paralel: material_id[] (kosong kalau baris
  // baru), material_type[], material_url[]. Kita rekonsiliasi terhadap materi
  // yang sudah ada di DB — BUKAN hapus-semua-lalu-insert-ulang — supaya
  // progress Creator yang sudah selesai untuk materi yang tidak berubah
  // (tutorial_progress -> tutorial_materials ON DELETE CASCADE) tidak ikut
  // ter-reset ke nol tanpa sengaja.
  const materialIds = formData.getAll("material_id") as string[];
  const materialTypes = formData.getAll("material_type") as string[];
  const materialUrls = formData.getAll("material_url") as string[];

  const submittedRows = materialTypes
    .map((type, i) => ({
      id: materialIds[i] || null,
      type,
      content_url: materialUrls[i],
    }))
    .filter((m) => m.content_url && m.content_url.trim() !== "")
    .map((m, i) => ({ ...m, order_index: i }));

  const { data: existingMaterials } = await supabase
    .from("tutorial_materials")
    .select("id")
    .eq("tutorial_id", tutorialId);

  const existingIds = new Set((existingMaterials ?? []).map((m) => m.id));
  const submittedIds = new Set(submittedRows.filter((m) => m.id).map((m) => m.id));

  const toUpdate = submittedRows.filter((m) => m.id && existingIds.has(m.id));
  const toInsert = submittedRows
    .filter((m) => !m.id)
    .map((m) => ({
      tutorial_id: tutorialId,
      order_index: m.order_index,
      type: m.type,
      content_url: m.content_url,
    }));
  const toDelete = [...existingIds].filter((id) => !submittedIds.has(id));

  for (const m of toUpdate) {
    const { error } = await supabase
      .from("tutorial_materials")
      .update({ type: m.type, content_url: m.content_url, order_index: m.order_index })
      .eq("id", m.id as string);
    if (error) throw new Error(error.message);
  }

  if (toInsert.length > 0) {
    const { error } = await supabase.from("tutorial_materials").insert(toInsert);
    if (error) throw new Error(error.message);
  }

  if (toDelete.length > 0) {
    const { error } = await supabase.from("tutorial_materials").delete().in("id", toDelete);
    if (error) throw new Error(error.message);
  }

  revalidatePath(`/tutorial/${tutorialId}`);
  redirect(`/tutorial/${tutorialId}`);
}
