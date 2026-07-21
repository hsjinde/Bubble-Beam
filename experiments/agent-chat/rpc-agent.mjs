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

/**
 * Resolves once the freshly spawned process responds to a `get_state`
 * command, confirming pi actually started and is accepting RPC commands.
 * Rejects on timeout, which signals a spawn/startup failure (e.g. `pi`
 * missing from PATH, or an invalid --model pattern).
 *
 * @param {ReturnType<typeof spawnAgent>} agent
 * @param {number} timeoutMs
 * @returns {Promise<void>}
 */
export function waitForReady(agent, timeoutMs) {
  return new Promise((resolve, reject) => {
    const requestId = `ready-check-${Date.now()}`;
    const timer = setTimeout(() => {
      reject(new Error(`agent did not respond within ${timeoutMs}ms of spawn`));
    }, timeoutMs);

    agent.onEvent((event) => {
      if (
        event.type === "response" &&
        event.command === "get_state" &&
        event.id === requestId
      ) {
        clearTimeout(timer);
        resolve();
      }
    });

    agent.send({ type: "get_state", id: requestId });
  });
}

/**
 * Resolves when the agent emits `agent_settled` (fully done: no pending
 * retry, compaction retry, or queued follow-up). Rejects if `timeoutMs`
 * elapses, or if either of pi's two observed error-signaling shapes
 * arrives first:
 *   - an error-type `message_update` delta
 *     (`event.assistantMessageEvent?.type === "error"`)
 *   - a `message_start` or `turn_end` event carrying
 *     `event.stopReason === "error"` (with `event.errorMessage` describing
 *     the failure)
 *
 * @param {ReturnType<typeof spawnAgent>} agent
 * @param {number} timeoutMs
 * @returns {Promise<void>}
 */
export function waitForSettled(agent, timeoutMs) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error(`waitForSettled timed out after ${timeoutMs}ms`));
    }, timeoutMs);

    agent.onEvent((event) => {
      if (event.type === "agent_settled") {
        clearTimeout(timer);
        resolve();
        return;
      }
      if (
        event.type === "message_update" &&
        event.assistantMessageEvent?.type === "error"
      ) {
        clearTimeout(timer);
        reject(
          new Error(
            `agent error: ${event.assistantMessageEvent.reason ?? "unknown"}`,
          ),
        );
        return;
      }
      if (
        (event.type === "message_start" || event.type === "turn_end") &&
        event.stopReason === "error"
      ) {
        clearTimeout(timer);
        reject(
          new Error(
            `agent error: ${event.errorMessage ?? "unknown"}`,
          ),
        );
      }
    });
  });
}

/**
 * Fetches the text of the agent's last assistant message.
 *
 * @param {ReturnType<typeof spawnAgent>} agent
 * @returns {Promise<string>}
 */
export function getLastText(agent) {
  return new Promise((resolve) => {
    const requestId = `get-last-text-${Date.now()}`;
    agent.onEvent((event) => {
      if (
        event.type === "response" &&
        event.command === "get_last_assistant_text" &&
        event.id === requestId
      ) {
        resolve(event.data?.text ?? "");
      }
    });
    agent.send({ type: "get_last_assistant_text", id: requestId });
  });
}

// Self-test: run this file directly to smoke-test spawn + prompt + settle
// + fetch-last-text against a real pi process.
if (process.argv[1] && process.argv[1].endsWith("rpc-agent.mjs")) {
  const agent = spawnAgent({
    model: "claude-sonnet-4-5",
    cwd: process.cwd(),
    name: "SelfTest",
  });

  agent.send({ type: "prompt", message: "Say hello in exactly one short sentence." });

  waitForSettled(agent, 60000)
    .then(() => getLastText(agent))
    .then((text) => {
      console.log("last assistant text:", text);
      agent.kill();
      process.exit(0);
    })
    .catch((err) => {
      console.error("self-test failed:", err.message);
      agent.kill();
      process.exit(1);
    });
}
