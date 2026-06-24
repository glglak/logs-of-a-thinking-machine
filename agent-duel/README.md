# agent-duel

**One task. Multiple coding agents. May the best PR win.**

Give the same real coding task to Claude Code, Codex (or any agent) from the
same starting commit, then compare the actual results: tests passed, cost,
time, size of the change, and a side-by-side-ready set of branches.

Public benchmarks (SWE-bench, Terminal-Bench) tell you how an agent does on
*someone else's* tasks. `agent-duel` tells you which agent is best for **this
task in your codebase**.

## How it works

For each configured agent, `agent-duel`:

1. Creates an isolated `git worktree` on a fresh branch from the same base commit.
2. Runs the agent's command in that worktree with your task injected.
3. Runs your test command and records pass/fail.
4. Computes diff size (files changed, insertions/deletions).
5. Extracts cost from the agent's output (if you give it a regex).

Then it prints a comparison table and writes `duel.md` + `duel.json`.

```
AGENT        STATUS    TESTS  FILES  +/-       COST   TIME
claude-code  complete  48/48  9      +480/-96  $7.20  19m02s
codex        complete  46/48  7      +210/-40  $4.80  13m11s

Winner: codex
```

## Bring your own agents

`agent-duel` **never proxies inference**. Each agent is just a shell command you
configure and run locally with your own credentials/subscription. That means:

- You pay your own token costs directly to the provider (no markup, no middleman).
- Your code never leaves your machine.
- There is no remote-execution service to trust.

## Install

Requires Go 1.22+ and `git`.

```bash
go build -o agent-duel .
# or
go install github.com/karimderaz/agent-duel@latest
```

## Configure

Copy `agent-duel.example.json` to `agent-duel.json` and adjust the agent
commands to match the CLIs you actually have installed. `{{TASK}}` is replaced
with your task text; the task is also available as `$AGENT_DUEL_TASK`.

```json
{
  "testCommand": "npm test",
  "timeout": "20m",
  "agents": [
    { "name": "claude-code", "command": "claude -p \"{{TASK}}\"", "costRegex": "(?i)total cost[^$]*\\$([0-9.]+)" },
    { "name": "codex",       "command": "codex exec \"{{TASK}}\"", "costRegex": "(?i)cost[^$]*\\$([0-9.]+)" }
  ]
}
```

> The example commands are illustrative. Check each tool's own `--help` for the
> correct non-interactive / headless invocation and flags.

## Usage

```bash
# Local repo, task inline
agent-duel --repo . --task "Add subscription cancellation with Stripe webhook handling and tests"

# Clone a public repo, read the task from a file, keep branches to inspect
agent-duel --repo https://github.com/acme/widgets.git --task @task.md --keep
```

Flags: `--repo` `--task` `--config` `--base` `--out` `--keep`.

## How the winner is chosen

Ranked by: tests pass → more tests passed → fewer files touched → lower known
cost → faster. The recommendation is a starting point — **inspect the branches
and judge the code yourself.**

## Honest caveats

- **Single run.** Agents are non-deterministic; one duel is a data point, not a
  verdict. Re-run important comparisons.
- **Tests are the judge.** Passing tests is not proof of good code, and missing
  tests hide regressions. Garbage tests give garbage verdicts.
- **You run untrusted-ish code.** Agents execute shell commands and you run the
  repo's test suite locally. Use a repo and agents you trust, ideally in a
  sandbox/VM.
- **Fairness is on you.** Give each agent a comparable command, the latest
  version, and equivalent config, or the comparison is meaningless.

## License

MIT (intended).
