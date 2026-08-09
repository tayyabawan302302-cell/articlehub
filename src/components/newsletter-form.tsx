"use client";

import { useState } from "react";
import { subscribeToNewsletter } from "@/app/newsletter-actions";

export default function NewsletterForm({ large = false }: { large?: boolean }) {
  const [status, setStatus] = useState<"idle" | "sent" | "error">("idle");

  async function handleSubmit(formData: FormData) {
    const res = await subscribeToNewsletter(formData);
    setStatus(res?.error ? "error" : "sent");
  }

  if (status === "sent") {
    return <p className={large ? "text-teal font-medium" : "text-sm text-teal"}>Subscribed — thanks!</p>;
  }

  if (large) {
    return (
      <form action={handleSubmit} className="flex gap-2">
        <input
          type="email"
          name="email"
          required
          placeholder="you@email.com"
          className="input flex-1 py-3 text-base"
        />
        <button className="px-6 py-3 rounded-full bg-ink text-paper font-medium font-medium hover:bg-ink/85 transition-colors whitespace-nowrap">
          Subscribe
        </button>
      </form>
    );
  }

  return (
    <form action={handleSubmit} className="flex gap-2">
      <input
        type="email"
        name="email"
        required
        placeholder="you@email.com"
        className="input text-sm py-1.5"
      />
      <button className="text-xs px-3 py-1.5 rounded-full bg-ink text-paper font-medium whitespace-nowrap">
        Subscribe
      </button>
    </form>
  );
}
