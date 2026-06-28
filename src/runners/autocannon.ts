import autocannon from "autocannon";
import type { Runner } from "../core/types.js";
import { computeRps } from "../core/computeRps.js";

export const autocannonRunner: Runner = {
  name: "autocannon",
  tool: "autocannon",

  async run(ctx) {
    const start = performance.now();
    const url = `${ctx.baseUrl}${ctx.endpoint}`;

    const result = await autocannon({
      url,
      connections: ctx.concurrency,
      duration: Math.max(1, Math.ceil(ctx.durationMs! / 1000)),
    });

    const durationMs = performance.now() - start;
    const totalRequests = result.requests.total ?? 0;

    return {
      tool: "autocannon",
      name: "autocannon",

      rps: computeRps(totalRequests, durationMs),
      avg: result.latency.average ?? 0,
      p50: result.latency.p50 ?? 0,
      p90: result.latency.p90 ?? 0,
      p99: result.latency.p99 ?? 0,
      min: result.latency.min ?? 0,
      max: result.latency.max ?? 0,
      stddev: result.latency.stddev ?? 0,
      errors: result.errors ?? 0,
      durationMs,
    };
  },
};
