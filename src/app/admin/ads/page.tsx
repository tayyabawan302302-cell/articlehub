import { createClient } from "@/lib/supabase/server";
import { createAd, toggleAd, deleteAd } from "./actions";

const PLACEMENTS = ["header", "sidebar", "between_articles", "footer", "inside_article"];

export default async function AdminAdsPage() {
  const supabase = await createClient();
  const { data: ads } = await supabase.from("advertisements").select("*").order("created_at", { ascending: false });

  return (
    <div>
      <h1 className="font-display text-3xl font-semibold mb-6">Advertisements</h1>

      <form action={createAd} className="flex flex-col gap-3 max-w-lg mb-10 border border-line rounded-lg p-5">
        <input name="name" required placeholder="Internal name (e.g. Header banner)" className="input" />
        <select name="placement" required className="input">
          {PLACEMENTS.map((p) => (
            <option key={p} value={p}>{p.replace("_", " ")}</option>
          ))}
        </select>
        <textarea name="adsense_code" required placeholder="Paste Google AdSense code" rows={4} className="input font-mono text-xs" />
        <button className="self-start text-sm px-4 py-2 rounded-full bg-ink text-paper font-medium">Add ad</button>
      </form>

      <ul className="flex flex-col gap-3">
        {ads?.map((ad) => (
          <li key={ad.id} className="border border-line rounded-lg p-4 flex items-center justify-between">
            <div>
              <p className="font-medium text-sm">{ad.name}</p>
              <p className="text-xs text-ink-muted">{ad.placement.replace("_", " ")}</p>
            </div>
            <div className="flex items-center gap-3">
              <form action={async () => { "use server"; await toggleAd(ad.id, !ad.is_active); }}>
                <button className="text-xs px-2 py-1 rounded border border-line">
                  {ad.is_active ? "Disable" : "Enable"}
                </button>
              </form>
              <form action={async () => { "use server"; await deleteAd(ad.id); }}>
                <button className="text-xs text-red-600">Delete</button>
              </form>
            </div>
          </li>
        ))}
        {(!ads || ads.length === 0) && <p className="text-sm text-ink-muted">No ad placements yet.</p>}
      </ul>
    </div>
  );
}
