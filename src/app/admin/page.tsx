import { createClient } from "@/lib/supabase/server";

export default async function AdminDashboard() {
  const supabase = await createClient();

  const [{ count: totalUsers }, { count: totalWriters }, { data: statusRows }, { data: recentWriters }] =
    await Promise.all([
      supabase.from("profiles").select("*", { count: "exact", head: true }),
      supabase.from("profiles").select("*", { count: "exact", head: true }).eq("role", "writer"),
      supabase.from("articles").select("status"),
      supabase
        .from("profiles")
        .select("id, full_name, username, created_at")
        .eq("role", "writer")
        .order("created_at", { ascending: false })
        .limit(5),
    ]);

  const byStatus = (status: string) => statusRows?.filter((r) => r.status === status).length ?? 0;

  return (
    <div>
      <h1 className="font-display text-3xl font-semibold mb-8">Dashboard</h1>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
        <Stat label="Total users" value={totalUsers ?? 0} />
        <Stat label="Writers" value={totalWriters ?? 0} />
        <Stat label="Published" value={byStatus("published")} />
        <Stat label="Approved (queued)" value={byStatus("approved")} />
        <Stat label="Pending review" value={byStatus("pending")} />
        <Stat label="Drafts" value={byStatus("draft")} />
        <Stat label="Rejected" value={byStatus("rejected")} />
        <Stat label="Archived" value={byStatus("archived")} />
        <Stat label="Total articles" value={statusRows?.length ?? 0} />
      </div>

      <h2 className="font-display text-xl font-semibold mb-4">Newest writers</h2>
      {recentWriters && recentWriters.length > 0 ? (
        <ul className="flex flex-col gap-2 text-sm">
          {recentWriters.map((w) => (
            <li key={w.id} className="flex justify-between border-b border-line/60 py-2">
              <span>{w.full_name} <span className="text-ink-muted">@{w.username}</span></span>
              <span className="text-ink-muted">{new Date(w.created_at).toLocaleDateString()}</span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-ink-muted">No writers yet.</p>
      )}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="border border-line rounded-xl p-5">
      <p className="font-mono text-3xl font-medium">{value}</p>
      <p className="text-sm text-ink-muted mt-1">{label}</p>
    </div>
  );
}
