import http from "k6/http";

export const options = {
  vus: 200,
  duration: "30s",
};

export default function () {
  // warm GET
  http.get("http://localhost:3000?warmup=" + __VU);

  // API GET
  const r1 = http.get("http://localhost:3000/api/data?id=" + __VU);

  // dependent request
  const id = JSON.parse(r1.body || "{}").id || __VU;

  http.get(`http://localhost:3000/api/detail/${id}`);
}
