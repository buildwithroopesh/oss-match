"use client";

import React from "react";

interface IssueFiltersProps {
  availableLanguages: string[];
  selectedLanguage: string;
  onSelectLanguage: (language: string) => void;
  friendlyOnly: boolean;
  onToggleFriendlyOnly: (value: boolean) => void;
  minScore: number;
  onSelectMinScore: (score: number) => void;
  totalMatchesCount: number;
  filteredCount: number;
}

export default function IssueFilters({
  availableLanguages,
  selectedLanguage,
  onSelectLanguage,
  friendlyOnly,
  onToggleFriendlyOnly,
  minScore,
  onSelectMinScore,
  totalMatchesCount,
  filteredCount,
}: IssueFiltersProps) {
  return (
    <div
      aria-label="Filter recommendations"
      style={{
        backgroundColor: "#101214",
        border: "1px solid #2A2F35",
        borderRadius: "8px",
        padding: "14px 16px",
        marginBottom: "20px",
        display: "flex",
        flexWrap: "wrap",
        alignItems: "center",
        justifyContent: "space-between",
        gap: "12px",
      }}
    >
      {/* Left controls: Language selector and Friendly-only checkbox */}
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          alignItems: "center",
          gap: "14px",
        }}
      >
        {/* Language Filter */}
        {availableLanguages.length > 0 && (
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <label
              htmlFor="filter-language"
              style={{
                fontSize: "12px",
                color: "#A5ABB3",
                fontWeight: 500,
              }}
            >
              Language:
            </label>
            <select
              id="filter-language"
              value={selectedLanguage}
              onChange={(e) => onSelectLanguage(e.target.value)}
              style={{
                backgroundColor: "#15181B",
                border: "1px solid #2A2F35",
                borderRadius: "6px",
                color: "#F2F3F5",
                fontSize: "12px",
                padding: "4px 8px",
                fontFamily: "var(--font-jetbrains-mono), monospace",
                cursor: "pointer",
              }}
            >
              <option value="ALL">All languages</option>
              {availableLanguages.map((lang) => (
                <option key={lang} value={lang}>
                  {lang}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Score Threshold Filter */}
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <label
            htmlFor="filter-score"
            style={{
              fontSize: "12px",
              color: "#A5ABB3",
              fontWeight: 500,
            }}
          >
            Score:
          </label>
          <select
            id="filter-score"
            value={minScore}
            onChange={(e) => onSelectMinScore(Number(e.target.value))}
            style={{
              backgroundColor: "#15181B",
              border: "1px solid #2A2F35",
              borderRadius: "6px",
              color: "#F2F3F5",
              fontSize: "12px",
              padding: "4px 8px",
              cursor: "pointer",
            }}
          >
            <option value={0}>All matches</option>
            <option value={50}>50+ Score</option>
            <option value={75}>75+ High Match</option>
          </select>
        </div>

        {/* Contributor-friendly Checkbox */}
        <label
          htmlFor="filter-friendly"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "6px",
            fontSize: "12px",
            color: "#D0D6DE",
            cursor: "pointer",
            userSelect: "none",
          }}
        >
          <input
            id="filter-friendly"
            type="checkbox"
            checked={friendlyOnly}
            onChange={(e) => onToggleFriendlyOnly(e.target.checked)}
            style={{
              cursor: "pointer",
              accentColor: "#8B92FF",
            }}
          />
          Good first issue / help wanted only
        </label>
      </div>

      {/* Right side: Count indicator */}
      <div
        style={{
          fontSize: "12px",
          color: "#7B838D",
          fontFamily: "var(--font-jetbrains-mono), monospace",
        }}
      >
        Showing {filteredCount} of {totalMatchesCount} issue{totalMatchesCount === 1 ? "" : "s"}
      </div>
    </div>
  );
}
