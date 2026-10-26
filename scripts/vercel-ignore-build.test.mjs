import assert from "node:assert/strict";
import { execFileSync, spawnSync } from "node:child_process";
import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const scriptPath = fileURLToPath(
  new URL("./vercel-ignore-build.mjs", import.meta.url),
);

function git(cwd, ...args) {
  return execFileSync("git", args, { cwd, encoding: "utf8" }).trim();
}

function commitFiles(cwd, files, message) {
  for (const [path, content] of Object.entries(files)) {
    const output = join(cwd, path);
    mkdirSync(dirname(output), { recursive: true });
    writeFileSync(output, content);
  }
  git(cwd, "add", "--all");
  git(cwd, "commit", "-qm", message);
}

function withRepository(callback) {
  const cwd = mkdtempSync(join(tmpdir(), "vercel-ignore-"));
  try {
    git(cwd, "init", "-q");
    git(cwd, "config", "user.name", "Test");
    git(cwd, "config", "user.email", "test@example.com");
    commitFiles(cwd, { "app/page.tsx": "initial" }, "initial");
    const previousDeploymentSha = git(cwd, "rev-parse", "HEAD");
    callback(cwd, previousDeploymentSha);
  } finally {
    rmSync(cwd, { recursive: true, force: true });
  }
}

function check(cwd, previousDeploymentSha) {
  return spawnSync(process.execPath, [scriptPath], {
    cwd,
    encoding: "utf8",
    env: { ...process.env, VERCEL_GIT_PREVIOUS_SHA: previousDeploymentSha },
  });
}

test("stats-only commits skip builds with stale deployment SHA", () => {
  withRepository((cwd, oldSha) => {
    commitFiles(cwd, { "app/page.tsx": "updated" }, "application update");
    commitFiles(
      cwd,
      {
        "data/github-contributions.json": "{}",
        ".github/readme-stats.svg": "<svg/>",
      },
      "stats update",
    );
    const result = check(cwd, oldSha);
    assert.equal(result.status, 0, result.stderr);
    assert.match(result.stdout, /Contribution data only/);
  });
});

test("application changes trigger builds", () => {
  withRepository((cwd, oldSha) => {
    commitFiles(cwd, { "app/page.tsx": "updated" }, "application update");
    const result = check(cwd, oldSha);
    assert.equal(result.status, 1, result.stderr);
    assert.match(result.stdout, /Application changes/);
  });
});

test("empty commits trigger builds", () => {
  withRepository((cwd, oldSha) => {
    git(cwd, "commit", "--allow-empty", "-qm", "empty");
    const result = check(cwd, oldSha);
    assert.equal(result.status, 1, result.stderr);
  });
});
