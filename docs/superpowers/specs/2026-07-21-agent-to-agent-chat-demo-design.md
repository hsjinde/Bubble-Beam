# Design: Agent-to-Agent Chat Demo (pi RPC Relay)

## Purpose

Prove out a minimal mechanism for two independent pi agent instances to
"talk" to each other automatically — no human relaying messages by hand —
using the officially published pi CLI (`@earendil-works/pi-coding-agent`)
in `--mode rpc`. This is a proof-of-concept, not a production feature: there
is no specific task the two agents must accomplish, other than demonstrating
that the communication loop works end to end, with each agent having full
tool access (read/write/edit/bash).

## Scope

- In scope: a standalone relay script that spawns two `pi --mode rpc`
  processes, alternates sending prompts between them for a fixed number of
  turns, and logs the full RPC event stream.
- Out of scope: pi's experimental `@earendil-works/pi-orchestrator` package
  (not published to npm; would require building from source). Out of scope:
  any asynchronous/steering-based conversation model, keyword-based stop
  conditions, or multi-agent (>2) topologies. Out of scope: automatic
  conflict resolution if both agents edit the same file.

## Requirements (confirmed via brainstorming)

1. Two independent pi agent processes, using the officially published pi
   CLI (`pi --mode rpc`), not the unpublished orchestrator package.
2. A custom Node.js relay script we write ourselves — no dependency on
   `pi-orchestrator`.
3. Lives inside this repo at `experiments/agent-chat/`.
4. Conversation runs for a fixed number of turns (5), then stops
   automatically.
5. Opening topic: brainstorm 3 new feature ideas for Bubble-Beam (a trading
   card deck-stats site); the two agents challenge and build on each
   other's ideas.
6. Both agents have full tool access (`read`, `write`, `edit`, `bash`) —
   not read-only, not chat-only.
7. Both agents share the same working directory, `D:\Bubble-Beam` (this
   repo). Risk of concurrent-edit collisions is accepted for this
   experiment.
8. Both agents use Anthropic (the only currently authenticated provider),
   but different Claude models, to get differing perspectives (e.g. Sonnet
   vs Opus — exact model IDs to be confirmed against `pi --mode json` /
   `get_available_models` output at implementation time).

## Architecture

```
experiments/agent-chat/
├── relay.mjs      # Main script: spawns two pi RPC processes, relays messages
├── config.mjs     # Agent configs: model, cwd, role, opening prompt, turn count
├── logs/          # Full JSONL event log per run (gitignored)
└── README.md      # How to run, how to read logs, safety notes
```

### Flow

1. `relay.mjs` checks `git status --short` in the target cwd. If dirty, it
   warns the user and requires an explicit `--force` flag to continue
   (safety net so an experiment gone wrong can be reverted with
   `git checkout .`).
2. Spawns two child processes via `child_process.spawn`:
   - Agent A: `pi --mode rpc --model <configured>` , cwd = `D:\Bubble-Beam`
   - Agent B: `pi --mode rpc --model <configured>`, cwd = `D:\Bubble-Beam`
   - Session persistence is left at pi's default (not `--no-session`), so
     each agent's own session is saved normally and can be resumed/inspected
     later via `pi -r` if desired.
3. For each child process, a JSONL line reader is attached following the
   framing rules in pi's RPC docs (split on `\n` only, strip trailing `\r`,
   do not use a Unicode-aware line reader).
4. Turn loop (fixed `MAX_TURNS = 5`):
   - Turn 0: relay sends `OPENING_PROMPT` (the feature-brainstorm prompt) to
     Agent A as a `prompt` command.
   - After sending, relay listens to the agent's event stream until an
     `agent_settled` event arrives (per RPC docs, this is the correct
     "fully done, no pending retries/compaction/follow-ups" signal).
   - Relay then sends `get_last_assistant_text` to that agent and captures
     the returned text.
   - That text is sent verbatim as the next `prompt` to the other agent.
   - Roles alternate (A → B → A → B → A) for 5 total turns.
   - All raw events (including `tool_execution_start/update/end`) are
     appended to `logs/<timestamp>.jsonl` as they arrive, so tool activity
     during the "chat" is fully auditable.
5. After 5 turns (or on error/interrupt), the relay sends `abort` to both
   agents, kills both child processes in a `finally` block, and prints a
   summary: log file path and a per-turn speaker/preview list.

### Components

- `spawnAgent(config)` — starts a `pi --mode rpc` child process, returns a
  handle with `send(cmd)`, `onEvent(cb)`, and `kill()`.
- `waitForSettled(agent, timeoutMs)` — resolves when `agent_settled` fires;
  rejects on timeout (default 5 minutes/turn) or on an error-type event.
- `getLastText(agent)` — sends `get_last_assistant_text`, returns the text.
- `runTurn(speaker, listener, message)` — sends the prompt to `speaker`,
  waits for settlement, fetches and returns the reply text; also prints a
  labeled console line (`[turn N] AgentX: ...`) and forwards tool-call
  events to the console/log.
- `main()` — safety check → spawn both agents → run the turn loop → cleanup
  → print summary.

## Data Flow / Console Output

Example console output while running:

```
[safety] git status clean, proceeding
[spawn] AgentA (claude-sonnet-...), AgentB (claude-opus-...)
[turn 1] AgentA: 我想到三個功能：1) ... 2) ... 3) ...
[turn 1]   (tool) AgentA ran bash: ls src/routes
[turn 2] AgentB: 你的第二點感覺跟現有排行榜重複了，我建議改成...
...
[done] 5 turns complete. Full log: logs/2026-07-21-153000.jsonl
```

## Error Handling

- **Spawn failure** (pi missing, bad model id): if no response within 3s of
  spawn, treat as a startup failure, print a clear error, exit non-zero,
  and ensure no orphaned child process remains.
- **Mid-run agent error** (RPC `success: false`, or an `error`-type
  `message_update` delta): log it, print a warning, and stop the whole
  relay immediately rather than guessing how to continue on a broken
  premise.
- **Stuck/timeout protection**: `waitForSettled` has a per-turn timeout
  (default 5 minutes, configurable); on timeout, abort the run and keep
  whatever log was captured so far.
- **Ctrl+C (SIGINT)**: send `abort` to both agents, then kill both child
  processes, avoiding zombie processes.
- **Guaranteed cleanup**: both child processes are killed in a
  `try/finally` regardless of how the run ends.

## Testing / Acceptance Criteria

This is a manual proof-of-concept, not something requiring automated unit
tests at this stage. Acceptance is checked by running it and confirming:

1. Console shows the two agents alternating, each turn labeled with which
   agent (and which model) spoke.
2. The run stops automatically after 5 turns, no manual interrupt needed.
3. `logs/*.jsonl` contains the full RPC event stream, including any
   `tool_execution_*` events, proving tool use happened (not just chat).
4. If an agent actually modified repo files, `git status --short` shows the
   diff, and the user can choose to keep it or `git checkout .` to discard.
5. After the run (or after Ctrl+C), no leftover `pi` child processes remain
   (verified via task manager / `tasklist`).

If this mechanism proves useful beyond a one-off demo, a follow-up project
should add automated tests (e.g. mocking the pi RPC subprocess) before it's
relied upon for real work.

## Explicitly Deferred (not part of this design)

- Using the unpublished `pi-orchestrator` package.
- Asynchronous / steering-based (non-turn-based) conversation.
- Keyword-based or open-ended stop conditions.
- More than two agents.
- Automatic handling of concurrent-edit conflicts between the two agents.
