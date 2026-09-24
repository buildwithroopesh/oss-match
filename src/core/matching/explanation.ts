/**
 * Factual Match Explanation Generator
 *
 * Generates transparent, verifiable explanations grounded 100% in observable facts.
 * Never claims personal expertise, skill mastery, or subjective difficulty.
 */

import type { TechnologyProfile } from "../types/technology";
import type { DiscoveredIssue } from "../types/issues";
import type {
  MatchComponentName,
  MatchComponentScore,
  MatchExplanation,
} from "../types/matching";

export interface ExplanationInput {
  profile: TechnologyProfile;
  issue: DiscoveredIssue;
  components: Record<MatchComponentName, MatchComponentScore>;
  unavailableComponents: MatchComponentName[];
  matchedTechnologies: string[];
  matchedLanguages: Array<{ language: string; userPercentage: number }>;
  matchedTopics: string[];
  suitabilityHighlights: string[];
  activitySummary: string;
}

export function buildMatchExplanation(input: ExplanationInput): MatchExplanation {
  const {
    profile,
    issue,
    components,
    unavailableComponents,
    matchedTechnologies,
    matchedLanguages,
    matchedTopics,
    suitabilityHighlights,
    activitySummary,
  } = input;

  const reasons: string[] = [];
  const gaps: string[] = [];

  // 1. Language reason
  const langComp = components.language;
  if (langComp.isAvailable && langComp.score !== null && langComp.score > 0) {
    if (matchedLanguages.length > 0) {
      reasons.push(
        `Primary language ${matchedLanguages[0].language} accounts for ${matchedLanguages[0].userPercentage}% of your analyzed code volume.`
      );
    }
  } else if (langComp.isAvailable && issue.signals.primaryLanguage) {
    gaps.push(
      `Primary repository language ${issue.signals.primaryLanguage} was not observed in your public repositories.`
    );
  }

  // 2. Technology reasons
  const techComp = components.technology;
  if (techComp.isAvailable && techComp.score !== null && techComp.score > 0) {
    if (matchedTechnologies.length > 0) {
      reasons.push(
        `Matches detected technology evidence from your profile: ${matchedTechnologies.join(", ")}.`
      );
    }
  }

  // 3. Framework / Topic reasons
  const fwComp = components.framework;
  if (fwComp.isAvailable && fwComp.score !== null && fwComp.score > 0) {
    if (matchedTopics.length > 0) {
      reasons.push(
        `Repository topic(s) match frameworks observed in your repositories: ${matchedTopics.join(", ")}.`
      );
    }
  }

  // 4. Suitability reasons
  const suitComp = components.suitability;
  if (suitComp.isAvailable && suitComp.score !== null && suitComp.score >= 0.4) {
    reasons.push(suitComp.explanation);
  }

  // 5. Activity reasons
  const actComp = components.activity;
  if (actComp.isAvailable && actComp.score !== null && actComp.score >= 0.4) {
    reasons.push(actComp.explanation);
  }

  // 6. Freshness reasons
  const freshComp = components.freshness;
  if (freshComp.isAvailable && freshComp.score !== null && freshComp.score >= 0.6) {
    reasons.push(freshComp.explanation);
  }

  // 7. Difficulty reasons
  const diffComp = components.difficulty;
  if (diffComp.isAvailable && diffComp.score !== null) {
    reasons.push(diffComp.explanation);
  }

  // 8. Observable gaps: detect technology-relevant labels on the issue not present in user profile
  const userTechIds = new Set(profile.technologies.map((t) => t.id.toLowerCase()));
  const userTechNames = new Set(profile.technologies.map((t) => t.name.toLowerCase()));
  for (const label of issue.signals.labelNames) {
    const cleanLabel = label.toLowerCase().trim();
    // Ignore meta labels like 'bug', 'enhancement', 'documentation', difficulty labels
    if (
      cleanLabel !== "bug" &&
      cleanLabel !== "enhancement" &&
      cleanLabel !== "documentation" &&
      cleanLabel !== "good first issue" &&
      cleanLabel !== "help wanted" &&
      cleanLabel.length > 2 &&
      !userTechIds.has(cleanLabel) &&
      !userTechNames.has(cleanLabel) &&
      !matchedTechnologies.map((m) => m.toLowerCase()).includes(cleanLabel)
    ) {
      // Check if it looks like a tech tag (e.g. 'graphql', 'vue', 'kubernetes')
      if (
        cleanLabel.includes("react") ||
        cleanLabel.includes("vue") ||
        cleanLabel.includes("angular") ||
        cleanLabel.includes("rust") ||
        cleanLabel.includes("go") ||
        cleanLabel.includes("python") ||
        cleanLabel.includes("database")
      ) {
        gaps.push(`Issue specifies '${label}' which was not detected in your analyzed repositories.`);
      }
    }
  }

  return {
    matchedTechnologies,
    matchedLanguages,
    matchedTopics,
    suitabilityHighlights,
    activitySummary,
    unavailableComponents,
    reasons,
    gaps,
  };
}
