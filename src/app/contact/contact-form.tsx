"use client";

import { useState } from "react";
import { submitContactForm } from "@/app/admin/messages/actions";

export default function ContactForm() {
  const [status, setStatus] = useState<"idle" | "sent" | "error">("idle");

  async function handleSubmit(formData: FormData) {
    const res = await submitContactForm(formData);
    setStatus(res?.error ? "error" : "sent");
  }

  if (status === "sent") {
    return (
      <div className="text-center py-10">
        <h2 className="font-display text-2xl font-semibold mb-2">Message sent</h2>
        <p className="text-sm text-ink-muted">We&apos;ll get back to you soon.</p>
      </div>
    );
  }

  return (
    <form action={handleSubmit} className="flex flex-col gap-4">
      <input name="name" required placeholder="Name" className="input" />
      <input name="email" type="email" required placeholder="Email" className="input" />
      <input name="subject" placeholder="Subject" className="input" />
      <textarea name="message" required placeholder="Message" rows={5} className="input" />
      {status === "error" && <p className="text-sm text-red-600">Something went wrong — try again.</p>}
      <button className="self-start text-sm px-5 py-2.5 rounded-full bg-ink text-paper font-medium">Send message</button>
    </form>
  );
}
