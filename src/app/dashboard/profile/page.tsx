import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { updateProfile } from "./actions";
import { PhotoUploadSection } from "./photo-section";

export default async function ProfilePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single();

  return (
    <div>
      <h1 className="font-display text-3xl font-semibold mb-8">Your profile</h1>
      <PhotoUploadSection avatarUrl={profile?.avatar_url} coverUrl={profile?.cover_url} />
      <form action={updateProfile} className="max-w-lg flex flex-col gap-4">
        <Field label="Full name" name="full_name" defaultValue={profile?.full_name} />
        <Field label="Bio" name="bio" defaultValue={profile?.bio} textarea />
        <Field label="Occupation" name="occupation" defaultValue={profile?.occupation} />
        <Field label="Country" name="country" defaultValue={profile?.country} />
        <Field label="Specializations (comma separated)" name="skills" defaultValue={profile?.skills?.join(", ")} />
        <Field label="Website" name="website" defaultValue={profile?.website} />
        <Field label="Facebook" name="facebook_url" defaultValue={profile?.facebook_url} />
        <Field label="LinkedIn" name="linkedin_url" defaultValue={profile?.linkedin_url} />
        <Field label="X" name="x_url" defaultValue={profile?.x_url} />
        <Field label="Instagram" name="instagram_url" defaultValue={profile?.instagram_url} />
        <button className="self-start text-sm px-5 py-2.5 rounded-full bg-ink text-paper font-medium">Save profile</button>
      </form>
    </div>
  );
}

function Field({
  label, name, defaultValue, textarea = false,
}: { label: string; name: string; defaultValue?: string | null; textarea?: boolean }) {
  return (
    <label className="flex flex-col gap-1 text-sm">
      <span className="font-medium">{label}</span>
      {textarea ? (
        <textarea name={name} defaultValue={defaultValue ?? ""} rows={3} className="input" />
      ) : (
        <input name={name} defaultValue={defaultValue ?? ""} className="input" />
      )}
    </label>
  );
}
