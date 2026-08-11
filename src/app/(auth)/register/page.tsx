"use client";

import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

export default function RegisterPage() {
  const supabase = createClient();

  const [fullName, setFullName] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (loading) return;

    setLoading(true);
    setError(null);

    const cleanFullName = fullName.trim();
    const cleanUsername = username.trim().toLowerCase();
    const cleanEmail = email.trim().toLowerCase();

    if (!cleanFullName) {
      setError("Please enter your full name.");
      setLoading(false);
      return;
    }

    if (cleanUsername.length < 3 || cleanUsername.length > 30) {
      setError("Username must be between 3 and 30 characters.");
      setLoading(false);
      return;
    }

    if (!/^[a-z0-9_-]+$/.test(cleanUsername)) {
      setError(
        "Username can only contain lowercase letters, numbers, hyphens (-), and underscores (_)."
      );
      setLoading(false);
      return;
    }

    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      setLoading(false);
      return;
    }

    try {
      const { error: signUpError } = await supabase.auth.signUp({
        email: cleanEmail,
        password,
        options: {
          data: {
            full_name: cleanFullName,
            username: cleanUsername,
          },
        },
      });

      if (signUpError) {
        setError(signUpError.message);
        setLoading(false);
        return;
      }

      setLoading(false);
      setSent(true);
    } catch (err) {
      console.error("Signup error:", err);

      setError(
        err instanceof Error
          ? err.message
          : "Something went wrong while creating your account."
      );

      setLoading(false);
    }
  }

  if (sent) {
    return (
      <div className="mx-auto max-w-sm px-6 py-20 text-center">
        <h1 className="font-display text-2xl font-semibold mb-3">
          Check your email
        </h1>

        <p className="text-ink-muted text-sm">
          We sent a verification link to{" "}
          <span className="font-medium">{email}</span>. Please check your inbox
          and spam folder. Once your email is verified, an admin will review
          your writer application before you can publish.
        </p>

        <Link
          href="/login"
          className="inline-block mt-6 text-denim font-medium text-sm"
        >
          Go to login
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-sm px-6 py-20">
      <h1 className="font-display text-3xl font-semibold mb-8">
        Become a writer
      </h1>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <Field label="Full name">
          <input
            type="text"
            required
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            className="input"
            autoComplete="name"
            placeholder="Your full name"
          />
        </Field>

        <Field label="Username">
          <input
            type="text"
            required
            minLength={3}
            maxLength={30}
            value={username}
            onChange={(e) => setUsername(e.target.value.toLowerCase())}
            className="input"
            autoComplete="username"
            placeholder="your_username"
            spellCheck={false}
          />

          <span className="text-xs text-ink-muted">
            3–30 characters. Use lowercase letters, numbers, - or _.
          </span>
        </Field>

        <Field label="Email">
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="input"
            autoComplete="email"
            placeholder="you@example.com"
          />
        </Field>

        <Field label="Password">
          <input
            type="password"
            required
            minLength={8}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="input"
            autoComplete="new-password"
            placeholder="Minimum 8 characters"
          />

          <span className="text-xs text-ink-muted">
            Minimum 8 characters.
          </span>
        </Field>

        {error && (
          <div
            className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600"
            role="alert"
          >
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="mt-2 rounded-full bg-ink text-paper font-medium py-2.5 hover:bg-ink/85 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? "Creating account…" : "Create account"}
        </button>
      </form>

      <p className="text-sm text-ink-muted mt-6">
        Already have an account?{" "}
        <Link href="/login" className="text-denim font-medium">
          Log in
        </Link>
      </p>
    </div>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="flex flex-col gap-1.5 text-sm">
      <span className="font-medium">{label}</span>
      {children}
    </label>
  );
}
