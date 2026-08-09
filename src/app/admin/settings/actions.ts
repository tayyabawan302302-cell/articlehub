"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function updateSettings(formData: FormData) {
  const supabase = await createClient();

  const fields = [
    "site_name", "logo_url", "favicon_url", "description", "contact_email",
    "contact_phone", "address", "facebook_url", "linkedin_url", "x_url",
    "instagram_url", "google_analytics_id", "google_search_console_code",
    "google_adsense_code", "theme_color", "footer_text",
  ];

  const update: Record<string, string> = {};
  for (const f of fields) {
    const val = formData.get(f);
    if (val !== null) update[f] = val as string;
  }

  const keywordsRaw = formData.get("keywords") as string;
  const keywords = keywordsRaw ? keywordsRaw.split(",").map((k) => k.trim()).filter(Boolean) : [];

  await supabase.from("site_settings").update({ ...update, keywords }).eq("id", 1);
  revalidatePath("/", "layout");
  revalidatePath("/admin/settings");
}
