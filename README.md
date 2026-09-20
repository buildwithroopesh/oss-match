# OSS Match

**Find open-source issues that match your experience.**

> Not affiliated with GitHub, Inc. Uses only publicly available GitHub data.

---

## What is OSS Match?

OSS Match is a repo-first open-source developer tool that helps you discover GitHub issues you can realistically contribute to, based on your public GitHub activity.

It does not simply list "Good First Issues." It analyzes your public repositories to build a **technology footprint**, then matches open issues to that footprint using a **transparent, deterministic scoring algorithm** — and explains exactly why each issue matched.

---

## Live Demo

> Coming in Milestone 6.

---

## How It Works

```
GitHub profile
    ↓
Public repository analysis (last 30 repos)
    ↓
Language footprint (byte counts → percentages)
    ↓
Technology detection (package manifests, config files, topics)
    ↓
Issue search (GitHub global search)
    ↓
Hard filtering (closed issues, abandoned repos, spam)
    ↓
Deterministic matching (weighted scoring)
    ↓
Explanation (derived from the same data as the score)
```

---

## Features (V1)

- **Technology footprint** — aggregated language statistics from public repositories, displayed as percentages of analyzed code (not skill percentages)
- **Evidence-based technology detection** — detects React, Next.js, Docker, FastAPI, etc. from real evidence (package manifests, config files, topics)
- **Deterministic matching** — same input always produces the same output; time is injected, not read from the clock
- **Transparent explanations** — every recommendation shows why it matched and what gaps to expect
- **No account required** — public GitHub username is all that's needed
- **No database** — stateless; data is fetched live from GitHub's public API
- **Fully open source** — every part of the matching logic is visible and auditable

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

Weights are centralized in [`src/core/matching/weights.ts`](src/core/matching/weights.ts) and can be adjusted or extended.

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
│   ├── app/               Next.js App Router (routes, API handlers)
│   ├── components/        React components (UI only, no business logic)
│   └── core/              Framework-independent business logic
│       ├── github/        GitHub API client, validation, schemas
│       ├── language/      Language aggregation and percentage calculation
│       ├── technology/    Technology detection (registry + signals)
│       ├── matching/      Scoring engine, weights, explainer
│       ├── pipeline/      Analysis and recommendation pipelines
│       ├── cache/         Simple in-memory cache
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

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md).

---

## Roadmap

- **V1** (current): Deterministic matching, technology detection, profile page, issue cards
- **V2**: AI issue explanation, contribution roadmap, improved difficulty estimation
- **V3**: GitHub OAuth, saved issues, personalized dashboard
- **V4**: `npx oss-match` CLI (reuses the same core matching engine)
- **V5**: Browser extension, additional Git hosting platforms

---

## License

[MIT](LICENSE)

---

## Disclaimer

OSS Match is not affiliated with, endorsed by, or sponsored by GitHub, Inc. GitHub is a trademark of GitHub, Inc. OSS Match accesses only publicly available data through GitHub's public API.
