"use server";

import { renderToBuffer } from "@react-pdf/renderer";
import { createElement } from "react";
import { createClient } from "@/lib/supabase/server";
import { MagazinePdfDocument } from "@/lib/pdf/magazine-pdf";
import { revalidatePath } from "next/cache";

export async function generateMagazinePdf(issueId: string) {
  const supabase = await createClient();

  const { data: issue } = await supabase.from("magazine_issues").select("*").eq("id", issueId).single();
  if (!issue) throw new Error("Issue not found");

  const { data: settings } = await supabase.from("site_settings").select("site_name").eq("id", 1).single();
  const siteName = settings?.site_name ?? "ArticleHub";

  const { data: articles } = await supabase
    .from("articles")
    .select("id, title, subtitle, content_html, content_type, poetry_type, featured_image_url, author:profiles!articles_author_id_fkey(full_name)")
    .eq("magazine_issue_id", issueId)
    .eq("status", "published");

  // Each issue gets its own permanently-associated file path, keyed by
  // issue number — publishing a later issue never touches an earlier
  // one's PDF. Re-generating the SAME issue's PDF (e.g. after adding a
  // late addition before publish) overwrites only that issue's file.
  const path = `magazine-pdfs/issue-${String(issue.issue_number).padStart(2, "0")}.pdf`;

  const buffer = await renderToBuffer(
    createElement(MagazinePdfDocument, { issue, siteName, articles: (articles as any) ?? [] }) as any
  );

  const { error: uploadError } = await supabase.storage
    .from("media")
    .upload(path, buffer, { contentType: "application/pdf", upsert: true });
  if (uploadError) throw uploadError;

  const { data: publicUrlData } = supabase.storage.from("media").getPublicUrl(path);

  await supabase
    .from("magazine_issues")
    .update({
      pdf_url: publicUrlData.publicUrl,
      pdf_storage_path: path,
      pdf_generated_at: new Date().toISOString(),
    })
    .eq("id", issueId);

  revalidatePath("/admin/magazine");
  revalidatePath(`/admin/magazine/${issueId}`);
  revalidatePath("/magazine");
  revalidatePath(`/magazine/${issue.issue_number}`);

  return publicUrlData.publicUrl;
}
