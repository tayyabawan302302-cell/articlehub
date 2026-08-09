import { Document, Page, Text, View, StyleSheet, Image } from "@react-pdf/renderer";
import { contentTypeLabel, poetryTypeLabel } from "@/lib/content-types";

const styles = StyleSheet.create({
  coverPage: {
    padding: 0,
    backgroundColor: "#111827",
    color: "#FAF9F6",
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "center",
  },
  coverKicker: { fontSize: 12, letterSpacing: 3, marginBottom: 16, color: "#D4A72C" },
  coverTitle: { fontSize: 40, fontFamily: "Times-Bold", textAlign: "center", marginHorizontal: 40, marginBottom: 20 },
  coverIssue: { fontSize: 14, marginBottom: 4 },
  coverDate: { fontSize: 12, color: "#94A3B8" },
  coverTheme: { fontSize: 13, marginTop: 24, marginHorizontal: 60, textAlign: "center", fontFamily: "Times-Italic", color: "#CBD5E1" },

  page: { padding: 48, fontFamily: "Times-Roman", fontSize: 11, color: "#111827" },
  pageHeader: { fontSize: 8, color: "#64748B", marginBottom: 20, textTransform: "uppercase", letterSpacing: 1 },
  pageFooter: { position: "absolute", bottom: 24, left: 48, right: 48, fontSize: 8, color: "#94A3B8", textAlign: "center" },

  tocTitle: { fontSize: 22, fontFamily: "Times-Bold", marginBottom: 24 },
  tocSectionLabel: { fontSize: 10, color: "#D4A72C", marginTop: 16, marginBottom: 8, textTransform: "uppercase", letterSpacing: 1 },
  tocRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 6 },
  tocRowTitle: { fontSize: 11 },
  tocRowMeta: { fontSize: 9, color: "#64748B" },

  sectionDivider: { fontSize: 10, color: "#D4A72C", textTransform: "uppercase", letterSpacing: 2, marginBottom: 8 },
  pieceTitle: { fontSize: 22, fontFamily: "Times-Bold", marginBottom: 6 },
  pieceMeta: { fontSize: 9, color: "#64748B", marginBottom: 16 },
  pieceImage: { width: "100%", height: 180, objectFit: "cover", marginBottom: 16, borderRadius: 4 },
  pieceBody: { fontSize: 10.5, lineHeight: 1.6, textAlign: "justify" },
  poetryBody: { fontSize: 12, lineHeight: 2, fontFamily: "Times-Italic" },

  closingPage: { padding: 48, backgroundColor: "#111827", color: "#FAF9F6", display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center" },
  closingText: { fontSize: 14, fontFamily: "Times-Italic", textAlign: "center", marginBottom: 8 },
});

function stripHtmlToText(html: string | null | undefined) {
  if (!html) return "";
  return html
    .replace(/<\/(p|div|h[1-6]|li)>/gi, "\n\n")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

type PdfArticle = {
  id: string;
  title: string;
  subtitle?: string | null;
  content_html?: string | null;
  content_type: string;
  poetry_type?: string | null;
  featured_image_url?: string | null;
  author?: { full_name: string } | null;
};

export function MagazinePdfDocument({
  issue,
  siteName,
  articles,
}: {
  issue: { issue_number: number; title: string; theme?: string | null; published_at?: string | null };
  siteName: string;
  articles: PdfArticle[];
}) {
  const dateLabel = issue.published_at
    ? new Date(issue.published_at).toLocaleDateString("en-US", { month: "long", year: "numeric" })
    : "";

  const byType = (t: string) => articles.filter((a) => a.content_type === t);
  const sections: { label: string; items: PdfArticle[] }[] = [
    { label: "Articles", items: byType("article") },
    { label: "Poetry", items: byType("poetry") },
    { label: "Stories", items: byType("story") },
    { label: "Essays", items: byType("essay") },
    { label: "Opinion", items: byType("opinion") },
    { label: "Other", items: byType("other") },
  ].filter((s) => s.items.length > 0);

  return (
    <Document title={`${siteName} — Issue ${issue.issue_number}`}>
      {/* Cover */}
      <Page size="A4" style={styles.coverPage}>
        <Text style={styles.coverKicker}>{siteName.toUpperCase()}</Text>
        <Text style={styles.coverTitle}>{issue.title}</Text>
        <Text style={styles.coverIssue}>ISSUE {String(issue.issue_number).padStart(2, "0")}</Text>
        {dateLabel && <Text style={styles.coverDate}>{dateLabel}</Text>}
        {issue.theme && <Text style={styles.coverTheme}>{issue.theme}</Text>}
      </Page>

      {/* Table of contents */}
      <Page size="A4" style={styles.page}>
        <Text style={styles.pageHeader}>{siteName} — Issue {issue.issue_number}</Text>
        <Text style={styles.tocTitle}>Table of Contents</Text>
        {sections.map((section) => (
          <View key={section.label}>
            <Text style={styles.tocSectionLabel}>{section.label}</Text>
            {section.items.map((a) => (
              <View key={a.id} style={styles.tocRow}>
                <Text style={styles.tocRowTitle}>{a.title}</Text>
                <Text style={styles.tocRowMeta}>{a.author?.full_name ?? ""}</Text>
              </View>
            ))}
          </View>
        ))}
        <Text style={styles.pageFooter} fixed>{siteName} — Issue {issue.issue_number}</Text>
      </Page>

      {/* Each piece, one per page */}
      {sections.map((section) =>
        section.items.map((a) => (
          <Page key={a.id} size="A4" style={styles.page} wrap>
            <Text style={styles.pageHeader}>{siteName} — Issue {issue.issue_number}</Text>
            <Text style={styles.sectionDivider}>
              {section.label}{a.content_type === "poetry" && a.poetry_type ? ` · ${poetryTypeLabel(a.poetry_type)}` : ""}
            </Text>
            <Text style={styles.pieceTitle}>{a.title}</Text>
            <Text style={styles.pieceMeta}>
              {a.author?.full_name ?? "Unknown"} · {contentTypeLabel(a.content_type)}
            </Text>
            {a.featured_image_url && (
              // eslint-disable-next-line jsx-a11y/alt-text -- this is react-pdf's PDF Image primitive, not an HTML <img>; it has no alt prop
              <Image src={a.featured_image_url} style={styles.pieceImage} />
            )}
            <Text style={a.content_type === "poetry" ? styles.poetryBody : styles.pieceBody}>
              {stripHtmlToText(a.content_html)}
            </Text>
            <Text style={styles.pageFooter} fixed render={({ pageNumber }) => `${pageNumber}`} />
          </Page>
        ))
      )}

      {/* Closing page */}
      <Page size="A4" style={styles.closingPage}>
        <Text style={styles.closingText}>Thank you for reading.</Text>
        <Text style={[styles.closingText, { color: "#D4A72C" }]}>{siteName} — Issue {issue.issue_number}</Text>
      </Page>
    </Document>
  );
}
