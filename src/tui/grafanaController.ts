import type { BenchResult, ProgressMetrics } from "../core/types.js";
import { GrafanaPro } from "./grafanaPro.js";

export class NoopGrafanaController {
  setHeader() {}
  setProgress() {}
  render() {}
  pushMetric() {}
  pushResult() {}
  dispose() {}
}

export class GrafanaController {
  private engine = new GrafanaPro();
  private queue: (() => void)[] = [];
  private timer: ReturnType<typeof setInterval>;
  private isDisposed = false;

  constructor() {
    process.stdout.write("\x1b[?1049h\x1b[?25l");

    this.timer = setInterval(() => {
      const len = this.queue.length;
      if (len === 0) return;

      for (let i = 0; i < len; i++) {
        this.queue[i]();
      }
      this.queue.length = 0;

      this.engine.render();
    }, 33);

    this.timer.unref?.();

    this.dispose = this.dispose.bind(this);
    process.once("exit", this.dispose);
    process.once("SIGINT", () => {
      this.dispose();
      process.exit(0);
    });
  }

  dispose() {
    if (this.isDisposed) return;
    this.isDisposed = true;

    clearInterval(this.timer);
    process.stdout.write("\x1b[?1049l\x1b[?25h");
    this.engine.renderFinal();

    process.off("exit", this.dispose);
  }

  pushMetric(name: string, m: ProgressMetrics) {
    this.queue.push(() => this.engine.applyMetric(name, m));
  }

  pushResult(result: BenchResult) {
    this.queue.push(() => this.engine.applyResult(result));
  }

  setHeader(t: string, s?: string) {
    this.engine.setHeader(t, s);
  }

  setProgress(d: number, t: number, cur?: string) {
    this.engine.setProgress(d, t, cur);
  }

  render() {
    this.engine.render();
  }
}
