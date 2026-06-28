# bench — HTTP Client Benchmarking Engine

Head-to-head HTTP client throughput & latency benchmarks for Bun and Node.js.

## Features

- Compare 18+ HTTP clients side-by-side (RPS, latency percentiles, errors)
- Real-time terminal Grafana dashboard with sparkline charts
- Markdown table leaderboard output
- Supports Bun and Node.js
- Built-in test server (Fastify on Node, `Bun.serve` on Bun)
- Configurable concurrency, request count, and duration
- k6 scenario scripts included
- Autocannon and wrk runners for cross-tool comparison

## Quick Start

```bash
bun install
bun .
```

On Node.js:

```bash
npx tsx bench.ts
```

## Configuration

Edit the `BenchContext` in `bench.ts` or set env vars:

| Variable    | Default                 | Description            |
| ----------- | ----------------------- | ---------------------- |
| `BENCH_URL` | `http://127.0.0.1:3001` | Target server base URL |

Enable/disable runners by commenting them in/out of the `runners` array in `bench.ts`.

## Runners

| Client                     | Source                           |
| -------------------------- | -------------------------------- |
| bun-fetch                  | `src/runners/bun.ts`             |
| undici                     | `src/runners/undici.ts`          |
| @hyperttp/core             | `src/runners/hyperttpCore.ts`    |
| @hyperttp/core (v1.2.6)    | `src/runners/hyperttpCoreold.ts` |
| hyperttp (original)        | `src/runners/hyperttp.ts`        |
| hyperttp v2                | `src/runners/hyperttpv2.ts`      |
| hyperttp v3                | `src/runners/hyperttpv3.ts`      |
| @hyperttp/transport-bun    | `src/runners/bunTransport.ts`    |
| @hyperttp/transport-undici | `src/runners/undiciTransport.ts` |
| axios                      | `src/runners/axios.ts`           |
| got                        | `src/runners/got.ts`             |
| ky                         | `src/runners/ky.ts`              |
| node-fetch                 | `src/runners/nodeFetch.ts`       |
| superagent                 | `src/runners/superagent.ts`      |
| request                    | `src/runners/request.ts`         |
| autocannon                 | `src/runners/autocannon.ts`      |
| wrk                        | `src/runners/wrk.ts`             |

## Metrics

Each runner runs 5 iterations; the median is reported.

| Metric      | Description           |
| ----------- | --------------------- |
| RPS         | Requests per second   |
| Avg         | Average latency (ms)  |
| p50/p90/p99 | Latency percentiles   |
| Min/Max     | Latency range (ms)    |
| StdDev      | Latency std deviation |
| Errors      | Failed request count  |

## Project Structure

```txt
bench.ts          — main entry point
src/
  core/           — benchmark orchestration
  runners/        — HTTP client adapters
  tui/            — terminal Grafana dashboard
  ui/             — output formatting
  utils/          — server, TUI helpers
  types/          — shared types
  k6/             — k6 scenario scripts
  reports/        — output artifacts
```

## License

MIT
