"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function updateProfile(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const fields = [
    "full_name", "bio", "country", "website", "facebook_url",
    "linkedin_url", "x_url", "instagram_url", "occupation", "avatar_url", "cover_url",
  ];
  const update: Record<string, string> = {};
  for (const f of fields) {
    const val = formData.get(f);
    if (val !== null) update[f] = val as string;
  }

  const skillsRaw = formData.get("skills") as string;
  const skills = skillsRaw ? skillsRaw.split(",").map((s) => s.trim()).filter(Boolean) : [];

  await supabase.from("profiles").update({ ...update, skills }).eq("id", user.id);
  revalidatePath("/dashboard/profile");
}
