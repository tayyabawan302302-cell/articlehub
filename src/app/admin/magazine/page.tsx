import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { createIssue, togglePublishIssue } from "./actions";

export default async function AdminMagazinePage() {
  const supabase = await createClient();
  const { data: issues } = await supabase
    .from("magazine_issues")
    .select("id, issue_number, title, theme, is_published, published_at")
    .order("issue_number", { ascending: false });

  const { data: selectionCounts } = await supabase
    .from("articles")
    .select("magazine_issue_id")
    .not("magazine_issue_id", "is", null);

  const countByIssue = new Map<string, number>();
  (selectionCounts ?? []).forEach((a) => {
    if (a.magazine_issue_id) countByIssue.set(a.magazine_issue_id, (countByIssue.get(a.magazine_issue_id) ?? 0) + 1);
  });

  return (
    <div>
      <h1 className="font-display text-3xl font-semibold mb-2">Magazine</h1>
      <p className="text-xs text-ink-muted mb-8">
        Editorial selection, separate from Trending (reader-driven) and Editor&apos;s Picks (lightweight highlight).
        Curate the best community work into numbered issues.
      </p>

      <form action={createIssue} className="flex flex-col gap-3 max-w-md mb-10 border border-line rounded-lg p-5">
        <p className="text-sm font-medium">New issue</p>
        <input name="issue_number" type="number" required placeholder="Issue number (e.g. 1)" className="input" />
        <input name="title" required placeholder="Title (e.g. The Best Writing from Our Community)" className="input" />
        <input name="theme" placeholder="Theme (optional)" className="input" />
        <button className="self-start text-sm px-4 py-2 rounded-full bg-ink text-paper font-medium">Create issue</button>
      </form>

      {issues && issues.length > 0 ? (
        <ul className="flex flex-col gap-3">
          {issues.map((issue) => (
            <li key={issue.id} className="border border-line rounded-lg p-4 flex items-center justify-between flex-wrap gap-3">
              <div>
                <p className="font-medium text-sm">
                  Issue {issue.issue_number} — {issue.title}
                  {issue.is_published && <span className="ml-2 text-xs px-2 py-0.5 rounded-full bg-teal/10 text-teal">Published</span>}
                </p>
                {issue.theme && <p className="text-xs text-ink-muted mt-0.5">{issue.theme}</p>}
                <p className="text-xs text-ink-muted mt-0.5">{countByIssue.get(issue.id) ?? 0} pieces selected</p>
              </div>
              <div className="flex gap-2">
                <Link href={`/admin/magazine/${issue.id}`} className="text-xs px-3 py-1.5 rounded-full border border-line">
                  Manage selections
                </Link>
                <form action={async () => { "use server"; await togglePublishIssue(issue.id, !issue.is_published); }}>
                  <button className="text-xs px-3 py-1.5 rounded-full bg-ink text-paper">
                    {issue.is_published ? "Unpublish" : "Publish"}
                  </button>
                </form>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-ink-muted">No issues yet.</p>
      )}
    </div>
  );
}
