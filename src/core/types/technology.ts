/**
 * Core types — Technology detection
 *
 * Implemented in Milestone 4 (Technology detection).
 *
 * Provides domain types for the declarative technology registry, observable
 * repository signals, evidence tracking, and aggregated technology profiles.
 */

import type { LanguageFootprintEntry } from "./language";

/** Signal types observable from repository artifacts */
export type SignalType =
  | "dependency"
  | "configFile"
  | "language"
  | "topic"
  | "filenamePattern";

/** Explicit signal strength hierarchy */
export type SignalStrength = "strong" | "moderate" | "weak";

/** Package manager ecosystems supported for dependency extraction */
export type PackageManager = "npm" | "pip" | "cargo" | "gomod" | "maven";

/** Evidence level — how strongly a technology has been detected based on observable evidence */
export type EvidenceLevel = "strong" | "moderate" | "limited" | "detected";

/** Technology classification category */
export type TechnologyCategory =
  | "language"
  | "framework"
  | "library"
  | "runtime"
  | "tool"
  | "platform"
  | "database"
  | "testing"
  | "ci";

/** An individual, verifiable piece of evidence linking a technology to a repository */
export interface TechnologyEvidence {
  technologyId: string;
  repositoryName: string;
  repositoryPushedAt?: string | null;
  signalType: SignalType;
  signalStrength: SignalStrength;
  detail: string;
}

/** A single detected technology with full evidence audit trail */
export interface DetectedTechnology {
  id: string;
  name: string;
  category: TechnologyCategory;
  evidenceLevel: EvidenceLevel;
  /** Human-readable summary of detected evidence */
  evidenceSummary: string[];
  /** Complete underlying evidence items for full auditability */
  evidence: TechnologyEvidence[];
  /** Number of distinct repositories providing evidence for this technology */
  repositoryCount: number;
  /** Names of the repositories providing evidence */
  repositories: string[];
  /** ISO 8601 — date of the most recently active repository using this tech */
  mostRecentAt: string | null;
  /** Days since the most recent repository activity (computed using injected `now`) */
  daysSinceMostRecent: number | null;
}

/** The complete technology profile built from a user's repositories */
export interface TechnologyProfile {
  userId: string;
  analyzedAt: string;
  repositoriesAnalyzed: number;
  technologies: DetectedTechnology[];
  languageFootprint: LanguageFootprintEntry[];
}

/** Normalized input representation of a repository for technology detection */
export interface RepositoryDetectionInput {
  name: string;
  owner?: string;
  pushedAt?: string | null;
  updatedAt?: string | null;
  /** Language byte breakdown from GitHub (e.g. { TypeScript: 50000, Python: 12000 }) */
  languages?: Record<string, number>;
  /** Exact repository topics/tags from GitHub */
  topics?: string[];
  /** File paths present in the repository (e.g. root files or file tree) */
  filePaths?: string[];
  /** Manifest contents or parsed objects */
  manifests?: {
    packageJson?: Record<string, unknown> | string;
    requirementsTxt?: string | string[];
    pyprojectToml?: string;
    cargoToml?: string;
    goMod?: string;
    pomXml?: string;
  };
}

export type { LanguageFootprintEntry };
