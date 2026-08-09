"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { createClient } from "@/lib/supabase/client";

const ACCEPTED_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
const MAX_SIZE_BYTES = 5 * 1024 * 1024; // 5MB

export function CoverImagePicker({
  currentUrl,
  onChange,
}: {
  currentUrl: string | null;
  onChange: (url: string) => void;
}) {
  const supabase = createClient();
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(currentUrl);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setError(null);
    if (!ACCEPTED_TYPES.includes(file.type)) {
      setError("Only JPG, PNG, and WEBP images are accepted");
      return;
    }
    if (file.size > MAX_SIZE_BYTES) {
      setError("Image must be under 5MB");
      return;
    }

    setPreview(URL.createObjectURL(file));
    setUploading(true);

    // Uploaded directly from the browser to Supabase Storage (the 'media'
    // bucket) — not through a Server Action — so a 5MB image never comes
    // close to Next.js's 1MB Server Action body-size limit.
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      setError("Not signed in");
      setUploading(false);
      return;
    }

    const ext = file.name.split(".").pop() || "jpg";
    const path = `article-covers/${user.id}-${Date.now()}.${ext}`;
    const { error: uploadError } = await supabase.storage.from("media").upload(path, file);

    if (uploadError) {
      setError(uploadError.message);
      setUploading(false);
      setPreview(currentUrl);
      return;
    }

    const { data } = supabase.storage.from("media").getPublicUrl(path);

    // Also record it in the media table so it shows up in the admin Media
    // Library — a small DB write, no file bytes involved.
    await supabase.from("media").insert({
      uploader_id: user.id,
      storage_path: path,
      public_url: data.publicUrl,
      file_name: file.name,
      folder: "article-covers",
      mime_type: file.type,
      size_bytes: file.size,
    });

    setUploading(false);
    onChange(data.publicUrl);
  }

  return (
    <div className="mb-6">
      <div
        onClick={() => inputRef.current?.click()}
        className="relative aspect-[16/9] w-full rounded-xl border-2 border-dashed border-line hover:border-denim cursor-pointer overflow-hidden bg-black/5 flex items-center justify-center"
      >
        {preview ? (
          <Image src={preview} alt="Cover preview" fill unoptimized className="object-cover" />
        ) : (
          <div className="text-center text-ink-muted text-sm">
            <p className="font-medium">Choose cover image</p>
            <p className="text-xs mt-1">JPG, PNG, or WEBP — up to 5MB</p>
          </div>
        )}
        {uploading && (
          <div className="absolute inset-0 bg-black/40 flex items-center justify-center text-white text-sm">
            Uploading…
          </div>
        )}
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/jpg,image/png,image/webp"
        className="hidden"
        onChange={handleFileChange}
      />
      {error && <p className="text-xs text-red-600 mt-2">{error}</p>}
      {preview && !uploading && (
        <button type="button" onClick={() => inputRef.current?.click()} className="text-xs text-denim-dark mt-2">
          Change image
        </button>
      )}
    </div>
  );
}
