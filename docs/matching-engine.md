# Matching Engine Reference

> Framework-independent open-source issue matching engine (`src/core/matching/`).

---

## 1. Overview & Architectural Boundaries

The Matching Engine compares a developer's observed public engineering profile (`TechnologyProfile`, `LanguageFootprint`, `DetectedTechnology[]` from Milestone 5) against candidate open-source issues (`DiscoveredIssue[]` from Milestone 7).

```
TechnologyProfile (Milestone 5)        DiscoveredIssue[] (Milestone 7)
       │                                       │
       └───────────────────┬───────────────────┘
                           │ + injected now: Date
                           ▼
          7 Observable Component Evaluators:
          1. Technology Match (35%)
          2. Language Match (20%)
          3. Framework / Topic Match (15%)
          4. Issue Suitability (10%)
          5. Repository Activity (10%)
          6. Freshness (5%)
          7. Difficulty (5%)
                           │
                           ▼
             Availability Filter & Weight Renormalization:
             W_avail = Σ W_c (where isAvailable == true)
             w'_c = W_c / W_avail
             Composite Score = (Σ (Score_c × W_c) / W_avail) × 100
                           │
                           ▼
             Factual Explanation Generator:
             - Matched technologies, languages, topics
             - Suitability & activity highlights
             - Explicit list of unavailable components
                           │
                           ▼
             Deterministic Sorting & Stable Tie-Breaking:
             1. Score DESC
             2. daysSinceUpdated ASC
             3. issue.id ASC (stable secondary tie-breaker)
                           │
                           ▼
                     MatchingResult
```

### Architectural Invariants
- Located under `src/core/matching/` with zero dependencies on React, Next.js, browser APIs, or `process.env`.
- Pure evaluation on already-normalized domain data. **Zero HTTP or network calls** inside the matching engine.
- Purely deterministic: operates using an injected reference time (`now: Date`).
- **Data Honesty Invariant**: Grounded 100% in observable facts.
  - Zero claims of personal skill or expertise (e.g. NEVER *"You are an expert in React"*).
  - Zero AI or LLM subjective classification.
  - Zero machine-invented difficulty ratings.
  - No arbitrary popularity minimums (stars and forks do not gate eligibility).

---

## 2. The 7 Scoring Components & Baseline Weights

The matching engine implements the initial scoring model specified in the OSS Match master requirements:

| Component | Base Weight | Observable Input (User) | Observable Input (Issue) | Availability Condition | Scoring Method |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Technology** | **35%** (`0.35`) | `profile.technologies` (IDs, names, evidence levels) | `signals.labelNames` (structured labels only) | `signals.labelNames.length > 0` | Saturated overlap weighted by user evidence strength (`strong`: 1.0, `moderate`: 0.8, `limited`: 0.6, `detected`: 0.4). Evaluated to `0.0` if no overlap. Strictly excludes issue title/body prose and repository topics. |
| **Language** | **20%** (`0.20`) | `profile.languageFootprint` (language names, code volume %) | `signals.primaryLanguage` | `signals.primaryLanguage !== null` | User percentage for primary language: $\ge 50\% \to 1.0$, $20\text{--}49\% \to 0.8$, $5\text{--}19\% \to 0.6$, $>0\% \to 0.4$, not in footprint $\to 0.0$. |
| **Framework / Topic** | **15%** (`0.15`) | User detected frameworks (`category: "framework"` or `"library"`) | `signals.repositoryTopics` (structured topics only) | `signals.repositoryTopics.length > 0` | Topic overlap: $\ge 2$ matching $\to 1.0$, $1$ matching $\to 0.7$, $0$ matching $\to 0.0$. Strictly excludes issue labels and title/body prose. |
| **Issue Suitability** | **10%** (`0.10`) | None (issue-intrinsic observable facts) | `signals.hasBody`, `signals.bodyLength`, `signals.commentsCount`, `signals.hasHelpWantedOrGoodFirstIssue` | Always available | Base body presence (0.4) + body length $\ge 100$ (+0.2) or $\ge 300$ (+0.3) + comments $0\text{--}5$ (+0.2) or $6\text{--}15$ (+0.1) + friendly labels (+0.1). Saturated to max 1.0. |
| **Repository Activity** | **10%** (`0.10`) | None (repo-intrinsic observable facts) | `signals.isRepositoryArchived`, `signals.daysSinceUpdated` | `signals.daysSinceUpdated >= 0` | If `isRepositoryArchived == true` $\to 0.0$. Else by issue update recency: $\le 30$d $\to 1.0$, $\le 90$d $\to 0.7$, $\le 180$d $\to 0.4$, $> 180$d $\to 0.1$. |
| **Freshness** | **5%** (`0.05`) | None (temporal recency relative to `now`) | `signals.daysSinceUpdated` | Valid timestamps | Stepped recency: $\le 7$d $\to 1.0$, $\le 30$d $\to 0.8$, $\le 60$d $\to 0.6$, $\le 120$d $\to 0.4$, $\le 365$d $\to 0.2$, $> 365$d $\to 0.05$. |
| **Difficulty** | **5%** (`0.05`) | User language/tech overlap | `signals.labelNames` for explicit labels (`good first issue`, `beginner`, `easy`, `intermediate`, `advanced`) | **Only available if explicit difficulty label is present** | If beginner-friendly label: 1.0. If intermediate: 0.8. If advanced: 0.6. **If no explicit difficulty label is present $\to$ UNAVAILABLE (`null`)**. |

