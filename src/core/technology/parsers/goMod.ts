/**
 * Safe parser for Go go.mod files
 *
 * Extracts module dependencies from single-line `require` statements
 * and multi-line `require (...)` blocks.
 */

/**
 * Parses go.mod content into a list of normalized module identifiers.
 * Includes both full module paths and base package names.
 */
export function parseGoMod(content: string | undefined | null): string[] {
  if (!content || typeof content !== "string") {
    return [];
  }

  const lines = content.split(/\r?\n/);
  const modules = new Set<string>();

  let inRequireBlock = false;

  for (const rawLine of lines) {
    // Strip comments
    const line = rawLine.split("//")[0].trim();
    if (!line) continue;

    if (line === "require (" || line.startsWith("require (")) {
      inRequireBlock = true;
      continue;
    }

    if (inRequireBlock) {
      if (line === ")") {
        inRequireBlock = false;
        continue;
      }
      addModuleFromLine(line, modules);
      continue;
    }

    if (line.startsWith("require ") && !line.includes("(")) {
      const rest = line.substring("require ".length).trim();
      addModuleFromLine(rest, modules);
    }
  }

  return Array.from(modules);
}

function addModuleFromLine(line: string, set: Set<string>): void {
  const parts = line.split(/\s+/);
  if (parts.length > 0) {
    const modPath = parts[0].trim();
    if (modPath && !modPath.startsWith("(") && !modPath.startsWith(")")) {
      const normalizedPath = modPath.toLowerCase();
      set.add(normalizedPath);

      // Also add the base package name (e.g. github.com/gin-gonic/gin -> gin)
      const pathSegments = normalizedPath.split("/");
      const baseName = pathSegments[pathSegments.length - 1];
      if (baseName && baseName.length > 1) {
        set.add(baseName);
      }
    }
  }
}
