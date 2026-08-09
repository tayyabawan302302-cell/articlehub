"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function postComment(articleId: string, slug: string, content: string, parentId?: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");
  if (!content.trim()) return;

  const { error } = await supabase.from("comments").insert({
    article_id: articleId,
    author_id: user.id,
    parent_id: parentId ?? null,
    content: content.trim(),
  });
  if (error) throw error;

  const { data: actor } = await supabase.from("profiles").select("full_name").eq("id", user.id).single();
  const actorName = actor?.full_name ?? "Someone";

  // Notify the article's author (skip if they're commenting on their own piece)
  const { data: article } = await supabase.from("articles").select("author_id, title").eq("id", articleId).single();
  if (article && article.author_id !== user.id) {
    await supabase.from("notifications").insert({
      recipient_id: article.author_id,
      type: "new_comment",
      title: `${actorName} commented on your article`,
      body: `"${article.title}"`,
      link_url: `/articles/${slug}`,
    });
  }

  // If this is a reply, notify the parent comment's author too
  if (parentId) {
    const { data: parent } = await supabase.from("comments").select("author_id").eq("id", parentId).single();
    if (parent && parent.author_id !== user.id) {
      await supabase.from("notifications").insert({
        recipient_id: parent.author_id,
        type: "comment_reply",
        title: `${actorName} replied to your comment`,
        link_url: `/articles/${slug}`,
      });
    }
  }

  revalidatePath(`/articles/${slug}`);
}

export async function deleteComment(commentId: string, slug: string) {
  const supabase = await createClient();
  await supabase.from("comments").update({ is_deleted: true }).eq("id", commentId);
  revalidatePath(`/articles/${slug}`);
}

export async function editComment(commentId: string, slug: string, content: string) {
  const supabase = await createClient();
  if (!content.trim()) return;
  await supabase.from("comments").update({ content: content.trim() }).eq("id", commentId);
  revalidatePath(`/articles/${slug}`);
}

export async function reportComment(commentId: string, slug: string) {
  const supabase = await createClient();
  await supabase.rpc("report_comment", { comment_id: commentId });
  revalidatePath(`/articles/${slug}`);
}
