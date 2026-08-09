import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { computeTrendingScore } from "@/lib/trending";

export default async function DashboardOverview() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [{ data: articles }, { data: allPublishedSiteWide }] = await Promise.all([
    supabase
      .from("articles")
      .select("id, title, status, content_type, view_count, like_count, comment_count, published_at")
      .eq("author_id", user.id),
    // Lightweight — used only to establish what counts as "trending"
    // site-wide, so this writer's trending count means something relative
    // to everyone else, not just to their own articles.
    supabase
      .from("articles")
      .select("id, view_count, like_count, comment_count, published_at")
      .eq("status", "published"),
  ]);

  const counts = {
    published: articles?.filter((a) => a.status === "published").length ?? 0,
    pending: articles?.filter((a) => a.status === "pending").length ?? 0,
    approved: articles?.filter((a) => a.status === "approved").length ?? 0,
    draft: articles?.filter((a) => a.status === "draft").length ?? 0,
    views: articles?.reduce((sum, a) => sum + (a.view_count ?? 0), 0) ?? 0,
    likes: articles?.reduce((sum, a) => sum + (a.like_count ?? 0), 0) ?? 0,
    poetry: articles?.filter((a) => a.content_type === "poetry").length ?? 0,
    stories: articles?.filter((a) => a.content_type === "story").length ?? 0,
  };

  // Trending Posts: how many of this writer's own published pieces are
  // currently in the site-wide top 10 by the same trending formula used
  // on the homepage — a real, relative measure, not a made-up number.
  const siteWideScored = (allPublishedSiteWide ?? [])
    .map((a) => ({ id: a.id, score: computeTrendingScore(a as any) }))
    .sort((a, b) => b.score - a.score);
  const trendingThresholdIds = new Set(siteWideScored.slice(0, 10).map((a) => a.id));
  const trendingPostsCount = (articles ?? []).filter((a) => trendingThresholdIds.has(a.id)).length;

  const articleIds = articles?.map((a) => a.id) ?? [];
  const { data: recentComments } =
    articleIds.length > 0
      ? await supabase
          .from("comments")
          .select("id, content, created_at, article:articles(title, slug), author:profiles!comments_author_id_fkey(full_name)")
          .in("article_id", articleIds)
          .eq("is_deleted", false)
          .order("created_at", { ascending: false })
          .limit(5)
      : { data: [] };

  return (
    <div>
      <h1 className="font-display text-3xl font-semibold mb-8">Overview</h1>

      {counts.published === 0 && (
        <div className="border border-denim/30 bg-denim/5 rounded-2xl p-6 mb-8 flex items-center justify-between flex-wrap gap-4">
          <div>
            <p className="font-display text-lg font-semibold">Your first article could inspire thousands of readers.</p>
            <p className="text-sm text-ink-muted mt-1">Articles publish immediately — no waiting on review.</p>
          </div>
          <Link href="/dashboard/articles/new" className="text-sm font-medium px-5 py-2.5 rounded-full bg-ink text-paper whitespace-nowrap">
            Write your first article
          </Link>
        </div>
      )}

      <h2 className="font-display text-xl font-semibold mb-4">Your Performance</h2>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
        <Stat label="Published" value={counts.published} />
        <Stat label="Poetry" value={counts.poetry} />
        <Stat label="Stories" value={counts.stories} />
        <Stat label="Drafts" value={counts.draft} />
        <Stat label="Total views" value={counts.views} />
        <Stat label="Total likes" value={counts.likes} />
        <Stat label="Trending posts" value={trendingPostsCount} />
        <Stat label="Awaiting admin review" value={counts.pending} />
      </div>

      <h2 className="font-display text-xl font-semibold mb-4">Recent comments</h2>
      {recentComments && recentComments.length > 0 ? (
        <ul className="flex flex-col gap-3">
          {recentComments.map((c: any) => (
            <li key={c.id} className="border border-line rounded-lg p-4 text-sm">
              <p className="text-ink-muted text-xs mb-1">
                {c.author?.full_name} on <span className="text-ink">{c.article?.title}</span>
              </p>
              <p>{c.content}</p>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-ink-muted">No comments yet.</p>
      )}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="border border-line rounded-xl p-5">
      <p className="font-mono text-3xl font-medium">{value}</p>
      <p className="text-sm text-ink-muted mt-1">{label}</p>
    </div>
  );
}
