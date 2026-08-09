import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { NotificationBell } from "@/components/notification-bell";
import { MobileMenu } from "@/components/mobile-menu";

type NavItem = { id: string; label: string; href: string };

export default async function Navbar({
  siteName,
  navItems,
}: {
  siteName: string;
  navItems: NavItem[];
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <header className="border-b border-line bg-paper/90 backdrop-blur sticky top-0 z-40 relative">
      <div className="mx-auto max-w-6xl px-6 h-16 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <MobileMenu navItems={navItems} isLoggedIn={!!user} />
          <Link href="/" className="font-display text-xl font-semibold tracking-tight">
            {siteName}
          </Link>
        </div>

        <nav className="hidden md:flex items-center gap-6 font-body text-sm text-ink-muted">
          {navItems.map((item) => (
            <Link key={item.id} href={item.href} className="hover:text-ink transition-colors">
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          {user && <NotificationBell userId={user.id} />}
          {user ? (
            <Link
              href="/dashboard"
              className="hidden sm:inline-block text-sm font-medium px-4 py-2 rounded-full bg-ink text-paper hover:bg-ink/85 transition-colors"
            >
              Dashboard
            </Link>
          ) : (
            <>
              <Link href="/login" className="hidden sm:inline-block text-sm font-medium text-ink hover:text-denim-dark">
                Log in
              </Link>
              <Link
                href="/register"
                className="hidden sm:inline-block text-sm font-medium px-4 py-2 rounded-full bg-ink text-paper hover:bg-ink/85 transition-colors"
              >
                Start writing
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
