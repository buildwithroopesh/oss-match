/**
 * Safe parser for Python requirements.txt files
 *
 * Adheres to PEP 503 package name normalization:
 * lowercase with runs of `[-_.]+` replaced by `-`.
 */

/** Normalizes a Python package name per PEP 503 */
export function normalizePythonPackageName(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .replace(/[-_.]+/g, "-");
}

/**
 * Parses requirements.txt content into a list of normalized package names.
 * Never throws on malformed syntax; skips unrecognized lines gracefully.
 */
export function parseRequirementsTxt(content: string | string[] | undefined | null): string[] {
  if (!content) {
    return [];
  }

  const lines = Array.isArray(content) ? content : content.split(/\r?\n/);
  const packages = new Set<string>();

  for (const rawLine of lines) {
    if (typeof rawLine !== "string") continue;

    // Remove comments
    let line = rawLine.split("#")[0].trim();
    if (!line) continue;

    // Ignore flags, options, and recursive requirements
    if (
      line.startsWith("-r ") ||
      line.startsWith("--requirement ") ||
      line.startsWith("-i ") ||
      line.startsWith("--index-url ") ||
      line.startsWith("--extra-index-url ") ||
      line.startsWith("-f ") ||
      line.startsWith("--find-links ") ||
      line.startsWith("-c ") ||
      line.startsWith("--constraint ") ||
      line.startsWith("-e ") ||
      line.startsWith("--editable ")
    ) {
      continue;
    }

    // Strip environment markers (e.g. `package >= 1.0 ; python_version >= '3.8'`)
    line = line.split(";")[0].trim();
    if (!line) continue;

    // Strip version specifiers and extras
    // Version operators: ==, <=, >=, ~=, !=, ===, <, >, @
    const versionMatch = line.search(/[=<>~!@]/);
    let pkgToken = versionMatch >= 0 ? line.substring(0, versionMatch).trim() : line;

    // Strip extras like `requests[security]`
    pkgToken = pkgToken.replace(/\[.*?\]/, "").trim();

    if (pkgToken.length > 0 && /^[a-zA-Z0-9_.-]+$/.test(pkgToken)) {
      packages.add(normalizePythonPackageName(pkgToken));
    }
  }

  return Array.from(packages);
}
