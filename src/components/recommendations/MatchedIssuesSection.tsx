"use client";

import React, { useState, useMemo } from "react";
import type { MatchingResult } from "@/core/types/matching";
import type { DiscoveryMetadata } from "@/core/types/issues";
import IssueCard from "./IssueCard";
import IssueFilters from "./IssueFilters";
import EmptyRecommendationsState from "./EmptyRecommendationsState";
import PartialDiscoveryBanner from "./PartialDiscoveryBanner";

interface MatchedIssuesSectionProps {
  recommendations: MatchingResult;
  discovery: DiscoveryMetadata;
}

export default function MatchedIssuesSection({
  recommendations,
  discovery,
}: MatchedIssuesSectionProps) {
  const [selectedLanguage, setSelectedLanguage] = useState<string>("ALL");
  const [friendlyOnly, setFriendlyOnly] = useState<boolean>(false);
  const [minScore, setMinScore] = useState<number>(0);

  const { matches } = recommendations;

  // Extract all distinct primary languages present among the matches
  const availableLanguages = useMemo(() => {
    const langs = new Set<string>();
    for (const match of matches) {
      if (match.signals.primaryLanguage) {
        langs.add(match.signals.primaryLanguage);
      }
    }
    return Array.from(langs).sort();
  }, [matches]);

  // Filter matches without altering the underlying deterministic score ordering
  const filteredMatches = useMemo(() => {
    return matches.filter((match) => {
      // 1. Language filter
      if (selectedLanguage !== "ALL") {
        if (
          !match.signals.primaryLanguage ||
          match.signals.primaryLanguage.toLowerCase() !== selectedLanguage.toLowerCase()
        ) {
          return false;
        }
      }

      // 2. Contributor friendly filter
      if (friendlyOnly && !match.signals.hasHelpWantedOrGoodFirstIssue) {
        return false;
      }

      // 3. Minimum score filter
      if (minScore > 0 && match.score < minScore) {
        return false;
      }

      return true;
    });
  }, [matches, selectedLanguage, friendlyOnly, minScore]);

  const handleResetFilters = () => {
    setSelectedLanguage("ALL");
    setFriendlyOnly(false);
    setMinScore(0);
  };

  return (
    <section
      id="matched-issues"
      aria-labelledby="matched-issues-heading"
      style={{
        marginBottom: "40px",
      }}
    >
      {/* Section Header */}
      <div style={{ marginBottom: "16px" }}>
        <h2
          id="matched-issues-heading"
          style={{
            fontFamily: "var(--font-geist), sans-serif",
            fontSize: "20px",
            fontWeight: 700,
            color: "#F2F3F5",
            margin: "0 0 6px 0",
            letterSpacing: "-0.3px",
          }}
        >
          Matched open-source issues
        </h2>
        <p
          style={{
            margin: 0,
            fontSize: "14px",
            color: "#A5ABB3",
            lineHeight: 1.5,
          }}
        >
          Issues discovered from active GitHub repositories and evaluated
          against your observed technology and language footprint.
        </p>
      </div>

      {/* Partial discovery notice banner if applicable */}
      {discovery.warnings.length > 0 && (
        <PartialDiscoveryBanner warnings={discovery.warnings} />
      )}

      {/* If 0 issues were discovered at all */}
      {matches.length === 0 ? (
        <EmptyRecommendationsState reason="no_discovered" />
      ) : (
        <>
          {/* Client-side filter controls */}
          <IssueFilters
            availableLanguages={availableLanguages}
            selectedLanguage={selectedLanguage}
            onSelectLanguage={setSelectedLanguage}
            friendlyOnly={friendlyOnly}
            onToggleFriendlyOnly={setFriendlyOnly}
            minScore={minScore}
            onSelectMinScore={setMinScore}
            totalMatchesCount={matches.length}
            filteredCount={filteredMatches.length}
          />

          {/* Filtered list or empty filter state */}
          {filteredMatches.length === 0 ? (
            <EmptyRecommendationsState
              reason="filter_empty"
              onResetFilters={handleResetFilters}
            />
          ) : (
            <div role="feed" aria-label="Matched issue recommendations">
              {filteredMatches.map((match) => (
                <IssueCard key={match.issue.id} match={match} />
              ))}
            </div>
          )}
        </>
      )}
    </section>
  );
}
