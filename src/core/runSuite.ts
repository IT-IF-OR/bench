import { fork } from "child_process";
import type {
  BenchResult,
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

function memSnapshot() {
  const m = process.memoryUsage();
  return {
    rss: m.rss / 1024 / 1024,
    heapUsed: m.heapUsed / 1024 / 1024,
    external: m.external / 1024 / 1024,
    arrayBuffers: m.arrayBuffers / 1024 / 1024,
  };
}

function fmtDelta(after: number, before: number) {
  const d = after - before;
  const sign = d >= 0 ? "+" : "";
  return `${sign}${d.toFixed(1)}`;
}

export async function runSuite(
  ctx: BenchContext,
  runners: Runner[],
  onProgress?: (runner: Runner, m: ProgressMetrics) => void,
): Promise<BenchResult[]> {
  if (process.env.IS_CHILD === "true") {
    const runnerIndex = parseInt(process.env.RUNNER_INDEX || "0", 10);
    const runner = runners[runnerIndex];

    if (!runner) {
      process.exit(1);
    }

    const RUNS = 5;
    const WARMUP_REQUESTS = 1000;

    await runner.run({ ...ctx, requests: WARMUP_REQUESTS }, () => {});

    if (typeof globalThis.gc === "function") globalThis.gc();
    const baseline = memSnapshot();

    process.send!({
      type: "LOG",
      text: `\n▸ ${runner.name} — ${RUNS} runs (baseline RSS=${baseline.rss.toFixed(1)} MB)`,
    });

    const rpsRuns: number[] = [];
    const avgRuns: number[] = [];
    const p50Runs: number[] = [];
    const p90Runs: number[] = [];
    const p99Runs: number[] = [];
    const errorRuns: number[] = [];

    for (let i = 0; i < RUNS; i++) {
      if (typeof globalThis.gc === "function") globalThis.gc();
      const before = memSnapshot();

      const core = await runner.run(ctx, (m) => {
        process.send!({
          type: "PROGRESS",
          metrics: {
            ...m,
            memory: m.memory != null ? m.memory - baseline.rss : undefined,
            heapUsed: m.heapUsed != null ? m.heapUsed - baseline.heapUsed : undefined,
            external: m.external != null ? m.external - baseline.external : undefined,
            arrayBuffers: m.arrayBuffers != null ? m.arrayBuffers - baseline.arrayBuffers : undefined,
          },
        });
      });

      if (typeof globalThis.gc === "function") globalThis.gc();
      const after = memSnapshot();

      process.send!({
        type: "LOG",
        text: `  Run ${i + 1}: RSS Δ${fmtDelta(after.rss, before.rss)} (from baseline ${fmtDelta(after.rss, baseline.rss)}) MB | ` +
              `heap Δ${fmtDelta(after.heapUsed, before.heapUsed)} | ` +
              `external Δ${fmtDelta(after.external, before.external)} | ` +
              `arrayBuf Δ${fmtDelta(after.arrayBuffers, before.arrayBuffers)} | ` +
              `rps=${core.rps.toFixed(0)}`,
      });

      rpsRuns.push(core.rps);
      avgRuns.push(core.avg);
      p50Runs.push(core.p50);
      p90Runs.push(core.p90);
      p99Runs.push(core.p99);
      errorRuns.push(core.errors);

      await sleep(300);
    }

    process.send!({
      type: "RESULT",
      result: {
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
        errors: Math.max(...errorRuns),
        durationMs: 0,
      },
    });

    process.exit(0);
  }

  const results: BenchResult[] = [];

  for (let i = 0; i < runners.length; i++) {
    const runner = runners[i];

    await new Promise<void>((resolve, reject) => {
      const child = fork(process.argv[1]!, [], {
        execArgv: Array.from(new Set([...process.execArgv, "--expose-gc"])),
        env: {
          ...process.env,
          IS_CHILD: "true",
          RUNNER_INDEX: i.toString(),
        },
      });

      child.on("message", (msg: any) => {
        if (msg.type === "LOG") {
          console.log(msg.text);
        } else if (msg.type === "PROGRESS") {
          onProgress?.(runner, msg.metrics);
        } else if (msg.type === "RESULT") {
          results.push(msg.result);
        }
      });

      child.on("exit", (code) => {
        if (code === 0) {
          resolve();
        } else {
          reject(new Error(`Runner [${runner.name}] crashed with exit code ${code}`));
        }
      });

      child.on("error", reject);
    });
  }

  return results;
}
