export type MemorySnapshot = ReturnType<typeof snapshotMemory>;

export type BenchmarkRow = {
  name: string;
  kind: "local" | "cache" | "queue" | "real-world" | "misc";
  tool: "k6" | "autocannon" | "wrk" | "custom";

  requests: number;
  concurrency: number;
  durationMs: number;

  rps: number;
  errors: number;

  avgLatencyMs: number;
  p50: number;
  p99: number;

  raw?: unknown;
};

export type BenchmarkOptions = {
  requests?: number;
  concurrency?: number;
  timeoutMs?: number;
  warmup?: number;
  memorySampleMs?: number;
  baseUrl?: string;
  logEveryRow?: boolean;
};

export function snapshotMemory() {
  const m = process.memoryUsage();
  return {
    rss: m.rss,
    heapUsed: m.heapUsed,
    heapTotal: m.heapTotal,
    external: m.external,
    arrayBuffers: m.arrayBuffers,
  };
}
