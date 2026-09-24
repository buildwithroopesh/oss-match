# Landing & Profile UI Reference

> Architecture, components, accessibility, and error handling for the OSS Match user interface (Milestone 6).

---

## 1. Overview & User Flow

Milestone 6 integrates the core pipeline from Milestones 1–5 into an accessible, developer-focused web application.

```
Landing Page (/)
    ↓
Enter GitHub username / click demo handle
    ↓
Client validation (1–39 alphanumeric/hyphens)
    ↓
Navigate to /profile/[username]
    ↓
Server Component executes analyzeProfile pipeline
    ↓
Render ProfileHeader, AnalysisSummary, LanguageFootprintCard,
TechnologyFootprintCard, RepositoryList, or ProfileErrorState
```

---

## 2. Component Hierarchy (`src/components/profile/`)

| Component | Purpose | Key Data Attributes |
| :--- | :--- | :--- |
| `UsernameForm` | Primary search input with client-side regex validation and quick demo handles. | `role="search"`, `aria-label`, `aria-describedby`, `aria-invalid` |
| `ProfileHeader` | Displays verified user metadata (avatar, login, name, bio, public repo count, followers, GitHub link, analysis status badge). | `role="banner"`, status badge (`complete` vs `partial`) |
| `AnalysisSummary` | Summary metrics (repos analyzed, languages count, skipped repos) and partial failure warning banner. | `role="alert"` for partial warnings, remaining rate limit notice |
| `LanguageFootprintCard` | Segmented visual breakdown bar and legend table summing to exactly 100%. Labeled strictly as *"percentage of analyzed code"*. | `role="img"`, language colors from locked palette |
| `TechnologyFootprintCard` | Detected technologies categorized with evidence badges (`strong`, `moderate`, `limited`), manifests detected, and recency notes. | Badges, deterministic recency from injected `now` |
| `RepositoryList` | Analyzed public repositories (up to 30) with primary languages, stars, forks, topics, and external links. | `article` cards, external links (`rel="noopener noreferrer"`) |
| `EmptyProfileCard` | Displayed when a user exists on GitHub but has 0 public repositories. | Inline retry input, return home CTA |
| `ProfileErrorState` | Accessible error views for 404 Not Found, Rate Limit Exhausted, Invalid Username, and API Error. | `role="alert"`, reset time formatting, inline retry form |
| `ProfileSkeleton` | Loading skeleton rendered during streaming/SSR transitions. | `role="status"`, `aria-busy="true"` |

---

## 3. Server-Side Integration (`src/lib/profile.ts`)

To uphold the core boundary rule, `analyzeProfile` is invoked on the server side via `getProfileAnalysis(username)`:
- Instantiates `GitHubClient` using `process.env.GITHUB_API_TOKEN` (tokens never leak to browser bundles).
- Catches typed `PipelineError` instances and returns a discriminated union:
  - `{ status: "success", data: ProfileAnalysisResult }`
  - `{ status: "error", error: PipelineError }`
- Prevents raw 500 exceptions and ensures graceful rendering of tailored error cards.

---

## 4. Accessibility & Quality Standards

1. **Semantic HTML**: Structural landmarks (`main`, `header`, `section`, `article`, `nav`, `footer`).
2. **Keyboard Accessibility**: All interactive elements (inputs, buttons, links) have visible focus indicators (`:focus-visible`).
3. **Screen Readers**:
   - Errors and warning banners use `role="alert"`.
   - Loading skeletons use `role="status" aria-busy="true"`.
   - Visual progress bars use `role="img"` or `role="progressbar"` with descriptive `aria-label`s.
4. **Data Honesty & Terminology**:
   - Language breakdown is strictly labeled as *"percentage of analyzed code"* or *"code volume"*. The words "skill", "proficiency", or "expertise" are strictly forbidden.
   - Recency notes are rendered only when `daysSinceMostRecent` is non-null.
   - Rate limit information is presented only in relevant error/partial contexts.
5. **Mobile Responsiveness**: Fluid layouts supporting viewports down to 375px without horizontal overflow.
