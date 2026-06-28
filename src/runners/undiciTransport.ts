import type { Runner } from "../core/types.js";
import { runBenchmark } from "../core/runBenchmark.js";
import { getSystemMetrics } from "../ui/systemMetrics.js";

import { UndiciTransport } from "@hyperttp/transport-undici";

const transport = new UndiciTransport({});

export const undiciTransportRunner: Runner = {
  name: "undici-transport",
  tool: "custom",

  run: (ctx, onProgress) =>
    runBenchmark({
      name: "undici-transport",
      tool: "custom",

      client: transport,

      concurrency: ctx.concurrency,
      requests: ctx.requests,
      baseUrl: ctx.baseUrl,
      endpoint: ctx.endpoint,

      request: (_c, url) =>
        transport.execute({
          method: "GET",
          url,
          headers: "test",
        }),

      consume: async (res) => {
        if (!res.body) return;

        const body = res.body as ReadableStream<Uint8Array>;

        const reader = body.getReader();

        try {
          while (true) {
            const { done } = await reader.read();
            if (done) break;
          }
        } finally {
          reader.releaseLock();
        }
      },

      getMetrics: getSystemMetrics,

      onProgress,
    }),
};
