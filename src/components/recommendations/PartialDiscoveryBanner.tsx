import React from "react";

interface PartialDiscoveryBannerProps {
  warnings: string[];
}

export default function PartialDiscoveryBanner({
  warnings,
}: PartialDiscoveryBannerProps) {
  if (warnings.length === 0) {
    return null;
  }

  return (
    <aside
      aria-label="Issue discovery notice"
      style={{
        backgroundColor: "#1C1710",
        border: "1px solid #5C451D",
        borderRadius: "8px",
        padding: "12px 16px",
        marginBottom: "20px",
        display: "flex",
        alignItems: "flex-start",
        gap: "12px",
      }}
    >
      <span
        aria-hidden="true"
        style={{
          color: "#E7B65C",
          fontSize: "16px",
          lineHeight: 1.4,
          flexShrink: 0,
        }}
      >
        ⚠
      </span>
      <div style={{ flex: 1 }}>
        <p
          style={{
            margin: 0,
            fontSize: "13px",
            color: "#F2F3F5",
            fontWeight: 500,
            lineHeight: 1.4,
          }}
        >
          Partial Issue Discovery Notice
        </p>
        <p
          style={{
            margin: "4px 0 0",
            fontSize: "12px",
            color: "#D0D6DE",
            lineHeight: 1.4,
          }}
        >
          {warnings[0]} Displaying matches from candidate issues discovered
          before the limit was reached.
        </p>
      </div>
    </aside>
  );
}
