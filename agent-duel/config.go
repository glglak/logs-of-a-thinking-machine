package main

import (
	"encoding/json"
	"fmt"
	"os"
	"time"
)

// AgentConfig describes one competitor in a duel. The command is run in an
// isolated git worktree; "{{TASK}}" is substituted with the task text and the
// task is also exposed via the AGENT_DUEL_TASK environment variable.
type AgentConfig struct {
	Name string `json:"name"`
	// Command is a shell command line (run via `sh -c` / `cmd /c`).
	Command string `json:"command"`
	// CostRegex optionally extracts a dollar amount from the agent's output.
	// Capture group 1 must be the numeric value, e.g. `total cost: \$([0-9.]+)`.
	CostRegex string `json:"costRegex,omitempty"`
}

// Config is the duel definition loaded from a JSON file.
type Config struct {
	// TestCommand is run after each agent finishes, inside that agent's worktree.
	// Its exit code decides pass/fail; output is parsed best-effort for counts.
	TestCommand string `json:"testCommand"`
	// Timeout is a Go duration string (e.g. "20m") applied to each agent run
	// and to the test command. Defaults to 20m.
	Timeout string        `json:"timeout,omitempty"`
	Agents  []AgentConfig `json:"agents"`
}

func LoadConfig(path string) (*Config, error) {
	data, err := os.ReadFile(path)
	if err != nil {
		return nil, fmt.Errorf("read config %s: %w", path, err)
	}
	var c Config
	if err := json.Unmarshal(data, &c); err != nil {
		return nil, fmt.Errorf("parse config %s: %w", path, err)
	}
	if c.TestCommand == "" {
		return nil, fmt.Errorf("config: testCommand is required")
	}
	if len(c.Agents) < 2 {
		return nil, fmt.Errorf("config: need at least 2 agents for a duel")
	}
	for i, a := range c.Agents {
		if a.Name == "" || a.Command == "" {
			return nil, fmt.Errorf("config: agent %d needs both name and command", i)
		}
	}
	return &c, nil
}

func (c *Config) TimeoutDuration() time.Duration {
	const def = 20 * time.Minute
	if c.Timeout == "" {
		return def
	}
	d, err := time.ParseDuration(c.Timeout)
	if err != nil || d <= 0 {
		return def
	}
	return d
}
