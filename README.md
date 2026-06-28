# bench — HTTP Client Benchmarking Engine

Head-to-head HTTP client throughput & latency benchmarks for Bun and Node.js.

## Features

- Compare 10+ HTTP clients side-by-side (RPS, latency percentiles, errors)
- Real-time terminal Grafana dashboard with sparkline charts
- Markdown table leaderboard output
- Supports Bun and Node.js
- Built-in test server on both runtimes
- Configurable concurrency, request count, and duration
- k6 scenario scripts included
- `NoopGrafanaController` for headless/CI runs
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

### Disabling the TUI

Switch to `NoopGrafanaController` in `bench.ts` for headless runs:

```ts
// const tui = new GrafanaController();
const tui = new NoopGrafanaController();
```

### Enabling/Disabling Runners

Comment runners in/out of the `runners` array in `bench.ts`:

```ts
const runners = [
  bunFetchRunner,
  undiciRunner,
  hyperttpCoreRunner,
  // axiosRunner,
  // gotRunner,
  // kyRunner,
  // ...
];
```

## Runners

All available runners. The 10 uncommented by default are marked with ✓.

| Client                     | Source                           | Default |
| -------------------------- | -------------------------------- | ------- |
| bun-fetch                  | `src/runners/bun.ts`             | ✓       |
| undici                     | `src/runners/undici.ts`          | ✓       |
| @hyperttp/core             | `src/runners/hyperttpCore.ts`    | ✓       |
| hyperttp                   | `src/runners/hyperttp.ts`        | ✓       |
| axios                      | `src/runners/axios.ts`           | ✓       |
| got                        | `src/runners/got.ts`             | ✓       |
| ky                         | `src/runners/ky.ts`              | ✓       |
| node-fetch                 | `src/runners/nodeFetch.ts`       | ✓       |
| superagent                 | `src/runners/superagent.ts`      | ✓       |
| request                    | `src/runners/request.ts`         | ✓       |
| autocannon                 | `src/runners/autocannon.ts`      |         |
| wrk                        | `src/runners/wrk.ts`             |         |

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

## Results

### Bun 1.3.14 — BunTransport

```
OS:  linux 7.0.10-zen1-1-zen
CPU: Intel(R) Core(TM) i5-8600K CPU @ 3.60GHz
```

| Rank | Client         |    RPS |      Avg |      p50 |      p90 |      p99 | Errors |
| ---- | -------------- | ------ | -------- | -------- | -------- | -------- | ------ |
| 🥇 1 | bun-fetch      | 23.84K |  8.36 ms |  8.51 ms | 11.01 ms | 16.18 ms |      0 |
| 🥈 2 | undici         | 19.77K | 10.08 ms | 10.25 ms | 13.79 ms | 17.23 ms |      0 |
| 🥉 3 | node-fetch     | 17.85K | 11.11 ms | 10.09 ms | 15.75 ms | 25.69 ms |      0 |
| 4    | @hyperttp/core | 11.99K | 16.62 ms | 15.90 ms | 22.11 ms | 30.79 ms |      0 |
| 5    | ky             | 11.04K | 18.05 ms | 18.15 ms | 21.22 ms | 33.33 ms |      0 |
| 6    | hyperttp       |  8.13K | 24.52 ms | 22.90 ms | 26.67 ms | 63.25 ms |      0 |
| 7    | request        |  6.92K | 28.81 ms | 27.79 ms | 30.87 ms | 44.74 ms |      0 |
| 8    | superagent     |  6.63K | 30.14 ms | 29.86 ms | 32.41 ms | 50.59 ms |      0 |
| 9    | got            |  4.41K | 45.14 ms | 43.63 ms | 48.76 ms | 74.62 ms |      0 |
| 10   | axios          |  4.37K | 45.66 ms | 43.70 ms | 49.70 ms | 66.75 ms |      0 |

### Node.js v24.16.0 — UndiciTransport

```
OS:  linux 7.0.10-zen1-1-zen
CPU: Intel(R) Core(TM) i5-8600K CPU @ 3.60GHz
```

| Rank | Client         |    RPS |      Avg |      p50 |      p90 |      p99 | Errors |
| ---- | -------------- | ------ | -------- | -------- | -------- | -------- | ------ |
| 🥇 1 | undici         | 14.59K | 13.64 ms | 13.12 ms | 15.13 ms | 20.54 ms |      0 |
| 🥈 2 | @hyperttp/core | 10.39K | 19.12 ms | 17.36 ms | 22.14 ms | 38.38 ms |      0 |
| 🥉 3 | hyperttp       |  9.82K | 20.17 ms | 18.08 ms | 23.37 ms | 38.70 ms |      0 |
| 4    | bun-fetch      |  7.85K | 25.33 ms | 23.93 ms | 31.33 ms | 38.77 ms |      0 |
| 5    | request        |  6.51K | 30.66 ms | 29.45 ms | 34.83 ms | 38.63 ms |      0 |
| 6    | ky             |  5.72K | 34.74 ms | 31.58 ms | 41.56 ms | 77.74 ms |      0 |
| 7    | axios          |  4.34K | 45.81 ms | 44.26 ms | 50.27 ms | 58.45 ms |      0 |
| 8    | node-fetch     |  4.20K | 47.45 ms | 44.75 ms | 54.64 ms | 71.98 ms |      0 |
| 9    | got            |  4.12K | 48.49 ms | 45.82 ms | 55.69 ms | 70.76 ms |      0 |
| 10   | superagent     |  3.00K | 66.46 ms | 65.06 ms | 72.20 ms | 83.07 ms |      0 |

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
