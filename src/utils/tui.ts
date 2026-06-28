import type { BenchResult } from "../core/types.js";
import { c } from "./ui.js";

type TuiState = {
  title?: string;
  runtime?: string;
  progress?: string;
  results: BenchResult[];
  footer?: string[];
};

export class BenchmarkTui {
  private state: TuiState = { results: [] };
  private lastFrame = "";

  setHeader(title: string, runtime: string, progress?: string) {
    this.state.title = title;
    this.state.runtime = runtime;
    this.state.progress = progress;
  }

  setResults(results: BenchResult[]) {
    this.state.results = results;
  }

  setFooter(lines: string[]) {
    this.state.footer = lines;
  }

  render() {
    const frame = this.buildFrame();

    if (frame === this.lastFrame) return;

    process.stdout.write("\x1b[2J\x1b[H"); // clear screen
    process.stdout.write(frame);

    this.lastFrame = frame;
  }

  private width(): number {
    return process.stdout.columns ?? 92;
  }

  private hr(char = "─"): string {
    return char.repeat(this.width());
  }

  private center(text: string): string {
    const w = this.width();
    const pad = Math.max(0, Math.floor((w - text.length) / 2));
    return " ".repeat(pad) + text;
  }

  private buildHeader(): string {
    const { title, runtime, progress } = this.state;

    const lines: string[] = [];

    if (title) lines.push(c(this.center(title), "bold"));
    if (runtime) lines.push(c(this.center(runtime), "cyan"));
    if (progress) lines.push(c(this.center(progress), "dim"));

    lines.push(this.hr("═"));

    return lines.join("\n");
  }

  private buildTable(): string {
    const results = [...this.state.results].sort((a, b) => b.rps - a.rps);

    const col = {
      name: 18,
      rps: 12,
      avg: 10,
      p99: 10,
      err: 6,
    };

    const header =
      c("Name".padEnd(col.name), "cyan") +
      c("RPS".padStart(col.rps), "cyan") +
      c("Avg".padStart(col.avg), "cyan") +
      c("P99".padStart(col.p99), "cyan") +
      c("Err".padStart(col.err), "cyan");

    const rows = results.map((r) => {
      return (
        r.name.padEnd(col.name) +
        r.rps.toFixed(2).padStart(col.rps) +
        r.avg.toFixed(2).padStart(col.avg) +
        r.p99.toFixed(2).padStart(col.p99) +
        String(r.errors).padStart(col.err)
      );
    });

    return [header, this.hr(), ...rows].join("\n");
  }

  private buildFooter(): string {
    const lines = this.state.footer ?? [];
    if (!lines.length) return "";

    return "\n" + this.hr("─") + "\n" + lines.map((l) => c(l, "gray")).join("\n");
  }

  private buildFrame(): string {
    return [this.buildHeader(), this.buildTable(), this.buildFooter()].filter(Boolean).join("\n");
  }
}
