/**
 * Evidence Aggregator & Technology Profile Builder
 *
 * Aggregates evidence across repositories into verified DetectedTechnology
 * items, evaluates evidence levels, and computes deterministic recency metrics.
 */

import type {
  TechnologyEvidence,
  DetectedTechnology,
  TechnologyProfile,
  EvidenceLevel,
  RepositoryDetectionInput,
  LanguageFootprintEntry,
} from "../types/technology";
import {
  TechnologyRegistry,
  defaultTechnologyRegistry,
} from "./registry";
import { detectRepositoryTechnologies } from "./detector";

export interface AggregationOptions {
  /** Injected reference time for deterministic recency calculations */
  now?: Date;
  /** Custom technology registry (defaults to defaultTechnologyRegistry) */
  registry?: TechnologyRegistry;
}

export interface BuildProfileOptions extends AggregationOptions {
  userId: string;
  /** Injected reference time (mandatory for profile building) */
  now: Date;
  /** Separately computed language footprint entries */
  languageFootprint?: LanguageFootprintEntry[];
}

/** Evidence level ranking for deterministic sorting */
const EVIDENCE_LEVEL_RANK: Record<EvidenceLevel, number> = {
  strong: 4,
  moderate: 3,
  limited: 2,
  detected: 1,
};

/**
 * Aggregates raw TechnologyEvidence items into structured DetectedTechnology records.
 */
export function aggregateDetectedTechnologies(
  evidenceList: TechnologyEvidence[],
  options?: AggregationOptions
): DetectedTechnology[] {
  const registry = options?.registry ?? defaultTechnologyRegistry;
  const now = options?.now;

  // Group evidence items by technologyId
  const grouped = new Map<string, TechnologyEvidence[]>();
  for (const ev of evidenceList) {
    const list = grouped.get(ev.technologyId) ?? [];
    list.push(ev);
    grouped.set(ev.technologyId, list);
  }

  const results: DetectedTechnology[] = [];

  for (const [techId, items] of grouped.entries()) {
    const techDef = registry.getById(techId);
    const techName = techDef?.name ?? techId;
    const techCategory = techDef?.category ?? "tool";

    // Collect distinct repositories
    const repoSet = new Set<string>();
    const strongRepoSet = new Set<string>();
    const moderateRepoSet = new Set<string>();
    let strongSignalsCount = 0;
    let moderateSignalsCount = 0;
    let weakSignalsCount = 0;

    // Track unique signal types per repository to prevent duplicate inflation
    const repoSignalTypes = new Map<string, Set<string>>();

    let latestPushedTimestamp = -Infinity;
    let latestPushedIso: string | null = null;

    for (const item of items) {
      repoSet.add(item.repositoryName);

      const sigTypes = repoSignalTypes.get(item.repositoryName) ?? new Set<string>();
      sigTypes.add(item.signalType);
      repoSignalTypes.set(item.repositoryName, sigTypes);

      if (item.signalStrength === "strong") {
        strongSignalsCount += 1;
        strongRepoSet.add(item.repositoryName);
      } else if (item.signalStrength === "moderate") {
        moderateSignalsCount += 1;
        moderateRepoSet.add(item.repositoryName);
      } else {
        weakSignalsCount += 1;
      }

      if (item.repositoryPushedAt) {
        const time = new Date(item.repositoryPushedAt).getTime();
        if (!isNaN(time) && time > latestPushedTimestamp) {
          latestPushedTimestamp = time;
          latestPushedIso = item.repositoryPushedAt;
        }
      }
    }

    // Evaluate evidence level according to strict guardrails:
    // Strong:
    // - >= 2 distinct repositories with strong signals, OR
    // - In 1 repo: >= 2 distinct strong signal types (e.g. dependency AND config file), OR
    // - 1 strong signal + >= 2 distinct repos with moderate signals.
    // Moderate:
    // - >= 1 strong signal in any repository, OR
    // - >= 2 moderate signals across repositories.
    // Limited:
    // - Only weak signals (e.g. filename patterns like *.tsx alone), OR
    // - A single isolated moderate signal (e.g. 1 topic in 1 repo).
    let evidenceLevel: EvidenceLevel = "limited";

    const hasMultiRepoStrong = strongRepoSet.size >= 2;
    let hasMultiSignalTypeStrongInSingleRepo = false;
    for (const [repoName, types] of repoSignalTypes.entries()) {
      if (strongRepoSet.has(repoName) && types.size >= 2) {
        // e.g. dependency + configFile in the same repository
        const strongTypesInRepo = items.filter(
          (i) => i.repositoryName === repoName && i.signalStrength === "strong"
        );
        const distinctStrongSignalTypes = new Set(strongTypesInRepo.map((i) => i.signalType));
        if (distinctStrongSignalTypes.size >= 2) {
          hasMultiSignalTypeStrongInSingleRepo = true;
          break;
        }
      }
    }

    if (
      hasMultiRepoStrong ||
      hasMultiSignalTypeStrongInSingleRepo ||
      (strongSignalsCount >= 1 && moderateRepoSet.size >= 2)
    ) {
      evidenceLevel = "strong";
    } else if (strongSignalsCount >= 1 || moderateSignalsCount >= 2) {
      evidenceLevel = "moderate";
    } else {
      evidenceLevel = "limited";
    }

    // Generate human-readable summary bullets
    const evidenceSummary = generateEvidenceSummary({
      items,
      repoCount: repoSet.size,
      strongRepoCount: strongRepoSet.size,
      moderateRepoCount: moderateRepoSet.size,
      weakSignalsCount,
    });

    // Compute daysSinceMostRecent if `now` is provided
    let daysSinceMostRecent: number | null = null;
    if (now && latestPushedTimestamp > -Infinity) {
      const diffMs = now.getTime() - latestPushedTimestamp;
      daysSinceMostRecent = Math.max(0, Math.floor(diffMs / (1000 * 60 * 60 * 24)));
    }

    results.push({
      id: techId,
      name: techName,
      category: techCategory,
      evidenceLevel,
      evidenceSummary,
      evidence: items,
      repositoryCount: repoSet.size,
      repositories: Array.from(repoSet).sort((a, b) => (a < b ? -1 : a > b ? 1 : 0)),
      mostRecentAt: latestPushedIso,
      daysSinceMostRecent,
    });
  }

  // Deterministic sorting:
  // 1. Evidence level rank descending
  // 2. Repository count descending
  // 3. Alphabetical name ascending (locale-independent)
  return results.sort((a, b) => {
    const rankA = EVIDENCE_LEVEL_RANK[a.evidenceLevel];
    const rankB = EVIDENCE_LEVEL_RANK[b.evidenceLevel];
    if (rankB !== rankA) {
      return rankB - rankA;
    }
    if (b.repositoryCount !== a.repositoryCount) {
      return b.repositoryCount - a.repositoryCount;
    }
    if (a.name < b.name) return -1;
    if (a.name > b.name) return 1;
    return 0;
  });
}

