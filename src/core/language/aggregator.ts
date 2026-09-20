/**
 * Language Footprint Aggregator
 *
 * Aggregates repository language byte counts across public repositories,
 * computes exact code share using largest-remainder rounding, and groups
 * long-tail languages into "Other" when exceeding the configured limit.
 *
 * PURE & DETERMINISTIC:
 * - Zero external dependencies
 * - Zero clock / Date access
 * - Percentages guaranteed to sum to exactly 100%
 * - Never calls code share "skill"
 */

import type {
  LanguageFootprint,
  LanguageFootprintEntry,
  RepositoryLanguageData,
  LanguageAggregationOptions,
} from "../types/language";
import type { GitHubLanguages } from "../types/github";
import { distributePercentages } from "./rounding";
import { attachLanguageColors } from "./colors";

export const DEFAULT_TOP_LANGUAGES = 8;

/**
 * Aggregates language byte counts across multiple repositories into a normalized footprint.
 *
 * @param repositories List of repositories with their associated language byte counts
 * @param options Configuration options (topLimit, attachColors)
 * @returns Fully aggregated LanguageFootprint with exact 100% percentage distribution
 */
export function aggregateLanguageFootprint(
  repositories: RepositoryLanguageData[] | GitHubLanguages[],
  options?: LanguageAggregationOptions
): LanguageFootprint {
  const topLimit = Math.max(1, options?.topLimit ?? DEFAULT_TOP_LANGUAGES);
  const shouldAttachColors = options?.attachColors ?? true;

  const totalRepositoriesCount = repositories.length;
  let analyzedRepositoriesCount = 0;
  let skippedRepositoriesCount = 0;
  const skippedRepositories: string[] = [];

  // Map to accumulate total bytes per language
  const byteMap = new Map<string, number>();

  for (let i = 0; i < repositories.length; i++) {
    const item = repositories[i];

    // Normalize input whether passed as RepositoryLanguageData or plain GitHubLanguages
    let repoName = `repo-${i + 1}`;
    let langData: GitHubLanguages | null | undefined;

    if (item && typeof item === "object" && "repositoryName" in item && typeof (item as { repositoryName?: unknown }).repositoryName === "string") {
      const data = item as RepositoryLanguageData;
      repoName = data.repositoryName;
      langData = data.languages;
    } else {
      langData = item as GitHubLanguages;
    }

    // Inspect repository bytes
    let repoByteTotal = 0;
    if (langData && typeof langData === "object") {
      for (const [lang, bytes] of Object.entries(langData)) {
        if (typeof bytes === "number" && bytes > 0 && !isNaN(bytes)) {
          repoByteTotal += bytes;
          const current = byteMap.get(lang) ?? 0;
          byteMap.set(lang, current + bytes);
        }
      }
    }

    if (repoByteTotal > 0) {
      analyzedRepositoriesCount += 1;
    } else {
      skippedRepositoriesCount += 1;
      skippedRepositories.push(repoName);
    }
  }

  const uniqueLanguagesCount = byteMap.size;
  const totalBytes = Array.from(byteMap.values()).reduce((sum, b) => sum + b, 0);

  // If no code bytes were found across any repositories
  if (totalBytes === 0 || uniqueLanguagesCount === 0) {
    return {
      entries: [],
      totalBytes: 0,
      analyzedRepositoriesCount,
      skippedRepositoriesCount,
      totalRepositoriesCount,
      skippedRepositories,
      uniqueLanguagesCount: 0,
    };
  }

  // Sort all unique languages by bytes descending, tie-breaking alphabetically
  const sortedLanguages = Array.from(byteMap.entries())
    .map(([language, bytes]) => ({ language, bytes }))
    .sort((a, b) => {
      if (b.bytes !== a.bytes) {
        return b.bytes - a.bytes;
      }
      if (a.language < b.language) return -1;
      if (a.language > b.language) return 1;
      return 0;
    });

  // Prepare entries with "Other" collapsing if unique count exceeds topLimit
  let preparedEntries: Array<{ language: string; bytes: number }> = [];

  if (sortedLanguages.length > topLimit) {
    // Keep top (topLimit - 1) languages
    const topLanguages = sortedLanguages.slice(0, topLimit - 1);
    const overflowLanguages = sortedLanguages.slice(topLimit - 1);

    const otherBytes = overflowLanguages.reduce((sum, item) => sum + item.bytes, 0);

    preparedEntries = [
      ...topLanguages,
      { language: "Other", bytes: otherBytes },
    ];
  } else {
    preparedEntries = sortedLanguages;
  }

  // Calculate percentages using largest-remainder method (guaranteeing exact 100% sum)
  const roundedEntries = distributePercentages(preparedEntries, 100);

  // Attach presentation color metadata if requested
  const finalEntries: LanguageFootprintEntry[] = shouldAttachColors
    ? attachLanguageColors(roundedEntries)
    : roundedEntries.map((e) => ({ ...e, color: "" }));

  return {
    entries: finalEntries,
    totalBytes,
    analyzedRepositoriesCount,
    skippedRepositoriesCount,
    totalRepositoriesCount,
    skippedRepositories,
    uniqueLanguagesCount,
  };
}
