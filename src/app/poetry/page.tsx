import Link from "next/link";
import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { ArticleCard } from "@/components/article-card";
import { POETRY_TYPES, poetryTypeLabel } from "@/lib/content-types";

type Props = { searchParams: Promise<{ type?: string }> };

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const { type } = await searchParams;
  const label = type ? poetryTypeLabel(type) : "Poetry";
  return { title: label ?? "Poetry", description: `${label ?? "Poetry"} from the ArticleHub community.` };
}

export default async function PoetryPage({ searchParams }: Props) {
  const { type } = await searchParams;
  const supabase = await createClient();

  let query = supabase
    .from("articles")
    .select("id, title, slug, subtitle, featured_image_url, published_at, reading_time_minutes, poetry_type, author:profiles!articles_author_id_fkey(full_name, username, is_verified)")
    .eq("status", "published")
    .eq("content_type", "poetry")
    .order("published_at", { ascending: false });

  if (type) query = query.eq("poetry_type", type);

  const { data: poems } = await query;

  return (
    <div className="mx-auto max-w-6xl px-6 py-14">
      <p className="byline mb-3"><span>🖋️ Poetry</span></p>
      <h1 className="font-display text-4xl font-semibold mb-8">
        {type ? poetryTypeLabel(type) : "All Poetry"}
      </h1>

      <div className="flex flex-wrap gap-2 mb-12">
        <Link
          href="/poetry"
          className={`text-sm px-3.5 py-1.5 rounded-full border transition-colors ${
            !type ? "bg-ink text-paper border-ink" : "border-line text-ink-muted hover:border-denim hover:text-denim-dark"
          }`}
        >
          All
        </Link>
        {POETRY_TYPES.map((p) => (
          <Link
            key={p.value}
            href={`/poetry?type=${p.value}`}
            className={`text-sm px-3.5 py-1.5 rounded-full border transition-colors ${
              type === p.value ? "bg-ink text-paper border-ink" : "border-line text-ink-muted hover:border-denim hover:text-denim-dark"
            }`}
          >
            {p.label}
          </Link>
        ))}
      </div>

      {poems && poems.length > 0 ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {poems.map((p) => (
            <ArticleCard key={p.id} article={p as any} />
          ))}
        </div>
      ) : (
        <div className="border border-dashed border-line rounded-lg p-10 text-center">
          <p className="font-display text-lg">
            {type ? `No ${poetryTypeLabel(type)} published yet.` : "No poetry published yet."}
          </p>
          <p className="text-sm text-ink-muted mt-1">Check back soon, or browse another type above.</p>
        </div>
      )}
    </div>
  );
}
