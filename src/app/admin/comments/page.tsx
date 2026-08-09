import { createClient } from "@/lib/supabase/server";
import { dismissReport, removeReportedComment } from "./actions";

export default async function AdminCommentsPage() {
  const supabase = await createClient();
  const { data: reported } = await supabase
    .from("comments")
    .select("id, content, created_at, article:articles(title, slug), author:profiles!comments_author_id_fkey(full_name, username)")
    .eq("is_reported", true)
    .eq("is_deleted", false)
    .order("created_at", { ascending: false });

  return (
    <div>
      <h1 className="font-display text-3xl font-semibold mb-2">Comments</h1>
      <p className="text-xs text-ink-muted mb-6">Reported comments waiting for a decision.</p>

      {reported && reported.length > 0 ? (
        <ul className="flex flex-col gap-4">
          {reported.map((c) => (
            <li key={c.id} className="border border-line rounded-lg p-4">
              <p className="text-xs text-ink-muted mb-1">
                {(c.author as any)?.full_name} on{" "}
                <a href={`/articles/${(c.article as any)?.slug}`} className="text-denim-dark" target="_blank" rel="noreferrer">
                  {(c.article as any)?.title}
                </a>
              </p>
              <p className="text-sm mb-3">{c.content}</p>
              <div className="flex gap-2">
                <form action={async () => { "use server"; await dismissReport(c.id); }}>
                  <button className="text-xs px-3 py-1.5 rounded-full border border-line">Dismiss report</button>
                </form>
                <form action={async () => { "use server"; await removeReportedComment(c.id); }}>
                  <button className="text-xs px-3 py-1.5 rounded-full bg-red-600 text-white">Remove comment</button>
                </form>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-ink-muted">No reported comments.</p>
      )}
    </div>
  );
}
