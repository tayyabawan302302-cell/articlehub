"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function submitWriterApplication(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const bio = formData.get("bio") as string;
  const sample_article = formData.get("sample_article") as string;
  const portfolio_url = (formData.get("portfolio_url") as string) || null;
  const facebook_url = (formData.get("facebook_url") as string) || null;
  const linkedin_url = (formData.get("linkedin_url") as string) || null;
  const x_url = (formData.get("x_url") as string) || null;
  const instagram_url = (formData.get("instagram_url") as string) || null;
  const interestsRaw = formData.get("writing_interests") as string;
  const writing_interests = interestsRaw ? interestsRaw.split(",").map((s) => s.trim()).filter(Boolean) : [];

  const { error } = await supabase.from("writer_applications").insert({
    user_id: user.id,
    bio,
    sample_article,
    portfolio_url,
    facebook_url,
    linkedin_url,
    x_url,
    instagram_url,
    writing_interests,
  });
  if (error) throw error;

  await supabase.from("profiles").update({ writer_status: "pending" }).eq("id", user.id);
  revalidatePath("/dashboard/apply");
}

export async function approveApplication(applicationId: string, userId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  await supabase
    .from("writer_applications")
    .update({ status: "approved", reviewed_by: user?.id, reviewed_at: new Date().toISOString() })
    .eq("id", applicationId);

  await supabase.from("profiles").update({ role: "writer", writer_status: "approved" }).eq("id", userId);

  await supabase.from("notifications").insert({
    recipient_id: userId,
    type: "system",
    title: "You're approved as a writer",
    body: "Your writer application was approved — you can now submit articles for review.",
  });

  revalidatePath("/admin/users");
}

export async function rejectApplication(applicationId: string, userId: string, note: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  await supabase
    .from("writer_applications")
    .update({ status: "rejected", review_note: note || null, reviewed_by: user?.id, reviewed_at: new Date().toISOString() })
    .eq("id", applicationId);

  // Reset to null (not "suspended" — that's reserved for actual moderation
  // action against an existing writer) so the user is free to submit a new
  // application; the unique index only blocks a second *pending* row.
  await supabase.from("profiles").update({ writer_status: null }).eq("id", userId);

  await supabase.from("notifications").insert({
    recipient_id: userId,
    type: "system",
    title: "Your writer application wasn't approved",
    body: note || "You're welcome to apply again.",
  });

  revalidatePath("/admin/users");
}
