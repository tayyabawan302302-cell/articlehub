"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function submitContactForm(formData: FormData) {
  const supabase = await createClient();
  const name = formData.get("name") as string;
  const email = formData.get("email") as string;
  const subject = formData.get("subject") as string;
  const message = formData.get("message") as string;

  const { error } = await supabase.from("contact_messages").insert({ name, email, subject, message });
  return { error: error?.message, success: !error };
}

export async function replyToMessage(id: string, reply: string) {
  const supabase = await createClient();
  await supabase.from("contact_messages").update({ admin_reply: reply, is_replied: true }).eq("id", id);
  revalidatePath("/admin/messages");
}
