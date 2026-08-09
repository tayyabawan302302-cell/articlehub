import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { submitWriterApplication } from "@/lib/actions/writer-applications";

export default async function ApplyToWritePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase.from("profiles").select("role, writer_status").eq("id", user.id).single();

  if (profile?.role === "writer" || (profile?.role && profile.role !== "visitor")) {
    return (
      <div className="max-w-lg">
        <h1 className="font-display text-3xl font-semibold mb-4">You&apos;re already a writer</h1>
        <p className="text-ink-muted">Head to your dashboard to start publishing.</p>
      </div>
    );
  }

  if (profile?.writer_status === "pending") {
    const { data: application } = await supabase
      .from("writer_applications")
      .select("created_at")
      .eq("user_id", user.id)
      .eq("status", "pending")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    return (
      <div className="max-w-lg">
        <h1 className="font-display text-3xl font-semibold mb-4">Application submitted</h1>
        <p className="text-ink-muted">
          You applied on {application ? new Date(application.created_at).toLocaleDateString() : "recently"}.
          An admin will review it and you&apos;ll get a notification either way.
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-lg">
      <h1 className="font-display text-3xl font-semibold mb-2">Apply to write</h1>
      <p className="text-ink-muted mb-8">
        Tell us a bit about yourself and share something you&apos;ve written — an admin will review it.
      </p>
      <form action={submitWriterApplication} className="flex flex-col gap-4">
        <Field label="Bio" name="bio" textarea required />
        <Field label="Writing interests (comma separated)" name="writing_interests" placeholder="Technology, Culture, Essays" />
        <Field label="Portfolio URL" name="portfolio_url" />
        <Field label="Facebook" name="facebook_url" />
        <Field label="LinkedIn" name="linkedin_url" />
        <Field label="X" name="x_url" />
        <Field label="Instagram" name="instagram_url" />
        <Field label="Sample article" name="sample_article" textarea rows={8} required placeholder="Paste a piece of your writing here." />
        <button className="self-start text-sm px-5 py-2.5 rounded-full bg-ink text-paper font-medium">
          Submit application
        </button>
      </form>
    </div>
  );
}

function Field({
  label, name, textarea = false, required = false, placeholder, rows = 3,
}: { label: string; name: string; textarea?: boolean; required?: boolean; placeholder?: string; rows?: number }) {
  return (
    <label className="flex flex-col gap-1 text-sm">
      <span className="font-medium">{label}</span>
      {textarea ? (
        <textarea name={name} required={required} placeholder={placeholder} rows={rows} className="input" />
      ) : (
        <input name={name} required={required} placeholder={placeholder} className="input" />
      )}
    </label>
  );
}
