"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function followWriter(writerId: string, writerUsername: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");
  if (user.id === writerId) return; // can't follow yourself

  const { error } = await supabase.from("follows").insert({ follower_id: user.id, following_id: writerId });
  if (error && !error.message.includes("duplicate")) throw error;

  const { data: follower } = await supabase.from("profiles").select("full_name, username").eq("id", user.id).single();
  await supabase.from("notifications").insert({
    recipient_id: writerId,
    type: "system",
    title: "New follower",
    body: `${follower?.full_name ?? "Someone"} started following you.`,
    link_url: follower?.username ? `/writers/${follower.username}` : null,
  });

  revalidatePath(`/writers/${writerUsername}`);
}

export async function unfollowWriter(writerId: string, writerUsername: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  await supabase.from("follows").delete().eq("follower_id", user.id).eq("following_id", writerId);
  revalidatePath(`/writers/${writerUsername}`);
}
