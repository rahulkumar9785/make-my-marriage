// Every run owns a temporary replica set. Never reads or modifies an Atlas database.
import { MongoMemoryReplSet } from "mongodb-memory-server";
import { spawn } from "node:child_process";
import { randomBytes } from "node:crypto";
import { setTimeout } from "node:timers/promises";
import { access, rm } from "node:fs/promises";

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
const baseURL = "http://127.0.0.1:3210";
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
    "3210",
  ],
  { env, stdio: ["ignore", "pipe", "pipe"] },
);
let serverFailure = "";
server.stderr.on("data", (data) => {
  serverFailure = (serverFailure + data).slice(-4000);
});
server.stdout.on("data", () => {});
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
  let ready = false;
  for (let attempt = 0; attempt < 120; attempt++) {
    if (server.exitCode !== null)
      throw new Error(`Test server stopped: ${serverFailure}`);
    try {
      const response = await fetch(`${baseURL}/api/health`, {
        signal: AbortSignal.timeout(1000),
      });
      if (response.ok) {
        ready = true;
        break;
      }
    } catch {}
    await setTimeout(250);
  }
  if (!ready)
    throw new Error(`Test server did not become ready: ${serverFailure}`);
  tests = spawn(
    process.execPath,
    ["node_modules/@playwright/test/cli.js", "test"],
    { env, stdio: "inherit" },
  );
  process.exitCode = await new Promise((resolve) =>
    tests.once("exit", (code) => resolve(code ?? 1)),
  );
} finally {
  await cleanup();
}
