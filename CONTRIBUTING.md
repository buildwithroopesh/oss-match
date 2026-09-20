# Contributing to OSS Match

Thank you for your interest in contributing. OSS Match is an open-source project and welcomes all contributions — bug reports, feature suggestions, documentation improvements, and code changes.

---

## Code of Conduct

This project follows the [Contributor Covenant Code of Conduct](CODE_OF_CONDUCT.md). By participating, you agree to uphold its standards.

---

## Quick Start

```bash
git clone https://github.com/buildwithroopesh/oss-match.git
cd oss-match
npm install
cp .env.example .env.local
# Add your GITHUB_API_TOKEN to .env.local
npm run dev
```

---

## Architecture Overview

```
src/
├── app/               Next.js routes and API handlers (thin layer)
├── components/        React UI components — no business logic
└── core/              Framework-independent business logic
    ├── github/        GitHub API client (all GitHub access goes here)
    ├── language/      Language aggregation and percentage calculation
    ├── technology/    Technology detection (registry + signals)
    ├── matching/      Scoring engine and explainer
    ├── pipeline/      Analysis and recommendation orchestration
    ├── cache/         Simple in-memory cache
    └── types/         Shared TypeScript types
```

### The Core Boundary

`src/core` must never import from:
- React or Next.js
- Browser APIs
- `process.env`
- UI components
- `src/app`

This keeps the core logic usable by the web application, a future CLI, and other consumers.

---

## GitHub API Layer

All GitHub API access is centralized in `src/core/github/`. The rest of the application must not call GitHub APIs directly.

The client:
- Reads the `GITHUB_API_TOKEN` environment variable server-side only
- Tracks rate-limit headers (`x-ratelimit-remaining`, `x-ratelimit-reset`, `retry-after`)
- Deduplicates in-flight requests
- Returns typed, Zod-validated domain objects

**Never expose `GITHUB_API_TOKEN` to the browser.**

---

## Technology Detection

Technology definitions live in `src/core/technology/registry.ts`.

To add a new technology, add an entry to the registry:

```typescript
{
  id: "your-tech",
  name: "Your Tech",
  category: "framework", // or "library", "tool", "runtime", etc.
  signals: [
    {
      type: "dependency",
      pkg: "npm",
      names: ["your-tech-package"],
      strength: "strong",
    },
    {
      type: "topic",
      values: ["your-tech", "yourtech"],
      strength: "moderate",
    },
  ],
}
```

Signal strengths: `strong` → `moderate` → `weak`.

Do not detect technologies from free-text descriptions (too noisy).

---

## Matching Engine

The matching engine is in `src/core/matching/engine.ts`.

Key properties:
- **Deterministic** — same input + same `now` timestamp = same output
- **Time-injected** — `now: Date` is passed as a parameter, never read from `Date.now()` inside the engine
- **Renormalizing** — if data for a component is unavailable, it is excluded and weights are renormalized
- **Stable sort** — tie-breaking uses `{score DESC, fullName ASC, issueNumber ASC}`

Weights are in `src/core/matching/weights.ts`.

---

## Running Tests

Tests run offline — no GitHub token, no network access required.

```bash
npm run test
npm run test:watch
```

The core matching algorithm has determinism tests. Do not introduce randomness into the matching engine.

---

## CI

Every pull request runs:

```
lint → typecheck → test → build
```

All four must pass before merge.

---

## Data Honesty

OSS Match never fabricates data. Development fixtures are recorded from real GitHub responses using `scripts/record-fixtures.ts` and are clearly labeled as fixtures.

If you add fixtures, they must:
- Come from real GitHub responses
- Contain no secrets or tokens
- Be clearly labeled as fixtures in the UI if displayed

---

## Opening a Pull Request

1. Fork the repository
2. Create a branch: `git checkout -b feat/your-feature`
3. Make your changes
4. Run the full check: `npm run lint && npm run typecheck && npm run test && npm run build`
5. Open a pull request against `main`

Use the pull request template.

---

## Reporting Bugs

Use the [bug report template](.github/ISSUE_TEMPLATE/bug_report.md).

## Suggesting Features

Use the [feature request template](.github/ISSUE_TEMPLATE/feature_request.md).

## Security Issues

Do **not** open public issues for security vulnerabilities. See [SECURITY.md](SECURITY.md).
