/**
 * Matching Engine Core
 *
 * Evaluates candidate open-source issues against a user's verified technology profile
 * using 7 observable scoring components, transparent weight renormalization,
 * factual explanations, and deterministic sorting with stable tie-breakers.
 */

import type { TechnologyProfile } from "../types/technology";
import type { GitHubIssue } from "../types/github";
import type { DiscoveredIssue } from "../types/issues";
import type {
  IssueMatch,
  MatchComponentName,
  MatchComponentScore,
  MatchingOptions,
  MatchingResult,
} from "../types/matching";
import { extractIssueSignals } from "../issues/signals";
import { defaultTechnologyRegistry } from "../technology/registry";
import { DEFAULT_COMPONENT_WEIGHTS } from "./constants";
import { evaluateTechnologyComponent } from "./components/technology";
import { evaluateLanguageComponent } from "./components/language";
import { evaluateFrameworkComponent } from "./components/framework";
import { evaluateSuitabilityComponent } from "./components/suitability";
import { evaluateActivityComponent } from "./components/activity";
import { evaluateFreshnessComponent } from "./components/freshness";
import { evaluateDifficultyComponent } from "./components/difficulty";
import { normalizeComponents } from "./normalization";
import { buildMatchExplanation } from "./explanation";

/**
 * Type guard to distinguish a DiscoveredIssue from a raw GitHubIssue.
 */
function isDiscoveredIssue(item: DiscoveredIssue | GitHubIssue): item is DiscoveredIssue {
  return "signals" in item && "issue" in item && item.signals !== undefined;
}

/**
 * Evaluates a single candidate issue against a user profile.
 *
 * @param profile Validated TechnologyProfile
 * @param candidate DiscoveredIssue or raw GitHubIssue
 * @param options Configuration options including injected `now` and custom weights
 */
export function matchIssue(
  profile: TechnologyProfile,
  candidate: DiscoveredIssue | GitHubIssue,
  options: MatchingOptions = {}
): IssueMatch {
  const now = options.now ?? new Date();
  const registry = options.registry ?? defaultTechnologyRegistry;

  // Ensure candidate has extracted signals
  const discoveredIssue: DiscoveredIssue = isDiscoveredIssue(candidate)
    ? candidate
    : { issue: candidate, signals: extractIssueSignals(candidate, now) };

  // Resolve base weights
  const weights: Record<MatchComponentName, number> = {
    technology: options.weights?.technology ?? DEFAULT_COMPONENT_WEIGHTS.technology,
    language: options.weights?.language ?? DEFAULT_COMPONENT_WEIGHTS.language,
    framework: options.weights?.framework ?? DEFAULT_COMPONENT_WEIGHTS.framework,
    suitability: options.weights?.suitability ?? DEFAULT_COMPONENT_WEIGHTS.suitability,
    activity: options.weights?.activity ?? DEFAULT_COMPONENT_WEIGHTS.activity,
    freshness: options.weights?.freshness ?? DEFAULT_COMPONENT_WEIGHTS.freshness,
    difficulty: options.weights?.difficulty ?? DEFAULT_COMPONENT_WEIGHTS.difficulty,
  };

  // 1. Evaluate individual components
  const techResult = evaluateTechnologyComponent(
    profile,
    discoveredIssue,
    weights.technology,
    registry
  );
  const langResult = evaluateLanguageComponent(
    profile,
    discoveredIssue,
    weights.language
  );
  const fwResult = evaluateFrameworkComponent(
    profile,
    discoveredIssue,
    weights.framework
  );
  const suitResult = evaluateSuitabilityComponent(
    discoveredIssue,
    weights.suitability
  );
  const actResult = evaluateActivityComponent(
    discoveredIssue,
    weights.activity
  );
  const freshResult = evaluateFreshnessComponent(
    discoveredIssue,
    weights.freshness
  );
  const diffResult = evaluateDifficultyComponent(
    discoveredIssue,
    weights.difficulty
  );

  // 2. Assemble raw component scores map
  const componentMap: Record<MatchComponentName, MatchComponentScore> = {
    technology: techResult.component,
    language: langResult.component,
    framework: fwResult.component,
    suitability: suitResult.component,
    activity: actResult.component,
    freshness: freshResult.component,
    difficulty: diffResult.component,
  };

  // 3. Renormalize weights over available components and compute composite score
  const norm = normalizeComponents(componentMap);

  // 4. Generate factual audit explanation
  const explanation = buildMatchExplanation({
    profile,
    issue: discoveredIssue,
    components: norm.components,
    unavailableComponents: norm.unavailableComponents,
    matchedTechnologies: techResult.matchedTechnologies,
    matchedLanguages: langResult.matchedLanguages,
    matchedTopics: fwResult.matchedTopics,
    suitabilityHighlights: suitResult.highlights,
    activitySummary: actResult.activitySummary,
  });

  return {
    issue: discoveredIssue.issue,
    signals: discoveredIssue.signals,
    score: norm.compositeScore,
    components: norm.components,
    explanation,
  };
}

/**
 * Matches a list of candidate issues against a user profile and returns deterministically sorted results.
 *
 * @param profile Validated TechnologyProfile
 * @param candidates Array of DiscoveredIssue or raw GitHubIssue items
 * @param options Matching options including injected `now`
 */
export function matchIssues(
  profile: TechnologyProfile,
  candidates: (DiscoveredIssue | GitHubIssue)[],
  options: MatchingOptions = {}
): MatchingResult {
  const now = options.now ?? new Date();
  const minScore = options.minScore ?? 0;

  // 1. Score all candidate issues
  const matches: IssueMatch[] = [];
  for (const candidate of candidates) {
    const scored = matchIssue(profile, candidate, { ...options, now });
    if (scored.score >= minScore) {
      matches.push(scored);
    }
  }

  // 2. Deterministic sorting:
  //    Primary: composite score descending
  //    Secondary: recency of update (daysSinceUpdated ascending)
  //    Tertiary (stable tie-breaker): issue.id ascending
  matches.sort((a, b) => {
    if (b.score !== a.score) {
      return b.score - a.score;
    }
    const daysDiff = a.signals.daysSinceUpdated - b.signals.daysSinceUpdated;
    if (daysDiff !== 0) {
      return daysDiff;
    }
    return a.issue.id < b.issue.id ? -1 : 1;
  });

  return {
    matches,
    profile,
    metadata: {
      matchedAt: now.toISOString(),
      totalCandidateIssues: candidates.length,
      matchedIssuesCount: matches.length,
      referenceNow: now.toISOString(),
    },
  };
}
