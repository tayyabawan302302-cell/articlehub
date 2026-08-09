import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { archiveArticle } from "@/lib/actions/article-workflow";
import { RichEditorField } from "./editor-field";
import { PublishWithConfirmation } from "./publish-button";

type Props = { params: Promise<{ id: string }> };

export default async function EditArticlePage({ params }: Props) {
  const { id } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: article } = await supabase
    .from("articles")
    .select("*")
    .eq("id", id)
    .single();

  // Writers can only edit their own articles.
  if (!article || article.author_id !== user.id) {
    notFound();
  }

  const editable =
    article.status !== "archived";

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display text-3xl font-semibold">
            Edit article
          </h1>

          <div className="mt-2">
            <StatusBadge status={article.status} />
          </div>
        </div>
      </div>

      {article.status === "rejected" && article.rejection_reason && (
        <div className="border border-red-200 bg-red-50 rounded-lg p-4 mb-6">
          <p className="text-sm font-medium text-red-800">
            This article was rejected
          </p>

          <p className="text-sm text-red-700 mt-1">
            {article.rejection_reason}
          </p>

          <p className="text-xs text-red-600 mt-2">
            Edit the article and publish it again when it&apos;s ready.
          </p>
        </div>
      )}

      {article.status === "published" && (
        <form
          action={async () => {
            "use server";
            await archiveArticle(article.id);
          }}
          className="mb-6"
        >
          <button className="text-xs px-3 py-1.5 rounded-full border border-red-300 text-red-600">
            Archive this article
          </button>
        </form>
      )}

      {editable ? (
        <RichEditorField article={article} />
      ) : (
        <div className="prose prose-lg border border-line rounded-lg p-6">
          <p className="text-sm text-ink-muted">
            This article is archived and cannot be edited.
          </p>
        </div>
      )}

      {editable &&
        (article.status === "draft" ||
          article.status === "rejected") && (
          <div className="mt-6">
            <PublishWithConfirmation
              articleId={article.id}
              label={
                article.status === "rejected"
                  ? "Republish"
                  : "Publish"
              }
            />
          </div>
        )}
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    draft: "bg-black/5 text-ink-muted",
    pending: "bg-amber-500/10 text-amber-700",
    approved: "bg-denim/15 text-denim-dark",
    published: "bg-teal/10 text-teal",
    rejected: "bg-red-500/10 text-red-700",
    archived: "bg-black/10 text-ink-muted",
  };

  return (
    <span
      className={`text-xs px-3 py-1.5 rounded-full ${
        styles[status] ?? ""
      }`}
    >
      {status}
    </span>
  );
}