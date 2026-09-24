# Issue Discovery Reference

> Framework-independent open-source issue discovery engine (`src/core/issues/`).

---

## 1. Overview & Architectural Boundaries

Issue discovery is the bridge between verified developer technology footprints and open-source contribution opportunities. It searches GitHub's public issue corpus using structured search qualifiers, deduplicates results across pages, extracts verifiable suitability signals, and produces deterministically ordered candidate issues for the matching engine (Milestone 8).

```
IssueSearchCriteria
        ↓
Query Builder (is:issue, state:open, archived:false, qualifiers)
        ↓
GitHubClient.searchIssues (GET /search/issues with rate-limit discipline & caching)
        ↓
Pagination & Deduplication by Issue ID
        ↓
Signal Extractor (observable facts with injected now: Date)
        ↓
Deterministic Ordering with Stable Tie-Breakers
        ↓
IssueDiscoveryResult (DiscoveredIssue[] + DiscoveryMetadata)
```

### Architectural Rules
- Located under `src/core/issues/` with zero dependencies on React, Next.js, browser APIs, or UI imports.
- Reuses the centralized `GitHubClient` transport layer from Milestone 2.
- Zero secrets in core: API credentials remain injected.

---

## 2. Query Builder (`buildIssueSearchQuery`)

The query builder translates high-level search options into valid GitHub search qualifier syntax:

| Qualifier | Purpose | Default Behavior | Example |
| :--- | :--- | :--- | :--- |
| `is:issue` | Excludes pull requests | Always included | `is:issue` |
| `state:open` | Filter by open/closed status | `open` (omitted if `all`) | `state:open` |
| `archived:false` | Exclude archived repositories | Included unless `excludeArchived: false` | `archived:false` |
| `language:<lang>` | Target programming language | Mapped per requested language | `language:typescript` |
| `label:"<label>"` | Target issue label | Automatically quotes multi-word labels | `label:"good first issue"` |
| `repo:<owner>/<name>` | Target repository | Scoped when `repo` specified | `repo:facebook/react` |
| `org:<org>` | Target organization | Scoped when `org` specified | `org:vercel` |
| `user:<owner>` | Target repository owner | Scoped when `owner` specified without repo | `user:torvalds` |
| `comments:<range>` | Filter by comment volume | Scoped when `minComments` / `maxComments` set | `comments:0..5` |
| `updated:>=<date>` | Filter by recency | Formats ISO or YYYY-MM-DD | `updated:>=2025-01-01` |
| `created:>=<date>` | Filter by creation date | Formats ISO or YYYY-MM-DD | `created:>=2025-01-01` |

### Broad Discovery (No Arbitrary Restrictions)
- Does **not** require "good first issue" only: Broad open-source issues can be queried across technologies.
- Does **not** impose arbitrary minimum star counts: Allows discovery of emerging, active projects alongside popular repositories.

---

## 3. Observable Suitability Signals (`IssueSignals`)

The signal extractor (`extractIssueSignals`) captures observable facts that the downstream matching engine (Milestone 8) uses to evaluate issue fit:

- **Body presence & length**: `hasBody: boolean`, `bodyLength: number`.
- **Labels**: `labelNames: string[]` (normalized lowercase), `hasHelpWantedOrGoodFirstIssue: boolean`.
- **Repository Context**: `primaryLanguage: string | null`, `repositoryTopics: string[]`, `repositoryStars: number`, `repositoryForks: number`, `isRepositoryArchived: boolean`.
- **Discussion Volume**: `commentsCount: number`.
- **Deterministic Recency**: `ageInDays: number`, `daysSinceUpdated: number` (computed deterministically relative to injected `now: Date`).

---

## 4. Determinism & Stable Tie-Breaking

- **Time Injection**: Requires an injected `now: Date` for pure, repeatable relative time calculations.
- **Deduplication**: Issues appearing across multiple pages or queries are deduplicated by `issue.id`, preserving the first occurrence.
- **Stable Tie-Breaking**: When issues have identical update or creation timestamps, a secondary tie-breaker orders them by issue `id` ascending (`a.id < b.id ? -1 : 1`).
- **Network Invariance**: Results are ordered independently of network arrival timing.

---

## 5. Rate-Limit Discipline & Partial Discovery

- **Non-Blind Retries**: Honors `GitHubClient` rate-limit headers.
- **Initial Failure**: Rate-limit exhaustion or errors on the first page throw typed `DiscoveryRateLimitExhaustedError` or `DiscoveryApiError`.
- **Mid-Search Partial Preservation**: When paginating across multiple pages, if a rate limit or network error occurs after issues have already been collected, the engine returns all collected issues, records the warning, and sets metadata `status: "partial"`.

---

## 6. Explicit Non-Goals (What This Layer Intentionally Does NOT Decide)

1. **No Match Scoring**: Does not score how well an issue matches a user. Final scoring belongs in Milestone 8 (`src/core/matching/`).
2. **No Ranking / Recommendations**: Does not sort issues by perceived recommendation strength.
3. **No Contributor Skill Inference**: Does not claim an issue is "easy" or "hard" based on assumptions; only records observable labels.
4. **No Data Fabrication**: Does not hallucinate missing repository topics or languages.
