import type { Runner } from "../core/types.js";
import { HyperClient } from "hyperttp";
import { runBenchmark } from "../core/runBenchmark.js";
import { consumeResponseBody } from "../core/consumeResponseBody.js";
import { getSystemMetrics } from "../ui/systemMetrics.js";

export const hyperttpRunner: Runner = {
  name: "hyperttp",
  tool: "custom",

  run: async (ctx, onProgress) => {
    const client = new HyperClient({
      network: {
        maxConcurrent: ctx.concurrency,
        keepAliveTimeout: ctx.durationMs,
        pipelining: 1,
      },
      interceptors: { enabled: false },
      inflight: { enabled: false },
      cache: { enabled: false },
      queue: { enabled: false },
      rateLimit: { enabled: false },
      metrics: { enabled: false },
    });

    const result = await runBenchmark({
      name: "hyperttp",
      tool: "custom",
      client,
      concurrency: ctx.concurrency,
      requests: ctx.requests,
      baseUrl: ctx.baseUrl,
      endpoint: ctx.endpoint,
      request: (c, url) => c.get(`${url}?uuid=${crypto.randomUUID()}`),
      consume: consumeResponseBody,
      getMetrics: getSystemMetrics,
      onProgress,
    });

    await (client as any).destroy?.();

    return result;
  },
};
