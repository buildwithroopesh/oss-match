# OSS Match Architecture Reference

> Technical reference for the OSS Match core pipeline and architecture layers.

---

## 1. Architectural Layers & Boundary Rules

OSS Match enforces a strict architectural boundary between the UI, application infrastructure, and framework-independent domain logic:

```
src/
├── app/               Next.js App Router (pages, layouts, route handlers)
├── components/        React presentation components (UI primitives, profile, issues)
├── lib/               Application infrastructure layer (injects env vars like GITHUB_API_TOKEN)
└── core/              Framework-independent business logic (pure TypeScript)
    ├── github/        GitHub API client, boundary Zod schemas, rate-limiting, cache
    ├── language/      Language footprint aggregation & largest-remainder rounding
    ├── technology/    (Milestone 4) Technology detection & registry
    ├── matching/      (Milestone 8) Deterministic scoring engine & explainer
    └── types/         Normalized domain types
```

### The Core Boundary Rule
`src/core/` must never import from:
- React or Next.js
- Browser APIs (`window`, `localStorage`, `document`)
- `process.env` (all credentials and options must be dependency-injected)
- UI components

---

## 2. Language Footprint System (`src/core/language/`)

The language footprint module analyzes normalized programming language byte counts across a user's public repositories to compute their observable code footprint.

### Domain Terminology Rules
- **"language"**: Programming language name (e.g. TypeScript, Python, Go).
- **"code bytes"**: Volume of code in bytes analyzed from repository language endpoints.
- **"percentage of analyzed code"**: Proportion of code represented by each language.
- **NEVER "skill"**: Code volume reflects past project output, not proficiency or skill.

### Pipeline Stages

```
Repository Language Data (GitHubLanguages[])
              ↓
Byte Aggregation across Repositories
              ↓
Filter Empty/0-Byte Repos (Preserve skipped count metadata)
              ↓
Sort by Bytes Descending (Alphabetical tie-break)
              ↓
Collapse Long-Tail (> topLimit) into "Other"
              ↓
Largest-Remainder Rounding (Sum exactly 100%)
              ↓
Attach Presentation Color Metadata
              ↓
LanguageFootprint Result
```

### Largest-Remainder Rounding (Hare-Niemeyer / Hamilton Method)
To avoid display anomalies like `99.9%` or `100.1%`, percentages are rounded using the largest-remainder method:
1. Calculate raw exact percentage: `rawPercentage = (bytes / totalBytes) * 100`.
2. Take the integer floor of each raw percentage.
3. Compute `remainingUnits = 100 - sum(floors)`.
4. Rank items by their fractional remainders (`rawPercentage - floor`) descending.
   - Tie-breaking: sorted by original `bytes` descending, then by language name alphabetically ascending.
5. Distribute +1 unit to the top `remainingUnits` items.
6. The resulting integer percentages are mathematically guaranteed to sum to **exactly 100%**.

### "Other" Collapsing
- Default top-language limit: `8` (`DEFAULT_TOP_LANGUAGES = 8`).
- When total unique languages exceed `topLimit`, the top `topLimit - 1` (7) languages are retained individually.
- All subsequent languages are summed into a single entry labeled `"Other"`.
- Total displayed entries never exceed `topLimit`.
- When total unique languages are `<= topLimit`, no `"Other"` entry is created.

### Presentation Colors (`src/core/language/colors.ts`)
Language colors are kept strictly as presentation metadata separate from the aggregation logic:
- Primary languages map to locked palette tokens from `globals.css` (e.g. TypeScript `#3178C6`, Python `#3776AB`, Go `#00ADD8`, Rust `#DEA584`).
- Unmapped languages and `"Other"` fall back to `#7B838D`.

---

## 3. Telemetry & Metadata

The aggregator preserves complete audit metadata:
- `totalBytes`: Total analyzed code bytes across all non-empty repositories.
- `analyzedRepositoriesCount`: Repositories with positive code bytes.
- `skippedRepositoriesCount`: Repositories with 0 bytes, null, or empty language data.
- `totalRepositoriesCount`: Total number of repositories inspected.
- `skippedRepositories`: List of repository names that had no analyzable code.
- `uniqueLanguagesCount`: Total number of distinct languages detected prior to collapsing.

