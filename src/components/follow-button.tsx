"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { followWriter, unfollowWriter } from "@/lib/actions/follows";

export function FollowButton({ writerId, writerUsername }: { writerId: string; writerUsername: string }) {
  const supabase = createClient();
  const router = useRouter();
  const [following, setFollowing] = useState(false);
  const [isSelf, setIsSelf] = useState(false);
  const [loading, setLoading] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let active = true;
    (async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!active) return;
      if (user?.id === writerId) {
        setIsSelf(true);
        setReady(true);
        return;
      }
      if (user) {
        const { data } = await supabase
          .from("follows")
          .select("follower_id")
          .eq("follower_id", user.id)
          .eq("following_id", writerId)
          .maybeSingle();
        if (active) setFollowing(!!data);
      }
      setReady(true);
    })();
    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [writerId]);

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

    if (following) {
      await unfollowWriter(writerId, writerUsername);
      setFollowing(false);
    } else {
      await followWriter(writerId, writerUsername);
      setFollowing(true);
    }
    router.refresh();
    setLoading(false);
  }

  if (isSelf || !ready) return null;

  return (
    <button
      onClick={toggle}
      disabled={loading}
      className={`text-sm px-5 py-2 rounded-full font-medium transition-colors ${
        following ? "border border-line text-ink hover:border-red-300 hover:text-red-600" : "bg-ink text-paper hover:bg-ink/85"
      }`}
    >
      {following ? "Following" : "Follow"}
    </button>
  );
}
