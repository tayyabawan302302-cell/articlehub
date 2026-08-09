"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

function slugify(name: string) {
  return name.toLowerCase().trim().replace(/[^a-z0-9\s-]/g, "").replace(/\s+/g, "-");
}

export async function createCategory(formData: FormData) {
  const supabase = await createClient();
  const name = formData.get("name") as string;
  const description = (formData.get("description") as string) || null;
  await supabase.from("categories").insert({ name, slug: slugify(name), description });
  revalidatePath("/admin/categories");
  revalidatePath("/");
}

export async function updateCategoryDescription(id: string, description: string) {
  const supabase = await createClient();
  await supabase.from("categories").update({ description: description || null }).eq("id", id);
  revalidatePath("/admin/categories");
  revalidatePath("/");
}

export async function deleteCategory(id: string) {
  const supabase = await createClient();
  await supabase.from("categories").delete().eq("id", id);
  revalidatePath("/admin/categories");
}

export async function createTag(formData: FormData) {
  const supabase = await createClient();
  const name = formData.get("name") as string;
  await supabase.from("tags").insert({ name, slug: slugify(name) });
  revalidatePath("/admin/categories");
}

export async function deleteTag(id: string) {
  const supabase = await createClient();
  await supabase.from("tags").delete().eq("id", id);
  revalidatePath("/admin/categories");
}
