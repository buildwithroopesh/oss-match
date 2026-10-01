/**
 * Profile Loading Skeleton
 *
 * Provides an accessible, animated placeholder layout while profile analysis runs.
 */
import React from "react";
import LatticeLoader from "@/components/ui/LatticeLoader";

export function ProfileSkeleton() {
  const pulseStyle: React.CSSProperties = {
    backgroundColor: "#1A1E22",
    borderRadius: "6px",
  };

  return (
    <div
      role="status"
      aria-label="Analyzing profile…"
      aria-busy="true"
      style={{
        maxWidth: "960px",
        margin: "0 auto",
        padding: "40px 16px 64px",
        width: "100%",
      }}
    >
      {/* Profile Analysis Status */}
      <div
        style={{
          backgroundColor: "#15181B",
          border: "1px solid #2A2F35",
          borderRadius: "8px",
          padding: "12px 20px",
          marginBottom: "20px",
          display: "flex",
          alignItems: "center",
          justifyContent: "flex-start",
        }}
      >
        <LatticeLoader
          label="Analyzing GitHub profile"
          doneLabel="Done in"
          errorLabel="Failed after"
          status="working"
          pattern="orbit"
          grid={3}
          shape="round"
          color="#A5ABB3"
          doneColor="#5CE1C6"
          errorColor="#F06A6A"
          glow={false}
          showTimer
        />
      </div>

      {/* Header Skeleton */}
      <div
        style={{
          backgroundColor: "#15181B",
          border: "1px solid #2A2F35",
          borderRadius: "12px",
          padding: "24px 28px",
          marginBottom: "24px",
          display: "flex",
          gap: "20px",
          alignItems: "center",
        }}
      >
        <div
          style={{
            ...pulseStyle,
            width: "72px",
            height: "72px",
            borderRadius: "50%",
            flexShrink: 0,
          }}
        />
        <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "10px", overflow: "hidden" }}>
          <div style={{ ...pulseStyle, maxWidth: "200px", width: "60%", height: "24px" }} />
          <div style={{ ...pulseStyle, maxWidth: "320px", width: "85%", height: "16px" }} />
          <div style={{ ...pulseStyle, maxWidth: "160px", width: "45%", height: "14px" }} />
        </div>
      </div>

      {/* Summary Metrics Skeleton */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
          gap: "12px",
          marginBottom: "24px",
        }}
      >
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            style={{
              backgroundColor: "#15181B",
              border: "1px solid #2A2F35",
              borderRadius: "8px",
              padding: "16px",
              height: "76px",
              display: "flex",
              flexDirection: "column",
              gap: "8px",
            }}
          >
            <div style={{ ...pulseStyle, width: "100px", height: "12px" }} />
            <div style={{ ...pulseStyle, width: "60px", height: "20px" }} />
          </div>
        ))}
      </div>

      {/* Matched Issues Skeleton */}
      <div
        style={{
          backgroundColor: "#15181B",
          border: "1px solid #2A2F35",
          borderRadius: "12px",
          padding: "24px 28px",
          marginBottom: "24px",
          display: "flex",
          flexDirection: "column",
          gap: "16px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-start" }}>
          <LatticeLoader
            label="Finding matching issues"
            doneLabel="Done in"
            errorLabel="Failed after"
            status="working"
            pattern="orbit"
            grid={3}
            shape="round"
            color="#A5ABB3"
            doneColor="#5CE1C6"
            errorColor="#F06A6A"
            glow={false}
            showTimer
          />
        </div>
        <div style={{ ...pulseStyle, width: "380px", maxWidth: "90%", height: "14px" }} />
        <div style={{ ...pulseStyle, width: "100%", height: "40px", borderRadius: "8px" }} />
        {[1, 2].map((i) => (
          <div
            key={i}
            style={{
              backgroundColor: "#101214",
              border: "1px solid #20252A",
              borderRadius: "8px",
              padding: "18px 20px",
              height: "120px",
            }}
          />
        ))}
      </div>

      {/* Language Footprint Skeleton */}
      <div
        style={{
          backgroundColor: "#15181B",
          border: "1px solid #2A2F35",
          borderRadius: "12px",
          padding: "24px 28px",
          marginBottom: "24px",
          display: "flex",
          flexDirection: "column",
          gap: "16px",
        }}
      >
        <div style={{ ...pulseStyle, width: "180px", height: "20px" }} />
        <div style={{ ...pulseStyle, width: "100%", height: "10px", borderRadius: "5px" }} />
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
            gap: "12px",
          }}
        >
          {[1, 2, 3, 4].map((i) => (
            <div key={i} style={{ ...pulseStyle, height: "36px" }} />
          ))}
        </div>
      </div>

      {/* Technology Footprint Skeleton */}
      <div
        style={{
          backgroundColor: "#15181B",
          border: "1px solid #2A2F35",
          borderRadius: "12px",
          padding: "24px 28px",
          marginBottom: "24px",
          display: "flex",
          flexDirection: "column",
          gap: "16px",
        }}
      >
        <div style={{ ...pulseStyle, width: "200px", height: "20px" }} />
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))",
            gap: "12px",
          }}
        >
          {[1, 2, 3, 4].map((i) => (
            <div key={i} style={{ ...pulseStyle, height: "110px" }} />
          ))}
        </div>
      </div>

      <span className="sr-only">Analyzing GitHub repositories…</span>
    </div>
  );
}