---

## 4. Technology Detection System (`src/core/technology/`)

The technology detection engine extracts verifiable evidence from repository artifacts to produce an evidence-backed `TechnologyProfile`.

### Separation of Concerns
- **Language Footprint**: Measures volume share (`"% of analyzed code"`).
- **Technology Detection**: Evaluates observable evidence (`"React — Strong evidence"`).
- The two systems remain completely decoupled.

### Evidence Hierarchy
- **Strong**: Verified manifest dependencies, verified configuration files (`Dockerfile`, `next.config.*`), direct language byte presence.
- **Moderate**: Exact case-insensitive repository topics.
- **Weak**: Filename patterns (`*.tsx`, `*.vue`). Filename patterns alone never produce high confidence or strong evidence.

### Evidence Levels (Confidence, Never "Skill")
- `strong`: Confirmed across $\ge 2$ repositories with strong signals, or $\ge 2$ distinct strong signal types in 1 repository.
- `moderate`: Confirmed by $\ge 1$ strong signal or $\ge 2$ moderate signals.
- `limited`: Only weak signals (e.g. filename patterns alone) or isolated single topic.
- `detected`: Base fallback evidence state.

All recency metrics require an injected `now: Date` to ensure deterministic execution.

---

## 5. Profile Analysis Pipeline (`src/core/pipeline/`)

The profile analysis pipeline connects the GitHub client, language aggregator, and technology detector into an audited, deterministic flow:

```
GitHub username
      ↓
Validate username
      ↓
Fetch GitHubUser (client.getUser)
      ↓
Fetch up to 30 repositories (client.getRepositories capped at 30)
      ↓
Fetch languages in bounded batches (concurrency: 5)
      ↓
Calculate deterministic LanguageFootprint (Largest-Remainder method)
      ↓
Detect technologies across repository evidence
      ↓
Aggregate into TechnologyProfile & ProfileAnalysisResult
```

### Determinism & Time Injection
- The pipeline requires an explicit injected `now: Date`.
- Wall-clock runtime duration (`durationMs`) is stored in execution metadata for diagnostics only; it never affects the domain profile, status, scoring, or ordering.

---

## 6. Presentation & Integration Layer (`src/components/`, `src/lib/profile.ts`)

Milestone 6 provides the user interface for executing and displaying profile analyses:
- **Server Data Loader (`src/lib/profile.ts`)**: Wraps `analyzeProfile` on the server using `getGitHubClient()`, safely returning a discriminated union state and preventing uncaught server exceptions.
- **Landing Page (`src/app/page.tsx`)**: Developer-focused hero, quick demo handles, and privacy/trust disclosures.
- **Profile Page (`src/app/profile/[username]/page.tsx`)**: Server Component rendering `ProfileHeader`, `AnalysisSummary`, `LanguageFootprintCard`, `TechnologyFootprintCard`, `RepositoryList`, or `ProfileErrorState`.
- **Loading Skeleton (`src/app/profile/[username]/loading.tsx`)**: Dedicated App Router streaming fallback.
- **A11y & Guardrails**: Accessible ARIA roles, responsive to 375px, dark mode tokens, and strictly enforces data honesty without subjective skill terminology.

---

## 7. Issue Discovery Engine (`src/core/issues/`)

Milestone 7 introduces the issue discovery engine that queries GitHub's issue search API:
- **Framework Independence**: Pure TypeScript under `src/core/issues/` with zero UI, browser, or framework imports.
- **Query Builder (`buildIssueSearchQuery`)**: Compiles structured search criteria into valid GitHub search qualifiers (`is:issue`, `state:open`, `archived:false`, `language:`, `label:`, `repo:`, `updated:`, `comments:`).
- **Observable Suitability Signals (`extractIssueSignals`)**: Extracts verifiable facts (body length, labels, timestamps, repository language, topics, stars, forks) without computing matching scores or inferring contributor skill.
- **Deduplication & Determinism**: Deduplicates issues by ID across pagination and applies stable secondary tie-breakers (`a.id < b.id ? -1 : 1`).
- **Resilience**: Honors rate limits and supports partial result preservation during pagination.




