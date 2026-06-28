import axios from "axios";
import { runBenchmark } from "../core/runBenchmark.js";
import { consumeResponseBody } from "../core/consumeResponseBody.js";
import { Runner } from "../core/types.js";
import { getSystemMetrics } from "../ui/systemMetrics.js";

export const axiosRunner: Runner = {
  name: "axios",
  tool: "custom",

  run: (ctx, onProgress) =>
    runBenchmark({
      name: "axios",
      tool: "custom",

      client: undefined,

      concurrency: ctx.concurrency,
      requests: ctx.requests,
      baseUrl: ctx.baseUrl,
      endpoint: ctx.endpoint,

      request: async (_c, url) => {
        return axios.get(url, { responseType: "arraybuffer" }).then((r) => r.data);
      },

      consume: (stream) => consumeResponseBody(stream),

      getMetrics: getSystemMetrics,

      onProgress,
    }),
};
