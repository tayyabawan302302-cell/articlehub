"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function deleteMedia(id: string, storagePath: string) {
  const supabase = await createClient();
  await supabase.storage.from("media").remove([storagePath]);
  await supabase.from("media").delete().eq("id", id);
  revalidatePath("/admin/media");
}

export async function renameMedia(id: string, newFileName: string) {
  const supabase = await createClient();
  await supabase.from("media").update({ file_name: newFileName }).eq("id", id);
  revalidatePath("/admin/media");
}
