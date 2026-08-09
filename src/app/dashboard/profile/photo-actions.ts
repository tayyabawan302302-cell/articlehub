"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

// These now only ever receive a URL string (the file itself was already
// uploaded directly from the browser to Supabase Storage) — tiny payload,
// nowhere near the Server Action body-size limit.

export async function saveAvatarUrl(url: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");
  await supabase.from("profiles").update({ avatar_url: url }).eq("id", user.id);
  revalidatePath("/dashboard/profile");
}

export async function removeAvatar() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");
  await supabase.from("profiles").update({ avatar_url: null }).eq("id", user.id);
  revalidatePath("/dashboard/profile");
}

export async function saveCoverUrl(url: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");
  await supabase.from("profiles").update({ cover_url: url }).eq("id", user.id);
  revalidatePath("/dashboard/profile");
}

export async function removeCover() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");
  await supabase.from("profiles").update({ cover_url: null }).eq("id", user.id);
  revalidatePath("/dashboard/profile");
}
