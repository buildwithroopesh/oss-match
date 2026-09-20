import { describe, it, expect } from "vitest";
import {
  parsePackageJson,
  parseRequirementsTxt,
  parsePyprojectToml,
  parseCargoToml,
  parseGoMod,
  parsePomXml,
  normalizePythonPackageName,
} from "@/core/technology/parsers";

describe("Manifest Parsers", () => {
  describe("package.json parser", () => {
    it("extracts dependencies across sections including scoped packages", () => {
      const packageJsonStr = JSON.stringify({
        name: "test-app",
        dependencies: {
          react: "^19.0.0",
          "react-dom": "^19.0.0",
          "@angular/core": "^17.0.0",
        },
        devDependencies: {
          typescript: "^5.0.0",
          "@types/node": "^20.0.0",
          tailwindcss: "^4.0.0",
        },
        peerDependencies: {
          next: ">=15.0.0",
        },
      });

      const { dependencies } = parsePackageJson(packageJsonStr);
      expect(dependencies).toContain("react");
      expect(dependencies).toContain("react-dom");
      expect(dependencies).toContain("@angular/core");
      expect(dependencies).toContain("typescript");
      expect(dependencies).toContain("@types/node");
      expect(dependencies).toContain("tailwindcss");
      expect(dependencies).toContain("next");
    });

    it("handles pre-parsed object input safely", () => {
      const { dependencies } = parsePackageJson({
        dependencies: { vue: "^3.0.0" },
      });
      expect(dependencies).toEqual(["vue"]);
    });

    it("handles malformed JSON and null gracefully without throwing", () => {
      expect(parsePackageJson("{ corrupt json:").dependencies).toEqual([]);
      expect(parsePackageJson(null).dependencies).toEqual([]);
      expect(parsePackageJson(undefined).dependencies).toEqual([]);
      expect(parsePackageJson("").dependencies).toEqual([]);
    });
  });

  describe("requirements.txt parser", () => {
    it("extracts and normalizes Python packages according to PEP 503", () => {
      const content = `
        # Main web frameworks
        Django==5.0.2
        fastapi>=0.110.0
        scikit_learn~=1.4.0
        requests[security]>=2.31.0 ; python_version >= "3.9"

        # Flags to ignore
        -r base.txt
        -i https://pypi.org/simple
        --extra-index-url https://custom.pypi.org
      `;

      const packages = parseRequirementsTxt(content);
      expect(packages).toContain("django");
      expect(packages).toContain("fastapi");
      expect(packages).toContain("scikit-learn"); // PEP 503 normalized underscore to hyphen
      expect(packages).toContain("requests");
      expect(packages).not.toContain("-r");
      expect(packages).not.toContain("base.txt");
    });

    it("handles normalization helper", () => {
      expect(normalizePythonPackageName("FastAPI")).toBe("fastapi");
      expect(normalizePythonPackageName("PyYAML")).toBe("pyyaml");
      expect(normalizePythonPackageName("psycopg2_binary")).toBe("psycopg2-binary");
    });

    it("handles malformed and empty input gracefully", () => {
      expect(parseRequirementsTxt(null)).toEqual([]);
      expect(parseRequirementsTxt("")).toEqual([]);
      expect(parseRequirementsTxt("### comments only\n# second comment")).toEqual([]);
    });
  });

  describe("pyproject.toml parser", () => {
    it("extracts dependencies from PEP 621 project.dependencies", () => {
      const content = `
        [project]
        name = "my-project"
        dependencies = [
          "django>=4.2",
          "fastapi==0.109.0",
          "uvicorn",
        ]
      `;

      const packages = parsePyprojectToml(content);
      expect(packages).toContain("django");
      expect(packages).toContain("fastapi");
      expect(packages).toContain("uvicorn");
    });

    it("extracts dependencies from Poetry [tool.poetry.dependencies]", () => {
      const content = `
        [tool.poetry.dependencies]
        python = "^3.11"
        django = "^5.0"
        celery = { version = "^5.3", extras = ["redis"] }

        [tool.poetry.dev-dependencies]
        pytest = "^8.0"
      `;

      const packages = parsePyprojectToml(content);
      expect(packages).toContain("django");
      expect(packages).toContain("celery");
      expect(packages).toContain("pytest");
      expect(packages).not.toContain("python"); // Filtered out runtime key
    });

    it("handles malformed or empty TOML gracefully", () => {
      expect(parsePyprojectToml(null)).toEqual([]);
      expect(parsePyprojectToml("")).toEqual([]);
      expect(parsePyprojectToml("[invalid\n===broken")).toEqual([]);
    });
  });

  describe("Cargo.toml parser", () => {
    it("extracts crates from dependencies and dev-dependencies", () => {
      const content = `
        [package]
        name = "my-crate"
        version = "0.1.0"

        [dependencies]
        tokio = { version = "1.0", features = ["full"] }
        serde = "1.0"
        anyhow = "1"

        [dependencies.axum]
        version = "0.7"

        [dev-dependencies]
        criterion = "0.5"
      `;

      const crates = parseCargoToml(content);
      expect(crates).toContain("tokio");
      expect(crates).toContain("serde");
      expect(crates).toContain("anyhow");
      expect(crates).toContain("axum");
      expect(crates).toContain("criterion");
    });

    it("handles malformed or empty Cargo.toml", () => {
      expect(parseCargoToml(null)).toEqual([]);
      expect(parseCargoToml("")).toEqual([]);
      expect(parseCargoToml("# Comments only")).toEqual([]);
    });
  });

  describe("go.mod parser", () => {
    it("extracts modules and package names from require blocks and single lines", () => {
      const content = `
        module example.com/myapp

        go 1.22

        require (
          github.com/gin-gonic/gin v1.9.1
          golang.org/x/crypto v0.14.0 // indirect
        )

        require github.com/stretchr/testify v1.8.4
      `;

      const modules = parseGoMod(content);
      expect(modules).toContain("github.com/gin-gonic/gin");
      expect(modules).toContain("gin"); // base package
      expect(modules).toContain("golang.org/x/crypto");
      expect(modules).toContain("crypto"); // base package
      expect(modules).toContain("github.com/stretchr/testify");
      expect(modules).toContain("testify"); // base package
    });

    it("handles malformed or empty go.mod", () => {
      expect(parseGoMod(null)).toEqual([]);
      expect(parseGoMod("")).toEqual([]);
    });
  });

  describe("pom.xml parser", () => {
    it("extracts coordinates and artifact IDs from Maven dependency blocks", () => {
      const content = `
        <project>
          <dependencies>
            <dependency>
              <groupId>org.springframework.boot</groupId>
              <artifactId>spring-boot-starter-web</artifactId>
              <version>3.2.0</version>
            </dependency>
            <dependency>
              <groupId>org.projectlombok</groupId>
              <artifactId>lombok</artifactId>
            </dependency>
          </dependencies>
        </project>
      `;

      const deps = parsePomXml(content);
      expect(deps).toContain("org.springframework.boot:spring-boot-starter-web");
      expect(deps).toContain("spring-boot-starter-web");
      expect(deps).toContain("org.springframework.boot");
      expect(deps).toContain("lombok");
    });

    it("handles malformed XML gracefully", () => {
      expect(parsePomXml(null)).toEqual([]);
      expect(parsePomXml("")).toEqual([]);
      expect(parsePomXml("<unclosed>xml")).toEqual([]);
    });
  });
});
