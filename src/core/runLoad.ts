export async function runLoad(
  concurrency: number,
  total: number,
  task: (index: number) => Promise<void> | void,
): Promise<void> {
  let next = 0;
  const workers = Array.from({ length: concurrency }, async () => {
    while (true) {
      const index = next++;
      if (index >= total) break;
      await task(index);
    }
  });
  await Promise.all(workers);
}
