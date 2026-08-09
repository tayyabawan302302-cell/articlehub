import Link from "next/link";
import Image from "next/image";
import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Magazine",
  description: "The best writing from our community, curated into numbered issues.",
};

export default async function MagazineArchivePage() {
  const supabase = await createClient();
  const { data: issues } = await supabase
    .from("magazine_issues")
    .select("id, issue_number, title, theme, cover_image_url, published_at")
    .eq("is_published", true)
    .order("issue_number", { ascending: false });

  const [latest, ...archive] = issues ?? [];

  return (
    <div className="mx-auto max-w-4xl px-6 py-16">
      <p className="byline mb-3"><span>📖 ArticleHub Magazine</span></p>
      <h1 className="font-display text-4xl font-semibold mb-10">Magazine Archive</h1>

      {latest ? (
        <>
          <Link
            href={`/magazine/${latest.issue_number}`}
            className="block rounded-2xl overflow-hidden border border-line mb-14 group"
          >
            <div className="relative aspect-[21/9] bg-ink">
              {latest.cover_image_url && (
                <Image src={latest.cover_image_url} alt={latest.title} fill className="object-cover opacity-70 group-hover:opacity-60 transition-opacity" />
              )}
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-6 text-paper">
                <p className="text-xs tracking-widest text-denim-dark uppercase mb-3">Latest Issue</p>
                <p className="font-display text-3xl md:text-4xl font-semibold mb-2">{latest.title}</p>
                <p className="text-sm text-paper/70">
                  Issue {String(latest.issue_number).padStart(2, "0")}
                  {latest.published_at && ` · ${new Date(latest.published_at).toLocaleDateString("en-US", { month: "long", year: "numeric" })}`}
                </p>
              </div>
            </div>
          </Link>

          {archive.length > 0 && (
            <>
              <h2 className="font-display text-xl font-semibold mb-4">Archive</h2>
              <ul className="flex flex-col gap-3">
                {archive.map((issue) => (
                  <li key={issue.id}>
                    <Link
                      href={`/magazine/${issue.issue_number}`}
                      className="flex items-center justify-between border border-line rounded-lg p-4 hover:border-denim transition-colors"
                    >
                      <span className="text-sm font-medium">
                        Issue {String(issue.issue_number).padStart(2, "0")} — {issue.title}
                      </span>
                      <span className="text-xs text-ink-muted">
                        {issue.published_at && new Date(issue.published_at).toLocaleDateString("en-US", { month: "long", year: "numeric" })}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </>
          )}
        </>
      ) : (
        <div className="border border-dashed border-line rounded-lg p-12 text-center">
          <p className="font-display text-lg">No magazine issues yet.</p>
          <p className="text-sm text-ink-muted mt-1">The first issue will appear here once it&apos;s published.</p>
        </div>
      )}
    </div>
  );
}
