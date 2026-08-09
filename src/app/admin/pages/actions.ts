"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function upsertPage(formData: FormData) {
  const supabase = await createClient();
  const slug = formData.get("slug") as string;
  const title = formData.get("title") as string;
  const html = formData.get("html") as string;
  const meta_title = formData.get("meta_title") as string;
  const meta_description = formData.get("meta_description") as string;

  await supabase.from("pages").upsert(
    { slug, title, content: { html }, meta_title, meta_description },
    { onConflict: "slug" }
  );
  revalidatePath("/admin/pages");
  revalidatePath(`/${slug}`);
}

export async function deletePage(id: string) {
  const supabase = await createClient();
  await supabase.from("pages").delete().eq("id", id);
  revalidatePath("/admin/pages");
}
