"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { generateMagazinePdf } from "@/lib/actions/magazine-pdf";

export async function createIssue(formData: FormData) {
  const supabase = await createClient();
  const issue_number = parseInt(formData.get("issue_number") as string, 10);
  const title = formData.get("title") as string;
  const theme = (formData.get("theme") as string) || null;

  const { error } = await supabase.from("magazine_issues").insert({ issue_number, title, theme });
  if (error) throw error;
  revalidatePath("/admin/magazine");
}

export async function togglePublishIssue(issueId: string, publish: boolean) {
  const supabase = await createClient();
  await supabase
    .from("magazine_issues")
    .update({ is_published: publish, published_at: publish ? new Date().toISOString() : null })
    .eq("id", issueId);

  // Generate the issue's own permanent PDF at the moment it goes public —
  // never overwrites another issue's file (see generateMagazinePdf).
  if (publish) {
    await generateMagazinePdf(issueId);
  }

  revalidatePath("/admin/magazine");
  revalidatePath("/magazine");
}

export async function selectArticleForIssue(articleId: string, issueId: string) {
  const supabase = await createClient();
  await supabase.from("articles").update({ magazine_issue_id: issueId }).eq("id", articleId);
  revalidatePath(`/admin/magazine/${issueId}`);
}

export async function removeArticleFromIssue(articleId: string, issueId: string) {
  const supabase = await createClient();
  await supabase.from("articles").update({ magazine_issue_id: null }).eq("id", articleId);
  revalidatePath(`/admin/magazine/${issueId}`);
}
