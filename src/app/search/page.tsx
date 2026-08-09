import Link from "next/link";
import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Search",
  description: "Search articles, writers, and categories.",
};

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const supabase = await createClient();

  let results: any[] = [];
  if (q) {
    const { data } = await supabase
      .from("articles")
      .select("id, title, slug, subtitle, author:profiles!articles_author_id_fkey(full_name), category:categories(name)")
      .eq("status", "published")
      .textSearch("content_html", q, { type: "websearch" })
      .limit(20);
    results = data ?? [];
  }

  return (
    <div className="mx-auto max-w-2xl px-6 py-14">
      <h1 className="font-display text-3xl font-semibold mb-6">Search</h1>
      <form className="mb-10">
        <input
          name="q"
          defaultValue={q}
          placeholder="Search articles, authors, categories…"
          className="input w-full text-lg py-3"
        />
      </form>

      {q && (
        <p className="text-sm text-ink-muted mb-6">
          {results.length} result{results.length === 1 ? "" : "s"} for &quot;{q}&quot;
        </p>
      )}

      <ul className="flex flex-col gap-6">
        {results.map((a) => (
          <li key={a.id}>
            <Link href={`/articles/${a.slug}`} className="font-display text-xl font-medium hover:text-denim">
              {a.title}
            </Link>
            {a.subtitle && <p className="text-sm text-ink-muted mt-1">{a.subtitle}</p>}
            <p className="byline mt-2">
              <span>{a.author?.full_name}</span>
              {a.category && (
                <>
                  <span className="byline-rule" />
                  <span>{a.category.name}</span>
                </>
              )}
            </p>
          </li>
        ))}
      </ul>
    </div>
  );
}
