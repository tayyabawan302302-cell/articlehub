import { createClient } from "@/lib/supabase/server";
import { updateSettings } from "./actions";
import { SiteImageUpload } from "./site-image-upload";

export default async function AdminSettingsPage() {
  const supabase = await createClient();
  const { data: s } = await supabase.from("site_settings").select("*").eq("id", 1).single();

  return (
    <div>
      <h1 className="font-display text-3xl font-semibold mb-8">Site settings</h1>
      <div className="max-w-2xl flex flex-col gap-4 mb-6 border border-line rounded-lg p-5">
        <SiteImageUpload label="Logo" field="logo_url" currentUrl={s?.logo_url} />
        <SiteImageUpload label="Favicon" field="favicon_url" currentUrl={s?.favicon_url} />
      </div>
      <form action={updateSettings} className="max-w-2xl flex flex-col gap-6">
        <Fieldset title="Identity">
          <Field label="Site name" name="site_name" defaultValue={s?.site_name} />
          <Field label="Description" name="description" defaultValue={s?.description} textarea />
          <Field label="Keywords (comma separated)" name="keywords" defaultValue={s?.keywords?.join(", ")} />
          <Field label="Theme color" name="theme_color" defaultValue={s?.theme_color} type="color" />
        </Fieldset>

        <Fieldset title="Contact">
          <Field label="Email" name="contact_email" defaultValue={s?.contact_email} />
          <Field label="Phone" name="contact_phone" defaultValue={s?.contact_phone} />
          <Field label="Address" name="address" defaultValue={s?.address} />
        </Fieldset>

        <Fieldset title="Social links">
          <Field label="Facebook" name="facebook_url" defaultValue={s?.facebook_url} />
          <Field label="LinkedIn" name="linkedin_url" defaultValue={s?.linkedin_url} />
          <Field label="X" name="x_url" defaultValue={s?.x_url} />
          <Field label="Instagram" name="instagram_url" defaultValue={s?.instagram_url} />
        </Fieldset>

        <Fieldset title="Analytics & Ads">
          <Field label="Google Analytics ID" name="google_analytics_id" defaultValue={s?.google_analytics_id} />
          <Field label="Search Console verification code" name="google_search_console_code" defaultValue={s?.google_search_console_code} />
          <Field label="AdSense code" name="google_adsense_code" defaultValue={s?.google_adsense_code} textarea />
        </Fieldset>

        <Fieldset title="Footer">
          <Field label="Footer text" name="footer_text" defaultValue={s?.footer_text} />
        </Fieldset>

        <button className="self-start text-sm font-medium px-5 py-2.5 rounded-full bg-ink text-paper font-medium hover:bg-ink/85">
          Save settings
        </button>
      </form>
    </div>
  );
}

function Fieldset({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <fieldset className="border border-line rounded-lg p-5">
      <legend className="font-display text-sm font-semibold px-2 -ml-2">{title}</legend>
      <div className="flex flex-col gap-3 mt-2">{children}</div>
    </fieldset>
  );
}

function Field({
  label, name, defaultValue, textarea = false, type = "text",
}: { label: string; name: string; defaultValue?: string | null; textarea?: boolean; type?: string }) {
  return (
    <label className="flex flex-col gap-1 text-sm">
      <span className="font-medium">{label}</span>
      {textarea ? (
        <textarea name={name} defaultValue={defaultValue ?? ""} rows={3} className="input" />
      ) : (
        <input name={name} type={type} defaultValue={defaultValue ?? ""} className="input" />
      )}
    </label>
  );
}
