import Image from "next/image";
import { createClient } from "@/lib/supabase/server";
import { deleteMedia } from "./actions";
import { MediaUploadForm } from "./upload-form";

export default async function AdminMediaPage({
  searchParams,
}: {
  searchParams: Promise<{ folder?: string }>;
}) {
  const { folder } = await searchParams;
  const supabase = await createClient();

  let query = supabase.from("media").select("id, public_url, file_name, folder, created_at").order("created_at", { ascending: false });
  if (folder) query = query.eq("folder", folder);
  const { data: files } = await query;

  return (
    <div>
      <h1 className="font-display text-3xl font-semibold mb-6">Media library</h1>

      <MediaUploadForm />

      {files && files.length > 0 ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {files.map((f) => (
            <div key={f.id} className="border border-line rounded-lg overflow-hidden">
              <Image src={f.public_url} alt={f.file_name} width={200} height={128} className="w-full h-32 object-cover bg-black/5" />
              <div className="p-2">
                <p className="text-xs truncate">{f.file_name}</p>
                <div className="flex items-center justify-end mt-1">
                  <form action={async () => { "use server"; await deleteMedia(f.id, `${f.folder}/${f.file_name}`); }}>
                    <button className="text-xs text-red-600">Delete</button>
                  </form>
                </div>
                <p className="text-[10px] text-ink-muted break-all mt-1 select-all">{f.public_url}</p>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-sm text-ink-muted">No media uploaded yet.</p>
      )}
    </div>
  );
}
