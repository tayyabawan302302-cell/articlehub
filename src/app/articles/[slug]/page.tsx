import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import AdSlot from "@/components/ads/ad-slot";
import { ReadingProgressBar } from "@/components/reading-progress";
import { ShareButtons } from "@/components/share-buttons";
import { LikeButton } from "@/components/like-button";
import { BookmarkButton } from "@/components/bookmark-button";
import { CommentSection } from "@/components/comments/comment-section";
import { ArticleCard } from "@/components/article-card";
import { WriterCard } from "@/components/writer-card";

type Props = { params: Promise<{ slug: string }> };

async function getArticle(slug: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("articles")
    .select(
      "id, title, subtitle, content_html, featured_image_url, published_at, reading_time_minutes, meta_title, meta_description, canonical_url, view_count, like_count, comment_count, category_id, category:categories(name, slug), author:profiles!articles_author_id_fkey(id, full_name, username, avatar_url, bio, occupation, is_verified, website, x_url, linkedin_url)"
    )
    .eq("slug", slug)
    .eq("status", "published")
    .single();
  return data;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const article = await getArticle(slug);
  if (!article) return {};

  return {
    title: article.meta_title || article.title,
    description: article.meta_description || article.subtitle || undefined,
    alternates: article.canonical_url ? { canonical: article.canonical_url } : undefined,
    openGraph: {
      title: article.title,
      description: article.subtitle ?? undefined,
      images: article.featured_image_url ? [article.featured_image_url] : undefined,
      type: "article",
      publishedTime: article.published_at ?? undefined,
    },
    twitter: { card: "summary_large_image", title: article.title },
  };
}

export default async function ArticlePage({ params }: Props) {
  const { slug } = await params;
  const article = await getArticle(slug);
  if (!article) notFound();

  const supabase = await createClient();
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

  // Real view tracking — one row per view, aggregated count on the article.
  await supabase.from("article_views").insert({ article_id: article.id });
  await supabase.rpc("increment", { row_id: article.id }).then(
    () => {},
    () => {} // falls back silently if the increment() RPC hasn't been added yet — see README
  );

  const category = article.category as any;
  const author = article.author as any;

  const [{ data: comments }, { data: related }] = await Promise.all([
    supabase
      .from("comments")
      .select("id, content, created_at, parent_id, author_id, author:profiles!comments_author_id_fkey(full_name, username, avatar_url)")
      .eq("article_id", article.id)
      .eq("is_deleted", false)
      .order("created_at", { ascending: true }),
    category
      ? supabase
          .from("articles")
          .select("id, title, slug, subtitle, featured_image_url, published_at, reading_time_minutes, author:profiles!articles_author_id_fkey(full_name, username, is_verified), category:categories(name, slug)")
          .eq("status", "published")
          .eq("category_id", article.category_id)
          .neq("slug", slug)
          .order("published_at", { ascending: false })
          .limit(3)
      : Promise.resolve({ data: [] as any[] }),
  ]);

  const articleJsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: article.title,
    description: article.subtitle ?? article.meta_description ?? undefined,
    image: article.featured_image_url ? [article.featured_image_url] : undefined,
    datePublished: article.published_at ?? undefined,
    dateModified: article.published_at ?? undefined,
    author: { "@type": "Person", name: author?.full_name, url: `${siteUrl}/writers/${author?.username}` },
    mainEntityOfPage: { "@type": "WebPage", "@id": `${siteUrl}/articles/${slug}` },
  };

  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: siteUrl },
      ...(category ? [{ "@type": "ListItem", position: 2, name: category.name, item: `${siteUrl}/categories/${category.slug}` }] : []),
      { "@type": "ListItem", position: category ? 3 : 2, name: article.title, item: `${siteUrl}/articles/${slug}` },
    ],
  };

  return (
    <>
      {/* eslint-disable-next-line react/no-danger */}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(articleJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }} />
      <ReadingProgressBar />
      <article className="mx-auto max-w-2xl px-6 py-14">
        {category && (
          <Link href={`/categories/${category.slug}`} className="text-xs font-medium px-2.5 py-1 rounded-full bg-denim/15 text-denim-dark">
            {category.name}
          </Link>
        )}

        <h1 className="font-display text-4xl md:text-5xl font-semibold leading-[1.1] mt-4">{article.title}</h1>
        {article.subtitle && <p className="text-xl text-ink-muted mt-4 leading-relaxed">{article.subtitle}</p>}

        <div className="flex items-center justify-between mt-8 mb-8 flex-wrap gap-4">
          <Link href={`/writers/${author?.username}`} className="flex items-center gap-3 group">
            {author?.avatar_url ? (
              <Image src={author.avatar_url} alt={author.full_name} width={44} height={44} className="rounded-full object-cover w-11 h-11" />
            ) : (
              <div className="w-11 h-11 rounded-full bg-denim/10 flex items-center justify-center font-display text-denim">
                {author?.full_name?.[0]}
              </div>
            )}
            <div>
              <p className="text-sm font-medium group-hover:text-denim-dark transition-colors flex items-center gap-1">
                {author?.full_name}
                {author?.is_verified && <span className="text-denim-dark text-xs">✓</span>}
              </p>
              <p className="byline">
                <span>{article.published_at && new Date(article.published_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</span>
                <span className="byline-rule" />
                <span>{article.reading_time_minutes} min read</span>
              </p>
            </div>
          </Link>
          <ShareButtons title={article.title} url={`${siteUrl}/articles/${slug}`} />
        </div>

        {article.featured_image_url && (
          <div className="relative w-full aspect-[16/9] rounded-2xl overflow-hidden mb-10">
            <Image src={article.featured_image_url} alt={article.title} fill priority sizes="(max-width: 768px) 100vw, 700px" className="object-cover" />
          </div>
        )}

        <AdSlot placement="inside_article" />

        <div
          className="prose prose-lg prose-headings:font-display prose-headings:font-semibold prose-p:leading-relaxed prose-headings:mt-10 prose-headings:mb-4"
          dangerouslySetInnerHTML={{ __html: article.content_html ?? "" }}
        />

        <div className="flex items-center gap-3 mt-12 pt-8 border-t border-line">
          <LikeButton articleId={article.id} slug={slug} initialCount={article.like_count ?? 0} />
          <BookmarkButton articleId={article.id} />
          <span className="text-xs text-ink-muted ml-auto">{article.view_count} views</span>
        </div>

        {author && (
          <div className="mt-10">
            <WriterCard author={author} />
          </div>
        )}

        {related && related.length > 0 && (
          <section className="mt-16 pt-8 border-t border-line">
            <h2 className="font-display text-xl font-semibold mb-6">More from {category?.name}</h2>
            <div className="grid sm:grid-cols-3 gap-5">
              {related.map((a: any) => (
                <ArticleCard key={a.id} article={a} />
              ))}
            </div>
          </section>
        )}

        <section className="mt-16 pt-8 border-t border-line">
          <h2 className="font-display text-xl font-semibold mb-6">
            {article.comment_count ?? 0} {article.comment_count === 1 ? "Comment" : "Comments"}
          </h2>
          <CommentSection articleId={article.id} slug={slug} initialComments={(comments as any) ?? []} />
        </section>
      </article>
    </>
  );
}
