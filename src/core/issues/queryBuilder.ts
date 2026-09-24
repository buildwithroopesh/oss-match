/**
 * GitHub Issue Search Query Builder
 *
 * Compiles high-level IssueSearchCriteria into standardized GitHub search query strings.
 * Adheres strictly to GitHub search qualifier syntax:
 * https://docs.github.com/en/search-github/searching-on-github/searching-issues-and-pull-requests
 */

import type { IssueSearchCriteria } from "../types/issues";

/**
 * Quotes a search token if it contains spaces or special characters.
 */
function quoteIfSpaces(token: string): string {
  const trimmed = token.trim();
  if (trimmed.includes(" ") && !trimmed.startsWith('"') && !trimmed.endsWith('"')) {
    return `"${trimmed}"`;
  }
  return trimmed;
}

/**
 * Validates and formats a date string (YYYY-MM-DD or ISO 8601).
 */
function formatDateQualifier(dateStr: string): string {
  const trimmed = dateStr.trim();
  // If full ISO, take YYYY-MM-DD
  if (trimmed.length > 10 && trimmed.includes("T")) {
    return trimmed.split("T")[0];
  }
  return trimmed;
}

/**
 * Compiles IssueSearchCriteria into a valid GitHub issue search query string.
 *
 * Default behaviors:
 * - Always includes `is:issue` (filters out pull requests)
 * - Includes `state:open` unless state is 'closed' or 'all'
 * - Includes `archived:false` unless excludeArchived is explicitly false
 */
export function buildIssueSearchQuery(criteria: IssueSearchCriteria = {}): string {
  const tokens: string[] = [];

  // 1. Mandatory issue qualifier (excludes pull requests)
  tokens.push("is:issue");

  // 2. State qualifier
  const state = criteria.state ?? "open";
  if (state === "open") {
    tokens.push("state:open");
  } else if (state === "closed") {
    tokens.push("state:closed");
  }
  // If state === "all", omit state qualifier

  // 3. Exclude archived repositories by default
  if (criteria.excludeArchived !== false) {
    tokens.push("archived:false");
  }

  // 4. Target repository, organization, or user/owner
  if (criteria.repo) {
    const cleanRepo = criteria.repo.trim();
    if (cleanRepo.includes("/")) {
      tokens.push(`repo:${cleanRepo}`);
    } else if (criteria.owner) {
      tokens.push(`repo:${criteria.owner.trim()}/${cleanRepo}`);
    } else {
      tokens.push(`repo:${cleanRepo}`);
    }
  } else if (criteria.org) {
    tokens.push(`org:${criteria.org.trim()}`);
  } else if (criteria.owner) {
    tokens.push(`user:${criteria.owner.trim()}`);
  }

  // 5. Target programming languages
  if (criteria.languages && criteria.languages.length > 0) {
    for (const lang of criteria.languages) {
      const cleanLang = lang.trim();
      if (cleanLang) {
        tokens.push(`language:${quoteIfSpaces(cleanLang)}`);
      }
    }
  }

  // 6. Target labels
  if (criteria.labels && criteria.labels.length > 0) {
    for (const label of criteria.labels) {
      const cleanLabel = label.trim();
      if (cleanLabel) {
        tokens.push(`label:${quoteIfSpaces(cleanLabel)}`);
      }
    }
  }

  // 7. Comment count bounds
  const hasMin = criteria.minComments !== undefined && criteria.minComments >= 0;
  const hasMax = criteria.maxComments !== undefined && criteria.maxComments >= 0;
  if (hasMin && hasMax) {
    tokens.push(`comments:${criteria.minComments}..${criteria.maxComments}`);
  } else if (hasMin) {
    tokens.push(`comments:>=${criteria.minComments}`);
  } else if (hasMax) {
    tokens.push(`comments:<=${criteria.maxComments}`);
  }

  // 8. Date bounds
  if (criteria.updatedAfter) {
    const formatted = formatDateQualifier(criteria.updatedAfter);
    if (formatted) {
      tokens.push(`updated:>=${formatted}`);
    }
  }

  if (criteria.createdAfter) {
    const formatted = formatDateQualifier(criteria.createdAfter);
    if (formatted) {
      tokens.push(`created:>=${formatted}`);
    }
  }

  // 9. Free-text search terms / keywords
  if (criteria.keywords && criteria.keywords.length > 0) {
    for (const kw of criteria.keywords) {
      const cleanKw = kw.trim();
      if (cleanKw) {
        tokens.push(quoteIfSpaces(cleanKw));
      }
    }
  }

  return tokens.join(" ");
}
