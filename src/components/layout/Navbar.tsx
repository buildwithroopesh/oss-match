"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";

export default function Navbar() {
  const router = useRouter();
  const [query, setQuery] = useState("");

  function handleQuickSearch(e: FormEvent) {
    e.preventDefault();
    const username = query.trim();
    if (username) {
      router.push(`/profile/${encodeURIComponent(username)}`);
      setQuery("");
    }
  }

  return (
    <header
      role="banner"
      style={{ backgroundColor: "#101214", borderBottom: "1px solid #2A2F35" }}
      className="sticky top-0 z-50"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <nav
          role="navigation"
          aria-label="Main navigation"
          className="flex h-14 items-center justify-between"
        >
          {/* Brand */}
          <Link
            href="/"
            className="flex items-center gap-2 focus-visible:rounded"
            aria-label="OSS Match — home"
          >
            {/* Logo mark */}
            <svg
              width="20"
              height="20"
              viewBox="0 0 20 20"
              fill="none"
              aria-hidden="true"
              focusable="false"
            >
              <circle
                cx="10"
                cy="10"
                r="9"
                stroke="#8B92FF"
                strokeWidth="1.5"
              />
              <circle cx="10" cy="10" r="3" fill="#8B92FF" />
              <line
                x1="10"
                y1="1"
                x2="10"
                y2="5"
                stroke="#8B92FF"
                strokeWidth="1.5"
                strokeLinecap="round"
              />
              <line
                x1="10"
                y1="15"
                x2="10"
                y2="19"
                stroke="#8B92FF"
                strokeWidth="1.5"
                strokeLinecap="round"
              />
              <line
                x1="1"
                y1="10"
                x2="5"
                y2="10"
                stroke="#8B92FF"
                strokeWidth="1.5"
                strokeLinecap="round"
              />
              <line
                x1="15"
                y1="10"
                x2="19"
                y2="10"
                stroke="#8B92FF"
                strokeWidth="1.5"
                strokeLinecap="round"
              />
            </svg>
            <span
              style={{
                fontFamily: "var(--font-display)",
                color: "#F2F3F5",
                fontSize: "15px",
                fontWeight: 600,
                letterSpacing: "-0.01em",
              }}
            >
              OSS Match
            </span>
          </Link>

          {/* Desktop nav links */}
          <div className="hidden items-center gap-6 md:flex">
            <Link
              href="/issues"
              style={{ color: "#A5ABB3", fontSize: "14px" }}
              className="transition-colors hover:text-fg"
            >
              Browse Issues
            </Link>
            <a
              href="https://github.com/buildwithroopesh/oss-match"
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: "#A5ABB3", fontSize: "14px" }}
              className="flex items-center gap-1.5 transition-colors hover:text-fg"
              aria-label="View OSS Match source on GitHub (opens in new tab)"
            >
              <svg
                width="15"
                height="15"
                viewBox="0 0 16 16"
                fill="currentColor"
                aria-hidden="true"
              >
                <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z" />
              </svg>
              GitHub
            </a>
          </div>

          {/* Quick-search (desktop) */}
          <form
            onSubmit={handleQuickSearch}
            className="hidden items-center gap-2 md:flex"
            role="search"
            aria-label="Quick profile search"
          >
            <label htmlFor="navbar-username" className="sr-only">
              GitHub username
            </label>
            <input
              id="navbar-username"
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="GitHub username"
              autoComplete="off"
              spellCheck={false}
              style={{
                backgroundColor: "#15181B",
                border: "1px solid #2A2F35",
                borderRadius: "8px",
                color: "#F2F3F5",
                fontFamily: "var(--font-mono)",
                fontSize: "13px",
                padding: "6px 12px",
                width: "180px",
                outline: "none",
              }}
              className="transition-colors placeholder:text-fg-subtle focus:border-brand"
            />
            <button
              type="submit"
              disabled={!query.trim()}
              style={{
                backgroundColor: "#8B92FF",
                borderRadius: "8px",
                color: "#0E1012",
                fontSize: "13px",
                fontWeight: 600,
                padding: "6px 14px",
                border: "none",
                cursor: "pointer",
                transition: "background-color 150ms",
              }}
              className="disabled:cursor-not-allowed disabled:opacity-40 hover:enabled:bg-brand-hover"
              aria-label="Analyze GitHub profile"
            >
              Analyze
            </button>
          </form>
        </nav>
      </div>
    </header>
  );
}
