import { execFileSync } from "node:child_process";

const runtimeDataFiles = new Set([
  "data/github-contributions.json",
  ".github/readme-stats.svg",
]);

try {
  // Vercel supplies the last successful deployment SHA for this project/branch.
  // Never substitute HEAD^: failed, skipped or superseded builds can leave
  // application changes outstanding across multiple commits.
  // https://vercel.com/docs/environment-variables/system-environment-variables#vercel_git_previous_sha
  const previousSha = process.env.VERCEL_GIT_PREVIOUS_SHA;
  const currentSha = process.env.VERCEL_GIT_COMMIT_SHA;
  const isSha = (value) => /^[a-f0-9]{40}$/i.test(value ?? "");
  if (
    process.env.VERCEL_ENV !== "production" ||
    process.env.VERCEL_GIT_COMMIT_REF !== "main" ||
    !isSha(previousSha) ||
    !isSha(currentSha)
  ) {
    throw new Error("Production deployment baseline unavailable");
  }
  const git = (...args) => execFileSync("git", args, { encoding: "utf8" });
  if (git("rev-parse", "HEAD").trim() !== currentSha) {
    throw new Error("Deployment commit does not match checkout");
  }
  // Missing/shallow or divergent history is not evidence that skipping is safe.
  git("merge-base", "--is-ancestor", previousSha, currentSha);
  const files = execFileSync(
    "git",
    [
      "diff",
      "--name-only",
      "--no-renames",
      "-z",
      previousSha,
      currentSha,
      "--",
    ],
    { encoding: "utf8" },
  )
    .split("\0")
    .filter(Boolean);
  const onlyRuntimeData =
    files.length > 0 && files.every((file) => runtimeDataFiles.has(file));
  console.log(
    onlyRuntimeData
      ? "Contribution data only; skipping build."
      : "Application changes; build required.",
  );
  process.exit(onlyRuntimeData ? 0 : 1);
} catch {
  console.log("Comparison unavailable; build required.");
  process.exit(1);
}
