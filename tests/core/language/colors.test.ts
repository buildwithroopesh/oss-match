import { describe, it, expect } from "vitest";
import {
  getLanguageColor,
  attachLanguageColors,
  DEFAULT_LANGUAGE_COLOR,
} from "@/core/language/colors";

describe("Language Colors", () => {
  it("returns locked palette hex colors for core languages", () => {
    expect(getLanguageColor("TypeScript")).toBe("#3178C6");
    expect(getLanguageColor("JavaScript")).toBe("#F7DF1E");
    expect(getLanguageColor("Python")).toBe("#3776AB");
    expect(getLanguageColor("Go")).toBe("#00ADD8");
    expect(getLanguageColor("Rust")).toBe("#DEA584");
    expect(getLanguageColor("HTML")).toBe("#E34C26");
    expect(getLanguageColor("CSS")).toBe("#563D7C");
    expect(getLanguageColor("Shell")).toBe("#89E051");
    expect(getLanguageColor("Other")).toBe("#7B838D");
  });

  it("is case-insensitive and trims whitespace", () => {
    expect(getLanguageColor("typescript")).toBe("#3178C6");
    expect(getLanguageColor("  TYPESCRIPT  ")).toBe("#3178C6");
    expect(getLanguageColor("python")).toBe("#3776AB");
  });

  it("falls back gracefully to DEFAULT_LANGUAGE_COLOR for unmapped languages", () => {
    expect(getLanguageColor("UnknownCustomLanguage")).toBe(DEFAULT_LANGUAGE_COLOR);
    expect(getLanguageColor("")).toBe(DEFAULT_LANGUAGE_COLOR);
  });

  it("attaches color metadata to an array of items", () => {
    const items = [
      { language: "TypeScript", bytes: 100 },
      { language: "UnknownLang", bytes: 50 },
    ];

    const colored = attachLanguageColors(items);
    expect(colored[0].color).toBe("#3178C6");
    expect(colored[1].color).toBe(DEFAULT_LANGUAGE_COLOR);
  });
});
