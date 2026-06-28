import { CoreMetrics } from "./types.js";

export function computeStats(
  samples: number[],
): Omit<CoreMetrics, "rps" | "errors" | "durationMs"> {
  const sorted = [...samples].sort((a, b) => a - b);

  const avg = samples.reduce((a, b) => a + b, 0) / samples.length;

  const p = (n: number) => sorted[Math.floor((n / 100) * (sorted.length - 1))];

  const variance = samples.reduce((acc, v) => acc + Math.pow(v - avg, 2), 0) / samples.length;

  return {
    avg,
    p50: p(50),
    p90: p(90),
    p99: p(99),
    min: sorted[0],
    max: sorted[sorted.length - 1],
    stddev: Math.sqrt(variance),
  };
}
