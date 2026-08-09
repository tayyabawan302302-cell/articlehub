"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { markWelcomeSeen } from "@/lib/actions/welcome";

export function WelcomeModal({ fullName }: { fullName: string }) {
  const [visible, setVisible] = useState(true);
  const [dismissing, setDismissing] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setDismissing(true), 6000);
    return () => clearTimeout(timer);
  }, []);

  function dismiss() {
    setDismissing(true);
    markWelcomeSeen();
    setTimeout(() => setVisible(false), 300);
  }

  if (!visible) return null;

  const confettiPieces = Array.from({ length: 24 });

  return (
    <div
      className={`fixed inset-0 z-[100] flex items-center justify-center bg-ink/40 backdrop-blur-sm transition-opacity duration-300 ${
        dismissing ? "opacity-0" : "opacity-100"
      }`}
    >
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {confettiPieces.map((_, i) => (
          <span
            key={i}
            className="absolute w-2 h-2 rounded-full"
            style={{
              left: `${(i * 41) % 100}%`,
              top: "-5%",
              backgroundColor: i % 3 === 0 ? "#C9A86A" : i % 3 === 1 ? "#EAE4D8" : "#111827",
              animation: `confetti-fall ${3 + (i % 4)}s ease-in ${i * 0.08}s infinite`,
            }}
          />
        ))}
      </div>

      <div
        className={`relative bg-surface rounded-2xl shadow-2xl max-w-md w-full mx-6 p-8 text-center transition-all duration-300 ${
          dismissing ? "scale-95 opacity-0" : "scale-100 opacity-100"
        }`}
      >
        <p className="text-3xl mb-3">🎉</p>
        <h2 className="font-display text-2xl font-semibold mb-2">Welcome, {fullName}!</h2>
        <p className="text-ink-muted leading-relaxed mb-1">Welcome to ArticleHub.</p>
        <p className="text-ink-muted leading-relaxed mb-6">
          We&apos;re excited to have you in our community.
          <br />
          Share your ideas. Tell your stories. Inspire readers around the world.
        </p>
        <div className="flex flex-col gap-2">
          <Link
            href="/dashboard/articles/new"
            onClick={dismiss}
            className="text-sm font-medium px-5 py-2.5 rounded-full bg-ink text-paper hover:bg-ink/85 transition-colors"
          >
            Start Writing
          </Link>
          <Link
            href="/"
            onClick={dismiss}
            className="text-sm font-medium px-5 py-2.5 rounded-full border border-line hover:border-ink transition-colors"
          >
            Explore Articles
          </Link>
          <Link
            href="/dashboard/profile"
            onClick={dismiss}
            className="text-sm font-medium px-5 py-2.5 rounded-full border border-line hover:border-ink transition-colors"
          >
            Complete Profile
          </Link>
          <button onClick={dismiss} className="text-xs text-ink-muted mt-2">
            Skip
          </button>
        </div>
      </div>

      <style jsx global>{`
        @keyframes confetti-fall {
          0% {
            transform: translateY(0) rotate(0deg);
            opacity: 1;
          }
          100% {
            transform: translateY(110vh) rotate(360deg);
            opacity: 0;
          }
        }
      `}</style>
    </div>
  );
}
