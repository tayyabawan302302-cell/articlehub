import { createClient } from "@/lib/supabase/server";
import { addNavItem, deleteNavItem, toggleNavItem } from "./actions";

export default async function AdminNavigationPage() {
  const supabase = await createClient();
  const { data: items } = await supabase.from("nav_items").select("*").order("sort_order");

  return (
    <div>
      <h1 className="font-display text-3xl font-semibold mb-6">Navigation</h1>

      <form action={addNavItem} className="flex gap-2 mb-8">
        <input name="label" required placeholder="Label (e.g. About)" className="input" />
        <input name="href" required placeholder="/about" className="input flex-1" />
        <button className="text-sm px-4 py-2 rounded-full bg-ink text-paper font-medium">Add</button>
      </form>

      <ul className="flex flex-col gap-2">
        {items?.map((item) => (
          <li key={item.id} className="flex items-center justify-between border-b border-line/60 py-2 text-sm">
            <span>{item.label} <span className="text-ink-muted font-mono text-xs">{item.href}</span></span>
            <div className="flex items-center gap-3">
              <form action={async () => { "use server"; await toggleNavItem(item.id, !item.is_visible); }}>
                <button className="text-xs px-2 py-1 rounded border border-line">
                  {item.is_visible ? "Hide" : "Show"}
                </button>
              </form>
              <form action={async () => { "use server"; await deleteNavItem(item.id); }}>
                <button className="text-xs text-red-600">Delete</button>
              </form>
            </div>
          </li>
        ))}
        {(!items || items.length === 0) && <p className="text-sm text-ink-muted">No nav items yet.</p>}
      </ul>
    </div>
  );
}
