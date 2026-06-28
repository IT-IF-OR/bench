import * as http from "node:http";
import type { Server as BunServer } from "bun";

// Совместимый тип для обоих рантаймов
export type BenchServer = BunServer<any> | http.Server;

const OK = Buffer.from('{"ok":true}');
const FAIL = Buffer.from('{"error":"fail"}');
const JSON_HDR = { "Content-Type": "application/json" };

export async function startServer(port = 3000): Promise<BenchServer> {
  // Проверяем, запущено ли окружение под Bun
  if (typeof Bun !== "undefined") {
    return Bun.serve({
      port,
      development: false,
      fetch(req) {
        const urlStr = req.url;
        const thirdSlashIdx = urlStr.indexOf("/", 7);
        const path = thirdSlashIdx === -1 ? "/" : urlStr.substring(thirdSlashIdx);

        if (path === "/" || path === "/json") {
          return new Response(OK, { status: 200, headers: JSON_HDR });
        }
        if (path === "/fail") {
          return new Response(FAIL, { status: 500, headers: JSON_HDR });
        }
        return new Response(OK, { status: 200, headers: JSON_HDR });
      },
    });
  }

  // Фолбэк для Node.js (npx tsx)
  const server = http.createServer((req, res) => {
    const url = req.url;

    if (url === "/" || url === "/json") {
      res.writeHead(200, JSON_HDR);
      res.end(OK);
      return;
    }

    if (url === "/fail") {
      res.writeHead(500, JSON_HDR);
      res.end(FAIL);
      return;
    }

    res.writeHead(200, JSON_HDR);
    res.end(OK);
  });

  server.keepAliveTimeout = 60_000;
  server.headersTimeout = 61_000;

  await new Promise<void>((r) => server.listen(port, r));
  return server;
}

export async function stopServer(server: BenchServer) {
  // Проверяем метод остановки, специфичный для Bun.serve
  if (server && "stop" in server && typeof server.stop === "function") {
    server.stop(true);
  } else if (server && "close" in server && typeof server.close === "function") {
    // Метод остановки для node:http
    await new Promise<void>((r) => server.close(() => r()));
  }
}
