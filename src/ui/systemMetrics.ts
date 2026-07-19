let lastCpu = process.cpuUsage();
let lastTime = process.hrtime.bigint();

export function getSystemMetrics() {
  const mem = process.memoryUsage();
  const memoryMB = mem.rss / 1024 / 1024;

  const currentTime = process.hrtime.bigint();
  const currentCpu = process.cpuUsage();

  const cpuDiff = {
    user: currentCpu.user - lastCpu.user,
    system: currentCpu.system - lastCpu.system,
  };

  const timeDiffNs = currentTime - lastTime;

  const cpuTimeUs = cpuDiff.user + cpuDiff.system;
  const timeDiffUs = Number(timeDiffNs) / 1000;

  const cpuPercent = timeDiffUs > 0 ? Math.min(100, (cpuTimeUs / timeDiffUs) * 100) : 0;

  lastCpu = currentCpu;
  lastTime = currentTime;

  return {
    memory: memoryMB,
    cpu: cpuPercent,
    heapUsed: mem.heapUsed / 1024 / 1024,
    heapTotal: mem.heapTotal / 1024 / 1024,
    external: mem.external / 1024 / 1024,
    arrayBuffers: mem.arrayBuffers / 1024 / 1024,
  };
}
