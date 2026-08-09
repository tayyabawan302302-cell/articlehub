"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export function BookmarkButton({ articleId }: { articleId: string }) {
  const supabase = createClient();
  const router = useRouter();
  const [bookmarked, setBookmarked] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let active = true;
    (async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user || !active) return;
      const { data } = await supabase
        .from("bookmarks")
        .select("user_id")
        .eq("article_id", articleId)
        .eq("user_id", user.id)
        .maybeSingle();
      if (active) setBookmarked(!!data);
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

    if (bookmarked) {
      await supabase.from("bookmarks").delete().eq("article_id", articleId).eq("user_id", user.id);
      setBookmarked(false);
    } else {
      await supabase.from("bookmarks").insert({ article_id: articleId, user_id: user.id });
      setBookmarked(true);
    }
    setLoading(false);
  }

  return (
    <button
      onClick={toggle}
      disabled={loading}
      className={`flex items-center gap-2 text-sm px-4 py-2 rounded-full border transition-colors ${
        bookmarked ? "border-denim bg-denim/15 text-denim-dark" : "border-line hover:border-ink"
      }`}
    >
      <BookmarkIcon filled={bookmarked} />
      {bookmarked ? "Saved" : "Save"}
    </button>
  );
}

function BookmarkIcon({ filled }: { filled: boolean }) {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill={filled ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2">
      <path d="M6 3h12a1 1 0 0 1 1 1v17l-7-4-7 4V4a1 1 0 0 1 1-1z" />
    </svg>
  );
}
