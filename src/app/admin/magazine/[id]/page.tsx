import { notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { selectArticleForIssue, removeArticleFromIssue } from "../actions";
import { generateMagazinePdf } from "@/lib/actions/magazine-pdf";
import { IssueCoverPicker } from "./issue-cover-picker";

type Props = { params: Promise<{ id: string }> };

export default async function ManageIssuePage({ params }: Props) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: issue } = await supabase.from("magazine_issues").select("*").eq("id", id).single();
  if (!issue) notFound();

  const [{ data: selected }, { data: candidates }] = await Promise.all([
    supabase
      .from("articles")
      .select("id, title, content_type, author:profiles!articles_author_id_fkey(full_name)")
      .eq("magazine_issue_id", id),
    supabase
      .from("articles")
      .select("id, title, content_type, view_count, like_count, author:profiles!articles_author_id_fkey(full_name)")
      .eq("status", "published")
      .is("magazine_issue_id", null)
      .order("like_count", { ascending: false })
      .limit(30),
  ]);

  return (
    <div>
      <h1 className="font-display text-3xl font-semibold mb-2">
        Issue {issue.issue_number} — {issue.title}
      </h1>
      <p className="text-xs text-ink-muted mb-6">
        Editorial judgment, not automatic ranking — select the strongest pieces regardless of view count.
      </p>

      <IssueCoverPicker issueId={id} currentUrl={issue.cover_image_url} />

      <div className="flex items-center gap-3 mb-10 border border-line rounded-lg p-4">
        {issue.pdf_url ? (
          <>
            <span className="text-xs text-teal">PDF generated {new Date(issue.pdf_generated_at).toLocaleString()}</span>
            <a href={issue.pdf_url} target="_blank" rel="noreferrer" className="text-xs text-denim-dark underline">View PDF</a>
          </>
        ) : (
          <span className="text-xs text-ink-muted">No PDF yet — generated automatically when this issue is published.</span>
        )}
        <form action={async () => { "use server"; await generateMagazinePdf(id); }} className="ml-auto">
          <button className="text-xs px-3 py-1.5 rounded-full border border-line">
            {issue.pdf_url ? "Regenerate PDF" : "Generate PDF now"}
          </button>
        </form>
        {issue.is_published && (
          <Link href={`/magazine/${issue.issue_number}`} target="_blank" className="text-xs text-denim-dark underline">
            View public page
          </Link>
        )}
      </div>

      <section className="mb-10">
        <h2 className="font-display text-xl font-semibold mb-4">Selected for this issue</h2>
        {selected && selected.length > 0 ? (
          <ul className="flex flex-col gap-2">
            {selected.map((a) => (
              <li key={a.id} className="flex items-center justify-between border border-line rounded-lg p-3 text-sm">
                <span>{a.title} <span className="text-ink-muted">— {(a.author as any)?.full_name} · {a.content_type}</span></span>
                <form action={async () => { "use server"; await removeArticleFromIssue(a.id, id); }}>
                  <button className="text-xs text-red-600">Remove</button>
                </form>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-ink-muted">Nothing selected yet.</p>
        )}
      </section>

      <section>
        <h2 className="font-display text-xl font-semibold mb-4">Candidates (published, unassigned)</h2>
        {candidates && candidates.length > 0 ? (
          <ul className="flex flex-col gap-2">
            {candidates.map((a) => (
              <li key={a.id} className="flex items-center justify-between border border-line rounded-lg p-3 text-sm">
                <span>
                  {a.title} <span className="text-ink-muted">— {(a.author as any)?.full_name} · {a.content_type} · {a.view_count} views · {a.like_count} likes</span>
                </span>
                <form action={async () => { "use server"; await selectArticleForIssue(a.id, id); }}>
                  <button className="text-xs px-3 py-1.5 rounded-full bg-ink text-paper">Select</button>
                </form>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-ink-muted">No eligible published articles.</p>
        )}
      </section>
    </div>
  );
}
