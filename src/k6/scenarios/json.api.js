import http from "k6/http";
import { check } from "k6";

export const options = {
  vus: 200,
  duration: "30s",
};

export default function () {
  const res = http.get("http://localhost:3000/api/json?t=" + __VU);

  check(res, {
    "is json": (r) => r.headers["Content-Type"]?.includes("application/json"),
    "status 200": (r) => r.status === 200,
  });
}
