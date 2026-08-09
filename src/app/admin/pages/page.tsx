import { createClient } from "@/lib/supabase/server";
import { upsertPage, deletePage } from "./actions";

const SUGGESTED = ["about", "privacy-policy", "terms", "faq", "contact"];

export default async function AdminPagesPage() {
  const supabase = await createClient();
  const { data: pages } = await supabase.from("pages").select("id, slug, title").order("slug");

  return (
    <div>
      <h1 className="font-display text-3xl font-semibold mb-6">Pages</h1>

      <div className="grid md:grid-cols-2 gap-8">
        <section>
          <h2 className="font-display text-xl font-semibold mb-4">Existing pages</h2>
          <ul className="flex flex-col gap-2">
            {pages?.map((p) => (
              <li key={p.id} className="flex items-center justify-between border-b border-line/60 py-2 text-sm">
                <span>{p.title} <span className="text-ink-muted font-mono text-xs">/{p.slug}</span></span>
                <form action={async () => { "use server"; await deletePage(p.id); }}>
                  <button className="text-xs text-red-600">Delete</button>
                </form>
              </li>
            ))}
            {(!pages || pages.length === 0) && <p className="text-sm text-ink-muted">No pages yet. Suggested: {SUGGESTED.join(", ")}</p>}
          </ul>
        </section>

        <section>
          <h2 className="font-display text-xl font-semibold mb-4">Create / edit a page</h2>
          <form action={upsertPage} className="flex flex-col gap-3">
            <input name="slug" required placeholder="Slug (e.g. about)" className="input" />
            <input name="title" required placeholder="Title" className="input" />
            <textarea name="html" required placeholder="Page content (HTML)" rows={8} className="input font-mono text-xs" />
            <input name="meta_title" placeholder="Meta title (optional)" className="input" />
            <input name="meta_description" placeholder="Meta description (optional)" className="input" />
            <button className="self-start text-sm px-4 py-2 rounded-full bg-ink text-paper font-medium">Save page</button>
          </form>
        </section>
      </div>
    </div>
  );
}
