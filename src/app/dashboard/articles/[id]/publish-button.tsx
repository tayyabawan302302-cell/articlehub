"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { publishArticle } from "@/lib/actions/article-workflow";

export function PublishWithConfirmation({ articleId, label }: { articleId: string; label: string }) {
  const supabase = createClient();
  const [confirmed, setConfirmed] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [publishing, setPublishing] = useState(false);

  async function handlePublish() {
    if (!confirmed) {
      setError("Please confirm this is original work before publishing.");
      return;
    }
    setPublishing(true);
    await supabase.from("articles").update({ originality_confirmed: true }).eq("id", articleId);
    await publishArticle(articleId);
    setPublishing(false);
  }

  return (
    <div className="mt-6">
      <label className="flex items-start gap-2 text-sm mb-4">
        <input type="checkbox" checked={confirmed} onChange={(e) => setConfirmed(e.target.checked)} className="mt-0.5" />
        <span>
          I confirm this work is original. If AI was used, it is disclosed. If another
          person&apos;s work is quoted, proper credit is given. Plagiarism is prohibited.
        </span>
      </label>
      {error && <p className="text-xs text-red-600 mb-2">{error}</p>}
      <button
        onClick={handlePublish}
        disabled={publishing}
        className="text-sm px-5 py-2.5 rounded-full bg-ink text-paper font-medium disabled:opacity-50"
      >
        {publishing ? "Publishing…" : label}
      </button>
    </div>
  );
}
