import Link from "next/link";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Page Not Found",
};

export default function NotFound() {
  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        backgroundColor: "#0E1012",
      }}
    >
      <Navbar />

      <main
        style={{
          flex: 1,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "48px 16px",
        }}
      >
        <div style={{ textAlign: "center", maxWidth: "420px" }}>
          <p
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: "11px",
              color: "#7B838D",
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              marginBottom: "12px",
            }}
          >
            404
          </p>
          <h1
            style={{
              fontFamily: "var(--font-display)",
              fontSize: "28px",
              fontWeight: 700,
              color: "#F2F3F5",
              marginBottom: "12px",
              letterSpacing: "-0.02em",
            }}
          >
            Page not found
          </h1>
          <p
            style={{
              color: "#7B838D",
              fontSize: "14px",
              lineHeight: 1.6,
              marginBottom: "28px",
            }}
          >
            The page you were looking for does not exist. Check the URL or
            return to the home page.
          </p>
          <Link
            href="/"
            style={{
              display: "inline-flex",
              alignItems: "center",
              backgroundColor: "#8B92FF",
              color: "#0E1012",
              fontWeight: 600,
              fontSize: "14px",
              padding: "10px 20px",
              borderRadius: "8px",
              transition: "background-color 150ms",
              textDecoration: "none",
            }}
          >
            ← Back to home
          </Link>
        </div>
      </main>

      <Footer />
    </div>
  );
}
