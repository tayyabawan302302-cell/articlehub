import { createClient } from "@/lib/supabase/server";
import { replyToMessage } from "./actions";

export default async function AdminMessagesPage() {
  const supabase = await createClient();
  const { data: messages } = await supabase
    .from("contact_messages")
    .select("*")
    .order("created_at", { ascending: false });

  return (
    <div>
      <h1 className="font-display text-3xl font-semibold mb-6">Contact messages</h1>

      {messages && messages.length > 0 ? (
        <ul className="flex flex-col gap-6">
          {messages.map((m) => (
            <li key={m.id} className="border border-line rounded-lg p-5">
              <div className="flex items-center justify-between mb-2">
                <p className="font-medium text-sm">{m.name} <span className="text-ink-muted">&lt;{m.email}&gt;</span></p>
                <span className="text-xs text-ink-muted">{new Date(m.created_at).toLocaleDateString()}</span>
              </div>
              {m.subject && <p className="text-sm font-medium mb-1">{m.subject}</p>}
              <p className="text-sm text-ink-muted mb-3">{m.message}</p>

              {m.is_replied ? (
                <p className="text-xs bg-teal/10 text-teal rounded p-2">Replied: {m.admin_reply}</p>
              ) : (
                <form
                  action={async (formData: FormData) => {
                    "use server";
                    await replyToMessage(m.id, formData.get("reply") as string);
                  }}
                  className="flex gap-2"
                >
                  <input name="reply" required placeholder="Write a reply…" className="input flex-1 text-sm" />
                  <button className="text-xs px-3 py-1.5 rounded-full bg-ink text-paper font-medium">Send</button>
                </form>
              )}
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-ink-muted">No messages yet.</p>
      )}
    </div>
  );
}
