export async function consumeResponseBody(response: unknown): Promise<void> {
  if (!response || typeof response !== "object") return;

  const res = response as any;

  if (typeof res.arrayBuffer === "function") {
    await res.arrayBuffer();
    return;
  }

  if (typeof res.text === "function") {
    await res.text();
    return;
  }

  const body = res.body;
  if (body && typeof body === "object") {
    if (typeof body.arrayBuffer === "function") {
      await body.arrayBuffer();
      return;
    }
    if (typeof body.text === "function") {
      await body.text();
      return;
    }
    if (typeof body.cancel === "function") {
      await body.cancel();
      return;
    }
  }
}
