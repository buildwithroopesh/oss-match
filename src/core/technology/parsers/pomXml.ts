/**
 * Safe parser for Java Maven pom.xml files
 *
 * Extracts dependency coordinates (`groupId:artifactId`, `artifactId`, and `groupId`)
 * from `<dependency>` blocks without requiring external XML parsing libraries.
 */

/**
 * Parses pom.xml content into a list of normalized dependency strings.
 * Never throws on malformed XML.
 */
export function parsePomXml(content: string | undefined | null): string[] {
  if (!content || typeof content !== "string") {
    return [];
  }

  const dependencies = new Set<string>();

  // Extract <dependency>...</dependency> blocks
  const depBlockRegex = /<dependency>([\s\S]*?)<\/dependency>/gi;
  let match: RegExpExecArray | null;

  while ((match = depBlockRegex.exec(content)) !== null) {
    const block = match[1];

    const groupIdMatch = /<groupId>\s*([^<\s]+)\s*<\/groupId>/i.exec(block);
    const artifactIdMatch = /<artifactId>\s*([^<\s]+)\s*<\/artifactId>/i.exec(block);

    const groupId = groupIdMatch ? groupIdMatch[1].trim().toLowerCase() : "";
    const artifactId = artifactIdMatch ? artifactIdMatch[1].trim().toLowerCase() : "";

    if (groupId && artifactId) {
      dependencies.add(`${groupId}:${artifactId}`);
    }
    if (artifactId) {
      dependencies.add(artifactId);
    }
    if (groupId) {
      dependencies.add(groupId);
    }
  }

  return Array.from(dependencies);
}
