import { describe, it, expect } from "vitest";
import { detectRepositoryTechnologies } from "@/core/technology/detector";
import type { RepositoryDetectionInput } from "@/core/types/technology";

describe("False Positive Prevention", () => {
  it("does not detect 'C' from arbitrary words or substring topics", () => {
    const repo: RepositoryDetectionInput = {
      name: "cargo-project",
      topics: ["cargo", "c-sharp", "cli", "cat", "container"],
      filePaths: ["docs/changelog.md", "src/client.ts"],
      manifests: {
        packageJson: {
          dependencies: {
            chalk: "^5.0.0",
          },
        },
      },
    };

    const evidence = detectRepositoryTechnologies(repo);
    const cEvidence = evidence.filter((e) => e.technologyId === "c");
    expect(cEvidence).toHaveLength(0);
  });

  it("does not detect 'Go' from English prose words or substring topics", () => {
    const repo: RepositoryDetectionInput = {
      name: "go-to-market-strategy",
      topics: ["gopher", "google", "good-first-issue", "government"],
      filePaths: ["README.md", "logo.png"],
      manifests: {
        packageJson: {
          dependencies: {
            "got-scraping": "^4.0.0",
          },
        },
      },
    };

    const evidence = detectRepositoryTechnologies(repo);
    const goEvidence = evidence.filter((e) => e.technologyId === "go");
    expect(goEvidence).toHaveLength(0);
  });

  it("does not detect 'Rust' from words like 'crust', 'trust', or 'rusting'", () => {
    const repo: RepositoryDetectionInput = {
      name: "zero-trust-architecture",
      topics: ["trust", "security", "crustacean", "rusting"],
      filePaths: ["security/policy.md"],
      manifests: {
        packageJson: {
          dependencies: {
            trusted: "^1.0.0",
          },
        },
      },
    };

    const evidence = detectRepositoryTechnologies(repo);
    const rustEvidence = evidence.filter((e) => e.technologyId === "rust");
    expect(rustEvidence).toHaveLength(0);
  });

  it("does not detect 'React' from 'reactive', 'reaction', or arbitrary prose", () => {
    const repo: RepositoryDetectionInput = {
      name: "reactive-streams-poc",
      topics: ["reactive", "reaction", "reactor"],
      filePaths: ["docs/readme.txt"],
      manifests: {
        packageJson: {
          dependencies: {
            "reactive-elements": "^1.0.0",
            "reactor-core": "^3.0.0",
          },
        },
      },
    };

    const evidence = detectRepositoryTechnologies(repo);
    const reactEvidence = evidence.filter((e) => e.technologyId === "react");
    expect(reactEvidence).toHaveLength(0);
  });

  it("requires exact package-name matches and does not trigger on partial prefixes", () => {
    const repo: RepositoryDetectionInput = {
      name: "django-tools",
      manifests: {
        requirementsTxt: "djangorestframework>=3.14\ndjango-filter>=23.0",
      },
    };

    const evidence = detectRepositoryTechnologies(repo);
    // Should NOT match core "django" unless "django" itself is declared
    const coreDjangoDep = evidence.find(
      (e) => e.technologyId === "django" && e.signalType === "dependency"
    );
    expect(coreDjangoDep).toBeUndefined();
  });
});
