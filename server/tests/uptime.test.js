import { describe, it, expect } from "@jest/globals";
import { calculateUptime } from "../src/utils/calculateUptime.js";

describe("calculateUptime", () => {
  it("should return null for empty array", () => {
    expect(calculateUptime([])).toBeNull();
  });

  it("should return null for null input", () => {
    expect(calculateUptime(null)).toBeNull();
  });

  it("should return null for undefined input", () => {
    expect(calculateUptime(undefined)).toBeNull();
  });

  it("should calculate 100% for 10/10 up checks", () => {
    const checks = Array.from({ length: 10 }, () => ({ isUp: true }));
    const result = calculateUptime(checks);

    expect(result).toEqual({
      uptimePercent: 100,
      totalChecks: 10,
      upChecks: 10,
    });
  });

  it("should calculate 0% for 0/10 up checks", () => {
    const checks = Array.from({ length: 10 }, () => ({ isUp: false }));
    const result = calculateUptime(checks);

    expect(result).toEqual({
      uptimePercent: 0,
      totalChecks: 10,
      upChecks: 0,
    });
  });

  it("should calculate 80% for 8/10 up checks", () => {
    const checks = [
      ...Array.from({ length: 8 }, () => ({ isUp: true })),
      ...Array.from({ length: 2 }, () => ({ isUp: false })),
    ];
    const result = calculateUptime(checks);

    expect(result).toEqual({
      uptimePercent: 80,
      totalChecks: 10,
      upChecks: 8,
    });
  });

  it("should handle a single up check", () => {
    const result = calculateUptime([{ isUp: true }]);

    expect(result).toEqual({
      uptimePercent: 100,
      totalChecks: 1,
      upChecks: 1,
    });
  });

  it("should handle a single down check", () => {
    const result = calculateUptime([{ isUp: false }]);

    expect(result).toEqual({
      uptimePercent: 0,
      totalChecks: 1,
      upChecks: 0,
    });
  });

  it("should round to 2 decimal places (e.g. 3/7 → 42.86%)", () => {
    const checks = [
      ...Array.from({ length: 3 }, () => ({ isUp: true })),
      ...Array.from({ length: 4 }, () => ({ isUp: false })),
    ];
    const result = calculateUptime(checks);

    expect(result.uptimePercent).toBe(42.86);
    expect(result.totalChecks).toBe(7);
    expect(result.upChecks).toBe(3);
  });
});
