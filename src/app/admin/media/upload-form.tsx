"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export function MediaUploadForm() {
  const supabase = createClient();
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const folderRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleUpload(e: React.FormEvent) {
    e.preventDefault();
    const file = fileRef.current?.files?.[0];
    if (!file) return;

    setError(null);
    setUploading(true);

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      setError("Not signed in");
      setUploading(false);
      return;
    }

    const folder = folderRef.current?.value || "uncategorized";
    const path = `${folder}/${Date.now()}-${file.name.replace(/\s+/g, "-")}`;

    // Direct browser-to-Storage upload — not a Server Action — so large
    // files never hit the 1MB Server Action body-size limit.
    const { error: uploadError } = await supabase.storage.from("media").upload(path, file);
    if (uploadError) {
      setError(uploadError.message);
      setUploading(false);
      return;
    }

    const { data } = supabase.storage.from("media").getPublicUrl(path);

    const { error: insertError } = await supabase.from("media").insert({
      uploader_id: user.id,
      storage_path: path,
      public_url: data.publicUrl,
      file_name: file.name,
      folder,
      mime_type: file.type,
      size_bytes: file.size,
    });
    if (insertError) setError(insertError.message);

    setUploading(false);
    if (fileRef.current) fileRef.current.value = "";
    router.refresh();
  }

  return (
    <form onSubmit={handleUpload} className="flex items-end gap-3 mb-8 border border-line rounded-lg p-4">
      <label className="flex flex-col gap-1 text-sm">
        <span className="font-medium">File</span>
        <input ref={fileRef} type="file" required className="text-sm" />
      </label>
      <label className="flex flex-col gap-1 text-sm">
        <span className="font-medium">Folder</span>
        <input ref={folderRef} placeholder="uncategorized" className="input" />
      </label>
      <button disabled={uploading} className="text-sm px-4 py-2 rounded-full bg-ink text-paper font-medium h-fit disabled:opacity-50">
        {uploading ? "Uploading…" : "Upload"}
      </button>
      {error && <p className="text-xs text-red-600">{error}</p>}
    </form>
  );
}
