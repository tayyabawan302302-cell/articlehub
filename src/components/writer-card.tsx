import Link from "next/link";
import Image from "next/image";
import { createClient } from "@/lib/supabase/server";
import { FollowButton } from "@/components/follow-button";

export async function WriterCard({
  author,
}: {
  author: {
    id: string;
    full_name: string;
    username: string;
    avatar_url?: string | null;
    bio?: string | null;
    occupation?: string | null;
    is_verified?: boolean;
    website?: string | null;
    x_url?: string | null;
    linkedin_url?: string | null;
  };
}) {
  const supabase = await createClient();
  const { count: followerCount } = await supabase
    .from("follows")
    .select("*", { count: "exact", head: true })
    .eq("following_id", author.id);

  const socials = [
    { label: "Website", href: author.website },
    { label: "X", href: author.x_url },
    { label: "LinkedIn", href: author.linkedin_url },
  ].filter((s) => s.href);

  return (
    <div className="border border-line rounded-2xl p-6 bg-surface">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <Link href={`/writers/${author.username}`} className="flex items-center gap-3 group">
          {author.avatar_url ? (
            <Image src={author.avatar_url} alt={author.full_name} width={56} height={56} className="rounded-full object-cover w-14 h-14" />
          ) : (
            <div className="w-14 h-14 rounded-full bg-denim/15 flex items-center justify-center font-display text-xl text-denim-dark">
              {author.full_name?.[0]}
            </div>
          )}
          <div>
            <p className="font-medium group-hover:text-denim-dark transition-colors flex items-center gap-1.5">
              {author.full_name}
              {author.is_verified && <span className="text-xs px-1.5 py-0.5 rounded-full bg-denim/15 text-denim-dark">Verified</span>}
            </p>
            <p className="byline mt-0.5">
              <span>@{author.username}</span>
              {author.occupation && (
                <>
                  <span className="byline-rule" />
                  <span>{author.occupation}</span>
                </>
              )}
              <span className="byline-rule" />
              <span>{followerCount ?? 0} followers</span>
            </p>
          </div>
        </Link>
        <FollowButton writerId={author.id} writerUsername={author.username} />
      </div>

      {author.bio && <p className="text-sm text-ink-muted mt-4 leading-relaxed">{author.bio}</p>}

      {socials.length > 0 && (
        <div className="flex gap-4 mt-4 text-xs">
          {socials.map((s) => (
            <a key={s.label} href={s.href!} target="_blank" rel="noreferrer" className="text-denim-dark">
              {s.label}
            </a>
          ))}
        </div>
      )}
    </div>
  );
}
