import { describe, expect, it } from "vitest";
import { formatDate, formatRange } from "@/lib/format";

describe("formatDate", () => {
  it("formats a month and a bare year", () => {
    expect(formatDate("2026-09")).toBe("Sep 2026");
    expect(formatDate("2025")).toBe("2025");
  });

  it("rejects malformed dates", () => {
    expect(() => formatDate("2026-13")).toThrow();
    expect(() => formatDate("26-01")).toThrow();
    expect(() => formatDate("")).toThrow();
  });
});

describe("formatRange", () => {
  it("collapses the year when both ends share it", () => {
    expect(formatRange("2026-01", "2026-07")).toBe("Jan – Jul 2026");
  });

  it("keeps both years when they differ", () => {
    expect(formatRange("2022-09", "2024-12")).toBe("Sep 2022 – Dec 2024");
  });

  it('shows "Present" for an open end', () => {
    expect(formatRange("2026-01", null)).toBe("Jan 2026 – Present");
  });
});
