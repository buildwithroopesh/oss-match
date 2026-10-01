# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.1.0] - 2026-10-01

### Added
- **GitHub Profile Analysis**:
  - Analyzes up to 30 recent public repositories for a specified GitHub username.
  - Computes language breakdown using the Hare-Niemeyer (Largest Remainder) method to guarantee exact 100% rounding.
  - Represents volume strictly as "% of analyzed code volume", never as a skill assessment.
- **Multi-Signal Technology Detection**:
  - Declarative technology registry with 19 curated ecosystem definitions (React, Next.js, Vue, Node.js, Python, Rust, Go, Docker, etc.).
  - Evaluates observable manifest dependencies, configuration paths, topics, and language presence.
  - Reports factual evidence levels (`strong`, `moderate`, `limited`, `detected`).
- **Open-Source Issue Discovery**:
  - Queries GitHub's issue search API with structured qualifiers (`is:issue state:open archived:false`).
  - Broad candidate recall preserving issues across technologies without arbitrary star or label restrictions.
  - Deduplication and stable tie-breaking on issue IDs.
- **Deterministic Matching Engine**:
  - 7 observable scoring components: Technology (35%), Language (20%), Framework/Topic (15%), Suitability (10%), Activity (10%), Freshness (5%), Difficulty (5%).
  - Strict evidence separation: Technology matches structured issue labels only; Framework matches repository topics only.
  - Dynamic weight renormalization when components lack observable data.
  - Injected reference time (`now: Date`) for 100% reproducible scoring.
  - Generates factual, transparent explanations for each match.
- **Recommendations UI**:
  - Developer-focused dashboard with profile summary and matched issues list.
  - Real-time client-side filtering by primary language, minimum match score, and contributor-friendly labels while preserving deterministic ranking.
  - Accessible design responsive down to 375px mobile viewports.
  - Clear empty states, loading skeletons, and degraded-state warning banners for rate limits and partial discoveries.
- **Production-Hardened Transport**:
  - In-process caching and in-flight request deduplication to conserve GitHub API rate limits.
  - Primary and secondary rate-limit handling with exponential backoff and typed error boundaries.
  - Server-only credential isolation (`GITHUB_API_TOKEN`) preventing token leakage to client bundles.
