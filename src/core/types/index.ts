/**
 * Core domain types barrel export
 */

export * from "./github";
export * from "./language";
export * from "./technology";
export * from "./pipeline";
export type {
  ScoringComponent,
  MatchResult,
  MatchReason,
  MatchGap,
  DifficultyEstimate,
  MatchEngineInput,
  MatchEngineOutput,
} from "./matching";
export * from "./issues";
