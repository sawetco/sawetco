import { execFileSync } from "node:child_process";

const runtimeDataFiles = new Set([
  "data/github-contributions.json",
  ".github/readme-stats.svg",
]);

try {
  const previous = process.env.VERCEL_GIT_PREVIOUS_SHA || "HEAD^";
  const files = execFileSync("git", ["diff", "--name-only", previous, "HEAD"], {
    encoding: "utf8",
  })
    .trim()
    .split("\n")
    .filter(Boolean);
  const onlyRuntimeData =
    files.length > 0 && files.every((file) => runtimeDataFiles.has(file));
  console.log(
    onlyRuntimeData
      ? "Contribution data only; serving updated data without a build."
      : "Application changes; build required.",
  );
  process.exit(onlyRuntimeData ? 0 : 1);
} catch {
  console.log("Comparison unavailable; build required.");
  process.exit(1);
}
