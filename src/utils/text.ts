const MULTISPACE_RE = /\s+/g;

export const normalizeText = (value: string): string => value.trim().replace(MULTISPACE_RE, " ");

export const escapeHtml = (value: string): string =>
  value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");

export const escapeMarkdownCell = (value: string): string =>
  normalizeText(value).replaceAll("|", "\\|");

export const estimateTokens = (value: string): number =>
  Math.max(1, Math.ceil(normalizeText(value).split(" ").filter(Boolean).length * 1.3));

export const joinSectionPath = (sectionPath?: string[]): string | undefined =>
  sectionPath && sectionPath.length > 0 ? sectionPath.join(" > ") : undefined;

export const formatPageRange = (pages: number[]): string => {
  if (pages.length === 0) {
    return "unknown";
  }

  const sorted = [...pages].sort((left, right) => left - right);
  return sorted[0] === sorted[sorted.length - 1]
    ? String(sorted[0])
    : `${sorted[0]}-${sorted[sorted.length - 1]}`;
};
