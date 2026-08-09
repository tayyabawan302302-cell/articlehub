import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "@/lib/types/database.types";

// Use in Client Components. Reads/writes are scoped by RLS to whatever
// the signed-in user is allowed to touch — no service-role key here.
export function createClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
