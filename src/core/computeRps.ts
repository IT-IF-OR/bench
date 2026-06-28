export function computeRps(success: number, durationMs: number): number {
  return durationMs > 0 ? success / (durationMs / 1000) : 0;
}
