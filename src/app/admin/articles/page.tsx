import { createClient } from "@/lib/supabase/server";
import { approveArticle, rejectArticle, publishArticle, archiveArticle, unarchiveArticle } from "@/lib/actions/article-workflow";

export default async function AdminArticlesPage() {
  const supabase = await createClient();

  const [
    { data: pending, error: pendingError },
    { data: approved, error: approvedError },
    { data: published, error: publishedError },
    { data: archived, error: archivedError },
  ] = await Promise.all([
    supabase.from("articles").select("id, title, created_at, author:profiles!articles_author_id_fkey(full_name, username)").eq("status", "pending").order("created_at"),
    supabase.from("articles").select("id, title, approved_at, author:profiles!articles_author_id_fkey(full_name, username)").eq("status", "approved").order("approved_at"),
    supabase.from("articles").select("id, title, published_at, author:profiles!articles_author_id_fkey(full_name, username)").eq("status", "published").order("published_at", { ascending: false }).limit(20),
    supabase.from("articles").select("id, title, archived_at, author:profiles!articles_author_id_fkey(full_name, username)").eq("status", "archived").order("archived_at", { ascending: false }).limit(20),
  ]);

  // Log every query error server-side (shows up in your terminal / Vercel
  // function logs) instead of letting a failed query silently look like an
  // empty result — this is what hid the ambiguous-embed bug last time.
  const queryError = pendingError || approvedError || publishedError || archivedError;
  if (queryError) {
    console.error("[/admin/articles] Supabase query error:", queryError);
  }

  return (
    <div className="flex flex-col gap-12">
      {queryError && (
        <div className="border border-red-300 bg-red-50 rounded-lg p-4 text-sm text-red-800">
          <p className="font-medium">Couldn&apos;t load articles from the database.</p>
          <p className="mt-1 font-mono text-xs">{queryError.message}</p>
        </div>
      )}

      <section>
        <h1 className="font-display text-3xl font-semibold mb-2">Pending review</h1>
        <p className="text-xs text-ink-muted mb-6">New submissions waiting on a first look.</p>
        {pending && pending.length > 0 ? (
          <ul className="flex flex-col gap-4">
            {pending.map((a) => (
              <li key={a.id} className="border border-line rounded-lg p-4 flex items-center justify-between">
                <div>
                  <p className="font-medium">{a.title}</p>
                  <p className="byline mt-1">
                    <span>{(a.author as any)?.full_name}</span>
                    <span className="byline-rule" />
                    <span>{new Date(a.created_at).toLocaleDateString()}</span>
                  </p>
                </div>
                <div className="flex gap-2">
                  <form action={async () => { "use server"; await approveArticle(a.id); }}>
                    <button className="text-xs px-3 py-1.5 rounded-full bg-teal text-white">Approve</button>
                  </form>
                  <form action={async (formData: FormData) => {
                    "use server";
                    await rejectArticle(a.id, formData.get("reason") as string);
                  }} className="flex gap-1">
                    <input name="reason" placeholder="Reason (optional)" className="input text-xs py-1 w-40" />
                    <button className="text-xs px-3 py-1.5 rounded-full bg-red-600 text-white">Reject</button>
                  </form>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-ink-muted">Nothing waiting for review.</p>
        )}
      </section>

      <section>
        <h2 className="font-display text-2xl font-semibold mb-2">Approved — ready to publish</h2>
        <p className="text-xs text-ink-muted mb-6">Reviewed and cleared. Publish to make them public.</p>
        {approved && approved.length > 0 ? (
          <ul className="flex flex-col gap-4">
            {approved.map((a) => (
              <li key={a.id} className="border border-line rounded-lg p-4 flex items-center justify-between">
                <div>
                  <p className="font-medium">{a.title}</p>
                  <p className="byline mt-1"><span>{(a.author as any)?.full_name}</span></p>
                </div>
                <form action={async () => { "use server"; await publishArticle(a.id); }}>
                  <button className="text-xs px-3 py-1.5 rounded-full bg-ink text-paper font-medium">Publish now</button>
                </form>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-ink-muted">Nothing approved and waiting to publish.</p>
        )}
      </section>

      <section>
        <h2 className="font-display text-2xl font-semibold mb-2">Published</h2>
        {published && published.length > 0 ? (
          <ul className="flex flex-col gap-3">
            {published.map((a) => (
              <li key={a.id} className="flex items-center justify-between border-b border-line/60 py-2 text-sm">
                <span>{a.title} <span className="text-ink-muted">— {(a.author as any)?.full_name}</span></span>
                <form action={async () => { "use server"; await archiveArticle(a.id); }}>
                  <button className="text-xs text-red-600">Archive</button>
                </form>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-ink-muted">Nothing published yet.</p>
        )}
      </section>

      <section>
        <h2 className="font-display text-2xl font-semibold mb-2">Archived</h2>
        {archived && archived.length > 0 ? (
          <ul className="flex flex-col gap-3">
            {archived.map((a) => (
              <li key={a.id} className="flex items-center justify-between border-b border-line/60 py-2 text-sm">
                <span>{a.title} <span className="text-ink-muted">— {(a.author as any)?.full_name}</span></span>
                <form action={async () => { "use server"; await unarchiveArticle(a.id); }}>
                  <button className="text-xs text-denim">Restore</button>
                </form>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-ink-muted">No archived articles.</p>
        )}
      </section>
    </div>
  );
}
