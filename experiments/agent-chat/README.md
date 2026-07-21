# Agent Chat Demo

Proof-of-concept: two independent `pi --mode rpc` processes automatically
relaying messages to each other for 5 turns, brainstorming feature ideas
for Bubble-Beam. See the design doc for full details:
`docs/superpowers/specs/2026-07-21-agent-to-agent-chat-demo-design.md`.

## Requirements

- `pi` CLI installed and on PATH (`pi --version` should print something).
- Anthropic authenticated (`pi` then `/login`, or `ANTHROPIC_API_KEY` set).
- Node.js >= 22.

## Run it

```bash
cd experiments/agent-chat
node relay.mjs
```

Both agents run with cwd `D:\Bubble-Beam` and **full tool access**
(read/write/edit/bash) — they can genuinely modify files in this repo
during the conversation. Before running, the script checks
`git status --short` in that directory and refuses to start if there are
uncommitted changes, unless you pass `--force`:

```bash
node relay.mjs --force
```

If a run leaves the repo in a state you don't want, discard it with:

```bash
cd D:\Bubble-Beam
git checkout .
```

## Output

- Console: live turn-by-turn transcript, labeled by agent and model, plus
  a line whenever either agent invokes a tool.
- `logs/<timestamp>.jsonl`: the full raw RPC event stream for the run
  (gitignored — not committed).

## Known limitations (by design, see the spec)

- Fixed 5 turns, no early/keyword-based stop.
- Both agents share one working directory; concurrent edits are not
  reconciled automatically.
- No automated tests — this is a manual, run-it-and-look POC.
