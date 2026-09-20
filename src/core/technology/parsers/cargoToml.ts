/**
 * Safe parser for Rust Cargo.toml files
 *
 * Extracts crate dependencies from `[dependencies]`, `[dev-dependencies]`,
 * `[build-dependencies]`, and `[workspace.dependencies]`.
 */

/**
 * Parses Cargo.toml content into a list of normalized crate names.
 * Uses a safe line-oriented state machine; never throws on malformed input.
 */
export function parseCargoToml(content: string | undefined | null): string[] {
  if (!content || typeof content !== "string") {
    return [];
  }

  const lines = content.split(/\r?\n/);
  const crates = new Set<string>();

  let inDepSection = false;

  for (const rawLine of lines) {
    const line = rawLine.split("#")[0].trim();
    if (!line) continue;

    // Detect section headers e.g. [dependencies], [dependencies.serde]
    if (line.startsWith("[") && line.endsWith("]")) {
      const section = line.slice(1, -1).trim().toLowerCase();

      // Check for table header like [dependencies.serde]
      if (
        section.startsWith("dependencies.") ||
        section.startsWith("dev-dependencies.") ||
        section.startsWith("build-dependencies.")
      ) {
        const crateName = section.split(".")[1]?.trim();
        if (crateName && /^[a-zA-Z0-9_-]+$/.test(crateName)) {
          crates.add(crateName.toLowerCase());
        }
        inDepSection = false;
        continue;
      }

      // Check if entering a general dependency section
      inDepSection =
        section === "dependencies" ||
        section === "dev-dependencies" ||
        section === "build-dependencies" ||
        section === "workspace.dependencies" ||
        section.endsWith(".dependencies");
      continue;
    }

    if (inDepSection) {
      const eqIndex = line.indexOf("=");
      if (eqIndex > 0) {
        let crateName = line.substring(0, eqIndex).trim();
        // Strip quotes if any
        crateName = crateName.replace(/^["']|["']$/g, "").trim();
        if (crateName && /^[a-zA-Z0-9_-]+$/.test(crateName)) {
          crates.add(crateName.toLowerCase());
        }
      }
    }
  }

  return Array.from(crates);
}
