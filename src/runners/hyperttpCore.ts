import type { Runner } from "../core/types.js";
import { HyperCore } from "@hyperttp/core";
import { runBenchmark } from "../core/runBenchmark.js";
import { consumeResponseBody } from "../core/consumeResponseBody.js";
import { getSystemMetrics } from "../ui/systemMetrics.js";

export const hyperttpCoreRunner: Runner = {
  name: "@hyperttp/core",
  tool: "custom",

  run: (ctx, onProgress) => {
    const client = new HyperCore({
      network: {
        maxConcurrent: ctx.concurrency,
        keepAliveTimeout: 60_000,
        pipelining: 1,
        // Перебиваем дефолтный Accept-Encoding для бенчмарков,
        // чтобы мерить чистый сетевой оверхед и парсинг, а не скорость JS-зиппера
        headers: {
          "accept-encoding": "identity",
        },
      },
    });

    return runBenchmark({
      name: "@hyperttp/core",
      tool: "custom",
      client,
      concurrency: ctx.concurrency,
      requests: ctx.requests,
      baseUrl: ctx.baseUrl,
      endpoint: ctx.endpoint,
      request: (c, url) => c.get(url),
      // Убедитесь, что consumeResponseBody умеет вызывать .arrayBuffer() / .text()
      // у вашего HyperHttpResponse, а не только у нативного Response
      consume: consumeResponseBody,
      getMetrics: getSystemMetrics,
      onProgress,
    });
  },
};
