"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function likeArticle(articleId: string, slug: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { error } = await supabase.from("likes").insert({ article_id: articleId, user_id: user.id });
  if (error && !error.message.includes("duplicate")) throw error;

  const { data: article } = await supabase.from("articles").select("author_id, title").eq("id", articleId).single();
  if (article && article.author_id !== user.id) {
    const { data: liker } = await supabase.from("profiles").select("full_name").eq("id", user.id).single();
    await supabase.from("notifications").insert({
      recipient_id: article.author_id,
      type: "system",
      title: "Someone liked your article",
      body: `${liker?.full_name ?? "Someone"} liked "${article.title}"`,
      link_url: `/articles/${slug}`,
    });
  }

  revalidatePath(`/articles/${slug}`);
}

export async function unlikeArticle(articleId: string, slug: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  await supabase.from("likes").delete().eq("article_id", articleId).eq("user_id", user.id);
  revalidatePath(`/articles/${slug}`);
}
