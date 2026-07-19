import { BenchResult, ProgressMetrics } from "../core/types.js";
import { c } from "../utils/ui.js";

type PanelType = "rps" | "latency" | "p99" | "errors" | "memory" | "heapUsed" | "external" | "arrayBuffers" | "cpu";

class FastSeries {
  public readonly values: Float64Array;
  public length = 0;
  private cursor = 0;

  constructor(
    public readonly name: string,
    private readonly maxLength = 60,
  ) {
    this.values = new Float64Array(maxLength);
  }

  push(value: number) {
    if (this.length < this.maxLength) {
      this.values[this.length] = value;
      this.length++;
    } else {
      this.values[this.cursor] = value;
      this.cursor = (this.cursor + 1) % this.maxLength;
    }
  }

  forEach(cb: (v: number, i: number) => void) {
    if (this.length < this.maxLength) {
      for (let i = 0; i < this.length; i++) {
        cb(this.values[i], i);
      }
    } else {
      const max = this.maxLength;
      const cur = this.cursor;
      for (let i = 0; i < max; i++) {
        cb(this.values[(cur + i) % max], i);
      }
    }
  }
}

type Panel = {
  type: PanelType;
  title: string;
  series: Map<string, FastSeries>;
};

class ScreenBuffer {
  private last = "";
  private lastLineCount = 0;

  render(frameLines: string[]) {
    const frame = frameLines.join("\x1b[K\n") + "\x1b[K";
    if (frame === this.last) return;

    const newLineCount = frameLines.length;
    let out = "\x1b[H" + frame;

    if (newLineCount < this.lastLineCount) {
      out += "\n\x1b[J";
    }

    process.stdout.write(out);
    this.last = frame;
    this.lastLineCount = newLineCount;
  }

  renderFinal() {
    if (this.last) {
      process.stdout.write(this.last + "\n");
    }
  }
}

class Layout {
  private cachedWidth = process.stdout.columns ?? 120;

  constructor() {
    // Слушаем изменение размера терминала вместо постоянного опроса геттера
    process.stdout.on("resize", () => {
      this.cachedWidth = process.stdout.columns ?? 120;
    });
  }

  width() {
    return this.cachedWidth;
  }

  hr(char = "═") {
    return char.repeat(this.cachedWidth);
  }

  center(t: string) {
    const space = Math.max(0, Math.floor((this.cachedWidth - t.length) / 2));
    return " ".repeat(space) + t;
  }
}

export class GrafanaPro {
  private buffer = new ScreenBuffer();
  private layout = new Layout();

  private title = "TERMINAL GRAFANA PRO";
  private subtitle = "REAL-TIME OBSERVABILITY";
  private progress = "";

  private panels: Record<PanelType, Panel> = {
    rps: { type: "rps", title: "RPS", series: new Map() },
    latency: { type: "latency", title: "AVG LATENCY", series: new Map() },
    p99: { type: "p99", title: "P99 LATENCY", series: new Map() },
    errors: { type: "errors", title: "ERROR RATE", series: new Map() },
    memory: { type: "memory", title: "MEMORY (MB)", series: new Map() },
    heapUsed: { type: "heapUsed", title: "HEAP USED (MB)", series: new Map() },
    external: { type: "external", title: "EXTERNAL (MB)", series: new Map() },
    arrayBuffers: { type: "arrayBuffers", title: "ARRAY BUFFERS (MB)", series: new Map() },
    cpu: { type: "cpu", title: "CPU %", series: new Map() },
  };

  setHeader(t: string, s?: string) {
    this.title = t;
    if (s) this.subtitle = s;
  }

  setProgress(d: number, t: number, cur?: string) {
    this.progress = `${d}/${t}${cur ? ` — ${cur}` : ""}`;
  }

  applyMetric(name: string, m: ProgressMetrics) {
    this.update("rps", name, m.rps);
    this.update("latency", name, m.avg);
    this.update("errors", name, m.errors);
    if (m.memory != null) this.update("memory", name, m.memory);
    if (m.heapUsed != null) this.update("heapUsed", name, m.heapUsed);
    if (m.external != null) this.update("external", name, m.external);
    if (m.arrayBuffers != null) this.update("arrayBuffers", name, m.arrayBuffers);
    if (m.cpu != null) this.update("cpu", name, m.cpu);
  }

  resetSeries(name: string) {
    for (const panel of Object.values(this.panels)) {
      panel.series.delete(name);
    }
  }

  applyResult(result: BenchResult) {
    this.update("rps", result.name, result.rps);
    this.update("latency", result.name, result.avg);
    if (result.p99 != null) this.update("p99", result.name, result.p99);
    this.update("errors", result.name, result.errors);
  }

  private update(type: PanelType, name: string, value: number) {
    if (value === undefined || value === null || Number.isNaN(value)) return;

    const panel = this.panels[type];
    if (!panel) return;

    let s = panel.series.get(name);
    if (!s) {
      s = new FastSeries(name, 60);
      panel.series.set(name, s);
    }

    s.push(value);
  }

  render() {
    const bars = " ▂▃▄▅▆▇█";
    const WINDOW = 60;

    const out: string[] = [
      c(this.layout.center(this.title), "bold"),
      c(this.layout.center(this.subtitle), "cyan"),
      this.layout.hr("═"),
      c(this.layout.center(this.progress), "dim"),
      this.layout.hr("═"),
    ];

    for (const panel of Object.values(this.panels)) {
      if (panel.series.size === 0) continue;

      out.push("", c(`● ${panel.title}`, "yellow"));

      const sortedSeries = [...panel.series.values()].sort((a, b) => a.name.localeCompare(b.name));

      const maxNameLen = Math.max(...sortedSeries.map((s) => s.name.length), 16);

      for (const s of sortedSeries) {
        if (s.length === 0) continue;

        let min = Infinity;
        let max = -Infinity;
        let lastVal = 0;

        s.forEach((v) => {
          if (v < min) min = v;
          if (v > max) max = v;
          lastVal = v;
        });

        let spark = "";
        s.forEach((v) => {
          const n = max === min ? 0 : (v - min) / (max - min);
          spark += bars[Math.floor(n * (bars.length - 1))];
        });

        if (spark.length < WINDOW) {
          spark = spark.padEnd(WINDOW, " ");
        }

        const lastStr = Number.isFinite(lastVal) ? lastVal.toFixed(1) : "?";
        const line = `${s.name.padEnd(maxNameLen + 2)} ${spark}  ${c(lastStr, "bold")}`;
        out.push(line);
      }
    }

    this.buffer.render(out);
  }

  renderFinal() {
    this.buffer.renderFinal();
  }
}
