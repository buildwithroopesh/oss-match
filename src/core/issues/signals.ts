/**
 * Issue Suitability Signal Extractor
 *
 * Extracts verifiable, observable facts from a GitHubIssue for consumption by
 * the downstream matching engine (Milestone 8).
 *
 * Strictly adheres to data honesty:
 * - Does NOT compute matching scores.
 * - Does NOT rank or recommend issues.
 * - Does NOT infer contributor skill.
 * - Only records observable facts (body length, labels, timestamps, repository metadata).
 */

import type { GitHubIssue } from "../types/github";
import type { IssueSignals } from "../types/issues";

const CONTRIBUTOR_FRIENDLY_LABEL_PATTERNS = [
  "good first issue",
  "good-first-issue",
  "good_first_issue",
  "help wanted",
  "help-wanted",
  "help_wanted",
  "beginner",
  "starter",
  "easy",
  "up-for-grabs",
  "first-timers-only",
];

const MS_PER_DAY = 1000 * 60 * 60 * 24;

/**
 * Extracts observable suitability facts from a GitHubIssue using an injected reference time.
 *
 * @param issue Validated GitHubIssue domain entity
 * @param now Injected reference time for deterministic date calculations
 */
export function extractIssueSignals(
  issue: GitHubIssue,
  now: Date
): IssueSignals {
  const trimmedBody = issue.body ? issue.body.trim() : "";
  const hasBody = trimmedBody.length > 0;
  const bodyLength = trimmedBody.length;

  const labelNames = (issue.labels ?? []).map((l) =>
    l.name.toLowerCase().trim()
  );

  const hasHelpWantedOrGoodFirstIssue = labelNames.some((name) =>
    CONTRIBUTOR_FRIENDLY_LABEL_PATTERNS.some(
      (pattern) => name === pattern || name.includes(pattern)
    )
  );

  // Deterministic age and update calculations relative to injected `now`
  const createdTime = new Date(issue.createdAt).getTime();
  const ageInDays = isNaN(createdTime)
    ? 0
    : Math.max(0, Math.floor((now.getTime() - createdTime) / MS_PER_DAY));

  const updatedTime = new Date(issue.updatedAt).getTime();
  const daysSinceUpdated = isNaN(updatedTime)
    ? 0
    : Math.max(0, Math.floor((now.getTime() - updatedTime) / MS_PER_DAY));

  return {
    hasBody,
    bodyLength,
    labelNames,
    hasHelpWantedOrGoodFirstIssue,
    primaryLanguage: issue.repository.primaryLanguage ?? null,
    repositoryTopics: issue.repository.topics ?? [],
    repositoryStars: issue.repository.stars ?? 0,
    repositoryForks: issue.repository.forks ?? 0,
    isRepositoryArchived: issue.repository.isArchived ?? false,
    commentsCount: issue.commentsCount ?? 0,
    createdAt: issue.createdAt,
    updatedAt: issue.updatedAt,
    ageInDays,
    daysSinceUpdated,
  };
}
