/**
 * Core Issue Discovery module barrel export
 */

export { discoverIssues } from "./discover";
export { buildIssueSearchQuery } from "./queryBuilder";
export { extractIssueSignals } from "./signals";
export {
  DiscoveryError,
  DiscoveryInvalidInputError,
  DiscoveryRateLimitExhaustedError,
  DiscoveryApiError,
  mapGitHubErrorToDiscoveryError,
} from "./errors";
