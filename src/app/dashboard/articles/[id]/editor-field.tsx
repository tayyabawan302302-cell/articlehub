"use client";

import { useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { RichEditor } from "@/components/editor/rich-editor";
import { CoverImagePicker } from "@/components/cover-image-picker";
import { CONTENT_TYPES, POETRY_TYPES } from "@/lib/content-types";
import type { JSONContent } from "@tiptap/react";

function estimateReadingTime(html: string) {
  const words = html
    .replace(/<[^>]+>/g, " ")
    .split(/\s+/)
    .filter(Boolean).length;

  return Math.max(1, Math.round(words / 200));
}

export function RichEditorField({
  article,
}: {
  article: any;
}) {
  const supabase = createClient();

  const [title, setTitle] = useState(article.title ?? "");
  const [subtitle, setSubtitle] = useState(article.subtitle ?? "");
  const [categoryId, setCategoryId] = useState(
    article.category_id ?? ""
  );

  const [contentType, setContentType] = useState<string>(
    article.content_type ?? "article"
  );

  const [poetryType, setPoetryType] = useState<string>(
    article.poetry_type ?? ""
  );

  const [categories, setCategories] = useState<
    { id: string; name: string }[]
  >([]);

  const [coverUrl, setCoverUrl] = useState<string | null>(
    article.featured_image_url ?? null
  );

  const [content, setContent] = useState<JSONContent | null>(
    article.content ?? null
  );

  const [contentHtml, setContentHtml] = useState(
    article.content_html ?? ""
  );

  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(
    null
  );

  const isFirstRun = useRef(true);

  useEffect(() => {
    supabase
      .from("categories")
      .select("id, name")
      .order("sort_order")
      .then(({ data }) => {
        setCategories(data ?? []);
      });
  }, [supabase]);

  useEffect(() => {
    if (isFirstRun.current) {
      isFirstRun.current = false;
      return;
    }

    if (saveTimer.current) {
      clearTimeout(saveTimer.current);
    }

    saveTimer.current = setTimeout(async () => {
      setSaving(true);
      setSaveError(null);

      const { error } = await supabase
        .from("articles")
        .update({
          title,
          subtitle,
          category_id: categoryId || null,
          content_type: contentType,
          poetry_type: contentType === "poetry" ? (poetryType || null) : null,
          featured_image_url: coverUrl,
          content: content ?? {},
          content_html: contentHtml,
          reading_time_minutes:
            estimateReadingTime(contentHtml),
        })
        .eq("id", article.id)
        .eq("author_id", article.author_id);

      if (error) {
        setSaveError(error.message);
      }

      setSaving(false);
    }, 1500);

    return () => {
      if (saveTimer.current) {
        clearTimeout(saveTimer.current);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    title,
    subtitle,
    contentHtml,
    categoryId,
    coverUrl,
    contentType,
    poetryType,
  ]);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="font-display text-xl font-semibold">
          Edit your article
        </h2>

        <span className="text-xs text-ink-muted">
          {saving ? "Saving…" : "Saved"}
        </span>
      </div>

      {saveError && (
        <div className="border border-red-200 bg-red-50 text-red-700 rounded-lg p-3 mb-5 text-sm">
          {saveError}
        </div>
      )}

      {/* Cover image */}
      <div className="mb-6">
        <CoverImagePicker
          currentUrl={coverUrl}
          onChange={setCoverUrl}
        />
      </div>

      {/* Content type + Poetry type + Category */}
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

          {categories.map((category) => (
            <option key={category.id} value={category.id}>
              {category.name}
            </option>
          ))}
        </select>
      </div>

      {/* Title */}
      <input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Title"
        className="w-full font-display text-3xl font-medium outline-none mb-3 bg-transparent"
      />

      {/* Subtitle */}
      <input
        value={subtitle}
        onChange={(e) => setSubtitle(e.target.value)}
        placeholder="Subtitle (optional)"
        className="w-full text-lg text-ink-muted outline-none placeholder:text-ink-muted/50 mb-6 bg-transparent"
      />

      {/* Editor */}
      <RichEditor
        content={content}
        onChange={(json, html) => {
          setContent(json);
          setContentHtml(html);
        }}
      />
    </div>
  );
}