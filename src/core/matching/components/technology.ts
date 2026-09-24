/**
 * Technology Component Scorer (Base Weight: 35%)
 *
 * Compares detected technologies from the user's TechnologyProfile against
 * structured issue labels ONLY.
 *
 * Strict Data-Honesty & Evidence Boundary:
 * - Does NOT inspect issue title or body prose.
 * - Does NOT use repository topics (topics are reserved for Framework/Topic).
 * - Matches strictly against verified, structured issue labels.
 */

import type { TechnologyProfile } from "../../types/technology";
import type { DiscoveredIssue } from "../../types/issues";
import type { MatchComponentScore } from "../../types/matching";
import { defaultTechnologyRegistry, type TechnologyRegistry } from "../../technology/registry";

export interface TechnologyScorerResult {
  component: MatchComponentScore;
  matchedTechnologies: string[];
}

export function evaluateTechnologyComponent(
  profile: TechnologyProfile,
  issue: DiscoveredIssue,
  baseWeight = 0.35,
  registry: TechnologyRegistry = defaultTechnologyRegistry
): TechnologyScorerResult {
  const { signals } = issue;
  const labelNames = signals.labelNames ?? [];

  // Check availability: if issue has no structured labels, technology label evidence is unavailable
  if (labelNames.length === 0) {
    return {
      component: {
        name: "technology",
        baseWeight,
        effectiveWeight: 0,
        score: null,
        isAvailable: false,
        explanation: "No observable technology labels found on the issue.",
      },
      matchedTechnologies: [],
    };
  }

  // Build a normalized set of issue label tokens ONLY
  const issueLabelTokens = new Set<string>();
  for (const label of labelNames) {
    issueLabelTokens.add(label.toLowerCase().trim());
  }

  const matchedTechNames: string[] = [];
  let maxEvidenceWeight = 0;
  let matchCount = 0;

  for (const detected of profile.technologies) {
    const techId = detected.id.toLowerCase();
    const techName = detected.name.toLowerCase();

    // Check direct ID or name match against issue labels
    let isMatched = issueLabelTokens.has(techId) || issueLabelTokens.has(techName);

    // If not directly matched, check aliases via registry if available
    if (!isMatched) {
      const def = registry.getById(detected.id);
      if (def) {
        if (def.aliases.some((alias) => issueLabelTokens.has(alias.toLowerCase()))) {
          isMatched = true;
        }
      }
    }

    if (isMatched) {
      matchedTechNames.push(detected.name);
      matchCount += 1;

      // Weight based on user evidence level
      let evidenceWeight = 0.5;
      if (detected.evidenceLevel === "strong") {
        evidenceWeight = 1.0;
      } else if (detected.evidenceLevel === "moderate") {
        evidenceWeight = 0.8;
      } else if (detected.evidenceLevel === "limited") {
        evidenceWeight = 0.6;
      } else if (detected.evidenceLevel === "detected") {
        evidenceWeight = 0.4;
      }

      if (evidenceWeight > maxEvidenceWeight) {
        maxEvidenceWeight = evidenceWeight;
      }
    }
  }

  // If no match found among issue labels
  if (matchCount === 0) {
    return {
      component: {
        name: "technology",
        baseWeight,
        effectiveWeight: 0,
        score: 0.0,
        isAvailable: true,
        explanation: "No detected technologies in your profile matched the issue's labels.",
      },
      matchedTechnologies: [],
    };
  }

  // Saturated score: primary match evidence weight + bonus for multiple matching technologies
  const bonus = Math.min(0.2, (matchCount - 1) * 0.1);
  const score = Math.min(1.0, Math.round((maxEvidenceWeight * 0.8 + bonus) * 100) / 100);

  const matchedListStr = matchedTechNames.join(", ");
  const explanation = `Matched ${matchCount} observed technolog${
    matchCount === 1 ? "y" : "ies"
  } from issue labels: ${matchedListStr}.`;

  return {
    component: {
      name: "technology",
      baseWeight,
      effectiveWeight: 0,
      score,
      isAvailable: true,
      explanation,
    },
    matchedTechnologies: matchedTechNames,
  };
}
