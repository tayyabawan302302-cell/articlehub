export type TrendingInput = {
  view_count: number;
  like_count: number;
  comment_count: number;
  published_at: string | null;
};

/**
 * Trending = engagement, time-decayed — not raw view count. An old piece
 * with thousands of historical views shouldn't outrank something readers
 * are actually engaging with right now. Kept intentionally simple for the
 * MVP; revisit with a proper decay curve or materialized scores if the
 * article count grows large enough that computing this per-request stops
 * being cheap.
 */
export function computeTrendingScore(a: TrendingInput): number {
  const ageHours = a.published_at ? (Date.now() - new Date(a.published_at).getTime()) / 36e5 : 0;
  return (a.view_count * 1.0 + a.like_count * 3.0 + a.comment_count * 5.0) / Math.pow(ageHours / 1 + 2, 1.5);
}

/**
 * Aggregates published articles by author into per-writer view/like totals,
 * sorted by a blended score (views + likes weighted 3x). Shared between the
 * homepage's Top Writers section and writer profile achievement badges, so
 * "top writer" means the same thing in both places.
 */
export function rankWritersByEngagement(
  articles: { author_id: string; view_count: number; like_count: number }[]
) {
  const totals = new Map<string, { views: number; likes: number }>();
  articles.forEach((a) => {
    if (!a.author_id) return;
    const existing = totals.get(a.author_id) ?? { views: 0, likes: 0 };
    existing.views += a.view_count ?? 0;
    existing.likes += a.like_count ?? 0;
    totals.set(a.author_id, existing);
  });
  return [...totals.entries()]
    .map(([authorId, t]) => ({ authorId, ...t }))
    .sort((a, b) => (b.views + b.likes * 3) - (a.views + a.likes * 3));
}
