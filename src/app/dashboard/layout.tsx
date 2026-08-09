import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

const writerLinks = [
  { href: "/dashboard", label: "Overview" },
  { href: "/dashboard/articles", label: "My articles" },
  { href: "/dashboard/articles/new", label: "New article" },
  { href: "/dashboard/profile", label: "Profile" },
  { href: "/dashboard/notifications", label: "Notifications" },
];

const visitorLinks = [
  { href: "/dashboard/apply", label: "Apply to write" },
  { href: "/dashboard/profile", label: "Profile" },
  { href: "/dashboard/notifications", label: "Notifications" },
];

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  let isWriter = false;

  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role, full_name")
      .eq("id", user.id)
      .single();

    isWriter = !!profile && profile.role !== "visitor";
  }

  const links = isWriter ? writerLinks : visitorLinks;

  return (
    <div className="mx-auto max-w-6xl px-6 py-10 grid md:grid-cols-[200px_1fr] gap-10">
      <aside className="flex md:flex-col gap-1 overflow-x-auto">
        {links.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className="text-sm px-3 py-2 rounded-lg hover:bg-black/5 whitespace-nowrap"
          >
            {link.label}
          </Link>
        ))}
      </aside>

      <div>{children}</div>
    </div>
  );
}