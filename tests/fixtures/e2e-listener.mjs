import { createServer } from "node:http";
const server = createServer((_request, response) => {
  response.writeHead(200, { "Content-Type": "application/json" });
  response.end('{"data":{"status":"ok"}}');
});
server.on("error", (error) => {
  console.error(error.code);
  process.exit(1);
});
server.listen(Number(process.argv[2]), "127.0.0.1", () => {
  // Same readiness marker as the pinned Next.js CLI, emitted only after bind.
  process.stdout.write("Ready in 1ms\n");
});
