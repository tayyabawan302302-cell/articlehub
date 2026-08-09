"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function createAd(formData: FormData) {
  const supabase = await createClient();
  const name = formData.get("name") as string;
  const placement = formData.get("placement") as string;
  const adsense_code = formData.get("adsense_code") as string;
  await supabase.from("advertisements").insert({ name, placement, adsense_code });
  revalidatePath("/admin/ads");
}

export async function toggleAd(id: string, active: boolean) {
  const supabase = await createClient();
  await supabase.from("advertisements").update({ is_active: active }).eq("id", id);
  revalidatePath("/admin/ads");
}

export async function deleteAd(id: string) {
  const supabase = await createClient();
  await supabase.from("advertisements").delete().eq("id", id);
  revalidatePath("/admin/ads");
}
