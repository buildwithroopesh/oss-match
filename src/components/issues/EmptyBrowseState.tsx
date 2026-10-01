import React from "react";

interface EmptyBrowseStateProps {
  onResetFilters?: () => void;
  hasFilters?: boolean;
}

export default function EmptyBrowseState({
  onResetFilters,
  hasFilters = false,
}: EmptyBrowseStateProps) {
  return (
    <div
      role="region"
      aria-label="No issues found"
      style={{
        backgroundColor: "#15181B",
        border: "1px solid #2A2F35",
        borderRadius: "8px",
        padding: "40px 24px",
        textAlign: "center",
        margin: "24px 0",
      }}
    >
      <div
        style={{
          width: "44px",
          height: "44px",
          borderRadius: "50%",
          backgroundColor: "#1A1E22",
          border: "1px solid #2A2F35",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          margin: "0 auto 16px",
          color: "#7B838D",
          fontSize: "18px",
        }}
        aria-hidden="true"
      >
        🔍
      </div>

      <p
        style={{
          margin: 0,
          fontSize: "16px",
          fontWeight: 600,
          color: "#F2F3F5",
        }}
      >
        {hasFilters
          ? "No issues match your current filters"
          : "No open issues discovered"}
      </p>

      <p
        style={{
          margin: "8px auto 20px",
          maxWidth: "460px",
          fontSize: "13px",
          color: "#A5ABB3",
          lineHeight: 1.5,
        }}
      >
        {hasFilters
          ? "Try clearing your search query or selecting a different programming language to see more issues."
          : "No open issues matching search criteria were returned from GitHub's search API at this time."}
      </p>

      {onResetFilters && hasFilters && (
        <button
          type="button"
          onClick={onResetFilters}
          style={{
            padding: "8px 18px",
            backgroundColor: "#1A1C32",
            border: "1px solid #8B92FF",
            borderRadius: "6px",
            color: "#8B92FF",
            fontSize: "13px",
            fontWeight: 500,
            cursor: "pointer",
            transition: "background-color 150ms",
          }}
        >
          Clear all filters
        </button>
      )}
    </div>
  );
}
