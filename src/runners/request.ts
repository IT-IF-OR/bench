import request from "request";
import type { Runner } from "../core/types.js";
import { runBenchmark } from "../core/runBenchmark.js";
import { consumeResponseBody } from "../core/consumeResponseBody.js";
import { getSystemMetrics } from "../ui/systemMetrics.js";

function req(url: string): Promise<any> {
  return new Promise((resolve, reject) => {
    request(url, (err, res, body) => {
      if (err) return reject(err);
      resolve(body);
    });
  });
}

export const requestRunner: Runner = {
  name: "request",
  tool: "custom",

  run: (ctx, onProgress) =>
    runBenchmark({
      name: "request",
      tool: "custom",

      client: undefined,

      concurrency: ctx.concurrency,
      requests: ctx.requests,
      baseUrl: ctx.baseUrl,
      endpoint: ctx.endpoint,

      request: (_c, url) => req(url),

      consume: (body) => consumeResponseBody(body),

      getMetrics: getSystemMetrics,

      onProgress,
    }),
};