### Explicit Evidence Separation
- **Technology (35%)**: Evaluates structured **issue labels** against user detected technologies (tools, libraries, databases, frameworks). Strictly no issue title/body tokens and no repository topics.
- **Framework / Topic (15%)**: Evaluates structured **repository topics** against user framework/platform evidence. Strictly no issue labels and no issue title/body tokens.
- **Zero Double-Counting**: Repository topics never fund the Technology component, and issue labels never fund the Framework/Topic component. No single token is scored twice across these components.

---

## 3. Weight Renormalization Over Available Components

When observable data for a component is missing (e.g. no repository primary language, no topics, or no explicit difficulty label):

1. Let $\mathcal{C}$ be the set of all 7 components, with base weights $W_c$ such that $\sum_{c \in \mathcal{C}} W_c = 1.00$.
2. Let $\mathcal{A} \subseteq \mathcal{C}$ be the subset of components where observable data is available (`isAvailable === true`).
3. Compute the available base weight sum:
   $$W_{\text{avail}} = \sum_{c \in \mathcal{A}} W_c$$
4. If $W_{\text{avail}} === 0$, composite score is `0.0`.
5. For each available component $c \in \mathcal{A}$, the effective normalized weight is:
   $$w'_c = \frac{W_c}{W_{\text{avail}}}$$
   Notice that $\sum_{c \in \mathcal{A}} w'_c \equiv 1.00$.
6. For unavailable components $u \notin \mathcal{A}$:
   $$w'_u = 0, \quad \text{score}_u = \text{null}$$
7. The composite score (0 to 100) is:
   $$\text{Score} = \text{round}\left( \sum_{c \in \mathcal{A}} (\text{score}_c \times w'_c) \times 100, \ 1 \right)$$
8. Unavailable components are clearly noted in `explanation.unavailableComponents` and preserved in the component breakdown.

---

## 4. Factual Match Explanations

The matching engine generates explanations powered directly by the underlying observable evidence:
- **Language**: *"Primary language TypeScript accounts for 64% of your analyzed code volume."*
- **Technology**: *"Matches detected technology evidence from your profile: Docker, Tailwind CSS."*
- **Framework / Topic**: *"Repository topic(s) match frameworks observed in your repositories: nextjs."*
- **Suitability**: *"Issue is open with descriptive issue body (450 characters), 2 comments (low contention)."*
- **Activity**: *"Parent repository exhibits recently active (updated 14 days ago)."*
- **Freshness**: *"Issue was updated 4 days ago."*
- **Difficulty**: *"Issue contains explicit contributor difficulty label 'good first issue'."*
- **Gaps**: *"Primary repository language Go was not observed in your public repositories."*

---

## 5. Deterministic Sorting & Tie-Breaking

Candidate issues are ranked using strict, deterministic criteria:
1. **Composite Score (`score`)** descending.
2. **Recency of Update (`daysSinceUpdated`)** ascending (more recently updated issues first).
3. **Issue ID (`issue.id`)** ascending as the stable secondary tie-breaker (`a.issue.id < b.issue.id ? -1 : 1`).

---

## 6. Non-Goals

Milestone 8 explicitly does **not**:
- Render matching results in the UI (deferred to Milestone 9).
- Call external APIs or query GitHub directly (uses already discovered issues).
- Introduce artificial intelligence, large language models, or probabilistic heuristics.
- Claim user mastery, skill level, or problem difficulty.
- Filter out projects based on arbitrary star or fork minimums.
