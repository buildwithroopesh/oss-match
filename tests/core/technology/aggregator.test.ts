import { describe, it, expect } from "vitest";
import {
  aggregateDetectedTechnologies,
  buildTechnologyProfile,
} from "@/core/technology/aggregator";
import type {
  TechnologyEvidence,
  RepositoryDetectionInput,
} from "@/core/types/technology";

describe("Evidence Aggregator", () => {
  const fixedNow = new Date("2026-03-15T12:00:00Z");

  it("classifies multi-repository strong evidence as 'strong'", () => {
    const evidence: TechnologyEvidence[] = [
      {
        technologyId: "react",
        repositoryName: "repo-a",
        repositoryPushedAt: "2026-03-10T10:00:00Z",
        signalType: "dependency",
        signalStrength: "strong",
        detail: "Found npm dependency 'react'",
      },
      {
        technologyId: "react",
        repositoryName: "repo-b",
        repositoryPushedAt: "2026-03-12T10:00:00Z",
        signalType: "dependency",
        signalStrength: "strong",
        detail: "Found npm dependency 'react'",
      },
    ];

    const results = aggregateDetectedTechnologies(evidence, { now: fixedNow });
    expect(results).toHaveLength(1);

    const react = results[0];
    expect(react.id).toBe("react");
    expect(react.evidenceLevel).toBe("strong");
    expect(react.repositoryCount).toBe(2);
    expect(react.repositories).toEqual(["repo-a", "repo-b"]);
    expect(react.mostRecentAt).toBe("2026-03-12T10:00:00Z");
    expect(react.daysSinceMostRecent).toBe(3); // 2026-03-15 minus 2026-03-12 = 3 days
  });

  it("classifies multi-signal-type strong evidence in a single repository as 'strong'", () => {
    const evidence: TechnologyEvidence[] = [
      {
        technologyId: "nextjs",
        repositoryName: "my-app",
        repositoryPushedAt: "2026-03-01T00:00:00Z",
        signalType: "dependency",
        signalStrength: "strong",
        detail: "Found dependency next in package.json",
      },
      {
        technologyId: "nextjs",
        repositoryName: "my-app",
        repositoryPushedAt: "2026-03-01T00:00:00Z",
        signalType: "configFile",
        signalStrength: "strong",
        detail: "Found next.config.ts",
      },
    ];

    const results = aggregateDetectedTechnologies(evidence, { now: fixedNow });
    expect(results[0].evidenceLevel).toBe("strong");
  });

  it("classifies single strong signal in single repository as 'moderate'", () => {
    const evidence: TechnologyEvidence[] = [
      {
        technologyId: "fastapi",
        repositoryName: "service-x",
        repositoryPushedAt: "2026-03-05T00:00:00Z",
        signalType: "dependency",
        signalStrength: "strong",
        detail: "Found fastapi in requirements.txt",
      },
    ];

    const results = aggregateDetectedTechnologies(evidence, { now: fixedNow });
    expect(results[0].evidenceLevel).toBe("moderate");
    expect(results[0].repositoryCount).toBe(1);
  });

  it("classifies multiple moderate signals as 'moderate'", () => {
    const evidence: TechnologyEvidence[] = [
      {
        technologyId: "docker",
        repositoryName: "app-1",
        repositoryPushedAt: "2026-02-01T00:00:00Z",
        signalType: "topic",
        signalStrength: "moderate",
        detail: "Topic docker",
      },
      {
        technologyId: "docker",
        repositoryName: "app-2",
        repositoryPushedAt: "2026-02-15T00:00:00Z",
        signalType: "topic",
        signalStrength: "moderate",
        detail: "Topic docker",
      },
    ];

    const results = aggregateDetectedTechnologies(evidence, { now: fixedNow });
    expect(results[0].evidenceLevel).toBe("moderate");
  });

  it("enforces Guardrail 2: filename patterns alone remain 'limited' evidence", () => {
    const evidence: TechnologyEvidence[] = [
      {
        technologyId: "react",
        repositoryName: "repo-1",
        signalType: "filenamePattern",
        signalStrength: "weak",
        detail: "Found *.tsx",
      },
      {
        technologyId: "react",
        repositoryName: "repo-2",
        signalType: "filenamePattern",
        signalStrength: "weak",
        detail: "Found *.tsx",
      },
      {
        technologyId: "react",
        repositoryName: "repo-3",
        signalType: "filenamePattern",
        signalStrength: "weak",
        detail: "Found *.tsx",
      },
    ];

    const results = aggregateDetectedTechnologies(evidence, { now: fixedNow });
    expect(results[0].evidenceLevel).toBe("limited");
    expect(results[0].repositoryCount).toBe(3);
  });

  it("classifies single isolated topic as 'limited' evidence", () => {
    const evidence: TechnologyEvidence[] = [
      {
        technologyId: "django",
        repositoryName: "toy-project",
        signalType: "topic",
        signalStrength: "moderate",
        detail: "Topic django",
      },
    ];

    const results = aggregateDetectedTechnologies(evidence, { now: fixedNow });
    expect(results[0].evidenceLevel).toBe("limited");
  });

  it("guarantees deterministic output across identical runs", () => {
    const repos: RepositoryDetectionInput[] = [
      {
        name: "service-b",
        pushedAt: "2026-03-10T00:00:00Z",
        languages: { Go: 40000 },
        manifests: { goMod: "module b\ngo 1.22" },
      },
      {
        name: "service-a",
        pushedAt: "2026-03-14T00:00:00Z",
        languages: { Python: 50000 },
        manifests: { requirementsTxt: "fastapi>=0.100" },
      },
    ];

    const profile1 = buildTechnologyProfile(repos, {
      userId: "alice",
      now: fixedNow,
    });

    const profile2 = buildTechnologyProfile(repos, {
      userId: "alice",
      now: fixedNow,
    });

    expect(JSON.stringify(profile1)).toBe(JSON.stringify(profile2));
  });
});
