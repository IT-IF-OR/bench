import { computeStats } from "./computeStats.js";
import { runLoad } from "./runLoad.js";
import type { BenchResult, ProgressCallback } from "./types.js";

let firstErrorLogged = false;

export async function runBenchmark<TClient, TRes>(opts: {
  name: string;
  tool: BenchResult["tool"];
  client: TClient;
  request: (client: TClient, url: string) => Promise<TRes>;
  consume?: (res: TRes) => Promise<void>;
  concurrency: number;
  requests: number;
  baseUrl: string;
  endpoint: string;
  onProgress?: ProgressCallback;
  getMetrics?: () => any;
}): Promise<BenchResult> {
  const start = performance.now();
  let completed = 0;
  let errors = 0;
  const samples: number[] = [];
  const url = `${opts.baseUrl}${opts.endpoint}`;

  const reportEvery = 200;
  let lastReport = start;

  // Сбрасываем флаг ошибки для каждого нового ранера
  firstErrorLogged = false;

  await runLoad(opts.concurrency, opts.requests, async () => {
    const t0 = performance.now();
    try {
      const res = await opts.request(opts.client, url);
      await opts.consume?.(res);
      samples.push(performance.now() - t0);
      completed++;
    } catch (err: any) {
      errors++;

      // ПЕРЕХВАТ ПЕРВОЙ ОШИБКИ И ВЫВОД В КОНСОЛЬ
      if (!firstErrorLogged) {
        firstErrorLogged = true;

        // Отключаем TUI буфер, если он вдруг активен, чтобы увидеть чистый трейс
        process.stdout.write("\x1b[?1049l\x1b[?25h");

        console.error(`\n\n🚨 [FIRST CRITICAL ERROR CAPTURED FOR ${opts.name}] 🚨`);
        console.error("Message:", err?.message || err);
        if (err?.stack) {
          console.error("Stack Trace:\n", err.stack);
        }
        console.error("────────────────────────────────────────────────────────\n");
      }
    }

    const now = performance.now();
    if (now - lastReport > reportEvery) {
      const elapsed = (now - start) / 1000;
      opts.onProgress?.({
        rps: completed / elapsed,
        avg: samples.reduce((a, b) => a + b, 0) / (samples.length || 1),
        errors,
        completed,
        ...opts.getMetrics?.(),
      });
      lastReport = now;
    }
  });

  const durationMs = performance.now() - start;
  const stats = computeStats(samples);

  return {
    tool: opts.tool,
    name: opts.name,
    rps: completed / (durationMs / 1000),
    ...stats,
    errors,
    durationMs,
  };
}