function generateEvidenceSummary(params: {
  items: TechnologyEvidence[];
  repoCount: number;
  strongRepoCount: number;
  moderateRepoCount: number;
  weakSignalsCount: number;
}): string[] {
  const summary: string[] = [];
  const { items, repoCount } = params;

  // Breakdown by signal type
  const deps = items.filter((i) => i.signalType === "dependency");
  const configs = items.filter((i) => i.signalType === "configFile");
  const langs = items.filter((i) => i.signalType === "language");
  const topics = items.filter((i) => i.signalType === "topic");
  const filenames = items.filter((i) => i.signalType === "filenamePattern");

  if (deps.length > 0) {
    const depRepos = new Set(deps.map((d) => d.repositoryName)).size;
    summary.push(`Verified dependency in ${depRepos} ${depRepos === 1 ? "repository" : "repositories"}`);
  }

  if (configs.length > 0) {
    const cfgRepos = new Set(configs.map((c) => c.repositoryName)).size;
    summary.push(`Configuration files detected across ${cfgRepos} ${cfgRepos === 1 ? "repository" : "repositories"}`);
  }

  if (langs.length > 0) {
    summary.push(`Direct language code presence verified`);
  }

  if (topics.length > 0) {
    summary.push(`Repository topic matches in ${topics.length} ${topics.length === 1 ? "repository" : "repositories"}`);
  }

  if (filenames.length > 0 && summary.length === 0) {
    summary.push(`Supporting filename patterns detected`);
  }

  if (summary.length === 0) {
    summary.push(`Detected in ${repoCount} ${repoCount === 1 ? "repository" : "repositories"}`);
  }

  return summary;
}

/**
 * Builds a complete TechnologyProfile from an array of analyzed repository inputs.
 */
export function buildTechnologyProfile(
  repositories: RepositoryDetectionInput[],
  options: BuildProfileOptions
): TechnologyProfile {
  const registry = options.registry ?? defaultTechnologyRegistry;
  const allEvidence: TechnologyEvidence[] = [];

  for (const repo of repositories) {
    const repoEvidence = detectRepositoryTechnologies(repo, registry);
    allEvidence.push(...repoEvidence);
  }

  const technologies = aggregateDetectedTechnologies(allEvidence, {
    now: options.now,
    registry,
  });

  return {
    userId: options.userId,
    analyzedAt: options.now.toISOString(),
    repositoriesAnalyzed: repositories.length,
    technologies,
    languageFootprint: options.languageFootprint ?? [],
  };
}
