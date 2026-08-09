import { createClient } from "@/lib/supabase/server";

export default async function AdminNewsletterPage() {
  const supabase = await createClient();
  const { data: subs } = await supabase
    .from("newsletter_subscribers")
    .select("email, is_confirmed, subscribed_at")
    .order("subscribed_at", { ascending: false });

  const csv = ["email,confirmed,subscribed_at", ...(subs ?? []).map((s) => `${s.email},${s.is_confirmed},${s.subscribed_at}`)].join("\n");
  const csvHref = `data:text/csv;charset=utf-8,${encodeURIComponent(csv)}`;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-display text-3xl font-semibold">Newsletter</h1>
        <a href={csvHref} download="subscribers.csv" className="text-sm px-4 py-2 rounded-full bg-ink text-paper font-medium">
          Export CSV
        </a>
      </div>

      {subs && subs.length > 0 ? (
        <table className="w-full text-sm">
          <thead className="text-left text-ink-muted border-b border-line">
            <tr>
              <th className="py-2 font-medium">Email</th>
              <th className="py-2 font-medium">Confirmed</th>
              <th className="py-2 font-medium">Subscribed</th>
            </tr>
          </thead>
          <tbody>
            {subs.map((s) => (
              <tr key={s.email} className="border-b border-line/60">
                <td className="py-3">{s.email}</td>
                <td className="py-3">{s.is_confirmed ? "Yes" : "No"}</td>
                <td className="py-3 text-ink-muted">{new Date(s.subscribed_at).toLocaleDateString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <p className="text-sm text-ink-muted">No subscribers yet.</p>
      )}
    </div>
  );
}
