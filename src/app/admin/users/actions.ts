"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function suspendUser(userId: string, suspend: boolean) {
  const supabase = await createClient();
  await supabase.from("profiles").update({ is_suspended: suspend }).eq("id", userId);
  revalidatePath("/admin/users");
}

export async function changeRole(userId: string, role: "visitor" | "writer" | "editor" | "moderator" | "admin") {
  const supabase = await createClient();
  await supabase.from("profiles").update({ role }).eq("id", userId);
  revalidatePath("/admin/users");
}

export async function toggleFeaturedWriter(userId: string, featured: boolean) {
  const supabase = await createClient();
  await supabase.from("profiles").update({ is_featured: featured }).eq("id", userId);
  revalidatePath("/admin/users");
  revalidatePath("/");
}

export async function toggleVerifiedWriter(userId: string, verified: boolean) {
  const supabase = await createClient();
  await supabase.from("profiles").update({ is_verified: verified }).eq("id", userId);
  revalidatePath("/admin/users");
  revalidatePath("/");
}

export async function addPlagiarismStrike(userId: string) {
  const supabase = await createClient();
  const { data: profile } = await supabase.from("profiles").select("plagiarism_strikes").eq("id", userId).single();
  const next = (profile?.plagiarism_strikes ?? 0) + 1;
  // Auto-suspension at 3 strikes is enforced by a DB trigger
  // (auto_suspend_on_third_strike, migration 0008) — not here — so it holds
  // even if this action is ever bypassed.
  await supabase.from("profiles").update({ plagiarism_strikes: next }).eq("id", userId);

  await supabase.from("notifications").insert({
    recipient_id: userId,
    type: "system",
    title: "Content policy strike issued",
    body:
      next >= 3
        ? "Your account has been suspended after three confirmed plagiarism violations."
        : `You now have ${next} of 3 strikes on your account.`,
  });

  revalidatePath("/admin/users");
}
