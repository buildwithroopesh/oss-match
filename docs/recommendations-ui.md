# Recommendations UI & Integration Specification

> Architectural reference and presentation rules for the OSS Match Recommendations UI (Milestone 9).

---

## 1. Overview & Data Flow

Milestone 9 bridges the completed domain engine layers into a unified, developer-focused user interface:

```
                  GitHub Username
                         │
                         ▼
        ┌───────────────────────────────────┐
        │     src/lib/recommendations.ts     │
        │  getProfileAndRecommendations()   │
        └─────────────────┬─────────────────┘
                          │
         ┌────────────────┼────────────────┐
         ▼                ▼                ▼
┌─────────────────┐ ┌───────────┐ ┌────────────────┐
│ Profile Pipeline│ │  Issue    │ │    Matching    │
│  (Milestone 5)  │ │ Discovery │ │     Engine     │
│                 │ │(Milestone │ │  (Milestone 8) │
│ analyzeProfile()│ │    7)     │ │                │
│                 │ │discover-  │ │ matchIssues()  │
│                 │ │ Issues()  │ │                │
└────────┬────────┘ └─────┬─────┘ └───────┬────────┘
         │                │               │
         └────────────────┼───────────────┘
                          │
                          ▼
            RecommendationsState (Server)
                          │
                          ▼
        ┌───────────────────────────────────┐
        │  /profile/[username]/page.tsx     │
        │  (Next.js Server Component)       │
        └─────────────────┬─────────────────┘
                          │
                          ▼
        ┌───────────────────────────────────┐
        │    <MatchedIssuesSection />       │
        │    ("use client" Filter State)    │
        └─────────────────┬─────────────────┘
                          │
         ┌────────────────┼────────────────┐
         ▼                ▼                ▼
┌─────────────────┐ ┌───────────┐ ┌────────────────┐
│  <IssueFilters> │ │<IssueCard>│ │    <Empty-     │
│                 │ │   feed    │ │Recommendations-│
│ (Preserves rank)│ │           │ │    State>      │
└─────────────────┘ └───────────┘ └────────────────┘
```

---

## 2. Server & Client Architecture Boundary

### Server Data Loader (`src/lib/recommendations.ts`)
- Runs exclusively on the server in Next.js Server Components.
- Executes:
  1. `analyzeProfile(client, username)`: Returns verified profile data.
  2. Formulates `IssueSearchCriteria`: Broad candidate search using the purest deterministic V1 strategy (`state: "open"`, `excludeArchived: true`, `limit: 30`, without language qualifiers and without "good first issue only" label restrictions). This preserves candidate recall across all open-source repositories and technologies, letting the Milestone 8 matching engine determine match scores from observable candidate signals (where presence of `good first issue` or `help wanted` continues to contribute to difficulty/suitability scoring).
  3. `discoverIssues(client, criteria)`: Queries GitHub issue search API for up to 30 candidate issues.
  4. `matchIssues(profile, candidateIssues, { now })`: Deterministically scores and ranks discovered issues.
- **Resilience**: If issue discovery fails (e.g. rate limit), profile analysis is preserved and partial discovery metadata (`status: "partial"`, warning message) is returned.
- **Zero Unhandled Exceptions**: Catches `PipelineError`, `DiscoveryError`, and wraps unexpected exceptions in typed `PipelineApiError`.

### Client Presentation Layer (`src/components/recommendations/`)
- `<MatchedIssuesSection>` manages interactive filter state (`selectedLanguage`, `friendlyOnly`, `minScore`).
- **Zero Client-Side API Calls**: All data is passed down from the server; client components perform zero fetch requests to GitHub.
- **Order Preservation**: Filtering selects a subset of the matching engine's array without re-sorting or recalculating scores, guaranteeing deterministic ranking order.

---

## 3. Data Honesty & Presentation Rules

OSS Match strictly enforces transparent, objective presentation grounded in observable facts:

| Prohibited Terminology | Required Replacement | Rationale |
| :--- | :--- | :--- |
| "Skill", "Competency", "Proficiency" | "Match score", "% of analyzed code volume" | Code volume and issue label overlaps reflect observable history, never human skill. |
| "Expertise", "Mastery" | "Strong evidence", "Observed evidence" | Evidence levels indicate multi-source verification, not developer capability. |
| "Compatibility rating", "Fit score" | "Match score" | Scores represent weighted signal overlap with discovered issues. |
| "Easy issue", "Beginner issue" | "Contributor friendly" | Label presence (`good first issue`) is an author-provided invitation, not verified difficulty. |

### Badge Conventions
- **Match Score Badge**: Displayed as `Match score: XX.X` (e.g., `85.0`) with semantic color coding:
  - $\ge 75$: Teal `#5CE1C6` on `#112620` (High match)
  - $\ge 50$: Lavender `#8B92FF` on `#1A1C32` (Moderate match)
  - $< 50$: Slate `#A5ABB3` on `#1A1E22` (Base match)
- **Technology Badges**: Highlight technologies identified from structured issue labels (e.g., `react`, `typescript`).
- **Language Badges**: State the primary language and explicit code volume percentage: `<Language> (<X>% of analyzed code)`.
- **Topic Badges**: Highlight matching repository topics prefixed with `#` (e.g., `#web`, `#cli`).
- **Contributor Friendly Badge**: Tagged with `"Contributor friendly"` when `hasHelpWantedOrGoodFirstIssue` is true.

### Factual Explanations
- Every `IssueCard` renders factual reasons generated by the Milestone 8 explainer directly (e.g., `"Matches detected technology: react"`, `"Repository primary language matches 85% of your analyzed code"`).
- When a scoring component was unavailable (e.g. no repository topics found), a transparent notice is rendered:
  `"Note: Framework/Topic omitted from score calculation (observable data not provided). Remaining components renormalized."`

---

## 4. Edge Cases & Degraded States

1. **Zero Discovered Issues**:
   - Displays `<EmptyRecommendationsState reason="no_discovered" />`.
   - Explains that no open issues matching the analyzed primary languages were returned by GitHub at this time.
   - Clarifies that this reflects issue availability, not developer experience.

2. **Filters Match Zero Issues**:
   - Displays `<EmptyRecommendationsState reason="filter_empty" />`.
   - Offers an interactive `"Clear active filters"` button to restore the full list.

3. **Partial Discovery / Rate Limit During Discovery**:
   - Displays `<PartialDiscoveryBanner />` warning: `"Displaying matches from candidate issues discovered before the limit was reached."`
   - Keeps the user profile analysis completely visible and intact.

4. **Zero Public Repositories**:
   - If the user has 0 public repositories, `EmptyProfileCard` is rendered without attempting issue discovery or matching.
