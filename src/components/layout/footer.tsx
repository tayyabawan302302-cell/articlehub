type Settings = {
  site_name?: string | null;
  footer_text?: string | null;
  facebook_url?: string | null;
  linkedin_url?: string | null;
  x_url?: string | null;
  instagram_url?: string | null;
} | null;

import NewsletterForm from "@/components/newsletter-form";

export default function Footer({ settings }: { settings: Settings }) {
  const links = [
    { label: "Facebook", href: settings?.facebook_url },
    { label: "LinkedIn", href: settings?.linkedin_url },
    { label: "X", href: settings?.x_url },
    { label: "Instagram", href: settings?.instagram_url },
  ].filter((l) => l.href);

  return (
    <footer className="border-t border-line mt-24">
      <div className="mx-auto max-w-6xl px-6 py-10 flex flex-col md:flex-row items-center justify-between gap-4">
        <p className="byline">
          <span>© {new Date().getFullYear()} {settings?.site_name ?? "ArticleHub"}</span>
          <span className="byline-rule" />
          <span>{settings?.footer_text ?? "Published on ArticleHub"}</span>
        </p>
        <NewsletterForm />
        <div className="flex gap-4 text-sm text-ink-muted">
          {links.map((l) => (
            <a key={l.label} href={l.href!} target="_blank" rel="noreferrer" className="hover:text-ink">
              {l.label}
            </a>
          ))}
        </div>
      </div>
    </footer>
  );
}
