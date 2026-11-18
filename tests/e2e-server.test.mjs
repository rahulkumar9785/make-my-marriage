import { afterEach, describe, expect, it } from "vitest";
import { createServer } from "node:http";
import { spawn } from "node:child_process";
import { once } from "node:events";
import { fileURLToPath } from "node:url";
import {
  availableTestPort,
  monitorTestServer,
} from "../scripts/e2e-server.mjs";

const servers = [];
const children = [];
async function listener() {
  let requests = 0;
  const server = createServer((_req, res) => {
    requests++;
    res.writeHead(200);
    res.end("ok");
  });
  servers.push(server);
  server.listen(0, "127.0.0.1");
  await once(server, "listening");
  const port = server.address().port;
  return { port, url: `http://127.0.0.1:${port}`, requests: () => requests };
}
function child(args) {
  const process = spawn(globalThis.process.execPath, args, {
    stdio: ["ignore", "pipe", "pipe"],
  });
  children.push(process);
  return process;
}
const fixture = fileURLToPath(
  new URL("./fixtures/e2e-listener.mjs", import.meta.url),
);
afterEach(async () => {
  await Promise.all(
    children.splice(0).map(async (process) => {
      if (process.exitCode === null && process.signalCode === null) {
        const closed = once(process, "close");
        process.kill("SIGTERM");
        await closed;
      }
    }),
  );
  await Promise.all(
    servers.splice(0).map(
      (server) =>
        new Promise((resolve, reject) => {
          server.close((error) => (error ? reject(error) : resolve()));
          server.closeAllConnections();
        }),
    ),
  );
});

describe("browser test server ownership", () => {
  it("allocates a loopback port without reusing an occupied port", async () => {
    const occupied = await listener();
    const port = await availableTestPort();
    expect(port).toBeGreaterThan(0);
    expect(port).not.toBe(occupied.port);
  });
  it("never probes an existing healthy service when its child cannot bind", async () => {
    const occupied = await listener();
    const server = child([fixture, String(occupied.port)]);
    const monitor = monitorTestServer(server);
    await expect(monitor.waitUntilReady(occupied.url, 5000)).rejects.toThrow(
      /exited.*EADDRINUSE/s,
    );
    expect(occupied.requests()).toBe(0);
  });
  it("does not accept a healthy service without readiness from its own child", async () => {
    const occupied = await listener();
    const server = child(["-e", "setInterval(() => {}, 1000)"]);
    const monitor = monitorTestServer(server);
    await expect(monitor.waitUntilReady(occupied.url, 250)).rejects.toThrow(
      "did not become ready",
    );
    expect(occupied.requests()).toBe(0);
  });
  it("accepts its own ready server and detects exit after readiness", async () => {
    const port = await availableTestPort();
    const server = child([fixture, String(port)]);
    const monitor = monitorTestServer(server);
    await monitor.waitUntilReady(`http://127.0.0.1:${port}`, 5000);
    expect(() => monitor.assertRunning()).not.toThrow();
    const exited = once(server, "exit");
    server.kill("SIGTERM");
    await exited;
    expect(() => monitor.assertRunning()).toThrow("exited");
  });
});
