import { execFileSync } from "node:child_process";

const runtimeDataFiles = new Set([
  "data/github-contributions.json",
  ".github/readme-stats.svg",
]);

try {
  // The previous deployed SHA may lag behind HEAD when earlier builds were skipped.
  // Classify only the latest commit to avoid redundant contribution-only builds.
  const files = execFileSync(
    "git",
    ["show", "--format=", "--name-only", "--diff-merges=first-parent", "HEAD"],
    { encoding: "utf8" },
  )
    .trim()
    .split("\n")
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
