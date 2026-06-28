export class EventLoopLagMonitor {
  private interval: NodeJS.Timeout | null = null;

  private lastCheck = 0;
  private lagSum = 0;
  private samples = 0;

  private readonly resolution: number;

  constructor(resolution = 10) {
    // 10ms — баланс точности и overhead
    this.resolution = resolution;
  }

  start() {
    this.lastCheck = performance.now();

    this.interval = setInterval(() => {
      const now = performance.now();
      const lag = now - this.lastCheck - this.resolution;

      this.lastCheck = now;

      if (lag > 0) {
        this.lagSum += lag;
        this.samples++;
      }
    }, this.resolution);

    // важно: не держать event loop alive лишними ref
    this.interval.unref?.();
  }

  stop() {
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = null;
    }
  }

  get() {
    if (this.samples === 0) return 0;
    return this.lagSum / this.samples;
  }

  reset() {
    this.lagSum = 0;
    this.samples = 0;
    this.lastCheck = performance.now();
  }
}
