# try-openrouter-demo.ps1
# One-command demo of agent-duel using your OpenRouter key.
#
# It spins up a THROWAWAY git repo with a failing test, then duels two cheap
# models (DeepSeek vs GPT-4o-mini) through aider + OpenRouter. The agent that
# correctly implements add() so `node --test` passes wins.
#
# Prereqs (already set up): agent-duel.exe built, aider installed, Node 18+.
#
# Usage (PowerShell):
#   $env:OPENROUTER_API_KEY = "sk-or-..."   # set your key for this session
#   ./try-openrouter-demo.ps1

$ErrorActionPreference = "Stop"

if (-not $env:OPENROUTER_API_KEY) {
    Write-Host "OPENROUTER_API_KEY is not set." -ForegroundColor Red
    Write-Host 'Set it first:  $env:OPENROUTER_API_KEY = "sk-or-..."'
    exit 1
}

$exe = Join-Path $PSScriptRoot "..\agent-duel.exe"
if (-not (Test-Path $exe)) { throw "agent-duel.exe not found at $exe. Build it first." }

# 1. Build a throwaway target repo with a failing test.
$repo = Join-Path $env:TEMP "agent-duel-demo"
if (Test-Path $repo) { Remove-Item $repo -Recurse -Force }
New-Item -ItemType Directory -Path $repo | Out-Null

@'
function add(a, b) {
  throw new Error("not implemented");
}
module.exports = { add };
'@ | Set-Content (Join-Path $repo "math.js")

@'
const test = require("node:test");
const assert = require("node:assert");
const { add } = require("./math");

test("adds two numbers", () => {
  assert.strictEqual(add(2, 3), 5);
  assert.strictEqual(add(-1, 1), 0);
});
'@ | Set-Content (Join-Path $repo "math.test.js")

# 2. Init git (local identity so the initial commit succeeds).
Push-Location $repo
git init -q
git config user.email "demo@agent-duel.local"
git config user.name "agent-duel demo"
git add -A
git commit -q -m "failing add() test"
Pop-Location

# 3. Write the duel config next to the repo.
$config = Join-Path $repo "agent-duel.json"
@'
{
  "testCommand": "node --test",
  "timeout": "10m",
  "agents": [
    {
      "name": "deepseek",
      "command": "aider math.js --model openrouter/deepseek/deepseek-chat --message \"{{TASK}}\" --yes --no-stream --no-check-update --no-analytics --no-auto-commits",
      "costRegex": "(?i)cost[^$]*\\$([0-9.]+)"
    },
    {
      "name": "gpt-4o-mini",
      "command": "aider math.js --model openrouter/openai/gpt-4o-mini --message \"{{TASK}}\" --yes --no-stream --no-check-update --no-analytics --no-auto-commits",
      "costRegex": "(?i)cost[^$]*\\$([0-9.]+)"
    }
  ]
}
'@ | Set-Content $config

# 4. Run the duel.
$task = "Implement the add(a, b) function in math.js so it returns the sum of a and b and the tests in math.test.js pass."

Write-Host "`nRunning duel in $repo ...`n" -ForegroundColor Cyan
& $exe --repo $repo --config $config --task $task --out (Join-Path $repo "results")
