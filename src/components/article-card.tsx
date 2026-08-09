import Image from "next/image";
import Link from "next/link";

type CardArticle = {
  id: string;
  title: string;
  slug: string;
  subtitle?: string | null;
  featured_image_url?: string | null;
  published_at?: string | null;
  reading_time_minutes?: number | null;
  author?: { full_name: string; username: string; is_verified?: boolean } | null;
  category?: { name: string; slug: string } | null;
};

function formatDate(d?: string | null) {
  if (!d) return null;
  return new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export function ArticleCard({ article }: { article: CardArticle }) {
  return (
    <Link
      href={`/articles/${article.slug}`}
      className="group flex flex-col rounded-2xl border border-line bg-surface overflow-hidden transition-all duration-300 hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] hover:-translate-y-0.5 hover:border-denim/40"
    >
      <div className="relative aspect-[16/10] w-full overflow-hidden bg-black/5">
        {article.featured_image_url ? (
          <Image
            src={article.featured_image_url}
            alt={article.title}
            fill
            sizes="(max-width: 768px) 100vw, 33vw"
            className="object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-ink-muted/40 font-display text-4xl">
            §
          </div>
        )}
        {article.category && (
          <span className="absolute top-3 left-3 text-[11px] font-medium px-2.5 py-1 rounded-full bg-white/90 backdrop-blur text-ink shadow-sm">
            {article.category.name}
          </span>
        )}
      </div>

      <div className="flex flex-col gap-2 p-5">
        <h3 className="font-display text-lg font-semibold leading-snug group-hover:text-denim transition-colors line-clamp-2">
          {article.title}
        </h3>
        {article.subtitle && (
          <p className="text-sm text-ink-muted line-clamp-2 leading-relaxed">{article.subtitle}</p>
        )}
        <p className="byline mt-1">
          <span className="flex items-center gap-1">
            {article.author?.full_name}
            {article.author?.is_verified && <VerifiedDot />}
          </span>
          {formatDate(article.published_at) && (
            <>
              <span className="byline-rule" />
              <span>{formatDate(article.published_at)}</span>
            </>
          )}
          {article.reading_time_minutes && (
            <>
              <span className="byline-rule" />
              <span>{article.reading_time_minutes} min</span>
            </>
          )}
        </p>
      </div>
    </Link>
  );
}

/** Large, wide hero card for the homepage's single featured story. */
export function FeaturedArticleCard({ article }: { article: CardArticle }) {
  return (
    <Link href={`/articles/${article.slug}`} className="group grid md:grid-cols-2 gap-8 items-center">
      <div className="relative aspect-[16/10] w-full overflow-hidden rounded-2xl bg-black/5">
        {article.featured_image_url ? (
          <Image
            src={article.featured_image_url}
            alt={article.title}
            fill
            priority
            sizes="(max-width: 768px) 100vw, 50vw"
            className="object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-ink-muted/40 font-display text-6xl">§</div>
        )}
      </div>
      <div>
        {article.category && (
          <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-denim/15 text-denim-dark">
            {article.category.name}
          </span>
        )}
        <h2 className="font-display text-3xl md:text-4xl font-semibold leading-[1.1] mt-4 group-hover:text-denim transition-colors">
          {article.title}
        </h2>
        {article.subtitle && <p className="text-lg text-ink-muted mt-3 leading-relaxed">{article.subtitle}</p>}
        <p className="byline mt-5">
          <span className="flex items-center gap-1">
            {article.author?.full_name}
            {article.author?.is_verified && <VerifiedDot />}
          </span>
          {formatDate(article.published_at) && (
            <>
              <span className="byline-rule" />
              <span>{formatDate(article.published_at)}</span>
            </>
          )}
          {article.reading_time_minutes && (
            <>
              <span className="byline-rule" />
              <span>{article.reading_time_minutes} min read</span>
            </>
          )}
        </p>
      </div>
    </Link>
  );
}

function VerifiedDot() {
  return (
    <svg width="13" height="13" viewBox="0 0 20 20" fill="none" className="text-denim">
      <path
        d="M10 1l2.1 1.6 2.6-.4 1.1 2.4 2.4 1.1-.4 2.6L19.4 10l-1.6 2.1.4 2.6-2.4 1.1-1.1 2.4-2.6-.4L10 19.4l-2.1-1.6-2.6.4-1.1-2.4-2.4-1.1.4-2.6L.6 10l1.6-2.1-.4-2.6 2.4-1.1L5.3 1.2l2.6.4L10 1z"
        fill="currentColor"
      />
      <path d="M6.5 10l2.3 2.3 4.7-4.7" stroke="white" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
