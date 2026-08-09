import type { MetadataRoute } from "next";
import { createClient } from "@/lib/supabase/server";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const supabase = await createClient();
  const base = process.env.NEXT_PUBLIC_SITE_URL ?? "https://articlehub.com";

  const [{ data: articles }, { data: categories }] = await Promise.all([
    supabase.from("articles").select("slug, updated_at").eq("status", "published"),
    supabase.from("categories").select("slug"),
  ]);

  return [
    { url: base, changeFrequency: "daily", priority: 1 },
    ...(categories ?? []).map((c) => ({
      url: `${base}/categories/${c.slug}`,
      changeFrequency: "daily" as const,
      priority: 0.7,
    })),
    ...(articles ?? []).map((a) => ({
      url: `${base}/articles/${a.slug}`,
      lastModified: a.updated_at,
      changeFrequency: "weekly" as const,
      priority: 0.9,
    })),
  ];
}
