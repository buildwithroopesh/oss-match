/**
 * Weight Normalization & Composite Score Calculation
 *
 * Implements transparent weight renormalization over available components.
 * When observable data for a component is missing, it is excluded from the denominator,
 * and the remaining component weights are scaled so they sum to exactly 1.0 (100%).
 */

import type { MatchComponentName, MatchComponentScore } from "../types/matching";

export interface NormalizationResult {
  /** Composite score scaled to [0, 100], rounded to 1 decimal place */
  compositeScore: number;
  /** Normalized component scores with updated effective weights */
  components: Record<MatchComponentName, MatchComponentScore>;
  /** Total sum of base weights for available components */
  availableBaseWeight: number;
  /** Names of components that were unavailable */
  unavailableComponents: MatchComponentName[];
}

/**
 * Renormalizes weights over available components and calculates the composite match score.
 *
 * @param componentMap Map of the 7 evaluated components
 */
export function normalizeComponents(
  componentMap: Record<MatchComponentName, MatchComponentScore>
): NormalizationResult {
  const componentEntries = Object.entries(componentMap) as [
    MatchComponentName,
    MatchComponentScore,
  ][];

  // 1. Calculate sum of base weights for available components
  let availableBaseWeight = 0;
  const unavailableComponents: MatchComponentName[] = [];

  for (const [name, comp] of componentEntries) {
    if (comp.isAvailable && comp.score !== null) {
      availableBaseWeight += comp.baseWeight;
    } else {
      unavailableComponents.push(name);
    }
  }

  // 2. If no components are available, return score 0
  if (availableBaseWeight <= 0) {
    const updatedComponents = { ...componentMap };
    for (const [name] of componentEntries) {
      updatedComponents[name] = {
        ...updatedComponents[name],
        effectiveWeight: 0,
      };
    }

    return {
      compositeScore: 0.0,
      components: updatedComponents,
      availableBaseWeight: 0,
      unavailableComponents,
    };
  }

  // 3. Compute effective weights and weighted sum
  let weightedSum = 0;
  const updatedComponents = {} as Record<MatchComponentName, MatchComponentScore>;

  for (const [name, comp] of componentEntries) {
    if (comp.isAvailable && comp.score !== null) {
      const effectiveWeight = comp.baseWeight / availableBaseWeight;
      weightedSum += comp.score * effectiveWeight;

      updatedComponents[name] = {
        ...comp,
        effectiveWeight: Math.round(effectiveWeight * 10000) / 10000,
      };
    } else {
      updatedComponents[name] = {
        ...comp,
        effectiveWeight: 0,
      };
    }
  }

  // Scale composite score to [0, 100] and round to 1 decimal place
  const compositeScore = Math.min(
    100,
    Math.max(0, Math.round(weightedSum * 100 * 10) / 10)
  );

  return {
    compositeScore,
    components: updatedComponents,
    availableBaseWeight: Math.round(availableBaseWeight * 10000) / 10000,
    unavailableComponents,
  };
}
