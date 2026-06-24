package main

import (
	"encoding/json"
	"fmt"
	"os"
	"path/filepath"
	"sort"
	"strings"
	"text/tabwriter"
	"time"
)

// Result is one agent's outcome in a duel.
type Result struct {
	Agent        string  `json:"agent"`
	Status       string  `json:"status"`
	AgentExit    int     `json:"agentExit"`
	TestsOK      bool    `json:"testsOk"`
	TestsPassed  int     `json:"testsPassed"`
	TestsFailed  int     `json:"testsFailed"`
	FilesChanged int     `json:"filesChanged"`
	Insertions   int     `json:"insertions"`
	Deletions    int     `json:"deletions"`
	CostUSD      float64 `json:"costUsd"`
	DurationSec  float64 `json:"durationSec"`
	TimedOut     bool    `json:"timedOut"`
	Branch       string  `json:"branch"`
	Error        string  `json:"error,omitempty"`
}

// Report is the full result of a duel.
type Report struct {
	Task      string    `json:"task"`
	Repo      string    `json:"repo"`
	Base      string    `json:"base"`
	CreatedAt time.Time `json:"createdAt"`
	Results   []Result  `json:"results"`
	Winner    string    `json:"winner"`
}

func statusFor(r Result) string {
	switch {
	case r.TimedOut:
		return "timed out"
	case r.AgentExit != 0:
		return "agent error"
	case r.FilesChanged == 0:
		return "no changes"
	case r.TestsOK:
		return "complete"
	default:
		return "tests failed"
	}
}

// pickWinner ranks results: tests pass > more tests passed > fewer files
// touched > lower known cost > faster. Returns "" if nothing usable.
func pickWinner(results []Result) string {
	scored := append([]Result(nil), results...)
	sort.SliceStable(scored, func(i, j int) bool {
		a, b := scored[i], scored[j]
		if a.TestsOK != b.TestsOK {
			return a.TestsOK
		}
		if a.TestsPassed != b.TestsPassed {
			return a.TestsPassed > b.TestsPassed
		}
		if a.FilesChanged != b.FilesChanged {
			return a.FilesChanged < b.FilesChanged
		}
		if a.CostUSD >= 0 && b.CostUSD >= 0 && a.CostUSD != b.CostUSD {
			return a.CostUSD < b.CostUSD
		}
		return a.DurationSec < b.DurationSec
	})
	if len(scored) == 0 {
		return ""
	}
	w := scored[0]
	if w.FilesChanged == 0 && !w.TestsOK {
		return ""
	}
	return w.Agent
}

func max0(n int) int {
	if n < 0 {
		return 0
	}
	return n
}

func fmtCost(c float64) string {
	if c < 0 {
		return "-"
	}
	return fmt.Sprintf("$%.2f", c)
}

func fmtTests(r Result) string {
	if r.TestsPassed < 0 && r.TestsFailed < 0 {
		if r.TestsOK {
			return "pass"
		}
		return "fail"
	}
	p := max0(r.TestsPassed)
	return fmt.Sprintf("%d/%d", p, p+max0(r.TestsFailed))
}

func fmtDuration(sec float64) string {
	if sec >= 60 {
		return fmt.Sprintf("%dm%02ds", int(sec)/60, int(sec)%60)
	}
	return fmt.Sprintf("%.0fs", sec)
}

func shortSHA(s string) string {
	if len(s) > 12 {
		return s[:12]
	}
	return s
}

// PrintTable renders the duel to stdout.
func PrintTable(rep Report) {
	w := tabwriter.NewWriter(os.Stdout, 0, 2, 2, ' ', 0)
	fmt.Fprintln(w, "AGENT\tSTATUS\tTESTS\tFILES\t+/-\tCOST\tTIME")
	for _, r := range rep.Results {
		fmt.Fprintf(w, "%s\t%s\t%s\t%d\t+%d/-%d\t%s\t%s\n",
			r.Agent, r.Status, fmtTests(r), r.FilesChanged,
			r.Insertions, r.Deletions, fmtCost(r.CostUSD), fmtDuration(r.DurationSec))
	}
	_ = w.Flush()
	if rep.Winner != "" {
		fmt.Printf("\nWinner: %s\n", rep.Winner)
	} else {
		fmt.Printf("\nNo clear winner.\n")
	}
}

// WriteReports writes duel.json and duel.md to outDir.
func WriteReports(rep Report, outDir string) (jsonPath, mdPath string, err error) {
	if err = os.MkdirAll(outDir, 0o755); err != nil {
		return
	}
	jsonPath = filepath.Join(outDir, "duel.json")
	mdPath = filepath.Join(outDir, "duel.md")

	jb, err := json.MarshalIndent(rep, "", "  ")
	if err != nil {
		return
	}
	if err = os.WriteFile(jsonPath, jb, 0o644); err != nil {
		return
	}

	var b strings.Builder
	b.WriteString("# Agent Duel\n\n")
	fmt.Fprintf(&b, "**Task:** %s\n\n", rep.Task)
	fmt.Fprintf(&b, "**Repo:** `%s`  \n**Base:** `%s`  \n**Run:** %s\n\n",
		rep.Repo, shortSHA(rep.Base), rep.CreatedAt.Format(time.RFC3339))
	b.WriteString("| Agent | Status | Tests | Files | +/- | Cost | Time |\n")
	b.WriteString("|---|---|---:|---:|---:|---:|---:|\n")
	for _, r := range rep.Results {
		fmt.Fprintf(&b, "| %s | %s | %s | %d | +%d/-%d | %s | %s |\n",
			r.Agent, r.Status, fmtTests(r), r.FilesChanged,
			r.Insertions, r.Deletions, fmtCost(r.CostUSD), fmtDuration(r.DurationSec))
	}
	b.WriteString("\n")
	if rep.Winner != "" {
		fmt.Fprintf(&b, "**Winner: %s**\n\n", rep.Winner)
	} else {
		b.WriteString("**No clear winner.**\n\n")
	}
	b.WriteString("> Single-run, test-based comparison. Agents are non-deterministic — ")
	b.WriteString("re-run for confidence. Passing tests is not proof of good code.\n")

	if err = os.WriteFile(mdPath, []byte(b.String()), 0o644); err != nil {
		return
	}
	return jsonPath, mdPath, nil
}
