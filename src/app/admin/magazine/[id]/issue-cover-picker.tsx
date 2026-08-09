"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { createClient } from "@/lib/supabase/client";

export function IssueCoverPicker({ issueId, currentUrl }: { issueId: string; currentUrl: string | null }) {
  const supabase = createClient();
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(currentUrl);
  const [uploading, setUploading] = useState(false);

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setPreview(URL.createObjectURL(file));
    setUploading(true);

    const ext = file.name.split(".").pop() || "jpg";
    const path = `magazine-covers/issue-${issueId}-${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from("media").upload(path, file);
    if (!error) {
      const { data } = supabase.storage.from("media").getPublicUrl(path);
      await supabase.from("magazine_issues").update({ cover_image_url: data.publicUrl }).eq("id", issueId);
    }
    setUploading(false);
  }

  return (
    <div className="mb-6">
      <p className="text-sm font-medium mb-2">Cover image</p>
      <div
        onClick={() => inputRef.current?.click()}
        className="relative w-64 aspect-[16/9] rounded-lg border-2 border-dashed border-line hover:border-denim cursor-pointer overflow-hidden bg-black/5 flex items-center justify-center"
      >
        {preview ? (
          <Image src={preview} alt="Issue cover" fill unoptimized className="object-cover" />
        ) : (
          <p className="text-xs text-ink-muted">Choose cover</p>
        )}
        {uploading && <div className="absolute inset-0 bg-black/40 flex items-center justify-center text-white text-xs">Uploading…</div>}
      </div>
      <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
    </div>
  );
}
