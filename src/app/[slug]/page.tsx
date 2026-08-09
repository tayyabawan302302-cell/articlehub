import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";

type Props = { params: Promise<{ slug: string }> };

async function getPage(slug: string) {
  const supabase = await createClient();
  const { data } = await supabase.from("pages").select("*").eq("slug", slug).single();
  return data;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const page = await getPage(slug);
  if (!page) return {};
  return { title: page.meta_title || page.title, description: page.meta_description || undefined };
}

export default async function StaticPage({ params }: Props) {
  const { slug } = await params;
  const page = await getPage(slug);
  if (!page) notFound();

  const html = (page.content as any)?.html ?? "";

  return (
    <article className="mx-auto max-w-2xl px-6 py-16">
      <h1 className="font-display text-4xl font-semibold mb-8">{page.title}</h1>
      <div className="prose prose-lg" dangerouslySetInnerHTML={{ __html: html }} />
    </article>
  );
}
