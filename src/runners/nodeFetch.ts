import fetch from "node-fetch";
import type { Runner } from "../core/types.js";
import { runBenchmark } from "../core/runBenchmark.js";
import { consumeResponseBody } from "../core/consumeResponseBody.js";
import { getSystemMetrics } from "../ui/systemMetrics.js";

export const nodeFetchRunner: Runner = {
  name: "node-fetch",
  tool: "custom",

  run: (ctx, onProgress) =>
    runBenchmark({
      name: "node-fetch",
      tool: "custom",

      client: undefined,

      concurrency: ctx.concurrency,
      requests: ctx.requests,
      baseUrl: ctx.baseUrl,
      endpoint: ctx.endpoint,

      request: (_c, url) => fetch(url),

      consume: (res) => consumeResponseBody(res),

      getMetrics: getSystemMetrics,

      onProgress,
    }),
};
