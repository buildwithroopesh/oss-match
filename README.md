# OSS Match

**Find open-source issues that match your experience.**

[![CI](https://github.com/buildwithroopesh/oss-match/actions/workflows/ci.yml/badge.svg)](https://github.com/buildwithroopesh/oss-match/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

> Not affiliated with GitHub, Inc. Uses only publicly available GitHub data.

---

## What is OSS Match?

OSS Match is a repo-first open-source developer tool that helps you discover GitHub issues you can realistically contribute to, based on your public GitHub activity.

It does not simply list "Good First Issues." It analyzes your public repositories to build a **technology footprint**, then matches open issues to that footprint using a **transparent, deterministic scoring algorithm** — and explains exactly why each issue matched.

---

## Example Usage

1. Start the local server (`npm run dev`) and visit [http://localhost:3000](http://localhost:3000).
2. Enter any public GitHub username (or click an example demo handle on the landing page).
3. OSS Match analyzes recent public repository history to build an observable technology footprint.
4. Browse ranked open-source issues with deterministic match scores, review factual explanation cards, and filter by primary language, minimum match score, or contributor-friendly labels.

---

## How It Works

OSS Match connects public developer activity to open-source contribution opportunities in four deterministic phases:

```
GitHub Profile
    ↓
1. Profile Analysis (inspects public repositories, aggregates language bytes, detects technologies)
    ↓
2. Issue Discovery (searches open GitHub issues across repositories without arbitrary filters)
    ↓
3. Deterministic Matching (scores candidates across 7 observable components with weight renormalization)
    ↓
4. Factual Explanations (transparent reasons explaining matches and observable gaps)
```

1. **Profile Analysis**: Fetches up to 30 recent public repositories. Computes language breakdown using the Largest Remainder (Hare-Niemeyer) algorithm so percentages sum to exactly 100%. Analyzes dependency manifests, configuration files, and topics to detect technologies with verified evidence levels (`strong`, `moderate`, `limited`).
2. **Candidate Discovery**: Searches open GitHub issues (`is:issue state:open archived:false`) across the broader open-source ecosystem without restricting candidates by arbitrary popularity thresholds or good-first-issue gates.
3. **Deterministic Matching Engine**: Evaluates candidate issues against the user's observable footprint across 7 scoring components. Re-normalizes weights dynamically when data is absent.
4. **Factual Explanations**: Generates transparent, objective reasons detailing why an issue matched, which technologies overlap, and what technologies or tools were not observed in the public footprint.

---

## Data Honesty & Privacy Guarantees

OSS Match adheres to strict product honesty and data safety principles:

- **Code volume, not skill**: Language percentages represent **"% of analyzed code volume"** across inspected public repositories. They do **not** measure skill, proficiency, competency, or expertise.
- **Evidence-based signals, not competency ratings**: Match scores reflect observable signal alignment between an issue and public repository activity. They do **not** represent competency assessments, and they do **not** guarantee contribution success.
- **Objective difficulty**: Difficulty estimates are only provided when repository maintainers explicitly label an issue (e.g. `good first issue`, `beginner`). Difficulty is never guessed, inferred, or fabricated.
- **Public data only**: Accesses only publicly available repositories and issue data through GitHub's public REST API. Never accesses private repositories or private profile data.
- **Stateless & zero database**: No user data, profiles, or recommendations are persisted to a database or tracked with cookies.
- **Server-only credentials**: `GITHUB_API_TOKEN` is used strictly server-side to raise GitHub API rate limits (from 60 to 5,000 req/hr) and is never exposed in client bundles or logged.

---

## Features (V1)

- **Technology footprint** — aggregated language statistics from public repositories, displayed as percentages of analyzed code (not skill percentages)
- **Evidence-based technology detection** — detects React, Next.js, Docker, FastAPI, and 15+ other technologies from real evidence (manifests, configs, topics)
- **Deterministic matching** — same input always produces the exact same score; time is injected, not read from the clock
- **Transparent explanations** — every recommendation shows why it matched and what gaps to expect
- **Client-side filters** — filter by primary language, minimum match score, or contributor-friendly labels while preserving deterministic ranking order
- **No account required** — enter any public GitHub username to begin
- **No database** — stateless architecture; data is fetched live from GitHub's public API
- **Production-hardened** — in-memory caching, in-flight request deduplication, and resilient rate-limit handling
- **Fully open source** — all matching formulas, heuristics, and registry definitions are auditable

---

## Matching Algorithm

The V1 algorithm uses a weighted sum of scoring components:

| Component | Weight |
|---|---|
| Technology match | 35% |
| Language match | 20% |
| Framework / topic match | 15% |
| Issue suitability | 10% |
| Repository activity | 10% |
| Issue freshness | 5% |
| Difficulty estimate | 5% |

Weights are centralized in [`src/core/matching/constants.ts`](src/core/matching/constants.ts) and can be adjusted or extended.

If data for a component is unavailable, it is excluded and the remaining weights are renormalized.

---

## Technology Detection

Technology definitions are data-driven in [`src/core/technology/registry.ts`](src/core/technology/registry.ts).

Each technology entry specifies typed signals:

```typescript
{
  id: "react",
  name: "React",
  category: "framework",
  signals: [
    { type: "dependency", pkg: "npm", names: ["react", "react-dom"], strength: "strong" },
    { type: "topic", values: ["react", "reactjs"], strength: "moderate" },
  ]
}
```

Adding support for a new technology is a small, self-contained contribution.

Evidence levels: **Detected**, **Strong evidence**, **Moderate evidence**, **Limited evidence**.

These are **evidence levels, not skill levels**.

---

## Architecture

```
oss-match/
├── src/
│   ├── app/               Next.js App Router (routes, pages)
│   ├── components/        React components (UI only, no business logic)
│   │   ├── layout/        Navbar, Footer
│   │   ├── profile/       Profile header, language/technology cards, skeleton
│   │   └── recommendations/  Issue cards, filters, empty states, banners
│   ├── lib/               Server-side integration helpers (GitHub client factory,
│   │                      profile analysis, recommendations orchestration)
│   └── core/              Framework-independent business logic
│       ├── github/        GitHub API client, validation, schemas, cache, rate-limit
│       ├── language/      Language aggregation and percentage calculation
│       ├── technology/    Technology detection (registry + signals)
│       ├── matching/      Scoring engine, weights (constants.ts), explainer
│       ├── issues/        Issue discovery, query builder, signals extraction
│       ├── pipeline/      Profile analysis pipeline and errors
│       └── types/         Shared type definitions
├── tests/                 Offline tests (no GitHub token required)
├── docs/                  Architecture documentation
├── scripts/               Record fixtures, utilities
└── .github/               CI, issue templates, PR template
```

`src/core` is framework-independent. It does not import from React, Next.js, browser APIs, or `process.env`. It can be used by the web application, a future CLI, or other consumers.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js (App Router) |
| Language | TypeScript (strict) |
| Styling | Tailwind CSS v4 |
| Fonts | Inter · Geist · JetBrains Mono |
| Validation | Zod |
| Tests | Vitest |
| HTTP | Native fetch (Node built-in) |
| CI | GitHub Actions |

---

## Local Setup

### Prerequisites

- Node.js 20+ (this project uses 24)
- npm 11+
- Git

### 1. Clone

```bash
git clone https://github.com/buildwithroopesh/oss-match.git
cd oss-match
```

### 2. Install dependencies

```bash
npm install
```

### 3. Configure environment

```bash
cp .env.example .env.local
```

Edit `.env.local` and add your GitHub Personal Access Token:

```
GITHUB_API_TOKEN=ghp_your_token_here
```

The token is an application credential used to authenticate requests to the GitHub REST API (increasing the rate limit from 60 to 5,000 requests/hour). We name it `GITHUB_API_TOKEN` to avoid collision with GitHub Actions' internal `GITHUB_TOKEN`.

**Create a token:** https://github.com/settings/tokens  
**Required scopes:** None — all data accessed by OSS Match is public.

### 4. Run development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## Scripts

```bash
npm run dev          # Development server
npm run build        # Production build
npm run start        # Production server
npm run lint         # ESLint
npm run typecheck    # TypeScript (no emit)
npm run test         # Vitest (offline, no token required)
npm run test:watch   # Vitest in watch mode
```

---

## Testing

All core tests run offline — no GitHub token, no network access required.

```bash
npm run test
```

The matching algorithm is deterministic: the same input always produces the same output. Time is injected as a parameter rather than read from `Date.now()` inside the engine.

See [`tests/`](tests/) for the test suite.

---

## Contributing & Community

We welcome contributions of all kinds — from adding new technology definitions to improving documentation and reporting bugs.

- **Contribution Guide**: [CONTRIBUTING.md](CONTRIBUTING.md)
- **Code of Conduct**: [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md)
- **Security Policy**: [SECURITY.md](SECURITY.md)
- **Changelog**: [CHANGELOG.md](CHANGELOG.md)
- **Technical Architecture**: [docs/architecture.md](docs/architecture.md)

---

## Roadmap

- **V1** (current): Deterministic matching, technology detection, profile page, issue cards
- **V2**: Enhanced explanations, contribution roadmap, improved difficulty estimation
- **V3**: GitHub OAuth, saved issues, personalized dashboard
- **V4**: `npx oss-match` CLI (reuses the same core matching engine)
- **V5**: Browser extension, additional Git hosting platforms

---

## License

[MIT](LICENSE)

---

## Disclaimer

OSS Match is not affiliated with, endorsed by, or sponsored by GitHub, Inc. GitHub is a trademark of GitHub, Inc. OSS Match accesses only publicly available data through GitHub's public API.
