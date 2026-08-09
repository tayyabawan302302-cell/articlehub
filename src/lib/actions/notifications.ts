"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function markNotificationRead(id: string) {
  const supabase = await createClient();
  await supabase.from("notifications").update({ is_read: true }).eq("id", id);
  revalidatePath("/dashboard/notifications");
}

export async function markAllNotificationsRead(userId: string) {
  const supabase = await createClient();
  await supabase.from("notifications").update({ is_read: true }).eq("recipient_id", userId).eq("is_read", false);
  revalidatePath("/dashboard/notifications");
}
