import { spawn } from "node:child_process";
import { StringDecoder } from "node:string_decoder";

/**
 * Spawns a `pi --mode rpc` child process and wires up JSONL framing on
 * stdout, following pi's documented framing rules: split on "\n" only,
 * strip a trailing "\r", never use a Unicode-aware line reader.
 *
 * @param {{ model: string, cwd: string, name: string }} options
 * @returns {{
 *   send(cmd: object): void,
 *   onEvent(cb: (event: object) => void): void,
 *   kill(): void,
 *   proc: import("node:child_process").ChildProcess,
 * }}
 */
export function spawnAgent({ model, cwd, name }) {
  const proc = spawn(
    "pi",
    ["--mode", "rpc", "--model", model, "--name", name],
    { cwd, stdio: ["pipe", "pipe", "inherit"], shell: true },
  );

  const listeners = [];
  const decoder = new StringDecoder("utf8");
  let buffer = "";
  let exited = false;

  proc.stdout.on("data", (chunk) => {
    buffer += decoder.write(chunk);
    while (true) {
      const newlineIndex = buffer.indexOf("\n");
      if (newlineIndex === -1) break;
      let line = buffer.slice(0, newlineIndex);
      buffer = buffer.slice(newlineIndex + 1);
      if (line.endsWith("\r")) line = line.slice(0, -1);
      if (!line.trim()) continue;
      const event = JSON.parse(line);
      for (const cb of listeners) cb(event);
    }
  });

  proc.on("error", (err) => {
    console.error(`[${name}] process error:`, err);
  });

  proc.on("exit", (code, signal) => {
    exited = true;
  });

  proc.stdin.on("error", (err) => {
    console.error(`[${name}] stdin error:`, err);
  });

  return {
    proc,
    send(cmd) {
      if (exited) {
        console.error(`[${name}] send() called after process exit; dropping command`);
        return;
      }
      proc.stdin.write(JSON.stringify(cmd) + "\n");
    },
    onEvent(cb) {
      listeners.push(cb);
    },
    kill() {
      proc.kill();
    },
  };
}

// Self-test: run this file directly to smoke-test that pi spawns and
// responds to a basic RPC command.
if (process.argv[1] && process.argv[1].endsWith("rpc-agent.mjs")) {
  const agent = spawnAgent({
    model: "claude-sonnet-4-5",
    cwd: process.cwd(),
    name: "SelfTest",
  });

  agent.onEvent((event) => {
    if (event.type === "response" && event.command === "get_state") {
      console.log("get_state response:", JSON.stringify(event.data));
      agent.kill();
      process.exit(0);
    }
  });

  setTimeout(() => {
    agent.send({ type: "get_state", id: "self-test-1" });
  }, 500);

  setTimeout(() => {
    console.error("self-test timed out waiting for get_state response");
    agent.kill();
    process.exit(1);
  }, 10000);
}
