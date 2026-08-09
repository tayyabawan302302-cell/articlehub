import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

function escapeXml(str: string) {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

export async function GET() {
  const supabase = await createClient();
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

  const { data: settings } = await supabase.from("site_settings").select("site_name, description").eq("id", 1).single();
  const { data: articles } = await supabase
    .from("articles")
    .select("title, slug, subtitle, published_at, author:profiles!articles_author_id_fkey(full_name)")
    .eq("status", "published")
    .order("published_at", { ascending: false })
    .limit(50);

  const siteName = settings?.site_name ?? "ArticleHub";
  const items = (articles ?? [])
    .map((a) => {
      const author = a.author as any;
      return `
    <item>
      <title>${escapeXml(a.title)}</title>
      <link>${siteUrl}/articles/${a.slug}</link>
      <guid>${siteUrl}/articles/${a.slug}</guid>
      ${a.subtitle ? `<description>${escapeXml(a.subtitle)}</description>` : ""}
      ${author?.full_name ? `<author>${escapeXml(author.full_name)}</author>` : ""}
      ${a.published_at ? `<pubDate>${new Date(a.published_at).toUTCString()}</pubDate>` : ""}
    </item>`;
    })
    .join("");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>${escapeXml(siteName)}</title>
    <link>${siteUrl}</link>
    <description>${escapeXml(settings?.description ?? "")}</description>${items}
  </channel>
</rss>`;

  return new Response(xml, {
    headers: { "Content-Type": "application/rss+xml; charset=utf-8" },
  });
}
