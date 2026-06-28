import { HyperCore } from "@hyperttp/core";
import type { BenchResult } from "../core/types.js";
import os from "os";

const isBun = typeof Bun !== "undefined";
const runtimeName = isBun ? "Bun" : "Node.js";
const runtimeVersion = isBun ? Bun.version : process.version;

function formatRps(rps: number): string {
  return rps >= 1000 ? (rps / 1000).toFixed(2) + "K" : rps.toFixed(2);
}

function formatMs(ms: number | undefined | null): string {
  if (ms === undefined || ms === null || Number.isNaN(ms)) return "0.00 ms";
  return `${ms.toFixed(2)} ms`;
}

function padRight(str: string, len: number) {
  return String(str).padEnd(len, " ");
}

function padLeft(str: string, len: number) {
  return String(str).padStart(len, " ");
}

function getEnvTitle() {
  return `${runtimeName} ${runtimeVersion}`;
}

function getEnvInfo() {
  return {
    os: `${os.platform()} ${os.release()}`,
    cpu: os.cpus()?.[0]?.model ?? "unknown",
  };
}

export async function printMarkdownTable(results: BenchResult[]) {
  const sorted = [...results].sort((a, b) => b.rps - a.rps);

  const core = new HyperCore();

  const env = getEnvInfo();
  const title = getEnvTitle();

  const medals = ["🥇", "🥈", "🥉"];

  const rows = sorted.map((r, i) => ({
    rank: i < 3 ? `${medals[i]} ${i + 1}` : String(i + 1),
    client: r.name,
    rps: formatRps(r.rps),
    avg: formatMs(r.avg),
    p50: formatMs(r.p50),
    p90: formatMs(r.p90),
    p99: formatMs(r.p99),
    errors: String(r.errors),
  }));

  const cols = {
    rank: Math.max(4, ...rows.map((r) => r.rank.length)),
    client: Math.max(6, ...rows.map((r) => r.client.length)),
    rps: Math.max(3, ...rows.map((r) => r.rps.length)),
    avg: Math.max(3, ...rows.map((r) => r.avg.length)),
    p50: Math.max(3, ...rows.map((r) => r.p50.length)),
    p90: Math.max(3, ...rows.map((r) => r.p90.length)),
    p99: Math.max(3, ...rows.map((r) => r.p99.length)),
    errors: Math.max(6, ...rows.map((r) => r.errors.length)),
  };

  const header =
    `| ${padRight("Rank", cols.rank)} ` +
    `| ${padRight("Client", cols.client)} ` +
    `| ${padLeft("RPS", cols.rps)} ` +
    `| ${padLeft("Avg", cols.avg)} ` +
    `| ${padLeft("p50", cols.p50)} ` +
    `| ${padLeft("p90", cols.p90)} ` +
    `| ${padLeft("p99", cols.p99)} ` +
    `| ${padLeft("Errors", cols.errors)} |`;

  const align =
    `| ${"-".repeat(cols.rank)} ` +
    `| ${"-".repeat(cols.client)} ` +
    `| ${"-".repeat(cols.rps)} ` +
    `| ${"-".repeat(cols.avg)} ` +
    `| ${"-".repeat(cols.p50)} ` +
    `| ${"-".repeat(cols.p90)} ` +
    `| ${"-".repeat(cols.p99)} ` +
    `| ${"-".repeat(cols.errors)} |`;

  const body = rows.map((r) => {
    return (
      `| ${padRight(r.rank, cols.rank)} ` +
      `| ${padRight(r.client, cols.client)} ` +
      `| ${padLeft(r.rps, cols.rps)} ` +
      `| ${padLeft(r.avg, cols.avg)} ` +
      `| ${padLeft(r.p50, cols.p50)} ` +
      `| ${padLeft(r.p90, cols.p90)} ` +
      `| ${padLeft(r.p99, cols.p99)} ` +
      `| ${padLeft(r.errors, cols.errors)} |`
    );
  });

  const table = [
    "",
    `# 🟦 ${title} — ${await core.getTransportName()}`,
    "",
    "## Environment",
    "",
    `- **OS:** ${env.os}`,
    `- **CPU:** ${env.cpu}`,
    "",
    "```",
    "Benchmark results",
    "```",
    "",
    header,
    align,
    ...body,
    "",
  ].join("\n");

  console.log(table);
}
