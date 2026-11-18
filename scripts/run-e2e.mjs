// Every run owns a temporary replica set. Never reads or modifies an Atlas database.
import { MongoMemoryReplSet } from "mongodb-memory-server";
import { spawn } from "node:child_process";
import { randomBytes } from "node:crypto";
import { setTimeout } from "node:timers/promises";
import { access, rm } from "node:fs/promises";
import { availableTestPort, monitorTestServer } from "./e2e-server.mjs";

// Dev and build share generated types. Do not disturb a developer's running server.
let devLocked = false;
try {
  await access(".next/dev/lock");
  devLocked = true;
} catch {}
if (devLocked)
  throw new Error(
    "Stop the existing Next.js dev server before running browser tests.",
  );
// A fresh dev cache avoids reload loops after switching from a production build.
await rm(".next/dev", { recursive: true, force: true });

const replica = await MongoMemoryReplSet.create({
  replSet: { count: 1 },
  binary: {
    systemBinary: process.env.MONGOMS_SYSTEM_BINARY,
    version: process.env.MONGOMS_VERSION || "7.0.24",
  },
});
const port = await availableTestPort();
const baseURL = `http://127.0.0.1:${port}`;
const env = {
  ...process.env,
  MONGODB_URI: replica.getUri("browser_test"),
  AUTH_SECRET: randomBytes(32).toString("hex"),
  APP_URL: baseURL,
  E2E_BASE_URL: baseURL,
  RESEND_API_KEY: "test-no-real-emails",
  EMAIL_FROM: "test@example.com",
};
// Use a local development server; production cookie flags are checked separately.
const server = spawn(
  process.execPath,
  [
    "node_modules/next/dist/bin/next",
    "dev",
    "--hostname",
    "127.0.0.1",
    "--port",
    String(port),
  ],
  { env, stdio: ["ignore", "pipe", "pipe"] },
);
const monitor = monitorTestServer(server);
let tests;
let shuttingDown = false;
async function cleanup() {
  if (shuttingDown) return;
  shuttingDown = true;
  if (tests && tests.exitCode === null) tests.kill("SIGTERM");
  if (server.exitCode === null) {
    const closed = new Promise((resolve) => server.once("close", resolve));
    server.kill("SIGTERM");
    await Promise.race([closed, setTimeout(5000)]);
    if (server.exitCode === null) server.kill("SIGKILL");
  }
  await replica.stop();
}
process.once("SIGINT", async () => {
  await cleanup();
  process.exit(130);
});
process.once("SIGTERM", async () => {
  await cleanup();
  process.exit(143);
});
try {
  await monitor.waitUntilReady(baseURL);
  tests = spawn(
    process.execPath,
    ["node_modules/@playwright/test/cli.js", "test"],
    { env, stdio: "inherit" },
  );
  // Stop the browser worker immediately if its server exits during the suite.
  const stopTests = () => tests.kill("SIGTERM");
  server.once("exit", stopTests);
  try {
    monitor.assertRunning();
    process.exitCode = await new Promise((resolve, reject) => {
      tests.once("error", reject);
      tests.once("exit", (code) => resolve(code ?? 1));
    });
    monitor.assertRunning();
  } finally {
    server.removeListener("exit", stopTests);
  }
} finally {
  await cleanup();
}
