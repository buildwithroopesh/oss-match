import { describe, it, expect } from "vitest";
import { distributePercentages } from "@/core/language/rounding";

describe("distributePercentages (Largest-Remainder Rounding)", () => {
  it("returns empty array when input is empty", () => {
    expect(distributePercentages([])).toEqual([]);
  });

  it("handles single language giving exactly 100%", () => {
    const result = distributePercentages([{ language: "TypeScript", bytes: 15420 }]);
    expect(result).toHaveLength(1);
    expect(result[0].percentage).toBe(100);
    expect(result[0].rawPercentage).toBe(100);
  });

  it("handles clean integer splits summing to 100%", () => {
    const result = distributePercentages([
      { language: "TypeScript", bytes: 500 },
      { language: "Python", bytes: 300 },
      { language: "Go", bytes: 200 },
    ]);

    expect(result[0].percentage).toBe(50);
    expect(result[1].percentage).toBe(30);
    expect(result[2].percentage).toBe(20);

    const sum = result.reduce((acc, curr) => acc + curr.percentage, 0);
    expect(sum).toBe(100);
  });

  it("resolves recurring fractions (1/3 each) so percentages sum to exactly 100%", () => {
    const result = distributePercentages([
      { language: "Go", bytes: 100 },
      { language: "Python", bytes: 100 },
      { language: "Rust", bytes: 100 },
    ]);

    // 100 / 300 = 33.333...%
    // Floors: 33, 33, 33 (sum 99, 1 unit remaining)
    // Remainders are equal (0.333...), bytes are equal (100).
    // Tie-break alphabetically: Go ('Go' < 'Python' < 'Rust') receives the +1.
    expect(result.find((r) => r.language === "Go")?.percentage).toBe(34);
    expect(result.find((r) => r.language === "Python")?.percentage).toBe(33);
    expect(result.find((r) => r.language === "Rust")?.percentage).toBe(33);

    const sum = result.reduce((acc, curr) => acc + curr.percentage, 0);
    expect(sum).toBe(100);
  });

  it("distributes remainders to higher decimal fractions first", () => {
    const result = distributePercentages([
      { language: "A", bytes: 49 }, // 49 / 140 = 35%
      { language: "B", bytes: 48 }, // 48 / 140 = 34.2857%
      { language: "C", bytes: 43 }, // 43 / 140 = 30.7142%
    ]);

    // Total = 140
    // A: 35.0% -> floor 35, rem 0.0
    // B: 34.2857% -> floor 34, rem 0.2857
    // C: 30.7142% -> floor 30, rem 0.7142
    // Sum of floors: 35 + 34 + 30 = 99. Remainder unit = 1.
    // C has largest remainder (0.7142), so C gets +1 -> 31%.
    expect(result[0].percentage).toBe(35);
    expect(result[1].percentage).toBe(34);
    expect(result[2].percentage).toBe(31);

    const sum = result.reduce((acc, curr) => acc + curr.percentage, 0);
    expect(sum).toBe(100);
  });

  it("handles complex multi-language dataset with exact 100% guarantee", () => {
    const result = distributePercentages([
      { language: "TypeScript", bytes: 84391 },
      { language: "JavaScript", bytes: 32014 },
      { language: "HTML", bytes: 14209 },
      { language: "CSS", bytes: 11094 },
      { language: "Shell", bytes: 4019 },
      { language: "Python", bytes: 2104 },
      { language: "Ruby", bytes: 940 },
    ]);

    const sum = result.reduce((acc, curr) => acc + curr.percentage, 0);
    expect(sum).toBe(100);
  });

  it("handles zero total bytes by returning 0% for all items", () => {
    const result = distributePercentages([
      { language: "TypeScript", bytes: 0 },
      { language: "Python", bytes: 0 },
    ]);

    expect(result[0].percentage).toBe(0);
    expect(result[1].percentage).toBe(0);
  });

  it("uses locale-independent deterministic string comparison for identical remainder and byte tie-breaking", () => {
    // 6 items with 100 bytes each -> 100/600 = 16.666...% -> floors: 16 (sum: 96, remaining: 4)
    // All items have identical bytes (100) and identical remainders (0.666...).
    // Input provided in reverse alphabetical order: "F", "E", "D", "C", "B", "A".
    // Deterministic string comparison ("A" < "B" < "C" < "D" < "E" < "F") ensures
    // the top 4 remaining units (+1%) are awarded to "A", "B", "C", and "D".
    const result = distributePercentages([
      { language: "F", bytes: 100 },
      { language: "E", bytes: 100 },
      { language: "D", bytes: 100 },
      { language: "C", bytes: 100 },
      { language: "B", bytes: 100 },
      { language: "A", bytes: 100 },
    ]);

    expect(result.find((r) => r.language === "A")?.percentage).toBe(17);
    expect(result.find((r) => r.language === "B")?.percentage).toBe(17);
    expect(result.find((r) => r.language === "C")?.percentage).toBe(17);
    expect(result.find((r) => r.language === "D")?.percentage).toBe(17);
    expect(result.find((r) => r.language === "E")?.percentage).toBe(16);
    expect(result.find((r) => r.language === "F")?.percentage).toBe(16);

    const sum = result.reduce((acc, curr) => acc + curr.percentage, 0);
    expect(sum).toBe(100);
  });
});
