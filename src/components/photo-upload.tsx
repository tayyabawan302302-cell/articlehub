"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { createClient } from "@/lib/supabase/client";

export function PhotoUpload({
  label,
  currentUrl,
  shape,
  bucket,
  onUploaded,
  onRemove,
}: {
  label: string;
  currentUrl?: string | null;
  shape: "circle" | "banner";
  bucket: "avatars" | "covers";
  onUploaded: (url: string) => Promise<void>;
  onRemove: () => Promise<void>;
}) {
  const supabase = createClient();
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setError(null);
    setPreview(URL.createObjectURL(file));
    setUploading(true);

    // Uploaded directly from the browser to Supabase Storage — not routed
    // through a Server Action — so file size is never limited by Next.js's
    // Server Action body-size cap (1MB by default). The bucket's RLS policy
    // (see migration 0004) restricts writes to the signed-in user's own
    // folder, so this is safe to call straight from the client.
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      setError("Not signed in");
      setUploading(false);
      return;
    }

    const ext = file.name.split(".").pop() || "jpg";
    const path = `${user.id}/${Date.now()}.${ext}`;
    const { error: uploadError } = await supabase.storage.from(bucket).upload(path, file, { upsert: true });

    if (uploadError) {
      setError(uploadError.message);
      setUploading(false);
      return;
    }

    const { data } = supabase.storage.from(bucket).getPublicUrl(path);
    await onUploaded(data.publicUrl);
    setUploading(false);
  }

  const displayUrl = preview ?? currentUrl;
  const isBanner = shape === "banner";

  return (
    <div>
      <p className="text-sm font-medium mb-2">{label}</p>
      <div
        className={
          isBanner
            ? "relative w-full h-32 rounded-xl overflow-hidden bg-black/5 border border-line"
            : "relative w-24 h-24 rounded-full overflow-hidden bg-black/5 border border-line"
        }
      >
        {displayUrl ? (
          <Image src={displayUrl} alt={label} fill className="object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-ink-muted text-xs">No photo</div>
        )}
        {uploading && (
          <div className="absolute inset-0 bg-black/30 flex items-center justify-center text-white text-xs">
            Uploading…
          </div>
        )}
      </div>
      {error && <p className="text-xs text-red-600 mt-1">{error}</p>}
      <div className="flex gap-3 mt-2">
        <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="text-xs px-3 py-1.5 rounded-full border border-line hover:border-ink"
        >
          {currentUrl ? "Replace" : "Upload"}
        </button>
        {currentUrl && (
          <button
            type="button"
            onClick={async () => { await onRemove(); setPreview(null); }}
            className="text-xs px-3 py-1.5 rounded-full border border-line text-red-600 hover:border-red-300"
          >
            Remove
          </button>
        )}
      </div>
    </div>
  );
}
