import { createClient } from "@/lib/supabase/server";

export default async function AdSlot({ placement }: { placement: string }) {
  const supabase = await createClient();
  const { data: ad } = await supabase
    .from("advertisements")
    .select("adsense_code")
    .eq("placement", placement)
    .eq("is_active", true)
    .limit(1)
    .maybeSingle();

  if (!ad) return null;

  return <div className="my-8" dangerouslySetInnerHTML={{ __html: ad.adsense_code }} />;
}
