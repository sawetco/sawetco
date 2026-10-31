"use strict";
const backports = require("./security-backports.cjs").verify();
const { spawnSync } = require("node:child_process");
require("./verify-deepmerge.cjs").verify();
const r =
  process.platform === "win32"
    ? spawnSync("cmd.exe", ["/d", "/s", "/c", "pnpm audit --json"], {
        encoding: "utf8",
      })
    : spawnSync("pnpm", ["audit", "--json"], { encoding: "utf8" });
if (r.error || ![0, 1].includes(r.status)) throw Error("Audit unavailable");
const report = JSON.parse(r.stdout);
if (report.error || !report.advisories || !report.metadata?.vulnerabilities)
  throw Error("Malformed audit");
const allowed = new Set([
  ".>shadcn>@shadcn/registry>deepmerge",
  ".>shadcn>deepmerge",
]);
const remaining = Object.values(report.advisories)
  .filter((a) => !backports.pnpm(a))
  .filter(
    (a) =>
      !(
        a.module_name === "deepmerge" &&
        a.url === "https://github.com/advisories/GHSA-gcqx-w48m-w2h4" &&
        a.findings.length &&
        a.findings.every(
          (f) =>
            f.version === "4.3.1" &&
            f.paths.length &&
            f.paths.every((p) => allowed.has(p)),
        )
      ),
  );
console.log(
  JSON.stringify({
    raw: report.metadata.vulnerabilities,
    verifiedLocalPatch: "deepmerge@4.3.1",
    unresolved: remaining.length,
  }),
);
if (remaining.length) {
  console.error(JSON.stringify(remaining));
  process.exitCode = 1;
}
