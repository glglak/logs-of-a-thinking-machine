package main

import (
	"bytes"
	"context"
	"os"
	"os/exec"
	"regexp"
	"runtime"
	"strconv"
	"strings"
	"syscall"
	"time"
)

// ExecResult captures the outcome of running one shell command.
type ExecResult struct {
	Output      string
	ExitCode    int
	DurationSec float64
	TimedOut    bool
}

func shellCommand(ctx context.Context, command, dir string, extraEnv []string) *exec.Cmd {
	var cmd *exec.Cmd
	if runtime.GOOS == "windows" {
		// Go's default arg quoting on Windows backslash-escapes embedded quotes,
		// which cmd.exe does not understand and which corrupts commands like
		//   aider --message "do the thing"
		// Set the raw command line ourselves so cmd.exe parses it natively.
		cmd = exec.CommandContext(ctx, "cmd")
		cmd.SysProcAttr = &syscall.SysProcAttr{CmdLine: "cmd /c " + command}
	} else {
		cmd = exec.CommandContext(ctx, "sh", "-c", command)
	}
	cmd.Dir = dir
	cmd.Env = append(os.Environ(), extraEnv...)
	return cmd
}

// runShell runs a command line in dir with a timeout, capturing combined output.
func runShell(command, dir string, extraEnv []string, timeout time.Duration) ExecResult {
	ctx, cancel := context.WithTimeout(context.Background(), timeout)
	defer cancel()

	cmd := shellCommand(ctx, command, dir, extraEnv)
	var buf bytes.Buffer
	cmd.Stdout = &buf
	cmd.Stderr = &buf

	start := time.Now()
	err := cmd.Run()
	res := ExecResult{Output: buf.String(), DurationSec: time.Since(start).Seconds()}

	if ctx.Err() == context.DeadlineExceeded {
		res.TimedOut = true
		res.ExitCode = -1
		return res
	}
	if err != nil {
		if ee, ok := err.(*exec.ExitError); ok {
			res.ExitCode = ee.ExitCode()
		} else {
			res.ExitCode = -1
		}
	}
	return res
}

// extractCost pulls a dollar amount from output using a regex whose first
// capture group is the numeric value. Returns -1 when unknown.
func extractCost(output, pattern string) float64 {
	if pattern == "" {
		return -1
	}
	re, err := regexp.Compile(pattern)
	if err != nil {
		return -1
	}
	m := re.FindStringSubmatch(output)
	if len(m) < 2 {
		return -1
	}
	v, err := strconv.ParseFloat(strings.TrimSpace(m[1]), 64)
	if err != nil {
		return -1
	}
	return v
}

var (
	rePassed = regexp.MustCompile(`(\d+)\s+(?:passed|passing|tests? passed|ok)`)
	reFailed = regexp.MustCompile(`(\d+)\s+(?:failed|failing|tests? failed)`)
)

// parseTestCounts is a best-effort parse of common runner output
// (jest, pytest, go test, mocha). Returns -1 for any count it can't find.
func parseTestCounts(output string) (passed, failed int) {
	passed, failed = -1, -1
	lower := strings.ToLower(output)
	if m := rePassed.FindStringSubmatch(lower); m != nil {
		if n, err := strconv.Atoi(m[1]); err == nil {
			passed = n
		}
	}
	if m := reFailed.FindStringSubmatch(lower); m != nil {
		if n, err := strconv.Atoi(m[1]); err == nil {
			failed = n
		}
	}
	return passed, failed
}
