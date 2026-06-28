import http from "k6/http";
import { check } from "k6";

const baseUrl = __ENV.BASE_URL;
const endpoint = __ENV.ENDPOINT || "/";
const requests = Number(__ENV.REQUESTS || "20000");
const concurrency = Number(__ENV.CONCURRENCY || "200");
const durationMs = Number(__ENV.DURATION_MS || "20000");

export const options =
  requests > 0
    ? {
        scenarios: {
          bench: {
            executor: "shared-iterations",
            vus: concurrency,
            iterations: requests,
            maxDuration: `${Math.max(1, Math.ceil(durationMs / 1000))}s`,
          },
        },
        discardResponseBodies: true,
      }
    : {
        vus: concurrency,
        duration: `${Math.max(1, Math.ceil(durationMs / 1000))}s`,
        discardResponseBodies: true,
      };

export default function () {
  const res = http.get(`${baseUrl}${endpoint}`);
  check(res, { "status is 200": (r) => r.status === 200 });
}
