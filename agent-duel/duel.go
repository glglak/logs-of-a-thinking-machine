package main

import (
	"fmt"
	"os"
	"strings"
	"time"
)

// sanitize makes an agent name safe for use in a git branch name.
func sanitize(s string) string {
	out := make([]rune, 0, len(s))
	for _, r := range s {
		switch {
		case r >= 'a' && r <= 'z', r >= 'A' && r <= 'Z',
			r >= '0' && r <= '9', r == '-', r == '_':
			out = append(out, r)
		default:
			out = append(out, '-')
		}
	}
	if len(out) == 0 {
		return "agent"
	}
	return string(out)
}

// RunDuel runs each configured agent against the same base commit in its own
// isolated worktree, then runs the test command and records the outcome.
func RunDuel(cfg *Config, repo, task, base, outDir string, keep bool) (Report, error) {
	repoPath, cleanup, err := resolveRepo(repo)
	if err != nil {
		return Report{}, err
	}
	defer cleanup()

	baseSHA, err := resolveBase(repoPath, base)
	if err != nil {
		return Report{}, err
	}

	rep := Report{Task: task, Repo: repo, Base: baseSHA, CreatedAt: time.Now()}
	timeout := cfg.TimeoutDuration()

	for _, ag := range cfg.Agents {
		branch := "duel/" + sanitize(ag.Name)
		res := Result{Agent: ag.Name, Branch: branch, CostUSD: -1, TestsPassed: -1, TestsFailed: -1}

		wt, err := os.MkdirTemp("", "agent-duel-wt-")
		if err != nil {
			return rep, err
		}

		if err := addWorktree(repoPath, branch, wt, baseSHA); err != nil {
			res.Status = "setup error"
			res.Error = err.Error()
			rep.Results = append(rep.Results, res)
			_ = os.RemoveAll(wt)
			continue
		}

		fmt.Printf("Running %s ...\n", ag.Name)
		command := strings.ReplaceAll(ag.Command, "{{TASK}}", task)
		ax := runShell(command, wt, []string{"AGENT_DUEL_TASK=" + task}, timeout)
		res.AgentExit = ax.ExitCode
		res.DurationSec = ax.DurationSec
		res.TimedOut = ax.TimedOut
		res.CostUSD = extractCost(ax.Output, ag.CostRegex)

		if ds, err := diffStat(wt, baseSHA); err == nil {
			res.FilesChanged = ds.FilesChanged
			res.Insertions = ds.Insertions
			res.Deletions = ds.Deletions
		}

		tx := runShell(cfg.TestCommand, wt, nil, timeout)
		res.TestsOK = tx.ExitCode == 0
		res.TestsPassed, res.TestsFailed = parseTestCounts(tx.Output)

		res.Status = statusFor(res)
		rep.Results = append(rep.Results, res)

		if keep {
			fmt.Printf("  kept worktree: %s (branch %s)\n", wt, branch)
		} else {
			removeWorktree(repoPath, branch, wt)
			_ = os.RemoveAll(wt)
		}
	}

	rep.Winner = pickWinner(rep.Results)
	return rep, nil
}
