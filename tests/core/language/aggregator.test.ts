import { describe, it, expect } from "vitest";
import {
  aggregateLanguageFootprint,
  DEFAULT_TOP_LANGUAGES,
} from "@/core/language/aggregator";
import type { RepositoryLanguageData } from "@/core/types/language";

describe("aggregateLanguageFootprint", () => {
  it("aggregates language byte counts across multiple repositories accurately", () => {
    const repos: RepositoryLanguageData[] = [
      {
        repositoryName: "buildwithroopesh/repo-a",
        languages: {
          TypeScript: 60000,
          HTML: 10000,
        },
      },
      {
        repositoryName: "buildwithroopesh/repo-b",
        languages: {
          TypeScript: 40000,
          CSS: 10000,
        },
      },
    ];

    const footprint = aggregateLanguageFootprint(repos);

    expect(footprint.totalBytes).toBe(120000);
    expect(footprint.analyzedRepositoriesCount).toBe(2);
    expect(footprint.skippedRepositoriesCount).toBe(0);
    expect(footprint.totalRepositoriesCount).toBe(2);
    expect(footprint.uniqueLanguagesCount).toBe(3);

    // TypeScript: 100,000 / 120,000 = 83.333% -> 83%
    // HTML: 10,000 / 120,000 = 8.333% -> 8% or 9%
    // CSS: 10,000 / 120,000 = 8.333% -> 8% or 9%
    const ts = footprint.entries.find((e) => e.language === "TypeScript");
    expect(ts?.bytes).toBe(100000);
    expect(ts?.color).toBe("#3178C6");

    // Exact sum verification: 100%
    const sum = footprint.entries.reduce((acc, curr) => acc + curr.percentage, 0);
    expect(sum).toBe(100);
  });

  it("handles single repository with a single language (100%)", () => {
    const repos: RepositoryLanguageData[] = [
      {
        repositoryName: "single-lang-repo",
        languages: { Python: 50000 },
      },
    ];

    const footprint = aggregateLanguageFootprint(repos);

    expect(footprint.entries).toHaveLength(1);
    expect(footprint.entries[0].language).toBe("Python");
    expect(footprint.entries[0].percentage).toBe(100);
    expect(footprint.entries[0].color).toBe("#3776AB");
  });

  it("collapses remaining languages into 'Other' when unique languages exceed topLimit", () => {
    // 10 distinct languages with default topLimit = 8
    const repos: RepositoryLanguageData[] = [
      {
        repositoryName: "polyglot-repo",
        languages: {
          TypeScript: 50000, // Top 1
          JavaScript: 25000, // Top 2
          Python: 15000,     // Top 3
          Go: 10000,         // Top 4
          Rust: 8000,        // Top 5
          Java: 6000,        // Top 6
          Ruby: 4000,        // Top 7 (cutoff for topLimit - 1)
          PHP: 3000,         // Overflow -> Other
          Kotlin: 2000,      // Overflow -> Other
          Swift: 1000,       // Overflow -> Other
        },
      },
    ];

    const footprint = aggregateLanguageFootprint(repos, { topLimit: DEFAULT_TOP_LANGUAGES });

    expect(DEFAULT_TOP_LANGUAGES).toBe(8);
    expect(footprint.uniqueLanguagesCount).toBe(10);
    expect(footprint.entries).toHaveLength(8); // 7 top + 1 "Other"

    const topLanguageNames = footprint.entries.slice(0, 7).map((e) => e.language);
    expect(topLanguageNames).toEqual([
      "TypeScript",
      "JavaScript",
      "Python",
      "Go",
      "Rust",
      "Java",
      "Ruby",
    ]);

    const otherEntry = footprint.entries[7];
    expect(otherEntry.language).toBe("Other");
    expect(otherEntry.bytes).toBe(3000 + 2000 + 1000); // 6000 bytes
    expect(otherEntry.color).toBe("#7B838D");

    // All percentages including "Other" must sum to exactly 100%
    const totalPercentage = footprint.entries.reduce((sum, e) => sum + e.percentage, 0);
    expect(totalPercentage).toBe(100);
  });

  it("does NOT add 'Other' when unique language count is less than or equal to topLimit", () => {
    const repos: RepositoryLanguageData[] = [
      {
        repositoryName: "small-repo",
        languages: {
          TypeScript: 5000,
          JavaScript: 3000,
          HTML: 2000,
        },
      },
    ];

    const footprint = aggregateLanguageFootprint(repos, { topLimit: 8 });

    expect(footprint.entries).toHaveLength(3);
    expect(footprint.entries.some((e) => e.language === "Other")).toBe(false);
  });

  it("handles custom topLimit (e.g. topLimit: 3 with 5 languages)", () => {
    const repos: RepositoryLanguageData[] = [
      {
        repositoryName: "test-repo",
        languages: {
          A: 500,
          B: 300,
          C: 150,
          D: 40,
          E: 10,
        },
      },
    ];

    const footprint = aggregateLanguageFootprint(repos, { topLimit: 3 });

    expect(footprint.entries).toHaveLength(3); // Top 2 (A, B) + 1 (Other)
    expect(footprint.entries[0].language).toBe("A");
    expect(footprint.entries[1].language).toBe("B");
    expect(footprint.entries[2].language).toBe("Other");
    expect(footprint.entries[2].bytes).toBe(150 + 40 + 10); // 200 bytes

    const totalPercentage = footprint.entries.reduce((sum, e) => sum + e.percentage, 0);
    expect(totalPercentage).toBe(100);
  });

  it("properly identifies and tracks skipped repositories (0 bytes or no language data)", () => {
    const repos: RepositoryLanguageData[] = [
      {
        repositoryName: "active-repo",
        languages: { Go: 1000 },
      },
      {
        repositoryName: "empty-repo",
        languages: {},
      },
      {
        repositoryName: "null-lang-repo",
        languages: null,
      },
      {
        repositoryName: "zero-bytes-repo",
        languages: { Rust: 0 },
      },
    ];

    const footprint = aggregateLanguageFootprint(repos);

    expect(footprint.totalRepositoriesCount).toBe(4);
    expect(footprint.analyzedRepositoriesCount).toBe(1);
    expect(footprint.skippedRepositoriesCount).toBe(3);
    expect(footprint.skippedRepositories).toEqual([
      "empty-repo",
      "null-lang-repo",
      "zero-bytes-repo",
    ]);
    expect(footprint.entries).toHaveLength(1);
    expect(footprint.entries[0].language).toBe("Go");
    expect(footprint.entries[0].percentage).toBe(100);
  });

  it("handles zero repositories edge case gracefully", () => {
    const footprint = aggregateLanguageFootprint([]);

    expect(footprint.entries).toEqual([]);
    expect(footprint.totalBytes).toBe(0);
    expect(footprint.analyzedRepositoriesCount).toBe(0);
    expect(footprint.skippedRepositoriesCount).toBe(0);
    expect(footprint.totalRepositoriesCount).toBe(0);
    expect(footprint.uniqueLanguagesCount).toBe(0);
  });

  it("handles all repositories having zero bytes gracefully", () => {
    const repos: RepositoryLanguageData[] = [
      { repositoryName: "repo1", languages: {} },
      { repositoryName: "repo2", languages: null },
    ];

    const footprint = aggregateLanguageFootprint(repos);

    expect(footprint.entries).toEqual([]);
    expect(footprint.totalBytes).toBe(0);
    expect(footprint.analyzedRepositoriesCount).toBe(0);
    expect(footprint.skippedRepositoriesCount).toBe(2);
  });

  it("guarantees deterministic output across multiple runs with identical input", () => {
    const repos: RepositoryLanguageData[] = [
      {
        repositoryName: "repo-1",
        languages: {
          TypeScript: 33333,
          Python: 33333,
          Go: 33334,
        },
      },
    ];

    const run1 = aggregateLanguageFootprint(repos);
    const run2 = aggregateLanguageFootprint(repos);
    const run3 = aggregateLanguageFootprint(repos);

    expect(run1).toEqual(run2);
    expect(run2).toEqual(run3);
  });

  it("handles very small languages (< 1% code share) without breaking percentage sum", () => {
    const repos: RepositoryLanguageData[] = [
      {
        repositoryName: "massive-repo",
        languages: {
          TypeScript: 999900,
          Lua: 100, // 0.01%
        },
      },
    ];

    const footprint = aggregateLanguageFootprint(repos);

    expect(footprint.entries).toHaveLength(2);
    const sum = footprint.entries.reduce((acc, curr) => acc + curr.percentage, 0);
    expect(sum).toBe(100);
  });
});
