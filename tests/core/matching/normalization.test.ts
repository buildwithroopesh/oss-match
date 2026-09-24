import { describe, it, expect } from "vitest";
import { normalizeComponents } from "@/core/matching/normalization";
import type { MatchComponentName, MatchComponentScore } from "@/core/types/matching";
import { DEFAULT_COMPONENT_WEIGHTS } from "@/core/matching/constants";

function createMockComponentMap(
  overrides: Partial<Record<MatchComponentName, Partial<MatchComponentScore>>> = {}
): Record<MatchComponentName, MatchComponentScore> {
  const map = {} as Record<MatchComponentName, MatchComponentScore>;
  const names: MatchComponentName[] = [
    "technology",
    "language",
    "framework",
    "suitability",
    "activity",
    "freshness",
    "difficulty",
  ];

  for (const name of names) {
    const override = overrides[name];
    map[name] = {
      name,
      baseWeight: DEFAULT_COMPONENT_WEIGHTS[name],
      effectiveWeight: 0,
      score: override?.score !== undefined ? override.score : 1.0,
      isAvailable: override?.isAvailable !== undefined ? override.isAvailable : true,
      explanation: override?.explanation ?? `${name} explanation`,
    };
  }

  return map;
}

describe("normalizeComponents", () => {
  it("normalizes cleanly when all 7 components are available and score is 1.0", () => {
    const map = createMockComponentMap();
    const result = normalizeComponents(map);

    expect(result.compositeScore).toBe(100.0);
    expect(result.availableBaseWeight).toBe(1.0);
    expect(result.unavailableComponents).toHaveLength(0);

    // Sum of effective weights must equal 1.0
    const effectiveSum = Object.values(result.components).reduce(
      (acc, c) => acc + c.effectiveWeight,
      0
    );
    expect(Math.abs(effectiveSum - 1.0)).toBeLessThan(0.001);
  });

  it("renormalizes weights when difficulty is unavailable (omitted from denominator)", () => {
    const map = createMockComponentMap({
      difficulty: { isAvailable: false, score: null },
    });

    const result = normalizeComponents(map);

    expect(result.unavailableComponents).toContain("difficulty");
    expect(result.availableBaseWeight).toBe(0.95);
    expect(result.components.difficulty.effectiveWeight).toBe(0);

    // Technology base weight is 0.35 -> effective weight should be 0.35 / 0.95 = ~0.3684
    expect(result.components.technology.effectiveWeight).toBeCloseTo(0.35 / 0.95, 3);

    // Sum of available effective weights must equal 1.0
    const effectiveSum = Object.values(result.components).reduce(
      (acc, c) => acc + c.effectiveWeight,
      0
    );
    expect(Math.abs(effectiveSum - 1.0)).toBeLessThan(0.001);

    // If all available components have score 1.0, composite score is still 100.0
    expect(result.compositeScore).toBe(100.0);
  });

  it("renormalizes weights when multiple components are unavailable", () => {
    const map = createMockComponentMap({
      difficulty: { isAvailable: false, score: null },
      framework: { isAvailable: false, score: null },
      language: { isAvailable: false, score: null },
    });

    // Available base weights: technology (0.35) + suitability (0.10) + activity (0.10) + freshness (0.05) = 0.60
    const result = normalizeComponents(map);

    expect(result.availableBaseWeight).toBe(0.60);
    expect(result.unavailableComponents).toEqual(["language", "framework", "difficulty"]);

    expect(result.components.technology.effectiveWeight).toBeCloseTo(0.35 / 0.60, 3);
    expect(result.components.suitability.effectiveWeight).toBeCloseTo(0.10 / 0.60, 3);

    const effectiveSum = Object.values(result.components).reduce(
      (acc, c) => acc + c.effectiveWeight,
      0
    );
    expect(Math.abs(effectiveSum - 1.0)).toBeLessThan(0.001);
  });

  it("handles edge case where all components are unavailable", () => {
    const map = createMockComponentMap({
      technology: { isAvailable: false, score: null },
      language: { isAvailable: false, score: null },
      framework: { isAvailable: false, score: null },
      suitability: { isAvailable: false, score: null },
      activity: { isAvailable: false, score: null },
      freshness: { isAvailable: false, score: null },
      difficulty: { isAvailable: false, score: null },
    });

    const result = normalizeComponents(map);

    expect(result.compositeScore).toBe(0.0);
    expect(result.availableBaseWeight).toBe(0);
    expect(result.unavailableComponents).toHaveLength(7);
  });

  it("computes accurate weighted composite score and rounds to 1 decimal place", () => {
    const map = createMockComponentMap({
      technology: { score: 0.8 },
      language: { score: 1.0 },
      framework: { score: 0.7 },
      suitability: { score: 0.9 },
      activity: { score: 1.0 },
      freshness: { score: 0.8 },
      difficulty: { isAvailable: false, score: null },
    });

    // Expected weighted sum over 0.95:
    // (0.8*0.35 + 1.0*0.20 + 0.7*0.15 + 0.9*0.10 + 1.0*0.10 + 0.8*0.05) / 0.95
    // = (0.28 + 0.20 + 0.105 + 0.09 + 0.10 + 0.04) / 0.95
    // = 0.815 / 0.95 = 0.857894... * 100 = 85.8
    const result = normalizeComponents(map);

    expect(result.compositeScore).toBe(85.8);
  });
});
