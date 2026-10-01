"use client";

import React, { useState, useMemo } from "react";
import type { DiscoveredIssue, DiscoveryMetadata } from "@/core/types/issues";
import BrowseIssueCard from "./BrowseIssueCard";
import EmptyBrowseState from "./EmptyBrowseState";
import { UsernameForm } from "@/components/profile/UsernameForm";

interface BrowseIssuesSectionProps {
  initialIssues: DiscoveredIssue[];
  metadata: DiscoveryMetadata;
  initialLanguage?: string;
  initialFriendlyOnly?: boolean;
  initialQuery?: string;
}

const POPULAR_LANGUAGES = [
  "ALL",
  "TypeScript",
  "JavaScript",
  "Python",
  "Go",
  "Rust",
  "C++",
  "Java",
];

export default function BrowseIssuesSection({
  initialIssues,
  metadata,
  initialLanguage = "ALL",
  initialFriendlyOnly = false,
  initialQuery = "",
}: BrowseIssuesSectionProps) {
  const [selectedLanguage, setSelectedLanguage] = useState<string>(
    initialLanguage.toUpperCase() === "ALL" ? "ALL" : initialLanguage
  );
  const [friendlyOnly, setFriendlyOnly] = useState<boolean>(initialFriendlyOnly);
  const [searchQuery, setSearchQuery] = useState<string>(initialQuery);

  // Compute available languages combining popular set and discovered set
  const availableLanguages = useMemo(() => {
    const langs = new Set<string>(POPULAR_LANGUAGES);
    for (const item of initialIssues) {
      if (item.signals.primaryLanguage) {
        langs.add(item.signals.primaryLanguage);
      }
    }
    return Array.from(langs);
  }, [initialIssues]);

  // Client-side filtering for fast responsive interactions
  const filteredIssues = useMemo(() => {
    return initialIssues.filter((item) => {
      // 1. Language filter
      if (selectedLanguage !== "ALL") {
        if (
          !item.signals.primaryLanguage ||
          item.signals.primaryLanguage.toLowerCase() !== selectedLanguage.toLowerCase()
        ) {
          return false;
        }
      }

      // 2. Contributor friendly filter
      if (friendlyOnly && !item.signals.hasHelpWantedOrGoodFirstIssue) {
        return false;
      }

      // 3. Search text query filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const titleMatch = item.issue.title.toLowerCase().includes(q);
        const repoMatch = (
          item.issue.repository.fullName ||
          `${item.issue.repository.owner}/${item.issue.repository.name}`
        )
          .toLowerCase()
          .includes(q);
        const labelMatch = item.signals.labelNames.some((l) =>
          l.toLowerCase().includes(q)
        );
        const topicMatch = item.signals.repositoryTopics.some((t) =>
          t.toLowerCase().includes(q)
        );

        if (!titleMatch && !repoMatch && !labelMatch && !topicMatch) {
          return false;
        }
      }

      return true;
    });
  }, [initialIssues, selectedLanguage, friendlyOnly, searchQuery]);

  const hasActiveFilters =
    selectedLanguage !== "ALL" || friendlyOnly || searchQuery.trim().length > 0;

  const handleResetFilters = () => {
    setSelectedLanguage("ALL");
    setFriendlyOnly(false);
    setSearchQuery("");
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      {/* Non-fatal discovery warnings if partial */}
      {metadata.status === "partial" && metadata.warnings.length > 0 && (
        <div
          role="status"
          style={{
            backgroundColor: "#2B2112",
            border: "1px solid #5C451D",
            borderRadius: "8px",
            padding: "12px 16px",
            color: "#E7B65C",
            fontSize: "13px",
            display: "flex",
            alignItems: "center",
            gap: "10px",
          }}
        >
          <span aria-hidden="true">⚠️</span>
          <span>
            {metadata.warnings[0] ||
              "Rate limit reached during discovery. Showing issues retrieved before limit."}
          </span>
        </div>
      )}

      {/* Filter and Search Controls */}
      <div
        style={{
          backgroundColor: "#15181B",
          border: "1px solid #2A2F35",
          borderRadius: "8px",
          padding: "16px 20px",
          display: "flex",
          flexDirection: "column",
          gap: "14px",
        }}
      >
        {/* Search input and Friendly checkbox */}
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: "12px",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div style={{ flex: "1 1 260px", minWidth: 0 }}>
            <label htmlFor="issue-search-filter" className="sr-only">
              Filter issues by title or repository
            </label>
            <input
              id="issue-search-filter"
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Filter by title, repo, topic, or keyword…"
              style={{
                width: "100%",
                backgroundColor: "#101214",
                border: "1px solid #2A2F35",
                borderRadius: "6px",
                color: "#F2F3F5",
                fontSize: "13px",
                padding: "8px 12px",
                outline: "none",
                fontFamily: "var(--font-sans)",
              }}
            />
          </div>

          <label
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              cursor: "pointer",
              fontSize: "13px",
              color: friendlyOnly ? "#E7B65C" : "#A5ABB3",
              userSelect: "none",
            }}
          >
            <input
              type="checkbox"
              checked={friendlyOnly}
              onChange={(e) => setFriendlyOnly(e.target.checked)}
              style={{
                cursor: "pointer",
                accentColor: "#E7B65C",
              }}
            />
            <span>Contributor-friendly only</span>
          </label>
        </div>

        {/* Language quick pills */}
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: "6px",
            alignItems: "center",
          }}
          role="group"
          aria-label="Filter by programming language"
        >
          <span
            style={{
              fontSize: "12px",
              color: "#7B838D",
              marginRight: "4px",
            }}
          >
            Language:
          </span>
          {availableLanguages.map((lang) => {
            const isSelected =
              selectedLanguage.toLowerCase() === lang.toLowerCase();
            return (
              <button
                key={lang}
                type="button"
                onClick={() => setSelectedLanguage(lang)}
                style={{
                  fontSize: "12px",
                  padding: "3px 10px",
                  borderRadius: "14px",
                  border: isSelected
                    ? "1px solid #8B92FF"
                    : "1px solid #2A2F35",
                  backgroundColor: isSelected ? "#1A1C32" : "#101214",
                  color: isSelected ? "#8B92FF" : "#A5ABB3",
                  cursor: "pointer",
                  transition: "background-color 150ms, border-color 150ms",
                  fontFamily: "var(--font-jetbrains-mono), monospace",
                }}
              >
                {lang}
              </button>
            );
          })}
        </div>
      </div>

      {/* Results Header */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "8px",
        }}
      >
        <span
          style={{
            fontSize: "13px",
            color: "#A5ABB3",
            fontFamily: "var(--font-jetbrains-mono), monospace",
          }}
        >
          {filteredIssues.length === initialIssues.length
            ? `Showing ${initialIssues.length} issues`
            : `Showing ${filteredIssues.length} of ${initialIssues.length} issues`}
        </span>

        {hasActiveFilters && (
          <button
            type="button"
            onClick={handleResetFilters}
            style={{
              background: "none",
              border: "none",
              color: "#8B92FF",
              fontSize: "12px",
              cursor: "pointer",
              padding: 0,
              textDecoration: "underline",
            }}
          >
            Clear filters
          </button>
        )}
      </div>

      {/* Issues List or Empty State */}
      {filteredIssues.length === 0 ? (
        <EmptyBrowseState
          hasFilters={hasActiveFilters}
          onResetFilters={handleResetFilters}
        />
      ) : (
        <div style={{ display: "flex", flexDirection: "column" }}>
          {filteredIssues.map((item) => (
            <BrowseIssueCard key={item.issue.id} discovered={item} />
          ))}
        </div>
      )}

      {/* Personalization Callout Box */}
      <section
        aria-labelledby="personalize-heading"
        style={{
          backgroundColor: "#15181B",
          border: "1px solid #2A2F35",
          borderRadius: "12px",
          padding: "28px 24px",
          marginTop: "16px",
        }}
      >
        <div style={{ maxWidth: "600px" }}>
          <h2
            id="personalize-heading"
            style={{
              fontFamily: "var(--font-display), var(--font-geist), sans-serif",
              fontSize: "18px",
              fontWeight: 700,
              color: "#F2F3F5",
              margin: "0 0 8px 0",
            }}
          >
            Looking for personalized match scores?
          </h2>
          <p
            style={{
              fontSize: "14px",
              color: "#A5ABB3",
              lineHeight: 1.5,
              margin: "0 0 20px 0",
            }}
          >
            Enter your GitHub username to build your verified language footprint
            and match these open-source issues with transparent evidence and
            explanations.
          </p>

          <div style={{ maxWidth: "420px" }}>
            <UsernameForm showExamples={true} />
          </div>
        </div>
      </section>
    </div>
  );
}
