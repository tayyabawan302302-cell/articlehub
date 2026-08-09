export const CONTENT_TYPES = [
  { value: "article", label: "Article" },
  { value: "poetry", label: "Poetry" },
  { value: "story", label: "Story" },
  { value: "essay", label: "Essay" },
  { value: "opinion", label: "Opinion" },
  { value: "other", label: "Other" },
] as const;

export const POETRY_TYPES = [
  { value: "ghazal", label: "Ghazal" },
  { value: "nazm", label: "Nazm" },
  { value: "free_verse", label: "Free Verse" },
  { value: "sonnet", label: "Sonnet" },
  { value: "haiku", label: "Haiku" },
  { value: "romantic", label: "Love / Romantic Poetry" },
  { value: "emotional", label: "Sad / Emotional Poetry" },
  { value: "spiritual", label: "Spiritual / Religious Poetry" },
  { value: "inspirational", label: "Inspirational Poetry" },
  { value: "nature", label: "Nature Poetry" },
  { value: "social_political", label: "Social / Political Poetry" },
  { value: "friendship", label: "Friendship Poetry" },
  { value: "philosophical", label: "Life / Philosophical Poetry" },
  { value: "patriotic", label: "Patriotic Poetry" },
  { value: "humorous_satirical", label: "Humorous / Satirical Poetry" },
  { value: "other", label: "Other" },
] as const;

export function contentTypeLabel(value: string) {
  return CONTENT_TYPES.find((c) => c.value === value)?.label ?? value;
}

export function poetryTypeLabel(value: string | null | undefined) {
  if (!value) return null;
  return POETRY_TYPES.find((p) => p.value === value)?.label ?? value;
}
