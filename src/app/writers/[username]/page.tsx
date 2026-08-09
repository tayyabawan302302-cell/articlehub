import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Image from "next/image";
import { createClient } from "@/lib/supabase/server";
import { ArticleCard } from "@/components/article-card";
import { FollowButton } from "@/components/follow-button";
import { computeTrendingScore, rankWritersByEngagement } from "@/lib/trending";

type Props = { params: Promise<{ username: string }> };

async function getWriter(username: string) {
  const supabase = await createClient();
  const { data } = await supabase.from("profiles").select("*").eq("username", username).single();
  return data;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { username } = await params;
  const writer = await getWriter(username);
  if (!writer) return {};
  return { title: writer.full_name, description: writer.bio ?? undefined };
}

export default async function WriterProfilePage({ params }: Props) {
  const { username } = await params;
  const writer = await getWriter(username);
  if (!writer) notFound();

  const supabase = await createClient();
  const [
    { data: articles },
    { count: followerCount },
    { count: followingCount },
    { data: allPublishedSiteWide },
  ] = await Promise.all([
    supabase
      .from("articles")
      .select("id, title, slug, subtitle, featured_image_url, published_at, reading_time_minutes, view_count, like_count, content_type, magazine_issue_id")
      .eq("author_id", writer.id)
      .eq("status", "published")
      .order("published_at", { ascending: false }),
    supabase.from("follows").select("*", { count: "exact", head: true }).eq("following_id", writer.id),
    supabase.from("follows").select("*", { count: "exact", head: true }).eq("follower_id", writer.id),
    // Used only to compute this writer's real, relative standing —
    // trending / top-writer / most-viewed badges are all derived from
    // real data, not static or fake.
    supabase.from("articles").select("id, author_id, view_count, like_count, comment_count, published_at").eq("status", "published"),
  ]);

  const stats = {
    articles: articles?.filter((a) => a.content_type === "article" || !a.content_type).length ?? 0,
    poetry: articles?.filter((a) => a.content_type === "poetry").length ?? 0,
    stories: articles?.filter((a) => a.content_type === "story").length ?? 0,
    other: articles?.filter((a) => a.content_type && !["article", "poetry", "story"].includes(a.content_type)).length ?? 0,
    total: articles?.length ?? 0,
    views: articles?.reduce((sum, a) => sum + (a.view_count ?? 0), 0) ?? 0,
    likes: articles?.reduce((sum, a) => sum + (a.like_count ?? 0), 0) ?? 0,
    followers: followerCount ?? 0,
    following: followingCount ?? 0,
    magazineSelections: articles?.filter((a) => a.magazine_issue_id).length ?? 0,
  };

  // Real, DB-backed achievement badges — nothing here is static or fake.
  const siteWideScored = (allPublishedSiteWide ?? [])
    .map((a) => ({ id: a.id, authorId: a.author_id, score: computeTrendingScore(a as any) }))
    .sort((a, b) => b.score - a.score);
  const trendingIds = new Set(siteWideScored.slice(0, 10).map((a) => a.id));
  const trendingPostsCount = (articles ?? []).filter((a) => trendingIds.has(a.id)).length;

  const engagementRanking = rankWritersByEngagement((allPublishedSiteWide ?? []) as any);
  const writerRank = engagementRanking.findIndex((w) => w.authorId === writer.id);
  const isTopWriter = writerRank >= 0 && writerRank < 5;
  const viewsRanking = [...engagementRanking].sort((a, b) => b.views - a.views);
  const isMostViewedWriter = viewsRanking.length > 0 && viewsRanking[0].authorId === writer.id;

  const achievements = [
    writer.is_verified && { icon: "✓", label: "Verified Writer" },
    writer.is_featured && { icon: "✨", label: "Featured Writer" },
    trendingPostsCount > 0 && { icon: "🔥", label: "Trending Writer" },
    isTopWriter && { icon: "🏆", label: "Top Writer" },
    isMostViewedWriter && { icon: "👑", label: "Most Viewed Writer" },
    stats.magazineSelections > 0 && { icon: "📖", label: "Magazine Contributor" },
  ].filter(Boolean) as { icon: string; label: string }[];

  const socials = [
    { label: "Website", href: writer.website },
    { label: "LinkedIn", href: writer.linkedin_url },
    { label: "X", href: writer.x_url },
    { label: "Instagram", href: writer.instagram_url },
  ].filter((s) => s.href);

  return (
    <div className="mx-auto max-w-4xl px-6 py-14">
      {writer.cover_url ? (
        <div className="relative w-full h-48 rounded-2xl overflow-hidden mb-[-3rem]">
          <Image src={writer.cover_url} alt="" fill className="object-cover" />
        </div>
      ) : (
        <div className="w-full h-32 rounded-2xl bg-gradient-to-r from-denim/10 to-teal/10 mb-[-3rem]" />
      )}

      <div className="flex items-end gap-4 mb-6 justify-between flex-wrap">
        <div className="flex items-end gap-4">
          {writer.avatar_url ? (
            <Image src={writer.avatar_url} alt={writer.full_name} width={88} height={88} className="rounded-full border-4 border-paper object-cover w-22 h-22" />
          ) : (
            <div className="w-20 h-20 rounded-full border-4 border-paper bg-denim/10 flex items-center justify-center font-display text-2xl text-denim">
              {writer.full_name?.[0]}
            </div>
          )}
          <div>
            <h1 className="font-display text-2xl font-semibold flex items-center gap-2">
              {writer.full_name}
              {writer.is_verified && (
                <span className="text-xs px-2 py-0.5 rounded-full bg-denim/15 text-denim-dark font-medium">Verified</span>
              )}
              {writer.is_featured && (
                <span className="text-xs px-2 py-0.5 rounded-full bg-teal/10 text-teal font-medium">Featured writer</span>
              )}
            </h1>
            <p className="byline mt-1">
              <span>@{writer.username}</span>
              {writer.occupation && (
                <>
                  <span className="byline-rule" />
                  <span>{writer.occupation}</span>
                </>
              )}
            </p>
          </div>
        </div>
        <FollowButton writerId={writer.id} writerUsername={writer.username} />
      </div>

      {writer.bio && <p className="text-ink-muted max-w-lg mb-6 leading-relaxed">{writer.bio}</p>}

      {writer.skills && writer.skills.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-6">
          {writer.skills.map((s: string) => (
            <span key={s} className="text-xs px-3 py-1 rounded-full bg-denim/15 text-denim-dark">{s}</span>
          ))}
        </div>
      )}

      {socials.length > 0 && (
        <div className="flex gap-4 text-sm mb-8">
          {socials.map((s) => (
            <a key={s.label} href={s.href!} target="_blank" rel="noreferrer" className="text-denim">
              {s.label}
            </a>
          ))}
        </div>
      )}

      {achievements.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-6">
          {achievements.map((a) => (
            <span key={a.label} className="text-xs px-3 py-1.5 rounded-full bg-black/[0.03] border border-line flex items-center gap-1.5">
              <span>{a.icon}</span>
              <span>{a.label}</span>
            </span>
          ))}
        </div>
      )}

      <div className="flex gap-8 mb-12 py-5 border-y border-line flex-wrap">
        <Stat label="Articles" value={stats.articles} />
        <Stat label="Poetry" value={stats.poetry} />
        <Stat label="Stories" value={stats.stories} />
        <Stat label="Total views" value={stats.views} />
        <Stat label="Total likes" value={stats.likes} />
        <Stat label="Trending posts" value={trendingPostsCount} />
        <Stat label="Magazine selections" value={stats.magazineSelections} />
        <Stat label="Followers" value={stats.followers} />
        <Stat label="Following" value={stats.following} />
      </div>

      <h2 className="font-display text-xl font-semibold mb-6">Published Work</h2>
      {articles && articles.length > 0 ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {articles.map((a) => (
            <ArticleCard
              key={a.id}
              article={{ ...a, author: { full_name: writer.full_name, username: writer.username, is_verified: writer.is_verified } }}
            />
          ))}
        </div>
      ) : (
        <p className="text-sm text-ink-muted">No published articles yet.</p>
      )}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <p className="font-mono text-2xl font-medium">{value.toLocaleString()}</p>
      <p className="text-xs text-ink-muted mt-0.5">{label}</p>
    </div>
  );
}
