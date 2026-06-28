import superagent from "superagent";
import type { Runner } from "../core/types.js";
import { runBenchmark } from "../core/runBenchmark.js";
import { consumeResponseBody } from "../core/consumeResponseBody.js";
import { getSystemMetrics } from "../ui/systemMetrics.js";

export const superagentRunner: Runner = {
  name: "superagent",
  tool: "custom",

  run: (ctx, onProgress) =>
    runBenchmark({
      name: "superagent",
      tool: "custom",

      client: undefined,

      concurrency: ctx.concurrency,
      requests: ctx.requests,
      baseUrl: ctx.baseUrl,
      endpoint: ctx.endpoint,

      request: (_c, url) => superagent.get(url),

      consume: (res) => consumeResponseBody(res),

      getMetrics: getSystemMetrics,

      onProgress,
    }),
};
