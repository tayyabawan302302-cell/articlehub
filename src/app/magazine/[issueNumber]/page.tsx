import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { poetryTypeLabel } from "@/lib/content-types";
import { PrintButton } from "./print-button";

type Props = { params: Promise<{ issueNumber: string }> };

async function getIssue(issueNumber: number) {
  const supabase = await createClient();
  const { data: issue } = await supabase
    .from("magazine_issues")
    .select("*")
    .eq("issue_number", issueNumber)
    .eq("is_published", true)
    .single();
  if (!issue) return null;

  const { data: articles } = await supabase
    .from("articles")
    .select("id, title, subtitle, slug, content_html, content_type, poetry_type, featured_image_url, author:profiles!articles_author_id_fkey(full_name, username)")
    .eq("magazine_issue_id", issue.id)
    .eq("status", "published");

  return { issue, articles: articles ?? [] };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { issueNumber } = await params;
  const data = await getIssue(parseInt(issueNumber, 10));
  if (!data) return {};
  return { title: `Issue ${data.issue.issue_number} — ${data.issue.title}`, description: data.issue.theme ?? undefined };
}

export default async function MagazineIssuePage({ params }: Props) {
  const { issueNumber } = await params;
  const data = await getIssue(parseInt(issueNumber, 10));
  if (!data) notFound();
  const { issue, articles } = data;

  const dateLabel = issue.published_at
    ? new Date(issue.published_at).toLocaleDateString("en-US", { month: "long", year: "numeric" })
    : "";

  const sections = [
    { label: "Articles", items: articles.filter((a) => a.content_type === "article") },
    { label: "Poetry", items: articles.filter((a) => a.content_type === "poetry") },
    { label: "Stories", items: articles.filter((a) => a.content_type === "story") },
    { label: "Essays", items: articles.filter((a) => a.content_type === "essay") },
    { label: "Opinion", items: articles.filter((a) => a.content_type === "opinion") },
    { label: "Other", items: articles.filter((a) => a.content_type === "other") },
  ].filter((s) => s.items.length > 0);

  return (
    <div className="magazine-print">
      {/* Controls — hidden on print */}
      <div className="no-print border-b border-line">
        <div className="mx-auto max-w-3xl px-6 py-4 flex items-center justify-between">
          <Link href="/magazine" className="text-xs text-ink-muted hover:text-ink">← Magazine archive</Link>
          <div className="flex gap-3">
            <PrintButton />
            {issue.pdf_url && (
              <a href={issue.pdf_url} download className="text-xs px-3 py-1.5 rounded-full bg-ink text-paper font-medium">
                Download PDF
              </a>
            )}
          </div>
        </div>
      </div>

      {/* Cover */}
      <section className="relative bg-ink text-paper py-24 px-6 text-center print-page-break-after">
        {issue.cover_image_url && (
          <Image src={issue.cover_image_url} alt="" fill className="object-cover opacity-30" />
        )}
        <div className="relative">
          <p className="text-xs tracking-[0.3em] text-denim-dark uppercase mb-4">ArticleHub</p>
          <h1 className="font-display text-5xl font-semibold mb-4">{issue.title}</h1>
          <p className="text-sm">Issue {String(issue.issue_number).padStart(2, "0")}{dateLabel && ` · ${dateLabel}`}</p>
          {issue.theme && <p className="font-display italic text-lg mt-6 text-paper/80 max-w-md mx-auto">{issue.theme}</p>}
        </div>
      </section>

      {/* Table of contents */}
      <section className="mx-auto max-w-2xl px-6 py-16 print-page-break-after">
        <h2 className="font-display text-2xl font-semibold mb-8">Table of Contents</h2>
        {sections.map((section) => (
          <div key={section.label} className="mb-8">
            <p className="text-xs tracking-widest text-denim-dark uppercase mb-3">{section.label}</p>
            <ul className="flex flex-col gap-2">
              {section.items.map((a) => (
                <li key={a.id} className="flex justify-between text-sm">
                  <a href={`#piece-${a.id}`} className="hover:text-denim-dark">{a.title}</a>
                  <span className="text-ink-muted">{(a.author as any)?.full_name}</span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </section>

      {/* Content, grouped by type */}
      {sections.map((section) => (
        <div key={section.label}>
          {section.items.map((a) => (
            <article key={a.id} id={`piece-${a.id}`} className="mx-auto max-w-2xl px-6 py-16 border-t border-line print-page-break-after">
              <p className="text-xs tracking-widest text-denim-dark uppercase mb-3">
                {section.label}
                {a.content_type === "poetry" && a.poetry_type && ` · ${poetryTypeLabel(a.poetry_type)}`}
              </p>
              <h2 className="font-display text-3xl font-semibold mb-2">{a.title}</h2>
              {a.subtitle && <p className="text-lg text-ink-muted mb-4">{a.subtitle}</p>}
              <p className="byline mb-8">
                <span>
                  <Link href={`/writers/${(a.author as any)?.username}`} className="hover:text-denim-dark">
                    {(a.author as any)?.full_name}
                  </Link>
                </span>
              </p>
              {a.featured_image_url && (
                <div className="relative aspect-[16/9] rounded-lg overflow-hidden mb-8">
                  <Image src={a.featured_image_url} alt="" fill className="object-cover" />
                </div>
              )}
              <div
                className={a.content_type === "poetry" ? "prose prose-lg italic" : "prose prose-lg"}
                dangerouslySetInnerHTML={{ __html: a.content_html ?? "" }}
              />
              <Link href={`/articles/${a.slug}`} className="text-xs text-denim-dark mt-8 inline-block no-print">
                Read & discuss on ArticleHub →
              </Link>
            </article>
          ))}
        </div>
      ))}

      <section className="bg-ink text-paper py-20 text-center">
        <p className="font-display italic text-lg mb-2">Thank you for reading.</p>
        <p className="text-denim-dark text-sm">ArticleHub — Issue {String(issue.issue_number).padStart(2, "0")}</p>
      </section>
    </div>
  );
}
