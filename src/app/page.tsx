import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { FeaturedArticleCard, ArticleCard } from "@/components/article-card";
import Image from "next/image";
import NewsletterForm from "@/components/newsletter-form";
import { computeTrendingScore, rankWritersByEngagement } from "@/lib/trending";
import {
  Cpu, Sparkles, Code2, Briefcase, TrendingUp, GraduationCap, FlaskConical,
  HeartPulse, Landmark, Plane, UtensilsCrossed, Trophy, Palette, BookOpen,
  Feather, PenLine, Microscope, ShieldCheck, UserCircle2, Rocket,
} from "lucide-react";

const CATEGORY_ICONS: Record<string, any> = {
  technology: Cpu, "artificial intelligence": Sparkles, ai: Sparkles, programming: Code2,
  "cyber security": ShieldCheck, business: Briefcase, finance: TrendingUp, marketing: Rocket,
  entrepreneurship: Rocket, education: GraduationCap, science: FlaskConical, medicine: HeartPulse,
  health: HeartPulse, history: Landmark, politics: Landmark, travel: Plane, food: UtensilsCrossed,
  sports: Trophy, culture: Palette, lifestyle: Sparkles, religion: BookOpen, research: Microscope,
  poetry: Feather, "short stories": PenLine, opinion: UserCircle2, "personal essays": UserCircle2,
  career: Briefcase, productivity: Rocket, "writing tips": PenLine, psychology: HeartPulse,
  "self improvement": Sparkles,
};

function iconFor(name: string) {
  const Icon = CATEGORY_ICONS[name.toLowerCase()] ?? BookOpen;
  return Icon;
}

