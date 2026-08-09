"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { likeArticle, unlikeArticle } from "@/lib/actions/likes";

export function LikeButton({ articleId, slug, initialCount }: { articleId: string; slug: string; initialCount: number }) {
  const supabase = createClient();
  const router = useRouter();
  const [liked, setLiked] = useState(false);
  const [count, setCount] = useState(initialCount);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let active = true;
    (async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user || !active) return;
      const { data } = await supabase
        .from("likes")
        .select("user_id")
        .eq("article_id", articleId)
        .eq("user_id", user.id)
        .maybeSingle();
      if (active) setLiked(!!data);
    })();
    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [articleId]);

  async function toggle() {
    if (loading) return;
    setLoading(true);

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      router.push("/login");
      setLoading(false);
      return;
    }

    // Routed through server actions (not a raw client insert/delete) so the
    // "someone liked your article" notification can be fired safely
    // server-side, in one place, instead of duplicated in every caller.
    if (liked) {
      await unlikeArticle(articleId, slug);
      setLiked(false);
      setCount((c) => Math.max(0, c - 1));
    } else {
      await likeArticle(articleId, slug);
      setLiked(true);
      setCount((c) => c + 1);
    }
    setLoading(false);
  }

  return (
    <button
      onClick={toggle}
      disabled={loading}
      className={`flex items-center gap-2 text-sm px-4 py-2 rounded-full border transition-colors ${
        liked ? "border-denim bg-denim/15 text-denim-dark" : "border-line hover:border-ink"
      }`}
    >
      <HeartIcon filled={liked} />
      <span>{count}</span>
    </button>
  );
}

function HeartIcon({ filled }: { filled: boolean }) {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill={filled ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2">
      <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.6l-1-1a5.5 5.5 0 0 0-7.8 7.8l1 1L12 21.2l7.8-7.8 1-1a5.5 5.5 0 0 0 0-7.8z" />
    </svg>
  );
}
