import Link from "next/link";

const sections = [
  { href: "/admin", label: "Dashboard" },
  { href: "/admin/users", label: "Users & Writers" },
  { href: "/admin/articles", label: "Articles" },
  { href: "/admin/magazine", label: "Magazine" },
  { href: "/admin/categories", label: "Categories & Tags" },
  { href: "/admin/comments", label: "Comments" },
  { href: "/admin/media", label: "Media Library" },
  { href: "/admin/pages", label: "Pages" },
  { href: "/admin/ads", label: "Advertisements" },
  { href: "/admin/newsletter", label: "Newsletter" },
  { href: "/admin/messages", label: "Contact Messages" },
  { href: "/admin/navigation", label: "Navigation" },
  { href: "/admin/settings", label: "Site Settings" },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto max-w-7xl px-6 py-10 grid md:grid-cols-[220px_1fr] gap-10">
      <aside className="flex md:flex-col gap-1 overflow-x-auto">
        {sections.map((s) => (
          <Link key={s.href} href={s.href} className="text-sm px-3 py-2 rounded-lg hover:bg-black/5 whitespace-nowrap">
            {s.label}
          </Link>
        ))}
      </aside>
      <div>{children}</div>
    </div>
  );
}
