import assert from "node:assert/strict";
import { execFileSync, spawnSync } from "node:child_process";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
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

function check(cwd, previousDeploymentSha, overrides = {}) {
  return spawnSync(process.execPath, [scriptPath], {
    cwd,
    encoding: "utf8",
    env: {
      ...process.env,
      VERCEL_ENV: "production",
      VERCEL_GIT_COMMIT_REF: "main",
      VERCEL_GIT_COMMIT_SHA: git(cwd, "rev-parse", "HEAD"),
      VERCEL_GIT_PREVIOUS_SHA: previousDeploymentSha,
      ...overrides,
    },
  });
}

test("application change followed by stats must build against stale deployment SHA", () => {
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
    assert.equal(result.status, 1, result.stderr);
    assert.match(result.stdout, /Application changes/);
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

for (const outcome of ["failed", "skipped", "superseded"]) {
  test(`${outcome} intervening deployment cannot hide application changes`, () => {
    withRepository((cwd, deployedSha) => {
      commitFiles(
        cwd,
        { "app/page.tsx": "pending release" },
        "application update",
      );
      commitFiles(cwd, { "data/github-contributions.json": "{}" }, outcome);
      commitFiles(
        cwd,
        { ".github/readme-stats.svg": "<svg/>" },
        "latest stats",
      );
      // An unsuccessful attempt does not advance Vercel's successful baseline.
      assert.equal(check(cwd, deployedSha).status, 1);
    });
  });
}

test("multiple contribution-only commits safely skip against deployed baseline", () => {
  withRepository((cwd, deployedSha) => {
    commitFiles(cwd, { "data/github-contributions.json": "{}" }, "stats one");
    commitFiles(cwd, { ".github/readme-stats.svg": "<svg/>" }, "stats two");
    const result = check(cwd, deployedSha);
    assert.equal(result.status, 0, result.stderr);
    assert.match(result.stdout, /Contribution data only/);
  });
});

test("a successful application deployment advances the baseline", () => {
  withRepository((cwd) => {
    commitFiles(cwd, { "app/page.tsx": "released" }, "application update");
    const deployedSha = git(cwd, "rev-parse", "HEAD");
    commitFiles(cwd, { "data/github-contributions.json": "{}" }, "stats");
    assert.equal(check(cwd, deployedSha).status, 0);
  });
});

for (const baseline of [
  undefined,
  "",
  "HEAD^",
  "--help",
  "0".repeat(40),
  "f".repeat(40),
]) {
  test(`missing, invalid or unavailable baseline builds: ${baseline}`, () => {
    withRepository((cwd) => {
      commitFiles(cwd, { "data/github-contributions.json": "{}" }, "stats");
      const result = check(cwd, baseline);
      assert.equal(result.status, 1);
      assert.match(result.stdout, /Comparison unavailable/);
    });
  });
}

for (const overrides of [
  { VERCEL_ENV: undefined },
  { VERCEL_ENV: "preview" },
  { VERCEL_GIT_COMMIT_REF: "feature" },
  { VERCEL_GIT_COMMIT_SHA: undefined },
  { VERCEL_GIT_COMMIT_SHA: "f".repeat(40) },
]) {
  test(`untrusted deployment context builds: ${JSON.stringify(overrides)}`, () => {
    withRepository((cwd, deployedSha) => {
      commitFiles(cwd, { "data/github-contributions.json": "{}" }, "stats");
      assert.equal(check(cwd, deployedSha, overrides).status, 1);
    });
  });
}

test("divergent deployment history builds", () => {
  withRepository((cwd, initialSha) => {
    commitFiles(
      cwd,
      { "data/github-contributions.json": "{}" },
      "other history",
    );
    const divergentSha = git(cwd, "rev-parse", "HEAD");
    git(cwd, "checkout", "--detach", initialSha);
    commitFiles(cwd, { ".github/readme-stats.svg": "<svg/>" }, "stats");
    assert.equal(check(cwd, divergentSha).status, 1);
  });
});

test("rename from application path to allowed data path builds", () => {
  withRepository((cwd, deployedSha) => {
    mkdirSync(join(cwd, "data"));
    git(cwd, "mv", "app/page.tsx", "data/github-contributions.json");
    git(cwd, "commit", "-qm", "rename");
    assert.equal(check(cwd, deployedSha).status, 1);
  });
});

test("git comparison errors build", () => {
  withRepository((cwd, deployedSha) => {
    commitFiles(cwd, { "data/github-contributions.json": "{}" }, "stats");
    assert.equal(check(cwd, deployedSha, { PATH: "" }).status, 1);
  });
});

test("shallow checkout without deployed history builds", () => {
  withRepository((cwd, deployedSha) => {
    commitFiles(cwd, { "data/github-contributions.json": "{}" }, "stats");
    const shallow = mkdtempSync(join(tmpdir(), "vercel-shallow-"));
    try {
      git(cwd, "clone", "-q", "--depth=1", `file://${cwd}`, shallow);
      assert.equal(check(shallow, deployedSha).status, 1);
    } finally {
      rmSync(shallow, { recursive: true, force: true });
    }
  });
});

test("diff failure after valid ancestry still builds", () => {
  withRepository((cwd, deployedSha) => {
    commitFiles(cwd, { "data/github-contributions.json": "{}" }, "stats");
    const tree = git(cwd, "rev-parse", "HEAD^{tree}");
    rmSync(join(cwd, ".git", "objects", tree.slice(0, 2), tree.slice(2)));
    const result = check(cwd, deployedSha);
    assert.equal(result.status, 1);
    assert.match(result.stdout, /Comparison unavailable/);
  });
});
