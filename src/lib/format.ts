/**
 * Formatting Utilities for UI Presentation
 */

/**
 * Formats a raw byte count into a human-readable size string (e.g. "1.4 MB", "420 KB").
 */
export function formatBytes(bytes: number): string {
  if (bytes <= 0) return "0 B";
  const units = ["B", "KB", "MB", "GB"];
  const i = Math.min(
    Math.floor(Math.log(bytes) / Math.log(1024)),
    units.length - 1
  );
  const size = bytes / Math.pow(1024, i);
  return `${size.toFixed(i === 0 ? 0 : 1)} ${units[i]}`;
}

/**
 * Formats an ISO 8601 date string into a clean date string (e.g. "Sep 25, 2026").
 */
export function formatDate(isoString: string | null | undefined): string {
  if (!isoString) return "Unknown";
  try {
    const date = new Date(isoString);
    if (isNaN(date.getTime())) return "Unknown";
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      timeZone: "UTC",
    });
  } catch {
    return "Unknown";
  }
}
