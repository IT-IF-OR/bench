import type { Runner } from "../core/types.js";
import got from "got";
import { runBenchmark } from "../core/runBenchmark.js";
import { consumeResponseBody } from "../core/consumeResponseBody.js";
import { getSystemMetrics } from "../ui/systemMetrics.js";

export const gotRunner: Runner = {
  name: "got",
  tool: "custom",

  run: (ctx, onProgress) =>
    runBenchmark({
      name: "got",
      tool: "custom",

      client: undefined,

      concurrency: ctx.concurrency,
      requests: ctx.requests,
      baseUrl: ctx.baseUrl,
      endpoint: ctx.endpoint,

      request: async (_c, url) => {
        const res = got.get(url, {
          http2: false,
          throwHttpErrors: false,
          decompress: false,
        });
        await consumeResponseBody(res);
        return res;
      },

      consume: (stream) => consumeResponseBody(stream),

      getMetrics: getSystemMetrics,

      onProgress,
    }),
};
