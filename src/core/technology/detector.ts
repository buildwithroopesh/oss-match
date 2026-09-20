/**
 * Technology Detector Engine
 *
 * Evaluates repository artifacts against the declarative technology registry.
 * Strictly avoids arbitrary text/prose matching, substring matching, or external I/O.
 */

import type {
  TechnologyEvidence,
  RepositoryDetectionInput,
} from "../types/technology";
import {
  TechnologyRegistry,
  defaultTechnologyRegistry,
  type TechnologyDefinition,
} from "./registry";
import {
  parsePackageJson,
  parseRequirementsTxt,
  parsePyprojectToml,
  parseCargoToml,
  parseGoMod,
  parsePomXml,
} from "./parsers";

/**
 * Detects technology evidence within a single repository.
 *
 * @param repo Repository input data
 * @param registry Technology registry to match against (defaults to defaultTechnologyRegistry)
 * @returns Array of verified TechnologyEvidence items
 */
export function detectRepositoryTechnologies(
  repo: RepositoryDetectionInput,
  registry: TechnologyRegistry = defaultTechnologyRegistry
): TechnologyEvidence[] {
  const evidenceList: TechnologyEvidence[] = [];

  // Pre-parse manifests if available
  const parsedNpmDeps = repo.manifests?.packageJson
    ? parsePackageJson(repo.manifests.packageJson).dependencies
    : [];

  const parsedPipDeps = [
    ...(repo.manifests?.requirementsTxt ? parseRequirementsTxt(repo.manifests.requirementsTxt) : []),
    ...(repo.manifests?.pyprojectToml ? parsePyprojectToml(repo.manifests.pyprojectToml) : []),
  ];

  const parsedCargoDeps = repo.manifests?.cargoToml
    ? parseCargoToml(repo.manifests.cargoToml)
    : [];

  const parsedGoDeps = repo.manifests?.goMod
    ? parseGoMod(repo.manifests.goMod)
    : [];

  const parsedMavenDeps = repo.manifests?.pomXml
    ? parsePomXml(repo.manifests.pomXml)
    : [];

  // Normalized repository topics (exact tags, lowercase)
  const normalizedTopics = new Set(
    (repo.topics ?? []).map((t) => t.trim().toLowerCase())
  );

  // Normalized file paths
  const filePaths = repo.filePaths ?? [];

  // Normalized languages
  const repoLanguages = repo.languages ?? {};
  const normalizedLanguages = new Map<string, number>();
  for (const [lang, bytes] of Object.entries(repoLanguages)) {
    if (typeof bytes === "number" && bytes > 0) {
      normalizedLanguages.set(lang.toLowerCase(), bytes);
    }
  }

  // Evaluate each technology in registry
  for (const tech of registry.getAll()) {
    const techEvidence = evaluateTechnologySignals(
      tech,
      repo,
      {
        npmDeps: parsedNpmDeps,
        pipDeps: parsedPipDeps,
        cargoDeps: parsedCargoDeps,
        goDeps: parsedGoDeps,
        mavenDeps: parsedMavenDeps,
        topics: normalizedTopics,
        filePaths,
        languages: normalizedLanguages,
      }
    );

    evidenceList.push(...techEvidence);
  }

  return evidenceList;
}

interface ParsedContext {
  npmDeps: string[];
  pipDeps: string[];
  cargoDeps: string[];
  goDeps: string[];
  mavenDeps: string[];
  topics: Set<string>;
  filePaths: string[];
  languages: Map<string, number>;
}

