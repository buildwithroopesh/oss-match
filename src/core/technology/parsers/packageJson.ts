/**
 * Safe parser for package.json manifests
 *
 * Extracts dependency names across dependencies, devDependencies,
 * peerDependencies, and optionalDependencies.
 */

export interface ParsedPackageJson {
  dependencies: string[];
  raw?: Record<string, unknown>;
}

/**
 * Parses package.json content or object into a list of lowercase dependency names.
 * Never throws on malformed JSON; returns empty dependency array on failure.
 */
export function parsePackageJson(content: string | Record<string, unknown> | undefined | null): ParsedPackageJson {
  if (!content) {
    return { dependencies: [] };
  }

  let data: Record<string, unknown>;
  if (typeof content === "string") {
    try {
      data = JSON.parse(content);
    } catch {
      return { dependencies: [] };
    }
  } else if (typeof content === "object") {
    data = content;
  } else {
    return { dependencies: [] };
  }

  if (!data || typeof data !== "object") {
    return { dependencies: [] };
  }

  const result = new Set<string>();
  const depSections = ["dependencies", "devDependencies", "peerDependencies", "optionalDependencies"];

  for (const section of depSections) {
    const deps = data[section];
    if (deps && typeof deps === "object" && !Array.isArray(deps)) {
      for (const key of Object.keys(deps)) {
        if (typeof key === "string" && key.trim().length > 0) {
          result.add(key.trim().toLowerCase());
        }
      }
    }
  }

  return {
    dependencies: Array.from(result),
    raw: data,
  };
}
