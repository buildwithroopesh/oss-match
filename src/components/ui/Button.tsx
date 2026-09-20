import type { ButtonHTMLAttributes } from "react";

type Variant = "primary" | "secondary" | "ghost";
type Size = "sm" | "md" | "lg";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
}

const variantStyles: Record<Variant, React.CSSProperties> = {
  primary: {
    backgroundColor: "#8B92FF",
    color: "#0E1012",
    border: "none",
    fontWeight: 600,
  },
  secondary: {
    backgroundColor: "#15181B",
    color: "#F2F3F5",
    border: "1px solid #2A2F35",
    fontWeight: 500,
  },
  ghost: {
    backgroundColor: "transparent",
    color: "#A5ABB3",
    border: "1px solid transparent",
    fontWeight: 500,
  },
};

const sizeStyles: Record<Size, React.CSSProperties> = {
  sm: { padding: "6px 12px", fontSize: "13px", borderRadius: "6px" },
  md: { padding: "8px 16px", fontSize: "14px", borderRadius: "8px" },
  lg: { padding: "12px 24px", fontSize: "15px", borderRadius: "8px" },
};

/**
 * Base Button component.
 *
 * Uses inline styles to keep styles co-located and avoid Tailwind class-name
 * explosion for dynamic variants. All interactive states (hover/focus) are
 * handled via CSS custom properties set in globals.css.
 */
export function Button({
  variant = "primary",
  size = "md",
  children,
  style,
  ...props
}: ButtonProps) {
  return (
    <button
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        gap: "8px",
        cursor: "pointer",
        transition: "background-color 150ms, opacity 150ms",
        fontFamily: "var(--font-sans)",
        lineHeight: 1,
        whiteSpace: "nowrap",
        ...variantStyles[variant],
        ...sizeStyles[size],
        ...style,
      }}
      {...props}
    >
      {children}
    </button>
  );
}