export default async function HomePage() {
  const supabase = await createClient();

  const [{ data: recent }, { data: categories }, { data: featuredWriters }, { data: allPublishedForCounts }, { data: latestIssue }, { data: allForTopWriters }] = await Promise.all([
    supabase
      .from("articles")
      .select(
        "id, title, slug, subtitle, featured_image_url, published_at, created_at, reading_time_minutes, view_count, like_count, comment_count, is_featured, status, content_type, category:categories(name, slug), author:profiles!articles_author_id_fkey(full_name, username, is_verified)"
      )
      .in("status", ["approved", "published"])
      .order("created_at", { ascending: false })
      .limit(40),
    supabase.from("categories").select("id, name, slug, description").order("sort_order").limit(12),
    supabase
      .from("profiles")
      .select("id, full_name, username, avatar_url, occupation, is_verified, bio")
      .eq("is_featured", true)
      .limit(4),
    supabase.from("articles").select("category_id").eq("status", "published"),
    supabase
      .from("magazine_issues")
      .select("id, issue_number, title, theme, cover_image_url, published_at")
      .eq("is_published", true)
      .order("issue_number", { ascending: false })
      .limit(1)
      .maybeSingle(),
    // Lightweight aggregate query — no content, just enough to rank writers
    // by real engagement. Not limited to recent articles, so an author's
    // full body of work counts, not just their latest few pieces.
    supabase
      .from("articles")
      .select("author_id, view_count, like_count, author:profiles!articles_author_id_fkey(full_name, username, avatar_url, is_verified)")
      .eq("status", "published"),
  ]);

  // Effective-date sort: published_at when set, otherwise created_at, so
  // approved-but-not-yet-formally-published pieces still slot in by recency.
  const all = [...(recent ?? [])].sort((a, b) => {
    const dateA = new Date(a.published_at ?? a.created_at).getTime();
    const dateB = new Date(b.published_at ?? b.created_at).getTime();
    return dateB - dateA;
  });

  const featuredStory = all.find((a) => a.is_featured) ?? all[0];
  const editorsPicks = all.filter((a) => a.is_featured && a.id !== featuredStory?.id).slice(0, 3);
  const rest = all.filter((a) => a.id !== featuredStory?.id && !editorsPicks.some((p) => p.id === a.id));
  const trending = [...all].sort((a, b) => computeTrendingScore(b as any) - computeTrendingScore(a as any)).slice(0, 5);

  const poetryCategory = categories?.find((c) => c.slug === "poetry" || c.name.toLowerCase() === "poetry");
  const poetryArticles = all.filter((a) => a.content_type === "poetry").slice(0, 3);
  const storyArticles = all.filter((a) => a.content_type === "story").slice(0, 3);

  // Top Writers — real engagement (views + likes), summed across every
  // published piece a writer has, not just their most recent.
  const authorLookup = new Map<string, any>();
  (allForTopWriters ?? []).forEach((a: any) => {
    if (a.author_id && a.author) authorLookup.set(a.author_id, a.author);
  });
  const topWriters = rankWritersByEngagement(allForTopWriters ?? [])
    .filter((w) => authorLookup.has(w.authorId))
    .slice(0, 5)
    .map((w) => ({ author: authorLookup.get(w.authorId), views: w.views, likes: w.likes }));

  const categoryCounts = new Map<string, number>();
  (allPublishedForCounts ?? []).forEach((a) => {
    if (a.category_id) categoryCounts.set(a.category_id, (categoryCounts.get(a.category_id) ?? 0) + 1);
  });

  return (
    <div>
      {/* Hero */}
      <section className="mx-auto max-w-6xl px-6 pt-16 pb-10">
        <p className="byline mb-4">
          <span>ISSUE №{new Date().getFullYear()}</span>
          <span className="byline-rule" />
          <span>{new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}</span>
        </p>
        <h1 className="font-display text-5xl md:text-6xl font-semibold leading-[1.05] max-w-3xl">
          Share ideas. Publish original stories.
          <br />
          <em className="not-italic text-denim">Build your reputation.</em>
        </h1>
        <p className="mt-5 text-lg text-ink-muted max-w-xl leading-relaxed">
          A modern publishing platform for writers, journalists, students, researchers,
          professionals, and storytellers — across business, technology, medicine, education,
          poetry, lifestyle, history, research, opinion, and creative writing.
        </p>
        <div className="flex flex-wrap gap-3 mt-8">
          <Link href="/dashboard/articles/new" className="text-sm font-medium px-5 py-2.5 rounded-full bg-ink text-paper hover:bg-ink/85 transition-colors">
            Start Writing
          </Link>
          <Link href="#latest" className="text-sm font-medium px-5 py-2.5 rounded-full border border-line hover:border-ink transition-colors">
            Explore Articles
          </Link>
          <Link href="/register" className="text-sm font-medium px-5 py-2.5 rounded-full border border-line hover:border-ink transition-colors">
            Become a Writer
          </Link>
        </div>
      </section>

      {/* Featured story */}
      {featuredStory && (
        <section className="mx-auto max-w-6xl px-6 py-10 border-y border-line">
          <FeaturedArticleCard article={featuredStory as any} />
        </section>
      )}

      {/* Editor&apos;s Picks */}
      {editorsPicks.length > 0 && (
        <section className="mx-auto max-w-6xl px-6 py-12 border-b border-line">
          <p className="byline mb-2"><span>Curated by the editorial team</span></p>
          <h2 className="font-display text-2xl font-semibold mb-6">Editor&apos;s Picks</h2>
          <div className="grid sm:grid-cols-3 gap-6">
            {editorsPicks.map((a) => (
              <ArticleCard key={a.id} article={a as any} />
            ))}
          </div>
        </section>
      )}

      {/* What can you publish */}
      {categories && categories.length > 0 && (
        <section className="mx-auto max-w-6xl px-6 py-14 border-b border-line">
          <h2 className="font-display text-2xl font-semibold mb-2">What can you publish?</h2>
          <p className="text-ink-muted mb-8 max-w-lg">
            From deep technical writing to poetry — every category below is a real, active
            space on ArticleHub.
          </p>
          <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4">
            {categories.map((c) => {
              const Icon = iconFor(c.name);
              const count = categoryCounts.get(c.id) ?? 0;
              return (
                <Link
                  key={c.id}
                  href={`/categories/${c.slug}`}
                  className="flex items-start gap-3 p-4 rounded-xl border border-line bg-surface hover:border-denim hover:shadow-sm transition-all"
                >
                  <div className="w-10 h-10 rounded-full bg-denim/15 flex items-center justify-center flex-shrink-0">
                    <Icon size={18} className="text-denim-dark" />
                  </div>
                  <div>
                    <p className="font-medium text-sm">{c.name}</p>
                    {c.description && <p className="text-xs text-ink-muted mt-0.5 line-clamp-2">{c.description}</p>}
                    <p className="text-xs text-ink-muted mt-1">{count} {count === 1 ? "article" : "articles"}</p>
                  </div>
                </Link>
              );
            })}
          </div>
        </section>
      )}

      <div className="mx-auto max-w-6xl px-6 grid lg:grid-cols-3 gap-12 py-12">
        {/* Latest */}
        <section id="latest" className="lg:col-span-2">
          <h2 className="font-display text-2xl font-semibold mb-6">Latest</h2>
          {rest.length > 0 ? (
            <div className="grid sm:grid-cols-2 gap-6">
              {rest.slice(0, 6).map((a) => (
                <ArticleCard key={a.id} article={a as any} />
              ))}
            </div>
          ) : (
            <EmptyState />
          )}
        </section>

        {/* Trending */}
        <aside>
          <h2 className="font-display text-2xl font-semibold mb-6">Trending</h2>
          {trending.length > 0 ? (
            <ol className="flex flex-col gap-5">
              {trending.map((a, i) => (
                <li key={a.id} className="flex gap-3">
                  <span className="font-mono text-ink-muted text-sm pt-0.5">{String(i + 1).padStart(2, "0")}</span>
                  <div>
                    <Link href={`/articles/${a.slug}`} className="font-medium leading-snug hover:text-denim transition-colors">
                      {a.title}
                    </Link>
                    <p className="byline mt-1">
                      <span>{(a.author as any)?.full_name}</span>
                      <span className="byline-rule" />
                      <span>{a.view_count} views</span>
                    </p>
                  </div>
                </li>
              ))}
            </ol>
          ) : (
            <p className="text-sm text-ink-muted">Nothing trending yet.</p>
          )}

          {/* Featured writers */}
          {featuredWriters && featuredWriters.length > 0 && (
            <div className="mt-12">
              <h2 className="font-display text-xl font-semibold mb-5">Featured writers</h2>
              <div className="flex flex-col gap-4">
                {featuredWriters.map((w) => (
                  <Link key={w.id} href={`/writers/${w.username}`} className="flex items-center gap-3 group">
                    {w.avatar_url ? (
                      <Image src={w.avatar_url} alt={w.full_name} width={40} height={40} className="rounded-full object-cover w-10 h-10" />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-denim/10 flex items-center justify-center font-display text-denim text-sm">
                        {w.full_name?.[0]}
                      </div>
                    )}
                    <div>
                      <p className="text-sm font-medium group-hover:text-denim transition-colors">{w.full_name}</p>
                      {w.occupation && <p className="text-xs text-ink-muted">{w.occupation}</p>}
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </aside>
      </div>

      {/* Poetry */}
      {poetryArticles.length > 0 && (
        <section className="border-y border-line bg-surface">
          <div className="mx-auto max-w-6xl px-6 py-14">
            <p className="byline mb-2"><span>A quieter corner</span></p>
            <h2 className="font-display text-3xl font-semibold mb-8">Poetry</h2>
            <div className="grid sm:grid-cols-3 gap-8">
              {poetryArticles.map((a) => (
                <Link key={a.id} href={`/articles/${a.slug}`} className="group">
                  <h3 className="font-display text-xl italic leading-snug group-hover:text-denim-dark transition-colors">
                    {a.title}
                  </h3>
                  <p className="byline mt-2"><span>{(a.author as any)?.full_name}</span></p>
                </Link>
              ))}
            </div>
            {poetryCategory && (
              <Link href={`/categories/${poetryCategory.slug}`} className="text-sm text-denim-dark mt-8 inline-block">
                More poetry →
              </Link>
            )}
          </div>
        </section>
      )}

      {/* Stories */}
      {storyArticles.length > 0 && (
        <section className="mx-auto max-w-6xl px-6 py-14 border-b border-line">
          <p className="byline mb-2"><span>Fiction & narrative</span></p>
          <h2 className="font-display text-2xl font-semibold mb-8">Stories</h2>
          <div className="grid sm:grid-cols-3 gap-6">
            {storyArticles.map((a) => (
              <ArticleCard key={a.id} article={a as any} />
            ))}
          </div>
        </section>
      )}

      {/* Top Writers */}
      {topWriters.length > 0 && (
        <section className="mx-auto max-w-6xl px-6 py-14 border-b border-line">
          <h2 className="font-display text-2xl font-semibold mb-8">Top Writers</h2>
          <div className="grid sm:grid-cols-2 md:grid-cols-5 gap-6">
            {topWriters.map(({ author, views, likes }) => (
              <Link key={author.username} href={`/writers/${author.username}`} className="text-center group">
                {author.avatar_url ? (
                  <Image src={author.avatar_url} alt={author.full_name} width={64} height={64} className="rounded-full object-cover w-16 h-16 mx-auto mb-3" />
                ) : (
                  <div className="w-16 h-16 rounded-full bg-denim/15 flex items-center justify-center font-display text-xl text-denim-dark mx-auto mb-3">
                    {author.full_name?.[0]}
                  </div>
                )}
                <p className="text-sm font-medium group-hover:text-denim-dark transition-colors flex items-center justify-center gap-1">
                  {author.full_name}
                  {author.is_verified && <span className="text-denim-dark text-xs">✓</span>}
                </p>
                <p className="text-xs text-ink-muted mt-0.5">{views.toLocaleString()} views · {likes} likes</p>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Magazine */}
      {latestIssue && (
        <section className="border-y border-line bg-ink text-paper">
          <div className="mx-auto max-w-6xl px-6 py-16 text-center">
            <p className="text-xs tracking-[0.3em] text-denim-dark uppercase mb-4">📖 ArticleHub Magazine</p>
            <p className="text-sm text-paper/60 mb-2">The latest issue</p>
            <h2 className="font-display text-3xl md:text-4xl font-semibold mb-2">{latestIssue.title}</h2>
            <p className="text-sm text-paper/60 mb-8">
              Issue {String(latestIssue.issue_number).padStart(2, "0")}
              {latestIssue.published_at && ` · ${new Date(latestIssue.published_at).toLocaleDateString("en-US", { month: "long", year: "numeric" })}`}
            </p>
            <div className="flex gap-3 justify-center flex-wrap">
              <Link href={`/magazine/${latestIssue.issue_number}`} className="text-sm font-medium px-5 py-2.5 rounded-full bg-denim text-ink font-medium hover:bg-denim-light transition-colors">
                Read Issue
              </Link>
              <Link href="/magazine" className="text-sm font-medium px-5 py-2.5 rounded-full border border-paper/30 hover:border-paper transition-colors">
                View Magazine Archive
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* How it works */}
      <section className="mx-auto max-w-6xl px-6 py-16">
        <h2 className="font-display text-2xl font-semibold mb-10 text-center">How it works</h2>
        <div className="grid sm:grid-cols-3 lg:grid-cols-6 gap-6 text-center">
          {[
            "Create an account",
            "Complete your profile",
            "Write an article",
            "Publish",
            "Readers like & comment",
            "Trending articles appear on the homepage",
          ].map((step, i) => (
            <div key={step}>
              <div className="w-9 h-9 rounded-full bg-ink text-paper flex items-center justify-center mx-auto font-mono text-sm mb-3">
                {i + 1}
              </div>
              <p className="text-sm text-ink-muted leading-snug">{step}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Newsletter */}
      <section className="border-t border-line">
        <div className="mx-auto max-w-6xl px-6 py-16 text-center">
          <h2 className="font-display text-3xl font-semibold mb-3">Stay in the loop</h2>
          <p className="text-ink-muted max-w-md mx-auto mb-8">
            One email, whenever there&apos;s something worth reading. No noise.
          </p>
          <div className="max-w-sm mx-auto">
            <NewsletterForm large />
          </div>
        </div>
      </section>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="border border-dashed border-line rounded-lg p-10 text-center">
      <p className="font-display text-lg">No articles published yet.</p>
      <p className="text-sm text-ink-muted mt-1">
        Once a writer publishes, it&apos;ll show up here automatically — nothing to configure.
      </p>
    </div>
  );
}
