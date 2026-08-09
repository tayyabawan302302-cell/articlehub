"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

async function getArticleForRevalidate(articleId: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("articles")
    .select("slug, category:categories(slug), author:profiles!articles_author_id_fkey(username)")
    .eq("id", articleId)
    .single();
  return data;
}

async function revalidateArticleSurfaces(articleId: string) {
  const article = await getArticleForRevalidate(articleId);
  revalidatePath("/");
  if (article?.slug) revalidatePath(`/articles/${article.slug}`);
  const category = article?.category as any;
  if (category?.slug) revalidatePath(`/categories/${category.slug}`);
  const author = article?.author as any;
  if (author?.username) revalidatePath(`/writers/${author.username}`);
}

/** Writer (or staff) submits a draft/rejected article for review. */
export async function submitForReview(articleId: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("articles").update({ status: "pending" }).eq("id", articleId);
  if (error) throw error;
  revalidatePath("/dashboard/articles");
}

/** Staff moves a pending article to "approved" — reviewed, not yet public. */
export async function approveArticle(articleId: string) {
  const supabase = await createClient();
  const { data: article } = await supabase.from("articles").select("author_id, title").eq("id", articleId).single();
  if (!article) throw new Error("Article not found");

  const { error } = await supabase.from("articles").update({ status: "approved" }).eq("id", articleId);
  if (error) throw error;

  await supabase.from("notifications").insert({
    recipient_id: article.author_id,
    type: "article_approved",
    title: "Your article was approved",
    body: `"${article.title}" passed review and is ready to publish.`,
  });

  revalidatePath("/admin/articles");
  revalidatePath("/dashboard/articles");
}

/** Staff rejects a pending article, with a reason the writer will see. */
export async function rejectArticle(articleId: string, reason: string) {
  const supabase = await createClient();
  const { data: article } = await supabase.from("articles").select("author_id, title").eq("id", articleId).single();
  if (!article) throw new Error("Article not found");

  const { error } = await supabase
    .from("articles")
    .update({ status: "rejected", rejection_reason: reason || null })
    .eq("id", articleId);
  if (error) throw error;

  await supabase.from("notifications").insert({
    recipient_id: article.author_id,
    type: "article_rejected",
    title: "Your article needs changes",
    body: reason || `"${article.title}" was not approved.`,
  });

  revalidatePath("/admin/articles");
  revalidatePath("/dashboard/articles");
}

/** Staff publishes an approved article. published_at is stamped by the DB trigger. */
export async function publishArticle(articleId: string) {
  const supabase = await createClient();
  const { data: article } = await supabase.from("articles").select("author_id, title").eq("id", articleId).single();
  if (!article) throw new Error("Article not found");

  const { error } = await supabase.from("articles").update({ status: "published" }).eq("id", articleId);
  if (error) throw error;

  await supabase.from("notifications").insert({
    recipient_id: article.author_id,
    type: "article_published",
    title: "Your article is live",
    body: `"${article.title}" was just published.`,
  });

  revalidatePath("/admin/articles");
  revalidatePath("/dashboard/articles");
  await revalidateArticleSurfaces(articleId);
}

/** Writer archives their own published article, or staff archives any article. */
export async function archiveArticle(articleId: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("articles").update({ status: "archived" }).eq("id", articleId);
  if (error) throw error;

  revalidatePath("/admin/articles");
  revalidatePath("/dashboard/articles");
  await revalidateArticleSurfaces(articleId);
}

/** Staff-only: bring an archived article back to published. */
export async function unarchiveArticle(articleId: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("articles").update({ status: "published" }).eq("id", articleId);
  if (error) throw error;

  revalidatePath("/admin/articles");
  await revalidateArticleSurfaces(articleId);
}

/** Writer deletes their own draft/rejected article (RLS restricts this to those statuses). */
export async function deleteArticle(articleId: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("articles").delete().eq("id", articleId);
  if (error) throw error;
  revalidatePath("/dashboard/articles");
}

/** Clone an article as a new draft — title gets a "(Copy)" suffix, status always resets to draft. */
export async function duplicateArticle(articleId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { data: original } = await supabase.from("articles").select("*").eq("id", articleId).single();
  if (!original || original.author_id !== user.id) throw new Error("Not found");

  const slug = `${original.slug}-copy-${Date.now().toString(36)}`;
  await supabase.from("articles").insert({
    author_id: user.id,
    category_id: original.category_id,
    title: `${original.title} (Copy)`,
    subtitle: original.subtitle,
    slug,
    content: original.content,
    content_html: original.content_html,
    featured_image_url: original.featured_image_url,
    reading_time_minutes: original.reading_time_minutes,
    status: "draft",
  });

  revalidatePath("/dashboard/articles");
}
