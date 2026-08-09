"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { RichEditor } from "@/components/editor/rich-editor";
import { CoverImagePicker } from "@/components/cover-image-picker";
import { CONTENT_TYPES, POETRY_TYPES } from "@/lib/content-types";
import type { JSONContent } from "@tiptap/react";

function slugify(title: string) {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .slice(0, 80);
}

function plainText(html: string) {
  return html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}

function estimateReadingTime(html: string) {
  const words = plainText(html).split(" ").filter(Boolean).length;
  return Math.max(1, Math.round(words / 200));
}

export default function NewArticlePage() {
  const supabase = createClient();
  const router = useRouter();

  const [title, setTitle] = useState("");
  const [subtitle, setSubtitle] = useState("");
  const [categoryId, setCategoryId] = useState<string>("");
  const [contentType, setContentType] = useState<string>("article");
  const [poetryType, setPoetryType] = useState<string>("");
  const [categories, setCategories] = useState<{ id: string; name: string }[]>([]);
  const [coverUrl, setCoverUrl] = useState<string | null>(null);
  const [content, setContent] = useState<JSONContent | null>(null);
  const [contentHtml, setContentHtml] = useState("");
  const [articleId, setArticleId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmOriginal, setConfirmOriginal] = useState(false);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const words = plainText(contentHtml).split(" ").filter(Boolean).length;
  const characters = plainText(contentHtml).length;
  const readingTime = estimateReadingTime(contentHtml);

  useEffect(() => {
    supabase
      .from("categories")
      .select("id, name")
      .order("sort_order")
      .then(({ data }) => setCategories(data ?? []));
  }, [supabase]);

  async function saveDraft() {
    setSaving(true);
    setError(null);

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    const payload = {
      author_id: user.id,
      title: title || "Untitled",
      subtitle,
      category_id: categoryId || null,
      content_type: contentType,
      poetry_type: contentType === "poetry" ? (poetryType || null) : null,
      featured_image_url: coverUrl,
      slug: `${slugify(title || "untitled")}-${Date.now().toString(36)}`,
      content: content ?? {},
      content_html: contentHtml,
      reading_time_minutes: estimateReadingTime(contentHtml),
      status: "draft" as const,
    };

    if (articleId) {
      const { error } = await supabase
        .from("articles")
        .update({
          title: payload.title,
          subtitle: payload.subtitle,
          category_id: payload.category_id,
          content_type: payload.content_type,
          poetry_type: payload.poetry_type,
          featured_image_url: payload.featured_image_url,
          content: payload.content,
          content_html: payload.content_html,
          reading_time_minutes: payload.reading_time_minutes,
        })
        .eq("id", articleId);
      if (error) setError(error.message);
    } else {
      const { data, error } = await supabase.from("articles").insert(payload).select("id").single();
      if (error) setError(error.message);
      if (data) setArticleId(data.id);
    }
    setSaving(false);
  }

  // Autosave, debounced 1.5s after the last change.
  useEffect(() => {
    if (!title && !contentHtml) return;
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(saveDraft, 1500);
    return () => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [title, subtitle, contentHtml, categoryId, coverUrl, contentType, poetryType]);

  async function handlePublish() {
    if (!articleId) {
      setError("Start writing first — a draft needs to be saved before it can be published.");
      return;
    }
    if (!title.trim()) {
      setError("Give your article a title before publishing.");
      return;
    }
    if (!confirmOriginal) {
      setError("Please confirm this is original work before publishing.");
      return;
    }
    setPublishing(true);
    // Articles publish immediately — no mandatory editorial approval step.
    // The guard on which transitions are allowed lives in a DB trigger
    // (handle_article_status_change) — if you see "Only staff can change
    // status from draft to published" here, it means that trigger update
    // (migration 0006) hasn't been applied to your database yet.
    const { error } = await supabase
      .from("articles")
      .update({ status: "published", originality_confirmed: true })
      .eq("id", articleId);
    setPublishing(false);
    if (error) {
      setError(error.message);
      return;
    }
    router.push("/dashboard/articles");
  }

  // Keyboard shortcuts: Ctrl/Cmd+S saves now, Ctrl/Cmd+Enter publishes.
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      const mod = e.metaKey || e.ctrlKey;
      if (mod && e.key === "s") {
        e.preventDefault();
        if (saveTimer.current) clearTimeout(saveTimer.current);
        saveDraft();
      }
      if (mod && e.key === "Enter") {
        e.preventDefault();
        handlePublish();
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [articleId, title, confirmOriginal]);

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <h1 className="font-display text-3xl font-semibold">New article</h1>
        <div className="flex items-center gap-3">
          <StatusPill saving={saving} hasArticle={!!articleId} />
          <button
            onClick={handlePublish}
            disabled={publishing}
            className="text-sm font-medium px-4 py-2 rounded-full bg-ink text-paper hover:bg-ink/85 disabled:opacity-50"
            title="Ctrl/Cmd + Enter"
          >
            {publishing ? "Publishing…" : "Publish"}
          </button>
        </div>
      </div>

      <p className="text-xs text-ink-muted mb-6">
        {words} words · {characters} characters · {readingTime} min read ·
        <span className="ml-1">Ctrl/Cmd+S to save now, Ctrl/Cmd+Enter to publish</span>
      </p>

      {error && <p className="text-sm text-red-600 mb-4">{error}</p>}

      <CoverImagePicker currentUrl={coverUrl} onChange={setCoverUrl} />

      <div className="flex flex-wrap gap-2 mb-4">
        <select
          value={contentType}
          onChange={(e) => {
            setContentType(e.target.value);
            if (e.target.value !== "poetry") setPoetryType("");
          }}
          className="input text-sm w-auto"
        >
          {CONTENT_TYPES.map((t) => (
            <option key={t.value} value={t.value}>{t.label}</option>
          ))}
        </select>

        {contentType === "poetry" && (
          <select
            value={poetryType}
            onChange={(e) => setPoetryType(e.target.value)}
            className="input text-sm w-auto"
          >
            <option value="">Poetry type…</option>
            {POETRY_TYPES.map((p) => (
              <option key={p.value} value={p.value}>{p.label}</option>
            ))}
          </select>
        )}

        <select
          value={categoryId}
          onChange={(e) => setCategoryId(e.target.value)}
          className="input text-sm w-auto"
        >
          <option value="">No category</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
      </div>

      <input
        placeholder="Title"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        className="w-full font-display text-3xl font-medium outline-none placeholder:text-ink-muted/50 mb-3 bg-transparent"
      />
      <input
        placeholder="Subtitle (optional)"
        value={subtitle}
        onChange={(e) => setSubtitle(e.target.value)}
        className="w-full text-lg text-ink-muted outline-none placeholder:text-ink-muted/50 mb-6 bg-transparent"
      />

      <RichEditor
        content={content}
        onChange={(json, html) => {
          setContent(json);
          setContentHtml(html);
        }}
      />

      <div className="mt-8 pt-6 border-t border-line">
        <label className="flex items-start gap-2 text-sm">
          <input
            type="checkbox"
            checked={confirmOriginal}
            onChange={(e) => setConfirmOriginal(e.target.checked)}
            className="mt-0.5"
          />
          <span>
            I confirm this work is original. If AI was used, it is disclosed. If another
            person&apos;s work is quoted, proper credit is given. Plagiarism is prohibited — if
            confirmed, content will be removed, and three confirmed violations permanently
            suspend the account.
          </span>
        </label>
      </div>
    </div>
  );
}

function StatusPill({ saving, hasArticle }: { saving: boolean; hasArticle: boolean }) {
  if (saving) return <span className="text-xs px-2 py-1 rounded-full bg-amber-500/10 text-amber-700">Saving…</span>;
  if (hasArticle) return <span className="text-xs px-2 py-1 rounded-full bg-black/5 text-ink-muted">Draft saved</span>;
  return <span className="text-xs text-ink-muted">Not saved yet</span>;
}
