import type { Metadata } from "next";
import { Playfair_Display, Inter, IBM_Plex_Mono } from "next/font/google";
import "./globals.css";
import { createClient } from "@/lib/supabase/server";
import Navbar from "@/components/layout/navbar";
import Footer from "@/components/layout/footer";

const display = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-display",
  weight: ["500", "600", "700", "900"],
});

const body = Inter({
  subsets: ["latin"],
  variable: "--font-body",
});

const mono = IBM_Plex_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  weight: ["400", "500"],
});

// Metadata is generated from the real site_settings row — editable from
// Admin > Settings, never hardcoded.
export async function generateMetadata(): Promise<Metadata> {
  const supabase = await createClient();

  const { data: settings } = await supabase
    .from("site_settings")
    .select("*")
    .eq("id", 1)
    .single();

  const siteName = settings?.site_name ?? "ArticleHub";
  const description = settings?.description ?? "";

  return {
    title: {
      default: siteName,
      template: `%s · ${siteName}`,
    },

    description,

    icons: settings?.favicon_url
      ? [{ url: settings.favicon_url }]
      : undefined,

    openGraph: {
      title: siteName,
      description,
      siteName,
      type: "website",
    },

    twitter: {
      card: "summary_large_image",
      title: siteName,
      description,
    },

    verification: settings?.google_search_console_code
      ? {
          google: settings.google_search_console_code,
        }
      : undefined,
  };
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();

  const { data: settings } = await supabase
    .from("site_settings")
    .select("*")
    .eq("id", 1)
    .single();

  const { data: navItems } = await supabase
    .from("nav_items")
    .select("*")
    .eq("is_visible", true)
    .order("sort_order");

  const siteUrl =
    process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

  const organizationJsonLd = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: settings?.site_name ?? "ArticleHub",
    url: siteUrl,
    logo: settings?.logo_url ?? undefined,
    sameAs: [
      settings?.facebook_url,
      settings?.linkedin_url,
      settings?.x_url,
      settings?.instagram_url,
    ].filter(Boolean),
  };

  // Theme Color from Site Settings
  const isValidHex =
    settings?.theme_color &&
    /^#[0-9A-Fa-f]{6}$/.test(settings.theme_color);

  const accentColor = isValidHex ? settings!.theme_color : null;

  return (
    <html
      lang="en"
      className={`${display.variable} ${body.variable} ${mono.variable}`}
    >
      <head>
        {/* Google AdSense */}
        <script
          async
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-4962220545836842"
          crossOrigin="anonymous"
        />
      </head>

      <body>
        {accentColor && (
          <style
            dangerouslySetInnerHTML={{
              __html: `:root { --color-accent: ${accentColor}; }`,
            }}
          />
        )}

        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(organizationJsonLd),
          }}
        />

        {settings?.google_analytics_id && (
          <script
            async
            src={`https://www.googletagmanager.com/gtag/js?id=${settings.google_analytics_id}`}
          />
        )}

        <Navbar
          siteName={settings?.site_name ?? "ArticleHub"}
          navItems={navItems ?? []}
        />

        <main className="min-h-screen">
          {children}
        </main>

        <Footer settings={settings} />
      </body>
    </html>
  );
}
