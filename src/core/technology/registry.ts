/**
 * Declarative Technology Registry
 *
 * Provides a strongly typed, extensible catalog of technology definitions and
 * their observable signals. A new technology can be added simply by adding a
 * single declarative definition object to the catalog.
 */

import type {
  TechnologyCategory,
  SignalStrength,
  PackageManager,
} from "../types/technology";

export interface DependencySignal {
  type: "dependency";
  packageManager: PackageManager;
  names: string[];
  strength?: SignalStrength;
}

export interface ConfigFileSignal {
  type: "configFile";
  patterns: string[];
  strength?: SignalStrength;
}

export interface LanguageSignal {
  type: "language";
  names: string[];
  strength?: SignalStrength;
}

export interface TopicSignal {
  type: "topic";
  values: string[];
  strength?: SignalStrength;
}

export interface FilenamePatternSignal {
  type: "filenamePattern";
  patterns: string[];
  strength?: SignalStrength;
}

export type TechnologySignal =
  | DependencySignal
  | ConfigFileSignal
  | LanguageSignal
  | TopicSignal
  | FilenamePatternSignal;

export interface TechnologyDefinition {
  id: string;
  name: string;
  category: TechnologyCategory;
  aliases: string[];
  signals: TechnologySignal[];
}

/** Curated initial catalog for V1 */
export const INITIAL_TECHNOLOGY_DEFINITIONS: TechnologyDefinition[] = [
  // ── Frontend / Web ────────────────────────────────────────────────────────
  {
    id: "react",
    name: "React",
    category: "framework",
    aliases: ["react", "reactjs"],
    signals: [
      {
        type: "dependency",
        packageManager: "npm",
        names: ["react", "react-dom", "@types/react"],
        strength: "strong",
      },
      {
        type: "topic",
        values: ["react", "reactjs"],
        strength: "moderate",
      },
      {
        type: "filenamePattern",
        patterns: ["*.jsx", "*.tsx"],
        strength: "weak",
      },
    ],
  },
  {
    id: "nextjs",
    name: "Next.js",
    category: "framework",
    aliases: ["nextjs", "next.js", "next-js"],
    signals: [
      {
        type: "dependency",
        packageManager: "npm",
        names: ["next"],
        strength: "strong",
      },
      {
        type: "configFile",
        patterns: [
          "next.config.js",
          "next.config.mjs",
          "next.config.ts",
          "next.config.cjs",
        ],
        strength: "strong",
      },
      {
        type: "topic",
        values: ["nextjs", "next-js", "next"],
        strength: "moderate",
      },
    ],
  },
  {
    id: "vue",
    name: "Vue",
    category: "framework",
    aliases: ["vue", "vuejs"],
    signals: [
      {
        type: "dependency",
        packageManager: "npm",
        names: ["vue", "@vue/runtime-core", "@vue/cli-service"],
        strength: "strong",
      },
      {
        type: "configFile",
        patterns: ["vue.config.js", "vue.config.ts"],
        strength: "strong",
      },
      {
        type: "topic",
        values: ["vue", "vuejs", "vue3", "vue2"],
        strength: "moderate",
      },
      {
        type: "filenamePattern",
        patterns: ["*.vue"],
        strength: "weak",
      },
    ],
  },
  {
    id: "angular",
    name: "Angular",
    category: "framework",
    aliases: ["angular", "angularjs"],
    signals: [
      {
        type: "dependency",
        packageManager: "npm",
        names: ["@angular/core", "@angular/common", "@angular/cli"],
        strength: "strong",
      },
      {
        type: "configFile",
        patterns: ["angular.json"],
        strength: "strong",
      },
      {
        type: "topic",
        values: ["angular", "angularjs"],
        strength: "moderate",
      },
    ],
  },
  {
    id: "svelte",
    name: "Svelte",
    category: "framework",
    aliases: ["svelte", "sveltekit"],
    signals: [
      {
        type: "dependency",
        packageManager: "npm",
        names: ["svelte", "@sveltejs/kit"],
        strength: "strong",
      },
      {
        type: "configFile",
        patterns: ["svelte.config.js", "svelte.config.ts", "svelte.config.mjs"],
        strength: "strong",
      },
      {
        type: "topic",
        values: ["svelte", "sveltekit"],
        strength: "moderate",
      },
      {
        type: "filenamePattern",
        patterns: ["*.svelte"],
        strength: "weak",
      },
    ],
  },
  {
    id: "tailwindcss",
    name: "Tailwind CSS",
    category: "tool",
    aliases: ["tailwind", "tailwindcss"],
    signals: [
      {
        type: "dependency",
        packageManager: "npm",
        names: ["tailwindcss", "@tailwindcss/postcss", "@tailwindcss/vite"],
        strength: "strong",
      },
      {
        type: "configFile",
        patterns: [
          "tailwind.config.js",
          "tailwind.config.ts",
          "tailwind.config.mjs",
          "tailwind.config.cjs",
        ],
        strength: "strong",
      },
      {
        type: "topic",
        values: ["tailwindcss", "tailwind-css", "tailwind"],
        strength: "moderate",
      },
    ],
  },

  // ── JavaScript Ecosystem ──────────────────────────────────────────────────
  {
    id: "nodejs",
    name: "Node.js",
    category: "runtime",
    aliases: ["node", "nodejs"],
    signals: [
      {
        type: "dependency",
        packageManager: "npm",
        names: ["@types/node"],
        strength: "strong",
      },
      {
        type: "configFile",
        patterns: ["package.json"],
        strength: "strong",
      },
      {
        type: "topic",
        values: ["nodejs", "node", "node-js"],
        strength: "moderate",
      },
    ],
  },
  {
    id: "express",
    name: "Express",
    category: "framework",
    aliases: ["express", "expressjs"],
    signals: [
      {
        type: "dependency",
        packageManager: "npm",
        names: ["express", "@types/express"],
        strength: "strong",
      },
      {
        type: "topic",
        values: ["express", "expressjs"],
        strength: "moderate",
      },
    ],
  },

  // ── Python Ecosystem ──────────────────────────────────────────────────────
  {
    id: "python",
    name: "Python",
    category: "language",
    aliases: ["python", "py"],
    signals: [
      {
        type: "language",
        names: ["Python"],
        strength: "strong",
      },
      {
        type: "configFile",
        patterns: ["requirements.txt", "pyproject.toml", "setup.py", "Pipfile"],
        strength: "strong",
      },
      {
        type: "topic",
        values: ["python", "python3"],
        strength: "moderate",
      },
      {
        type: "filenamePattern",
        patterns: ["*.py"],
        strength: "weak",
      },
    ],
  },
  {
    id: "django",
    name: "Django",
    category: "framework",
    aliases: ["django"],
    signals: [
      {
        type: "dependency",
        packageManager: "pip",
        names: ["django"],
        strength: "strong",
      },
      {
        type: "configFile",
        patterns: ["manage.py"],
        strength: "strong",
      },
      {
        type: "topic",
        values: ["django", "django-framework"],
        strength: "moderate",
      },
    ],
  },
  {
    id: "fastapi",
    name: "FastAPI",
    category: "framework",
    aliases: ["fastapi"],
    signals: [
      {
        type: "dependency",
        packageManager: "pip",
        names: ["fastapi"],
        strength: "strong",
      },
      {
        type: "topic",
        values: ["fastapi"],
        strength: "moderate",
      },
    ],
  },

  // ── Java Ecosystem ────────────────────────────────────────────────────────
  {
    id: "java",
    name: "Java",
    category: "language",
    aliases: ["java"],
    signals: [
      {
        type: "language",
        names: ["Java"],
        strength: "strong",
      },
      {
        type: "configFile",
        patterns: ["pom.xml", "build.gradle", "build.gradle.kts"],
        strength: "strong",
      },
      {
        type: "topic",
        values: ["java"],
        strength: "moderate",
      },
      {
        type: "filenamePattern",
        patterns: ["*.java"],
        strength: "weak",
      },
    ],
  },
  {
    id: "spring",
    name: "Spring",
    category: "framework",
    aliases: ["spring", "spring-boot", "springboot"],
    signals: [
      {
        type: "dependency",
        packageManager: "maven",
        names: [
          "org.springframework.boot:spring-boot",
          "org.springframework.boot:spring-boot-starter",
          "org.springframework:spring-core",
          "spring-boot",
          "spring-boot-starter-web",
          "spring-core",
        ],
        strength: "strong",
      },
      {
        type: "topic",
        values: ["spring", "spring-boot", "springboot", "spring-framework"],
        strength: "moderate",
      },
    ],
  },

  // ── Systems & Compiled Languages ──────────────────────────────────────────
  {
    id: "c",
    name: "C",
    category: "language",
    aliases: ["c"],
    signals: [
      {
        type: "language",
        names: ["C"],
        strength: "strong",
      },
      {
        type: "configFile",
        patterns: ["Makefile"],
        strength: "moderate",
      },
      {
        type: "topic",
        values: ["c-programming", "c-language", "c"],
        strength: "moderate",
      },
      {
        type: "filenamePattern",
        patterns: ["*.c", "*.h"],
        strength: "weak",
      },
    ],
  },
  {
    id: "cpp",
    name: "C++",
    category: "language",
    aliases: ["cpp", "c++", "cplusplus"],
    signals: [
      {
        type: "language",
        names: ["C++"],
        strength: "strong",
      },
      {
        type: "configFile",
        patterns: ["CMakeLists.txt"],
        strength: "moderate",
      },
      {
        type: "topic",
        values: ["cpp", "cplusplus", "c-plus-plus"],
        strength: "moderate",
      },
      {
        type: "filenamePattern",
        patterns: ["*.cpp", "*.cc", "*.cxx", "*.hpp"],
        strength: "weak",
      },
    ],
  },
  {
    id: "rust",
    name: "Rust",
    category: "language",
    aliases: ["rust", "rustlang"],
    signals: [
      {
        type: "language",
        names: ["Rust"],
        strength: "strong",
      },
      {
        type: "configFile",
        patterns: ["Cargo.toml"],
        strength: "strong",
      },
      {
        type: "topic",
        values: ["rust", "rust-lang", "rustlang"],
        strength: "moderate",
      },
      {
        type: "filenamePattern",
        patterns: ["*.rs"],
        strength: "weak",
      },
    ],
  },
  {
    id: "go",
    name: "Go",
    category: "language",
    aliases: ["go", "golang"],
    signals: [
      {
        type: "language",
        names: ["Go"],
        strength: "strong",
      },
      {
        type: "configFile",
        patterns: ["go.mod"],
        strength: "strong",
      },
      {
        type: "topic",
        values: ["golang", "go-language", "go-lang", "go"],
        strength: "moderate",
      },
      {
        type: "filenamePattern",
        patterns: ["*.go"],
        strength: "weak",
      },
    ],
  },

  // ── Infrastructure & Tooling ──────────────────────────────────────────────
  {
    id: "docker",
    name: "Docker",
    category: "tool",
    aliases: ["docker", "docker-compose"],
    signals: [
      {
        type: "configFile",
        patterns: [
          "Dockerfile",
          "docker-compose.yml",
          "docker-compose.yaml",
          "compose.yaml",
          "compose.yml",
        ],
        strength: "strong",
      },
      {
        type: "topic",
        values: ["docker", "docker-compose", "containerization"],
        strength: "moderate",
      },
    ],
  },
  {
    id: "github-actions",
    name: "GitHub Actions",
    category: "ci",
    aliases: ["github-actions", "gh-actions"],
    signals: [
      {
        type: "configFile",
        patterns: [
          ".github/workflows/*.yml",
          ".github/workflows/*.yaml",
          ".github/workflows",
        ],
        strength: "strong",
      },
      {
        type: "topic",
        values: ["github-actions", "github-workflow"],
        strength: "moderate",
      },
    ],
  },
];

