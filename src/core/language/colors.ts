/**
 * Language Color Presentation Mapping
 *
 * Provides visual color tokens for programming languages, preserving the locked
 * design system palette and GitHub linguist standards.
 *
 * Kept strictly as presentation metadata separate from core aggregation logic.
 */

export const DEFAULT_LANGUAGE_COLOR = "#7B838D";

/**
 * Locked palette mapping for common programming languages.
 * Keys are normalized to lower-case for robust case-insensitive matching.
 */
export const LANGUAGE_COLORS: Record<string, string> = {
  // Locked palette tokens from globals.css
  typescript: "#3178C6",
  javascript: "#F7DF1E",
  python: "#3776AB",
  go: "#00ADD8",
  rust: "#DEA584",
  java: "#B07219",
  "c#": "#178600",
  csharp: "#178600",
  "c++": "#F34B7D",
  cpp: "#F34B7D",
  c: "#555555",
  ruby: "#701516",
  php: "#4F5D95",
  swift: "#F05138",
  kotlin: "#A97BFF",
  html: "#E34C26",
  css: "#563D7C",
  shell: "#89E051",
  bash: "#89E051",
  sh: "#89E051",
  other: "#7B838D",

  // Extended common languages (GitHub linguist standards)
  dart: "#00B4AB",
  scala: "#c22d40",
  elixir: "#6e4a7e",
  clojure: "#db5855",
  haskell: "#5e5086",
  lua: "#000080",
  r: "#198CE7",
  zig: "#ec915c",
  "objective-c": "#438eff",
  julia: "#a270ba",
  sql: "#e38c00",
  dockerfile: "#384d54",
  vue: "#41b883",
  svelte: "#ff3e00",
};

/**
 * Retrieves the hex color code for a programming language.
 * Falls back gracefully to DEFAULT_LANGUAGE_COLOR (#7B838D) for unmapped languages.
 */
export function getLanguageColor(language: string): string {
  const normalized = language.trim().toLowerCase();
  return LANGUAGE_COLORS[normalized] ?? DEFAULT_LANGUAGE_COLOR;
}

/**
 * Enriches items containing a language name with presentation color metadata.
 */
export function attachLanguageColors<T extends { language: string }>(
  items: T[]
): Array<T & { color: string }> {
  return items.map((item) => ({
    ...item,
    color: getLanguageColor(item.language),
  }));
}
