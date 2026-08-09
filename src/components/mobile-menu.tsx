"use client";

import { useState } from "react";
import Link from "next/link";

type NavItem = { id: string; label: string; href: string };

export function MobileMenu({
  navItems,
  isLoggedIn,
}: {
  navItems: NavItem[];
  isLoggedIn: boolean;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="md:hidden">
      <button
        onClick={() => setOpen((o) => !o)}
        className="p-2 rounded-full hover:bg-black/5 transition-colors"
        aria-label={open ? "Close menu" : "Open menu"}
        aria-expanded={open}
      >
        {open ? <CloseIcon /> : <MenuIcon />}
      </button>

      {open && (
        <div className="absolute left-0 right-0 top-16 bg-surface border-b border-line shadow-lg z-50">
          <nav className="flex flex-col p-4 gap-1">
            {navItems.map((item) => (
              <Link
                key={item.id}
                href={item.href}
                onClick={() => setOpen(false)}
                className="text-sm px-3 py-2.5 rounded-lg hover:bg-black/5 transition-colors"
              >
                {item.label}
              </Link>
            ))}
            <Link
              href="/search"
              onClick={() => setOpen(false)}
              className="text-sm px-3 py-2.5 rounded-lg hover:bg-black/5 transition-colors"
            >
              Search
            </Link>
            <div className="border-t border-line my-2" />
            {isLoggedIn ? (
              <Link
                href="/dashboard"
                onClick={() => setOpen(false)}
                className="text-sm px-3 py-2.5 rounded-lg bg-ink text-paper font-medium text-center"
              >
                Dashboard
              </Link>
            ) : (
              <>
                <Link href="/login" onClick={() => setOpen(false)} className="text-sm px-3 py-2.5 rounded-lg hover:bg-black/5">
                  Log in
                </Link>
                <Link
                  href="/register"
                  onClick={() => setOpen(false)}
                  className="text-sm px-3 py-2.5 rounded-lg bg-ink text-paper font-medium text-center"
                >
                  Start writing
                </Link>
              </>
            )}
          </nav>
        </div>
      )}
    </div>
  );
}

function MenuIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
      <path d="M4 7h16M4 12h16M4 17h16" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
      <path d="M6 6l12 12M18 6L6 18" />
    </svg>
  );
}
