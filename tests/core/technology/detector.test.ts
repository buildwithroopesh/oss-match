import { describe, it, expect } from "vitest";
import { detectRepositoryTechnologies } from "@/core/technology/detector";
import type { RepositoryDetectionInput } from "@/core/types/technology";

describe("detectRepositoryTechnologies", () => {
  it("detects React from npm dependencies and filename patterns", () => {
    const repo: RepositoryDetectionInput = {
      name: "web-ui",
      filePaths: ["src/App.tsx", "src/index.tsx"],
      manifests: {
        packageJson: {
          dependencies: {
            react: "^19.0.0",
            "react-dom": "^19.0.0",
          },
        },
      },
    };

    const evidence = detectRepositoryTechnologies(repo);
    const reactEvidence = evidence.filter((e) => e.technologyId === "react");

    expect(reactEvidence.length).toBeGreaterThanOrEqual(1);

    const depEvidence = reactEvidence.find((e) => e.signalType === "dependency");
    expect(depEvidence).toBeDefined();
    expect(depEvidence?.signalStrength).toBe("strong");

    const fnEvidence = reactEvidence.find((e) => e.signalType === "filenamePattern");
    expect(fnEvidence).toBeDefined();
    expect(fnEvidence?.signalStrength).toBe("weak");
  });

  it("detects Next.js from config file and npm dependency", () => {
    const repo: RepositoryDetectionInput = {
      name: "my-next-site",
      filePaths: ["next.config.mjs", "src/app/page.tsx"],
      manifests: {
        packageJson: {
          dependencies: {
            next: "15.2.0",
          },
        },
      },
    };

    const evidence = detectRepositoryTechnologies(repo);
    const nextEvidence = evidence.filter((e) => e.technologyId === "nextjs");

    expect(nextEvidence.length).toBe(2);
    expect(nextEvidence.some((e) => e.signalType === "dependency" && e.signalStrength === "strong")).toBe(true);
    expect(nextEvidence.some((e) => e.signalType === "configFile" && e.signalStrength === "strong")).toBe(true);
  });

  it("detects Python and Django from manifests, files, and language bytes", () => {
    const repo: RepositoryDetectionInput = {
      name: "backend-api",
      languages: { Python: 85000, Shell: 2000 },
      filePaths: ["manage.py", "requirements.txt"],
      manifests: {
        requirementsTxt: "django==5.0.2\npsycopg2-binary==2.9.9",
      },
    };

    const evidence = detectRepositoryTechnologies(repo);

    // Python evidence
    const pythonEvidence = evidence.filter((e) => e.technologyId === "python");
    expect(pythonEvidence.some((e) => e.signalType === "language" && e.signalStrength === "strong")).toBe(true);
    expect(pythonEvidence.some((e) => e.signalType === "configFile")).toBe(true);

    // Django evidence
    const djangoEvidence = evidence.filter((e) => e.technologyId === "django");
    expect(djangoEvidence.some((e) => e.signalType === "dependency" && e.signalStrength === "strong")).toBe(true);
    expect(djangoEvidence.some((e) => e.signalType === "configFile" && e.signalStrength === "strong")).toBe(true);
  });

  it("detects Rust from Cargo.toml and language bytes", () => {
    const repo: RepositoryDetectionInput = {
      name: "rust-cli",
      languages: { Rust: 120000 },
      filePaths: ["Cargo.toml", "src/main.rs"],
      manifests: {
        cargoToml: `
          [package]
          name = "cli"
          [dependencies]
          clap = "4.0"
        `,
      },
    };

    const evidence = detectRepositoryTechnologies(repo);
    const rustEvidence = evidence.filter((e) => e.technologyId === "rust");

    expect(rustEvidence.some((e) => e.signalType === "language")).toBe(true);
    expect(rustEvidence.some((e) => e.signalType === "configFile")).toBe(true);
    expect(rustEvidence.some((e) => e.signalType === "filenamePattern")).toBe(true);
  });

  it("detects Go from go.mod and language bytes", () => {
    const repo: RepositoryDetectionInput = {
      name: "go-microservice",
      languages: { Go: 45000 },
      filePaths: ["go.mod", "main.go"],
      manifests: {
        goMod: "module example.com/service\ngo 1.22\nrequire github.com/gin-gonic/gin v1.9.1",
      },
    };

    const evidence = detectRepositoryTechnologies(repo);
    const goEvidence = evidence.filter((e) => e.technologyId === "go");

    expect(goEvidence.some((e) => e.signalType === "language")).toBe(true);
    expect(goEvidence.some((e) => e.signalType === "configFile")).toBe(true);
  });

  it("detects Docker and GitHub Actions from configuration files", () => {
    const repo: RepositoryDetectionInput = {
      name: "infra-repo",
      filePaths: [
        "Dockerfile",
        "docker-compose.yml",
        ".github/workflows/ci.yml",
        ".github/workflows/deploy.yaml",
      ],
    };

    const evidence = detectRepositoryTechnologies(repo);

    const dockerEvidence = evidence.filter((e) => e.technologyId === "docker");
    expect(dockerEvidence.length).toBeGreaterThanOrEqual(1);
    expect(dockerEvidence.some((e) => e.signalType === "configFile" && e.signalStrength === "strong")).toBe(true);

    const actionsEvidence = evidence.filter((e) => e.technologyId === "github-actions");
    expect(actionsEvidence.length).toBeGreaterThanOrEqual(1);
    expect(actionsEvidence.some((e) => e.signalType === "configFile" && e.signalStrength === "strong")).toBe(true);
  });

  it("detects repository topics with case-insensitivity as moderate evidence", () => {
    const repo: RepositoryDetectionInput = {
      name: "tagged-project",
      topics: ["ReactJS", "TailwindCSS", "Docker"],
    };

    const evidence = detectRepositoryTechnologies(repo);

    const reactTopic = evidence.find((e) => e.technologyId === "react" && e.signalType === "topic");
    expect(reactTopic).toBeDefined();
    expect(reactTopic?.signalStrength).toBe("moderate");

    const tailwindTopic = evidence.find((e) => e.technologyId === "tailwindcss" && e.signalType === "topic");
    expect(tailwindTopic).toBeDefined();
    expect(tailwindTopic?.signalStrength).toBe("moderate");

    const dockerTopic = evidence.find((e) => e.technologyId === "docker" && e.signalType === "topic");
    expect(dockerTopic).toBeDefined();
    expect(dockerTopic?.signalStrength).toBe("moderate");
  });
});
