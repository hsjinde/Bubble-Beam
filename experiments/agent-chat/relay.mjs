import { execSync } from "node:child_process";
import { mkdirSync, appendFileSync } from "node:fs";
import { join } from "node:path";
import { spawnAgent, waitForReady, waitForSettled, getLastText } from "./rpc-agent.mjs";
import {
  AGENT_A,
  AGENT_B,
  CWD,
  MAX_TURNS,
  TURN_TIMEOUT_MS,
  OPENING_PROMPT,
} from "./config.mjs";

const SPAWN_TIMEOUT_MS = 3000;

function checkGitClean(cwd) {
  const forceFlag = process.argv.includes("--force");
  const status = execSync("git status --short", { cwd }).toString().trim();
  if (status && !forceFlag) {
    console.error(
      "[safety] git status is not clean in " +
        cwd +
        ":\n" +
        status +
        "\n\nCommit or stash your changes first, or re-run with --force to proceed anyway " +
        "(both agents have full write access and may modify files).",
    );
    process.exit(1);
  }
  if (status && forceFlag) {
    console.log("[safety] git status dirty, continuing due to --force");
  } else {
    console.log("[safety] git status clean, proceeding");
  }
}

function openLog() {
  const logsDir = join(process.cwd(), "logs");
  mkdirSync(logsDir, { recursive: true });
  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  const logPath = join(logsDir, `${stamp}.jsonl`);
  return {
    path: logPath,
    write(entry) {
      appendFileSync(logPath, JSON.stringify(entry) + "\n");
    },
  };
}

async function runTurn(turnNumber, speakerLabel, speaker, listenerLabel, message, log) {
  console.log(`[turn ${turnNumber}] -> ${speakerLabel}: ${message}`);
  log.write({ turn: turnNumber, direction: "prompt", to: speakerLabel, message });

  speaker.onEvent((event) => {
    log.write({ turn: turnNumber, speaker: speakerLabel, event });
    if (event.type === "tool_execution_start") {
      console.log(`[turn ${turnNumber}]   (tool) ${speakerLabel} ran ${event.toolName}: ${JSON.stringify(event.args)}`);
    }
  });

  speaker.send({ type: "prompt", message });
  await waitForSettled(speaker, TURN_TIMEOUT_MS);
  const reply = await getLastText(speaker);
  console.log(`[turn ${turnNumber}] ${speakerLabel}: ${reply}`);
  log.write({ turn: turnNumber, direction: "reply", from: speakerLabel, reply });
  return reply;
}

async function main() {
  checkGitClean(CWD);

  const log = openLog();
  console.log(
    `[spawn] ${AGENT_A.name} (${AGENT_A.model}), ${AGENT_B.name} (${AGENT_B.model})`,
  );

  const agentA = spawnAgent({ model: AGENT_A.model, cwd: CWD, name: AGENT_A.name });
  const agentB = spawnAgent({ model: AGENT_B.model, cwd: CWD, name: AGENT_B.name });

  try {
    await Promise.all([
      waitForReady(agentA, SPAWN_TIMEOUT_MS),
      waitForReady(agentB, SPAWN_TIMEOUT_MS),
    ]);
  } catch (err) {
    console.error(`[error] agent failed to start: ${err.message}`);
    agentA.kill();
    agentB.kill();
    process.exit(1);
  }

  const cleanup = () => {
    try {
      agentA.send({ type: "abort" });
      agentB.send({ type: "abort" });
    } catch {
      // ignore: process may already be gone
    }
    agentA.kill();
    agentB.kill();
  };

  process.on("SIGINT", () => {
    console.log("\n[interrupt] aborting both agents and exiting");
    cleanup();
    process.exit(130);
  });

  try {
    let message = OPENING_PROMPT;
    const pairs = [
      [AGENT_A.name, agentA, AGENT_B.name],
      [AGENT_B.name, agentB, AGENT_A.name],
    ];

    for (let turn = 1; turn <= MAX_TURNS; turn++) {
      const [speakerLabel, speaker, listenerLabel] = pairs[(turn - 1) % 2];
      message = await runTurn(turn, speakerLabel, speaker, listenerLabel, message, log);
    }

    console.log(`[done] ${MAX_TURNS} turns complete. Full log: ${log.path}`);
  } catch (err) {
    console.error("[error]", err.message);
    console.error(`Partial log preserved at: ${log.path}`);
    process.exitCode = 1;
  } finally {
    cleanup();
  }
}

await main();
