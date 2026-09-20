/**
 * Safe parser for Python pyproject.toml files
 *
 * Extracts dependencies from standard PEP 621 (`[project.dependencies]`, `dependencies = [...]`)
 * and Poetry (`[tool.poetry.dependencies]`, `[tool.poetry.group.*.dependencies]`).
 */

import { normalizePythonPackageName } from "./requirementsTxt";

/**
 * Parses pyproject.toml content into a list of normalized package names.
 * Uses a safe line-oriented state machine; never throws on malformed input.
 */
export function parsePyprojectToml(content: string | undefined | null): string[] {
  if (!content || typeof content !== "string") {
    return [];
  }

  const lines = content.split(/\r?\n/);
  const packages = new Set<string>();

  let currentSection = "";
  let inDependenciesArray = false;

  for (const rawLine of lines) {
    // Strip comments
    const line = rawLine.split("#")[0].trim();
    if (!line) continue;

    // Detect section headers e.g. [project], [tool.poetry.dependencies]
    if (line.startsWith("[") && line.endsWith("]")) {
      currentSection = line.slice(1, -1).trim().toLowerCase();
      inDependenciesArray = false;
      continue;
    }

    // Check if entering a multi-line array e.g. dependencies = [
    if (
      currentSection === "project" &&
      (line.startsWith("dependencies") || line.startsWith("optional-dependencies")) &&
      line.includes("[")
    ) {
      inDependenciesArray = true;
      // Handle inline single-line array e.g. dependencies = ["fastapi", "uvicorn"]
      const arrayContent = line.substring(line.indexOf("[") + 1);
      if (arrayContent.includes("]")) {
        extractArrayDependencies(arrayContent.split("]")[0], packages);
        inDependenciesArray = false;
      } else {
        extractArrayDependencies(arrayContent, packages);
      }
      continue;
    }

    // Handling lines inside dependencies array
    if (inDependenciesArray) {
      if (line.includes("]")) {
        extractArrayDependencies(line.split("]")[0], packages);
        inDependenciesArray = false;
      } else {
        extractArrayDependencies(line, packages);
      }
      continue;
    }

    // Key-value dependency tables: [tool.poetry.dependencies], [tool.poetry.dev-dependencies], [project.dependencies]
    const isDependencySection =
      currentSection === "project.dependencies" ||
      currentSection.startsWith("project.optional-dependencies") ||
      currentSection === "tool.poetry.dependencies" ||
      currentSection === "tool.poetry.dev-dependencies" ||
      (currentSection.startsWith("tool.poetry.group.") && currentSection.endsWith(".dependencies"));

    if (isDependencySection) {
      const eqIndex = line.indexOf("=");
      if (eqIndex > 0) {
        let pkgName = line.substring(0, eqIndex).trim();
        // Remove surrounding quotes if present
        pkgName = pkgName.replace(/^["']|["']$/g, "").trim();
        if (pkgName && pkgName !== "python" && /^[a-zA-Z0-9_.-]+$/.test(pkgName)) {
          packages.add(normalizePythonPackageName(pkgName));
        }
      }
    }
  }

  return Array.from(packages);
}

function extractArrayDependencies(text: string, set: Set<string>): void {
  // Matches quoted strings like "django>=4.0" or 'fastapi'
  const matches = text.matchAll(/["']([^"']+)["']/g);
  for (const match of matches) {
    const raw = match[1].trim();
    // Strip version specifiers
    const versionMatch = raw.search(/[=<>~!@;]/);
    let pkgToken = versionMatch >= 0 ? raw.substring(0, versionMatch).trim() : raw;
    pkgToken = pkgToken.replace(/\[.*?\]/, "").trim();
    if (pkgToken && /^[a-zA-Z0-9_.-]+$/.test(pkgToken)) {
      set.add(normalizePythonPackageName(pkgToken));
    }
  }
}
