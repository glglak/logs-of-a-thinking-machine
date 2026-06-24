package main

import (
	"fmt"
	"os"
	"os/exec"
	"path/filepath"
	"strconv"
	"strings"
)

func runGit(dir string, args ...string) (string, error) {
	cmd := exec.Command("git", args...)
	if dir != "" {
		cmd.Dir = dir
	}
	out, err := cmd.CombinedOutput()
	if err != nil {
		return string(out), fmt.Errorf("git %s: %w: %s",
			strings.Join(args, " "), err, strings.TrimSpace(string(out)))
	}
	return string(out), nil
}

// resolveRepo clones a git URL into a temp dir, or validates a local path.
// The returned cleanup removes the temp clone (no-op for local paths).
func resolveRepo(repo string) (path string, cleanup func(), err error) {
	if isGitURL(repo) {
		tmp, err := os.MkdirTemp("", "agent-duel-src-")
		if err != nil {
			return "", nil, err
		}
		if _, err := runGit("", "clone", "--quiet", repo, tmp); err != nil {
			os.RemoveAll(tmp)
			return "", nil, err
		}
		return tmp, func() { os.RemoveAll(tmp) }, nil
	}
	abs, err := filepath.Abs(repo)
	if err != nil {
		return "", nil, err
	}
	if _, err := os.Stat(filepath.Join(abs, ".git")); err != nil {
		return "", nil, fmt.Errorf("%s is not a git repository", abs)
	}
	return abs, func() {}, nil
}

func isGitURL(s string) bool {
	return strings.HasPrefix(s, "http://") ||
		strings.HasPrefix(s, "https://") ||
		strings.HasPrefix(s, "git@") ||
		strings.HasSuffix(s, ".git")
}

func resolveBase(repo, base string) (string, error) {
	ref := base
	if ref == "" {
		ref = "HEAD"
	}
	out, err := runGit(repo, "rev-parse", ref)
	if err != nil {
		return "", err
	}
	return strings.TrimSpace(out), nil
}

func addWorktree(repo, branch, dir, base string) error {
	_, err := runGit(repo, "worktree", "add", "-f", "-b", branch, dir, base)
	return err
}

func removeWorktree(repo, branch, dir string) {
	// Best-effort cleanup; ignore errors.
	_, _ = runGit(repo, "worktree", "remove", "--force", dir)
	_, _ = runGit(repo, "branch", "-D", branch)
}

// DiffStat summarizes the change an agent produced against the base commit.
type DiffStat struct {
	FilesChanged int
	Insertions   int
	Deletions    int
}

// diffStat stages everything in the worktree (to include new files) and
// compares the index against the base commit.
func diffStat(worktree, base string) (DiffStat, error) {
	if _, err := runGit(worktree, "add", "-A"); err != nil {
		return DiffStat{}, err
	}
	out, err := runGit(worktree, "diff", "--numstat", "--cached", base)
	if err != nil {
		return DiffStat{}, err
	}
	var ds DiffStat
	for _, line := range strings.Split(strings.TrimSpace(out), "\n") {
		if line == "" {
			continue
		}
		fields := strings.Fields(line)
		if len(fields) < 3 {
			continue
		}
		ds.FilesChanged++
		// Binary files report "-"; Atoi fails and is skipped.
		if n, err := strconv.Atoi(fields[0]); err == nil {
			ds.Insertions += n
		}
		if n, err := strconv.Atoi(fields[1]); err == nil {
			ds.Deletions += n
		}
	}
	return ds, nil
}
