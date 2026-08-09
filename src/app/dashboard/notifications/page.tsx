import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { markNotificationRead, markAllNotificationsRead } from "@/lib/actions/notifications";

export default async function NotificationsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: notifications } = await supabase
    .from("notifications")
    .select("*")
    .eq("recipient_id", user.id)
    .order("created_at", { ascending: false });

  const hasUnread = notifications?.some((n) => !n.is_read);

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h1 className="font-display text-3xl font-semibold">Notifications</h1>
        {hasUnread && (
          <form action={async () => { "use server"; await markAllNotificationsRead(user.id); }}>
            <button className="text-xs text-denim-dark">Mark all read</button>
          </form>
        )}
      </div>
      {notifications && notifications.length > 0 ? (
        <ul className="flex flex-col gap-3">
          {notifications.map((n) => (
            <li
              key={n.id}
              className={`border rounded-lg p-4 ${n.is_read ? "border-line/60" : "border-denim bg-denim/5"}`}
            >
              <div className="flex items-center justify-between">
                <p className="font-medium text-sm">{n.title}</p>
                {!n.is_read && (
                  <form action={async () => { "use server"; await markNotificationRead(n.id); }}>
                    <button className="text-xs text-denim-dark">Mark read</button>
                  </form>
                )}
              </div>
              {n.body && <p className="text-sm text-ink-muted mt-1">{n.body}</p>}
              <p className="text-xs text-ink-muted mt-2">{new Date(n.created_at).toLocaleString()}</p>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-ink-muted">Nothing here yet.</p>
      )}
    </div>
  );
}
