import { createServer } from "node:net";
import { setTimeout } from "node:timers/promises";

export async function availableTestPort() {
  // Let the OS select a free loopback port; never assume a fixed port is ours.
  const reservation = createServer();
  await new Promise((resolve, reject) => {
    reservation.once("error", reject);
    reservation.listen(0, "127.0.0.1", resolve);
  });
  const { port } = reservation.address();
  await new Promise((resolve, reject) =>
    reservation.close((error) => (error ? reject(error) : resolve())),
  );
  return port;
}

export function monitorTestServer(server) {
  let output = "";
  let errors = "";
  let ready = false;
  let failure;
  // Next emits "Ready in" from its listening callback. Only trust output from
  // this child, never a successful health response from an arbitrary listener.
  server.stdout.on("data", (data) => {
    output = (output + data).slice(-8000);
    ready ||= /Ready in\s/.test(output);
  });
  server.stderr.on("data", (data) => {
    errors = (errors + data).slice(-4000);
  });
  server.on("error", () => {
    failure = new Error("Could not start the browser test server.");
  });
  server.on("exit", (code, signal) => {
    failure = new Error(
      `Browser test server exited (${signal || code}). ${errors}`,
    );
  });
  function assertRunning() {
    if (failure) throw failure;
    if (server.exitCode !== null || server.signalCode !== null)
      throw new Error("Browser test server stopped.");
  }
  return {
    assertRunning,
    async waitUntilReady(baseURL, timeoutMs = 30000) {
      const deadline = Date.now() + timeoutMs;
      while (Date.now() < deadline) {
        assertRunning();
        if (ready) {
          let response;
          try {
            response = await fetch(`${baseURL}/api/health`, {
              signal: AbortSignal.timeout(
                Math.min(1000, Math.max(1, deadline - Date.now())),
              ),
            });
          } catch {}
          // The port can become available between allocation and spawn. If
          // another process takes it, our child's bind failure must abort tests.
          assertRunning();
          if (response?.ok) return;
        }
        await setTimeout(50);
      }
      throw new Error(`Browser test server did not become ready. ${errors}`);
    },
  };
}
