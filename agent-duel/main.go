// Command agent-duel runs the same coding task through multiple AI coding
// agents from the same starting commit and compares the resulting PRs.
//
// It is bring-your-own-agent: each agent is just a shell command you configure,
// run locally with your own credentials. agent-duel never proxies inference.
package main

import (
	"flag"
	"fmt"
	"os"
	"strings"
)

func main() {
	repo := flag.String("repo", ".", "path to a local git repo, or a git URL to clone")
	task := flag.String("task", "", "task description, or @file to read it from a file")
	config := flag.String("config", "agent-duel.json", "path to the duel config file")
	base := flag.String("base", "", "base git ref each agent starts from (default HEAD)")
	out := flag.String("out", "agent-duel-results", "output directory for reports")
	keep := flag.Bool("keep", false, "keep agent worktrees/branches for inspection")
	flag.Parse()

	if *task == "" {
		fmt.Fprintln(os.Stderr, "error: --task is required")
		flag.Usage()
		os.Exit(2)
	}

	taskText, err := resolveTask(*task)
	if err != nil {
		fail(err)
	}

	cfg, err := LoadConfig(*config)
	if err != nil {
		fail(err)
	}

	rep, err := RunDuel(cfg, *repo, taskText, *base, *out, *keep)
	if err != nil {
		fail(err)
	}

	fmt.Println()
	PrintTable(rep)

	jsonPath, mdPath, err := WriteReports(rep, *out)
	if err != nil {
		fail(err)
	}
	fmt.Printf("\nReports written:\n  %s\n  %s\n", mdPath, jsonPath)
}

func resolveTask(t string) (string, error) {
	if strings.HasPrefix(t, "@") {
		b, err := os.ReadFile(t[1:])
		if err != nil {
			return "", err
		}
		return strings.TrimSpace(string(b)), nil
	}
	return t, nil
}

func fail(err error) {
	fmt.Fprintln(os.Stderr, "error:", err)
	os.Exit(1)
}
