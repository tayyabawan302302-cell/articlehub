"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { createClient } from "@/lib/supabase/client";

export function SiteImageUpload({
  label,
  field,
  currentUrl,
}: {
  label: string;
  field: "logo_url" | "favicon_url";
  currentUrl: string | null;
}) {
  const supabase = createClient();
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(currentUrl);
  const [uploading, setUploading] = useState(false);

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setPreview(URL.createObjectURL(file));
    setUploading(true);

    const ext = file.name.split(".").pop() || "png";
    const path = `site-branding/${field}-${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from("media").upload(path, file, { upsert: true });
    if (!error) {
      const { data } = supabase.storage.from("media").getPublicUrl(path);
      await supabase.from("site_settings").update({ [field]: data.publicUrl }).eq("id", 1);
    }
    setUploading(false);
  }

  return (
    <div className="flex items-center gap-3">
      <div className="relative w-12 h-12 rounded border border-line bg-black/5 flex items-center justify-center overflow-hidden flex-shrink-0">
        {preview ? <Image src={preview} alt={label} fill unoptimized className="object-contain" /> : <span className="text-[10px] text-ink-muted">None</span>}
      </div>
      <div>
        <p className="text-sm font-medium mb-1">{label}</p>
        <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className="text-xs px-3 py-1.5 rounded-full border border-line hover:border-ink disabled:opacity-50"
        >
          {uploading ? "Uploading…" : currentUrl ? "Replace" : "Upload"}
        </button>
      </div>
    </div>
  );
}
