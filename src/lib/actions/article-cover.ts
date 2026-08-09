"use server";

import { createClient } from "@/lib/supabase/server";

const ACCEPTED_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
const MAX_SIZE_BYTES = 5 * 1024 * 1024; // 5MB

export async function uploadArticleCover(formData: FormData): Promise<{ url?: string; error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const file = formData.get("file") as File;
  if (!file || file.size === 0) return { error: "No file provided" };
  if (!ACCEPTED_TYPES.includes(file.type)) return { error: "Only JPG, PNG, and WEBP images are accepted" };
  if (file.size > MAX_SIZE_BYTES) return { error: "Image must be under 5MB" };

  const ext = file.name.split(".").pop() || "jpg";
  const path = `article-covers/${user.id}/${Date.now()}.${ext}`;

  const { error: uploadError } = await supabase.storage.from("media").upload(path, file);
  if (uploadError) return { error: uploadError.message };

  const { data } = supabase.storage.from("media").getPublicUrl(path);

  // Also track it in the media table so it shows up in the admin Media Library.
  await supabase.from("media").insert({
    uploader_id: user.id,
    storage_path: path,
    public_url: data.publicUrl,
    file_name: file.name,
    folder: "article-covers",
    mime_type: file.type,
    size_bytes: file.size,
  });

  return { url: data.publicUrl };
}
