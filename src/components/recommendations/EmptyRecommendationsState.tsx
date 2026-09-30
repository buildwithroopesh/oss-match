import React from "react";

interface EmptyRecommendationsStateProps {
  reason: "no_discovered" | "filter_empty";
  onResetFilters?: () => void;
}

export default function EmptyRecommendationsState({
  reason,
  onResetFilters,
}: EmptyRecommendationsStateProps) {
  if (reason === "filter_empty") {
    return (
      <div
        role="region"
        aria-label="No filtered matches"
        style={{
          backgroundColor: "#15181B",
          border: "1px solid #2A2F35",
          borderRadius: "8px",
          padding: "36px 20px",
          textAlign: "center",
          margin: "16px 0",
        }}
      >
        <p
          style={{
            margin: 0,
            fontSize: "15px",
            fontWeight: 600,
            color: "#F2F3F5",
          }}
        >
          No issues match the selected filters
        </p>
        <p
          style={{
            margin: "8px 0 16px",
            fontSize: "13px",
            color: "#A5ABB3",
            lineHeight: 1.5,
          }}
        >
          Try selecting a different language or clearing active filters to see
          all matched issues.
        </p>
        {onResetFilters && (
          <button
            type="button"
            onClick={onResetFilters}
            style={{
              padding: "8px 16px",
              backgroundColor: "#1A1C32",
              border: "1px solid #8B92FF",
              borderRadius: "6px",
              color: "#8B92FF",
              fontSize: "13px",
              fontWeight: 500,
              cursor: "pointer",
            }}
          >
            Clear active filters
          </button>
        )}
      </div>
    );
  }

  return (
    <div
      role="region"
      aria-label="No discovered issues"
      style={{
        backgroundColor: "#15181B",
        border: "1px solid #2A2F35",
        borderRadius: "8px",
        padding: "36px 20px",
        textAlign: "center",
        margin: "16px 0",
      }}
    >
      <p
        style={{
          margin: 0,
          fontSize: "15px",
          fontWeight: 600,
          color: "#F2F3F5",
        }}
      >
        No open issues currently available
      </p>
      <p
        style={{
          margin: "8px auto 0",
          maxWidth: "480px",
          fontSize: "13px",
          color: "#A5ABB3",
          lineHeight: 1.5,
        }}
      >
        No open issues matching your analyzed primary languages were returned
        from GitHub search at this time. This reflects current issue availability
        and does not reflect on your development experience.
      </p>
    </div>
  );
}
