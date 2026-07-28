/**
 * Calculate uptime statistics from an array of check logs.
 *
 * @param {Array<{ isUp: boolean }>} checks - Array of check logs containing at least an `isUp` boolean field.
 * @returns {{ uptimePercent: number, totalChecks: number, upChecks: number } | null}
 * Returns null if checks array is empty or null/undefined.
 */
export function calculateUptime(checks) {
  if (!checks || !Array.isArray(checks) || checks.length === 0) {
    return null;
  }

  const totalChecks = checks.length;
  const upChecks = checks.filter((c) => c && c.isUp === true).length;
  const uptimePercent = parseFloat(((upChecks / totalChecks) * 100).toFixed(2));

  return {
    uptimePercent,
    totalChecks,
    upChecks,
  };
}