/** Technology Registry class providing lookup, validation, and registration */
export class TechnologyRegistry {
  private readonly definitions = new Map<string, TechnologyDefinition>();
  private readonly aliasMap = new Map<string, string>();

  constructor(initialDefinitions: TechnologyDefinition[] = INITIAL_TECHNOLOGY_DEFINITIONS) {
    for (const def of initialDefinitions) {
      this.register(def);
    }
  }

  /** Registers a technology definition */
  register(definition: TechnologyDefinition): void {
    if (!definition.id || typeof definition.id !== "string") {
      throw new Error("Technology definition must have a valid non-empty id");
    }

    const normalizedId = definition.id.toLowerCase();
    this.definitions.set(normalizedId, definition);

    // Register primary ID as alias
    this.aliasMap.set(normalizedId, normalizedId);

    // Register aliases
    for (const alias of definition.aliases) {
      this.aliasMap.set(alias.toLowerCase(), normalizedId);
    }
  }

  /** Returns all registered technology definitions */
  getAll(): TechnologyDefinition[] {
    return Array.from(this.definitions.values());
  }

  /** Looks up a technology definition by exact ID */
  getById(id: string): TechnologyDefinition | undefined {
    return this.definitions.get(id.toLowerCase());
  }

  /** Looks up a technology definition by ID or alias */
  findByAlias(alias: string): TechnologyDefinition | undefined {
    const id = this.aliasMap.get(alias.toLowerCase());
    return id ? this.definitions.get(id) : undefined;
  }

  /** Checks if a technology ID exists in the registry */
  has(id: string): boolean {
    return this.definitions.has(id.toLowerCase());
  }
}

/** Global default registry instance */
export const defaultTechnologyRegistry = new TechnologyRegistry();
