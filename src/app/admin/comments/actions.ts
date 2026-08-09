"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function dismissReport(commentId: string) {
  const supabase = await createClient();
  await supabase.from("comments").update({ is_reported: false }).eq("id", commentId);
  revalidatePath("/admin/comments");
}

export async function removeReportedComment(commentId: string) {
  const supabase = await createClient();
  await supabase.from("comments").update({ is_deleted: true, is_reported: false }).eq("id", commentId);
  revalidatePath("/admin/comments");
}
