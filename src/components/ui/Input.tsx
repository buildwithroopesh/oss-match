import type { InputHTMLAttributes } from "react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
}

/**
 * Base Input component with accessible label, error, and hint support.
 *
 * Always provide a `label` prop or an external `aria-label` / `aria-labelledby`.
 * The `id` prop is required when using `label`.
 */
export function Input({ label, error, hint, id, style, ...props }: InputProps) {
  const hintId = hint && id ? `${id}-hint` : undefined;
  const errorId = error && id ? `${id}-error` : undefined;
  const describedBy =
    [hintId, errorId].filter(Boolean).join(" ") || undefined;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
      {label && (
        <label
          htmlFor={id}
          style={{
            color: "#A5ABB3",
            fontSize: "13px",
            fontWeight: 500,
            lineHeight: 1,
          }}
        >
          {label}
        </label>
      )}

      <input
        id={id}
        aria-describedby={describedBy}
        aria-invalid={error ? "true" : undefined}
        style={{
          backgroundColor: "#15181B",
          border: `1px solid ${error ? "#F06A6A" : "#2A2F35"}`,
          borderRadius: "8px",
          color: "#F2F3F5",
          fontFamily: "var(--font-mono)",
          fontSize: "14px",
          padding: "10px 14px",
          width: "100%",
          outline: "none",
          transition: "border-color 150ms",
          ...style,
        }}
        {...props}
      />

      {hint && !error && (
        <p id={hintId} style={{ color: "#7B838D", fontSize: "12px" }}>
          {hint}
        </p>
      )}

      {error && (
        <p
          id={errorId}
          role="alert"
          style={{ color: "#F06A6A", fontSize: "12px" }}
        >
          {error}
        </p>
      )}
    </div>
  );
}
