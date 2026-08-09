"use client";

import { PhotoUpload } from "@/components/photo-upload";
import { saveAvatarUrl, removeAvatar, saveCoverUrl, removeCover } from "./photo-actions";

export function PhotoUploadSection({ avatarUrl, coverUrl }: { avatarUrl?: string | null; coverUrl?: string | null }) {
  return (
    <div className="flex flex-col gap-6 mb-6 pb-6 border-b border-line">
      <PhotoUpload label="Cover banner" shape="banner" bucket="covers" currentUrl={coverUrl} onUploaded={saveCoverUrl} onRemove={removeCover} />
      <PhotoUpload label="Profile photo" shape="circle" bucket="avatars" currentUrl={avatarUrl} onUploaded={saveAvatarUrl} onRemove={removeAvatar} />
    </div>
  );
}
