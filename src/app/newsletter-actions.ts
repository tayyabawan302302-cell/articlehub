"use server";

import { createClient } from "@/lib/supabase/server";

export async function subscribeToNewsletter(formData: FormData) {
  const supabase = await createClient();
  const email = formData.get("email") as string;
  if (!email) return { error: "Email required" };

  const { error } = await supabase.from("newsletter_subscribers").insert({ email });
  if (error && !error.message.includes("duplicate")) return { error: error.message };
  return { success: true };
}
