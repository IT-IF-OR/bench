import { execFileSync } from "node:child_process";
import type { BenchContext, BenchResult, Runner } from "../core/types.js";
import { computeRps } from "../core/computeRps.js";

function parseWrkLatencyStats(output: string) {
  const latMatch = output.match(
    /Latency\s+([\d.]+)([a-zµ]+)\s+([\d.]+)([a-zµ]+)\s+([\d.]+)([a-zµ]+)\s+([\d.]+)([a-zµ]+)/i,
  );
  const toMs = (value: string, unit: string): number => {
    const v = Number(value);
    switch (unit.toLowerCase()) {
      case "s":
        return v * 1000;
      case "ms":
        return v;
      case "us":
      case "µs":
        return v / 1000;
      case "ns":
        return v / 1_000_000;
      default:
        return v;
    }
  };
  const avg = latMatch ? toMs(latMatch[1], latMatch[2]) : 0;
  const min = latMatch ? toMs(latMatch[3], latMatch[4]) : 0;
  const max = latMatch ? toMs(latMatch[5], latMatch[6]) : 0;
  const stddev = latMatch ? toMs(latMatch[7], latMatch[8]) : 0;

  const p50 = Number(output.match(/50%\s+([\d.]+)([a-zµ]+)/i)?.[1] ?? 0);
  const p90 = Number(output.match(/90%\s+([\d.]+)([a-zµ]+)/i)?.[1] ?? 0);
  const p99 = Number(output.match(/99%\s+([\d.]+)([a-zµ]+)/i)?.[1] ?? 0);

  return { avg, min, max, stddev, p50, p90, p99 };
}

export const wrkRunner: Runner = {
  name: "wrk",
  tool: "wrk",

  async run(ctx: BenchContext): Promise<BenchResult> {
    const start = performance.now();
    const url = `${ctx.baseUrl}${ctx.endpoint}`;
    const threads = Math.max(1, Math.min(4, ctx.concurrency));
    const connections = Math.max(1, ctx.concurrency);
    const durationSec = Math.max(1, Math.ceil(ctx.durationMs! / 1000));

    let out: string;
    try {
      out = execFileSync(
        "wrk",
        [
          "-t",
          String(threads),
          "-c",
          String(connections),
          "-d",
          `${durationSec}s`,
          "--latency",
          url,
        ],
        { encoding: "utf8", stdio: ["pipe", "pipe", "pipe"] },
      );
    } catch (err: any) {
      console.error(`wrk failed:`, err.stderr || err.message);
      return {
        name: `wrk`,
        tool: "wrk",
        rps: 0,
        avg: 0,
        p50: 0,
        p90: 0,
        p99: 0,
        min: 0,
        max: 0,
        stddev: 0,
        errors: 0,
        durationMs: performance.now() - start,
      };
    }

    const durationMs = performance.now() - start;

    const totalMatch = out.match(/(\d+)\s+requests\s+in\s/);
    const totalRequests = totalMatch ? Number(totalMatch[1]) : 0;

    const stats = parseWrkLatencyStats(out);

    return {
      name: `wrk`,
      tool: "wrk",
      rps: computeRps(totalRequests, durationMs),
      avg: stats.avg,
      p50: stats.p50,
      p90: stats.p90,
      p99: stats.p99,
      min: stats.min,
      max: stats.max,
      stddev: stats.stddev,
      errors: 0,
      durationMs,
    };
  },
};
