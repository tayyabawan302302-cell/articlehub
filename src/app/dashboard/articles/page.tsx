import Link from "next/link";
import Image from "next/image";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { deleteArticle, duplicateArticle } from "@/lib/actions/article-workflow";

const STATUS_STYLES: Record<string, string> = {
  published: "bg-teal/10 text-teal",
  pending: "bg-amber-500/10 text-amber-700",
  approved: "bg-denim/15 text-denim-dark",
  draft: "bg-black/5 text-ink-muted",
  rejected: "bg-red-500/10 text-red-700",
  archived: "bg-black/10 text-ink-muted",
  scheduled: "bg-denim/15 text-denim-dark",
};

const PAGE_SIZE = 10;

export default async function MyArticlesPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string; page?: string }>;
}) {
  const { q, status, page: pageParam } = await searchParams;
  const page = Math.max(1, parseInt(pageParam ?? "1", 10) || 1);

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  let query = supabase
    .from("articles")
    .select(
      "id, title, slug, status, featured_image_url, view_count, like_count, comment_count, updated_at, published_at, rejection_reason, category:categories(name)",
      { count: "exact" }
    )
    .eq("author_id", user.id);

  if (q) query = query.ilike("title", `%${q}%`);
  if (status) query = query.eq("status", status);

  const from = (page - 1) * PAGE_SIZE;
  const { data: articles, count } = await query
    .order("updated_at", { ascending: false })
    .range(from, from + PAGE_SIZE - 1);

  const totalPages = Math.max(1, Math.ceil((count ?? 0) / PAGE_SIZE));

  function pageHref(params: { page?: string }) {
    const targetPage = params.page;
    const sp = new URLSearchParams();
    if (q) sp.set("q", q);
    if (status) sp.set("status", status);
    if (targetPage && targetPage !== "1") sp.set("page", targetPage);
    const qs = sp.toString();
    return `/dashboard/articles${qs ? `?${qs}` : ""}`;
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-display text-3xl font-semibold">My articles</h1>
        <Link href="/dashboard/articles/new" className="text-sm font-medium px-4 py-2 rounded-full bg-ink text-paper font-medium">
          New article
        </Link>
      </div>

      <form className="flex gap-2 mb-6" action="/dashboard/articles">
        <input name="q" defaultValue={q} placeholder="Search by title…" className="input flex-1 text-sm" />
        <select name="status" defaultValue={status ?? ""} className="input text-sm w-auto">
          <option value="">All statuses</option>
          <option value="draft">Draft</option>
          <option value="pending">Pending</option>
          <option value="approved">Approved</option>
          <option value="published">Published</option>
          <option value="rejected">Rejected</option>
          <option value="archived">Archived</option>
        </select>
        <button className="text-sm px-4 py-2 rounded-full border border-line">Filter</button>
      </form>

      {articles && articles.length > 0 ? (
        <>
          <div className="flex flex-col gap-3">
            {articles.map((a) => (
              <div key={a.id} className="flex items-center gap-4 border border-line rounded-lg p-3">
                <div className="relative w-20 h-14 rounded-md overflow-hidden bg-black/5 flex-shrink-0">
                  {a.featured_image_url ? (
                    <Image src={a.featured_image_url} alt="" fill className="object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-ink-muted text-xs">—</div>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <Link href={`/dashboard/articles/${a.id}`} className="font-medium hover:text-denim-dark truncate block">
                    {a.title}
                  </Link>
                  <p className="byline mt-0.5">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${STATUS_STYLES[a.status]}`}>{a.status}</span>
                    {(a.category as any)?.name && (
                      <>
                        <span className="byline-rule" />
                        <span>{(a.category as any).name}</span>
                      </>
                    )}
                    <span className="byline-rule" />
                    <span>{a.view_count} views</span>
                    <span className="byline-rule" />
                    <span>{a.like_count} likes</span>
                    <span className="byline-rule" />
                    <span>{a.comment_count} comments</span>
                  </p>
                  {a.status === "rejected" && a.rejection_reason && (
                    <p className="text-xs text-red-600 mt-1">{a.rejection_reason}</p>
                  )}
                </div>

                <div className="flex items-center gap-3 flex-shrink-0 text-xs">
                  <Link href={`/dashboard/articles/${a.id}`} className="text-denim-dark">Edit</Link>
                  <form action={async () => { "use server"; await duplicateArticle(a.id); }}>
                    <button className="text-ink-muted hover:text-ink">Duplicate</button>
                  </form>
                  {(a.status === "draft" || a.status === "rejected") && (
                    <form action={async () => { "use server"; await deleteArticle(a.id); }}>
                      <button className="text-red-600">Delete</button>
                    </form>
                  )}
                </div>
              </div>
            ))}
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-8 text-sm">
              <Link
                href={pageHref({ page: String(Math.max(1, page - 1)) })}
                className={`px-3 py-1.5 rounded-full border border-line ${page <= 1 ? "pointer-events-none opacity-40" : ""}`}
              >
                Previous
              </Link>
              <span className="text-ink-muted">Page {page} of {totalPages}</span>
              <Link
                href={pageHref({ page: String(Math.min(totalPages, page + 1)) })}
                className={`px-3 py-1.5 rounded-full border border-line ${page >= totalPages ? "pointer-events-none opacity-40" : ""}`}
              >
                Next
              </Link>
            </div>
          )}
        </>
      ) : (
        <div className="border border-dashed border-line rounded-lg p-10 text-center">
          <p className="font-display text-lg">
            {q || status ? "No articles match your search." : "You haven't written anything yet."}
          </p>
          {!q && !status && (
            <Link href="/dashboard/articles/new" className="text-denim-dark font-medium text-sm mt-2 inline-block">
              Write your first article →
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
