import type { Runner } from "../core/types.js";
import ky from "ky";
import { runBenchmark } from "../core/runBenchmark.js";
import { consumeResponseBody } from "../core/consumeResponseBody.js";
import { getSystemMetrics } from "../ui/systemMetrics.js";

export const kyRunner: Runner = {
  name: "ky",
  tool: "custom",

  run: (ctx, onProgress) =>
    runBenchmark({
      name: "ky",
      tool: "custom",

      client: undefined,

      concurrency: ctx.concurrency,
      requests: ctx.requests,
      baseUrl: ctx.baseUrl,
      endpoint: ctx.endpoint,

      request: (_c, url) => ky(url).text(),

      consume: async (res: string) => {
        await consumeResponseBody(res);
      },

      getMetrics: getSystemMetrics,

      onProgress,
    }),
};
