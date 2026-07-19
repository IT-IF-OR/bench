export type BenchContext = {
  baseUrl: string;
  requests: number;
  concurrency: number;
  endpoint: string;

  durationMs?: number;
};

export type CoreMetrics = {
  rps: number;
  avg: number;
  p50: number;
  p90: number;
  p99: number;
  min: number;
  max: number;
  stddev: number;
  errors: number;
  durationMs: number;
};

export type ProgressMetrics = {
  rps: number;
  avg: number;
  errors: number;
  completed: number;

  memory?: number;
  cpu?: number;
  heapUsed?: number;
  heapTotal?: number;
  external?: number;
  arrayBuffers?: number;
  eventLoopLag?: number;
  ttfb?: number;
};

export type ProgressCallback = (
  metrics: ProgressMetrics & {
    runner?: string;
  },
) => void;

export type BenchResult = CoreMetrics & {
  tool: "k6" | "autocannon" | "wrk" | "custom";
  name: string;
  raw?: unknown;
};

export interface Runner {
  name: string;
  tool: BenchResult["tool"];

  run(ctx: BenchContext, onProgress?: ProgressCallback): Promise<BenchResult>;
}
