"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function addNavItem(formData: FormData) {
  const supabase = await createClient();
  const label = formData.get("label") as string;
  const href = formData.get("href") as string;
  const { count } = await supabase.from("nav_items").select("*", { count: "exact", head: true });
  await supabase.from("nav_items").insert({ label, href, sort_order: count ?? 0 });
  revalidatePath("/admin/navigation");
  revalidatePath("/", "layout");
}

export async function deleteNavItem(id: string) {
  const supabase = await createClient();
  await supabase.from("nav_items").delete().eq("id", id);
  revalidatePath("/admin/navigation");
  revalidatePath("/", "layout");
}

export async function toggleNavItem(id: string, visible: boolean) {
  const supabase = await createClient();
  await supabase.from("nav_items").update({ is_visible: visible }).eq("id", id);
  revalidatePath("/admin/navigation");
  revalidatePath("/", "layout");
}
