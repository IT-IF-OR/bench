import { runSuite } from "./src/core/runSuite.js";
import type { BenchContext, BenchResult } from "./src/core/types.js";
import { startServer, stopServer } from "./src/utils/server.js";
import { bunFetchRunner } from "./src/runners/bun.js";
import { undiciRunner } from "./src/runners/undici.js";
import { hyperttpRunner } from "./src/runners/hyperttp.js";
import { hyperttpCoreRunner } from "./src/runners/hyperttpCore.js";
import {
  GrafanaController,
  NoopGrafanaController,
} from "./src/tui/grafanaController.js";
import { printMarkdownTable } from "./src/ui/printMarkdownTable.js";
import { axiosRunner } from "./src/runners/axios.js";
import { gotRunner } from "./src/runners/got.js";
import { kyRunner } from "./src/runners/ky.js";
import { nodeFetchRunner } from "./src/runners/nodeFetch.js";
import { superagentRunner } from "./src/runners/superagent.js";
import { requestRunner } from "./src/runners/request.js";
import { HyperCore } from "@hyperttp/core";

const isBun = typeof Bun !== "undefined";
const runtimeName = isBun ? "Bun" : "Node.js";
const runtimeVersion = isBun ? Bun.version : process.version;

async function main() {
  const allRunners = [
    bunFetchRunner,
    undiciRunner,
    hyperttpCoreRunner,
    hyperttpRunner,
    axiosRunner,
    gotRunner,
    kyRunner,
    nodeFetchRunner,
    superagentRunner,
    requestRunner,
  ];

  if (process.env.IS_CHILD === "true") {
    const targetName = process.env.RUNNER_NAME;
    const runner = allRunners.find((r) => r.name === targetName);

    if (!runner) {
      console.error(`[Worker] Не удалось найти раннер с именем: "${targetName}"`);
      process.exit(1);
    }

    const ctx: BenchContext = {
      baseUrl: process.env.BENCH_URL ?? "http://127.0.0.1:3001",
      endpoint: "/json",
      requests: 200_000,
      concurrency: 1000,
      durationMs: 120_000,
    };

    if (!isBun) {
      const { Agent, setGlobalDispatcher } = await import("undici");
      setGlobalDispatcher(
        new Agent({
          connections: ctx.concurrency,
          pipelining: 1,
          keepAliveTimeout: 60_000,
        }),
      );
    }

    await runSuite(ctx, [runner]);
    return;
  }

  const ctx: BenchContext = {
    baseUrl: process.env.BENCH_URL ?? "http://127.0.0.1:3001",
    endpoint: "/json",
    requests: 20_000,
    concurrency: 100,
    durationMs: 60_000,
  };

  if (!isBun) {
    const { Agent, setGlobalDispatcher } = await import("undici");
    setGlobalDispatcher(
      new Agent({
        connections: ctx.concurrency,
        pipelining: 1,
        keepAliveTimeout: ctx.durationMs,
      }),
    );
  }

  const tui: GrafanaController | NoopGrafanaController = new GrafanaController();
  // const tui = new NoopGrafanaController();

  const server = await startServer(3001);
  const core = new HyperCore();

  const runners = [
    bunFetchRunner,
    undiciRunner,
    hyperttpCoreRunner,
    hyperttpRunner,
    axiosRunner,
    gotRunner,
    kyRunner,
    nodeFetchRunner,
    superagentRunner,
    requestRunner,
  ];

  try {
    tui.setHeader(
      `${await core.getTransportName()}`,
      `${runtimeName} ${runtimeVersion}`,
    );
    tui.setProgress(0, runners.length, "INIT");
    tui.render();

    const results: BenchResult[] = [];

    for (let i = 0; i < runners.length; i++) {
      const runner = runners[i];
      tui.resetSeries(runner.name);
      tui.setProgress(i, runners.length, runner.name);

      if (tui instanceof NoopGrafanaController) {
        console.log(`\n🚀 Starting benchmark for: ${runner.name}...`);
      }

      process.env.RUNNER_NAME = runner.name;

      const [result] = await runSuite(ctx, [runner], (r, m) => {
        tui.pushMetric(r.name, m);
        if (tui instanceof NoopGrafanaController && m.errors > 0) {
          console.warn(
            `[${r.name}] Errors detected: ${m.errors} (RPS: ${m.rps.toFixed(1)})`,
          );
        }
      });

      results.push(result);
      tui.pushResult(result);

      const currentBest = results.reduce((a, b) => (b.rps > a.rps ? b : a));
      tui.setProgress(
        i + 1,
        runners.length,
        `Top: ${currentBest.name} ~${Math.round(currentBest.rps)} RPS`,
      );
      tui.render();
    }

    const best = results.reduce((a, b) => (b.rps > a.rps ? b : a));

    const validP99s = results
      .map((r) => r.p99)
      .filter((p) => p !== undefined && p !== null && !Number.isNaN(p));
    const worstP99 = validP99s.length > 0 ? Math.max(...validP99s) : 0;

    tui.setProgress(runners.length, runners.length, "DONE");
    tui.render();
    tui.dispose();

    console.log("\n");
    await printMarkdownTable(results);

    console.log("\n🏆 Winner:", best.name);
    console.log("⚡ Peak RPS:", Math.round(best.rps));
    console.log("📉 Worst P99:", worstP99 > 0 ? worstP99.toFixed(2) : "N/A");
    console.log("\n");
  } catch (error) {
    tui.dispose();
    console.error("Benchmark failed:", error);
  } finally {
    await stopServer(server);
  }
}

void main();
