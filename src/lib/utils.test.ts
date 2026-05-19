import { describe, expect, it, vi } from "vitest";
import { formatChartTick, formatRelativeTime, formatTimestamp } from "./utils";

describe("date formatters", () => {
  it("returns a fallback for missing or invalid timestamps", () => {
    expect(formatTimestamp(null)).toBe("--");
    expect(formatTimestamp("")).toBe("--");
    expect(formatTimestamp("not-a-date")).toBe("--");
    expect(formatChartTick("not-a-date")).toBe("--");
  });

  it("returns a fallback for invalid relative timestamps", () => {
    expect(formatRelativeTime(undefined)).toBe("--");
    expect(formatRelativeTime("not-a-date")).toBe("--");
  });

  it("formats valid relative timestamps", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-05-19T04:00:00Z"));

    expect(formatRelativeTime("2026-05-19T03:59:00Z")).toBe("1 minute ago");

    vi.useRealTimers();
  });
});