function evaluateTechnologySignals(
  tech: TechnologyDefinition,
  repo: RepositoryDetectionInput,
  context: ParsedContext
): TechnologyEvidence[] {
  const evidence: TechnologyEvidence[] = [];
  const seenKeys = new Set<string>();

  for (const signal of tech.signals) {
    switch (signal.type) {
      case "dependency": {
        let matchedDeps: string[] = [];
        if (signal.packageManager === "npm") {
          matchedDeps = signal.names.filter((name) =>
            context.npmDeps.includes(name.toLowerCase())
          );
        } else if (signal.packageManager === "pip") {
          matchedDeps = signal.names.filter((name) =>
            context.pipDeps.includes(name.toLowerCase())
          );
        } else if (signal.packageManager === "cargo") {
          matchedDeps = signal.names.filter((name) =>
            context.cargoDeps.includes(name.toLowerCase())
          );
        } else if (signal.packageManager === "gomod") {
          matchedDeps = signal.names.filter((name) =>
            context.goDeps.includes(name.toLowerCase())
          );
        } else if (signal.packageManager === "maven") {
          matchedDeps = signal.names.filter((name) =>
            context.mavenDeps.includes(name.toLowerCase())
          );
        }

        for (const dep of matchedDeps) {
          const key = `dep:${signal.packageManager}:${dep}`;
          if (!seenKeys.has(key)) {
            seenKeys.add(key);
            evidence.push({
              technologyId: tech.id,
              repositoryName: repo.name,
              repositoryPushedAt: repo.pushedAt ?? repo.updatedAt ?? null,
              signalType: "dependency",
              signalStrength: signal.strength ?? "strong",
              detail: `Found ${signal.packageManager} dependency "${dep}" in manifest`,
            });
          }
        }
        break;
      }

      case "configFile": {
        for (const pattern of signal.patterns) {
          const matchedFile = context.filePaths.find((path) =>
            matchesPathPattern(path, pattern)
          );

          if (matchedFile) {
            const key = `cfg:${pattern}`;
            if (!seenKeys.has(key)) {
              seenKeys.add(key);
              evidence.push({
                technologyId: tech.id,
                repositoryName: repo.name,
                repositoryPushedAt: repo.pushedAt ?? repo.updatedAt ?? null,
                signalType: "configFile",
                signalStrength: signal.strength ?? "strong",
                detail: `Found configuration file "${matchedFile}" matching "${pattern}"`,
              });
            }
          }
        }
        break;
      }

      case "language": {
        for (const langName of signal.names) {
          const bytes = context.languages.get(langName.toLowerCase());
          if (bytes !== undefined && bytes > 0) {
            const key = `lang:${langName.toLowerCase()}`;
            if (!seenKeys.has(key)) {
              seenKeys.add(key);
              evidence.push({
                technologyId: tech.id,
                repositoryName: repo.name,
                repositoryPushedAt: repo.pushedAt ?? repo.updatedAt ?? null,
                signalType: "language",
                signalStrength: signal.strength ?? "strong",
                detail: `Detected ${bytes.toLocaleString()} bytes of ${langName} code`,
              });
            }
          }
        }
        break;
      }

      case "topic": {
        for (const topicVal of signal.values) {
          // Exact match only! Never substring or regex!
          if (context.topics.has(topicVal.toLowerCase())) {
            const key = `topic:${topicVal.toLowerCase()}`;
            if (!seenKeys.has(key)) {
              seenKeys.add(key);
              evidence.push({
                technologyId: tech.id,
                repositoryName: repo.name,
                repositoryPushedAt: repo.pushedAt ?? repo.updatedAt ?? null,
                signalType: "topic",
                signalStrength: signal.strength ?? "moderate",
                detail: `Found repository topic "${topicVal}"`,
              });
            }
          }
        }
        break;
      }

      case "filenamePattern": {
        for (const pattern of signal.patterns) {
          const matchedFile = context.filePaths.find((path) =>
            matchesExtensionPattern(path, pattern)
          );

          if (matchedFile) {
            const key = `fn:${pattern}`;
            if (!seenKeys.has(key)) {
              seenKeys.add(key);
              evidence.push({
                technologyId: tech.id,
                repositoryName: repo.name,
                repositoryPushedAt: repo.pushedAt ?? repo.updatedAt ?? null,
                signalType: "filenamePattern",
                signalStrength: signal.strength ?? "weak",
                detail: `Found files matching pattern "${pattern}" (e.g. "${matchedFile}")`,
              });
            }
          }
        }
        break;
      }
    }
  }

  return evidence;
}

/**
 * Checks if a file path matches a configuration file pattern.
 * Supports exact filenames, basename matches, and simple prefix wildcards.
 */
export function matchesPathPattern(filePath: string, pattern: string): boolean {
  const normalizedPath = filePath.replace(/\\/g, "/").toLowerCase();
  const normalizedPattern = pattern.replace(/\\/g, "/").toLowerCase();

  // 1. Exact match against full path
  if (normalizedPath === normalizedPattern) {
    return true;
  }

  // 2. Basename match (e.g. "path/to/Dockerfile" matches "Dockerfile")
  const basename = normalizedPath.split("/").pop() ?? "";
  if (basename === normalizedPattern) {
    return true;
  }

  // 3. Directory path match (e.g. ".github/workflows" matches ".github/workflows/ci.yml")
  const cleanDirPattern = normalizedPattern.replace(/\/+\*?$/, "");
  if (cleanDirPattern.length > 0 && normalizedPath.startsWith(`${cleanDirPattern}/`)) {
    return true;
  }

  // 4. Wildcard glob match (e.g. "next.config.*", ".github/workflows/*.yml")
  if (normalizedPattern.includes("*")) {
    const escaped = normalizedPattern.replace(/[.+?^${}()|[\]\\/]/g, "\\$&");
    const regexStr = "^" + escaped.replace(/\*/g, "[^/]*") + "$";
    const regex = new RegExp(regexStr);
    if (regex.test(normalizedPath) || regex.test(basename)) {
      return true;
    }
  }

  return false;
}

/**
 * Checks if a file path matches an extension pattern (e.g. "*.tsx", "*.py").
 */
export function matchesExtensionPattern(filePath: string, pattern: string): boolean {
  const normalizedPath = filePath.replace(/\\/g, "/").toLowerCase();
  const normalizedPattern = pattern.toLowerCase();

  if (normalizedPattern.startsWith("*.")) {
    const ext = normalizedPattern.substring(1); // e.g. ".tsx"
    return normalizedPath.endsWith(ext);
  }

  return matchesPathPattern(filePath, pattern);
}
