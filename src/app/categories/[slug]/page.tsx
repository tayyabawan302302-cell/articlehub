import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { ArticleCard } from "@/components/article-card";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const supabase = await createClient();
  const { data: category } = await supabase.from("categories").select("name, description").eq("slug", slug).single();
  if (!category) return {};
  return { title: category.name, description: category.description ?? undefined };
}

export default async function CategoryPage({ params }: Props) {
  const { slug } = await params;
  const supabase = await createClient();

  const { data: category } = await supabase.from("categories").select("*").eq("slug", slug).single();
  if (!category) notFound();

  const { data: articles } = await supabase
    .from("articles")
    .select(
      "id, title, slug, subtitle, featured_image_url, published_at, reading_time_minutes, author:profiles!articles_author_id_fkey(full_name, username, is_verified)"
    )
    .eq("category_id", category.id)
    .eq("status", "published")
    .order("published_at", { ascending: false });

  return (
    <div className="mx-auto max-w-6xl px-6 py-14">
      <p className="byline mb-3"><span>Category</span></p>
      <h1 className="font-display text-4xl md:text-5xl font-semibold mb-2">{category.name}</h1>
      {category.description && <p className="text-ink-muted max-w-xl mb-12">{category.description}</p>}

      {articles && articles.length > 0 ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {articles.map((a) => (
            <ArticleCard key={a.id} article={a as any} />
          ))}
        </div>
      ) : (
        <p className="text-sm text-ink-muted">No articles in this category yet.</p>
      )}
    </div>
  );
}
