import type { Runner } from "../core/types.js";
import { HyperCore } from "@hyperttp/core";
import { runBenchmark } from "../core/runBenchmark.js";
import { consumeResponseBody } from "../core/consumeResponseBody.js";
import { getSystemMetrics } from "../ui/systemMetrics.js";

export const hyperttpCoreRunner: Runner = {
  name: "@hyperttp/core",
  tool: "custom",

  run: async (ctx, onProgress) => {
    const client = new HyperCore({
      network: {
        maxConcurrent: ctx.concurrency,
        keepAliveTimeout: ctx.durationMs,
        pipelining: 1,
        headers: {
          "accept-encoding": "identity",
        },
      }
    });

    const result = await runBenchmark({
      name: "@hyperttp/core",
      tool: "custom",
      client,
      concurrency: ctx.concurrency,
      requests: ctx.requests,
      baseUrl: ctx.baseUrl,
      endpoint: ctx.endpoint,
      request: (c, url) => c.get({ url: url }),
      consume: consumeResponseBody,
      getMetrics: getSystemMetrics,
      onProgress,
    });

    await (client as any).destroy?.();

    return result;
  },
};
