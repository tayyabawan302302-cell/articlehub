import { createClient } from "@/lib/supabase/server";
import { createCategory, deleteCategory, createTag, deleteTag, updateCategoryDescription } from "./actions";

export default async function AdminCategoriesPage() {
  const supabase = await createClient();
  const [{ data: categories }, { data: tags }] = await Promise.all([
    supabase.from("categories").select("id, name, slug, description").order("sort_order"),
    supabase.from("tags").select("id, name, slug").order("name"),
  ]);

  return (
    <div className="grid md:grid-cols-2 gap-12">
      <section>
        <h1 className="font-display text-2xl font-semibold mb-4">Categories</h1>
        <form action={createCategory} className="flex flex-col gap-2 mb-6">
          <input name="name" required placeholder="New category name" className="input" />
          <input name="description" placeholder="Short description (shown on the homepage)" className="input" />
          <button className="self-start text-sm px-4 py-2 rounded-full bg-ink text-paper font-medium">Add</button>
        </form>
        <ul className="flex flex-col gap-3">
          {categories?.map((c) => (
            <li key={c.id} className="border-b border-line/60 py-2 text-sm">
              <div className="flex items-center justify-between">
                <span>{c.name} <span className="text-ink-muted font-mono text-xs">/{c.slug}</span></span>
                <form action={async () => { "use server"; await deleteCategory(c.id); }}>
                  <button className="text-xs text-red-600 hover:underline">Delete</button>
                </form>
              </div>
              <form
                action={async (formData: FormData) => {
                  "use server";
                  await updateCategoryDescription(c.id, formData.get("description") as string);
                }}
                className="flex gap-2 mt-1"
              >
                <input name="description" defaultValue={c.description ?? ""} placeholder="Description" className="input text-xs py-1 flex-1" />
                <button className="text-xs px-2 py-1 rounded border border-line">Save</button>
              </form>
            </li>
          ))}
          {(!categories || categories.length === 0) && <p className="text-sm text-ink-muted">No categories yet.</p>}
        </ul>
      </section>

      <section>
        <h1 className="font-display text-2xl font-semibold mb-4">Tags</h1>
        <form action={createTag} className="flex gap-2 mb-6">
          <input name="name" required placeholder="New tag name" className="input flex-1" />
          <button className="text-sm px-4 py-2 rounded-full bg-ink text-paper font-medium">Add</button>
        </form>
        <div className="flex flex-wrap gap-2">
          {tags?.map((t) => (
            <span key={t.id} className="text-xs px-3 py-1.5 rounded-full border border-line flex items-center gap-2">
              {t.name}
              <form action={async () => { "use server"; await deleteTag(t.id); }}>
                <button className="text-red-600">×</button>
              </form>
            </span>
          ))}
          {(!tags || tags.length === 0) && <p className="text-sm text-ink-muted">No tags yet.</p>}
        </div>
      </section>
    </div>
  );
}
