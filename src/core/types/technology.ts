/**
 * Core types — Technology detection
 *
 * Implemented in Milestone 4 (Technology detection).
 */

/** Evidence level — how strongly a technology has been detected */
export type EvidenceLevel = "detected" | "strong" | "moderate" | "limited";

/** Technology category */
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

/** A single detected technology with supporting evidence */
export interface DetectedTechnology {
  id: string;
  name: string;
  category: TechnologyCategory;
  evidenceLevel: EvidenceLevel;
  evidenceSummary: string[];
  repositoryCount: number;
  /** ISO 8601 — date of the most recently active repository using this tech */
  mostRecentAt: string | null;
}

/** The complete technology profile built from a user's repositories */
export interface TechnologyProfile {
  userId: string;
  analyzedAt: string;
  repositoriesAnalyzed: number;
  technologies: DetectedTechnology[];
  languageFootprint: LanguageFootprintEntry[];
}

/** A single language entry in the code footprint */
export interface LanguageFootprintEntry {
  language: string;
  bytes: number;
  /** Rounded percentage of total analyzed code (0–100) */
  percentage: number;
  /** Hex color for display purposes */
  color: string;
}
