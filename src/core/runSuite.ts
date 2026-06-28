import { computeStats } from "./computeStats.js";
import { runLoad } from "./runLoad.js";
import type {
  BenchResult,
  ProgressCallback,
  BenchContext,
  Runner,
  ProgressMetrics,
} from "./types.js";

function median(values: number[]): number {
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid];
}

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

let lastCpu = process.cpuUsage();
let lastTime = process.hrtime.bigint();

export function getSystemMetrics() {
  const mem = process.memoryUsage();
  const memoryMB = mem.rss / 1024 / 1024;

  const currentTime = process.hrtime.bigint();
  const currentCpu = process.cpuUsage();

  const cpuDiff = {
    user: currentCpu.user - lastCpu.user,
    system: currentCpu.system - lastCpu.system,
  };

  const timeDiffNs = currentTime - lastTime;
  const cpuTimeUs = cpuDiff.user + cpuDiff.system;
  const timeDiffUs = Number(timeDiffNs) / 1000;

  const cpuPercent = timeDiffUs > 0 ? Math.min(100, (cpuTimeUs / timeDiffUs) * 100) : 0;

  lastCpu = currentCpu;
  lastTime = currentTime;

  return {
    memory: memoryMB,
    cpu: cpuPercent,
  };
}

export function resetSystemMetrics() {
  lastCpu = process.cpuUsage();
  lastTime = process.hrtime.bigint();
}

export async function runBenchmark<TClient, TRes>(opts: {
  name: string;
  tool: BenchResult["tool"];
  client: TClient;
  request: (client: TClient, url: string) => Promise<TRes>;
  consume?: (res: TRes) => Promise<void>;
  concurrency: number;
  requests: number;
  baseUrl: string;
  endpoint: string;
  onProgress?: ProgressCallback;
  getMetrics?: () => any;
}): Promise<BenchResult> {
  const start = performance.now();
  let completed = 0;
  let errors = 0;
  const samples: number[] = [];
  const url = `${opts.baseUrl}${opts.endpoint}`;

  const reportEvery = 200;
  let lastReport = start;

  await runLoad(opts.concurrency, opts.requests, async () => {
    const t0 = performance.now();
    try {
      const res = await opts.request(opts.client, url);
      await opts.consume?.(res);
      samples.push(performance.now() - t0);
      completed++;
    } catch {
      errors++;
    }

    const now = performance.now();
    if (now - lastReport > reportEvery) {
      const elapsed = (now - start) / 1000;
      opts.onProgress?.({
        rps: completed / elapsed,
        avg: samples.reduce((a, b) => a + b, 0) / (samples.length || 1),
        errors,
        completed,
        ...opts.getMetrics?.(),
      });
      lastReport = now;
    }
  });

  const durationMs = performance.now() - start;
  const stats = computeStats(samples);

  return {
    tool: opts.tool,
    name: opts.name,
    rps: completed / (durationMs / 1000),
    ...stats,
    errors,
    durationMs,
  };
}

export async function runSuite(
  ctx: BenchContext,
  runners: Runner[],
  onProgress?: (runner: Runner, m: ProgressMetrics) => void,
): Promise<BenchResult[]> {
  const results: BenchResult[] = [];
  const RUNS = 5;

  for (const runner of runners) {
    const rpsRuns: number[] = [];
    const avgRuns: number[] = [];
    const p50Runs: number[] = [];
    const p90Runs: number[] = [];
    const p99Runs: number[] = [];
    const errorRuns: number[] = []; // Сбор ошибок

    for (let i = 0; i < RUNS; i++) {
      resetSystemMetrics();

      const core = await runner.run(ctx, (m) => {
        onProgress?.(runner, m);
      });

      rpsRuns.push(core.rps);
      avgRuns.push(core.avg);
      p50Runs.push(core.p50);
      p90Runs.push(core.p90);
      p99Runs.push(core.p99);
      errorRuns.push(core.errors); // Сохраняем ошибки прогона

      await sleep(300);
    }

    results.push({
      name: runner.name,
      tool: runner.tool,
      rps: median(rpsRuns),
      avg: median(avgRuns),
      p50: median(p50Runs),
      p90: median(p90Runs),
      p99: median(p99Runs),
      min: Math.min(...rpsRuns),
      max: Math.max(...rpsRuns),
      stddev: 0,
      errors: Math.max(...errorRuns), // Выводим максимальное число ошибок из ранов
      durationMs: 0,
    });
  }

  return results;
}
