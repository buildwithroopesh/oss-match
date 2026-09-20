import { describe, it, expect } from "vitest";
import {
  TechnologyRegistry,
  defaultTechnologyRegistry,
  INITIAL_TECHNOLOGY_DEFINITIONS,
  type TechnologyDefinition,
} from "@/core/technology/registry";

describe("TechnologyRegistry", () => {
  it("initializes with curated technology definitions", () => {
    const all = defaultTechnologyRegistry.getAll();
    expect(all.length).toBeGreaterThanOrEqual(18);
  });

  it("ensures all technology IDs are unique and lowercase", () => {
    const ids = new Set<string>();
    for (const def of INITIAL_TECHNOLOGY_DEFINITIONS) {
      expect(def.id).toMatch(/^[a-z0-9-]+$/);
      expect(ids.has(def.id)).toBe(false);
      ids.add(def.id);
    }
  });

  it("ensures all definitions have valid categories and signals", () => {
    const validCategories = [
      "language",
      "framework",
      "library",
      "runtime",
      "tool",
      "platform",
      "database",
      "testing",
      "ci",
    ];

    for (const def of INITIAL_TECHNOLOGY_DEFINITIONS) {
      expect(validCategories).toContain(def.category);
      expect(def.name.trim().length).toBeGreaterThan(0);
      expect(def.signals.length).toBeGreaterThan(0);
    }
  });

  it("looks up technologies by ID accurately", () => {
    const react = defaultTechnologyRegistry.getById("react");
    expect(react).toBeDefined();
    expect(react?.name).toBe("React");
    expect(react?.category).toBe("framework");

    const python = defaultTechnologyRegistry.getById("python");
    expect(python).toBeDefined();
    expect(python?.name).toBe("Python");
    expect(python?.category).toBe("language");
  });

  it("looks up technologies by alias", () => {
    expect(defaultTechnologyRegistry.findByAlias("reactjs")?.id).toBe("react");
    expect(defaultTechnologyRegistry.findByAlias("next.js")?.id).toBe("nextjs");
    expect(defaultTechnologyRegistry.findByAlias("golang")?.id).toBe("go");
    expect(defaultTechnologyRegistry.findByAlias("cpp")?.id).toBe("cpp");
    expect(defaultTechnologyRegistry.findByAlias("unknown-tech")).toBeUndefined();
  });

  it("allows registering a new technology without modifying existing definitions", () => {
    const customRegistry = new TechnologyRegistry([]);
    expect(customRegistry.getAll()).toHaveLength(0);

    const astroDef: TechnologyDefinition = {
      id: "astro",
      name: "Astro",
      category: "framework",
      aliases: ["astro", "astrojs"],
      signals: [
        {
          type: "dependency",
          packageManager: "npm",
          names: ["astro"],
          strength: "strong",
        },
        {
          type: "configFile",
          patterns: ["astro.config.mjs", "astro.config.ts"],
          strength: "strong",
        },
        {
          type: "topic",
          values: ["astro", "astrojs"],
          strength: "moderate",
        },
      ],
    };

    customRegistry.register(astroDef);
    expect(customRegistry.has("astro")).toBe(true);
    expect(customRegistry.getById("astro")?.name).toBe("Astro");
    expect(customRegistry.findByAlias("astrojs")?.id).toBe("astro");
  });
});
