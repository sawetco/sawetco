import { connection } from "next/server";
import {
  contributionSnapshot,
  isContributionSnapshot,
} from "@/lib/portfolio-data";

export async function GET() {
  await connection();
  try {
    const response = await fetch(
      "https://api.github.com/repos/sawetco/sawetco/contents/data/github-contributions.json?ref=main",
      {
        headers: {
          Accept: "application/vnd.github.raw+json",
          "User-Agent": "sawetco-contributions",
        },
        next: { revalidate: 3600 },
        signal: AbortSignal.timeout(8000),
      },
    );
    if (!response.ok) throw new Error("Contribution source unavailable");
    const snapshot: unknown = await response.json();
    if (!isContributionSnapshot(snapshot))
      throw new Error("Invalid contribution snapshot");
    return Response.json(snapshot, {
      headers: {
        "Cache-Control":
          "public, max-age=300, s-maxage=3600, stale-while-revalidate=3600",
        "X-Contributions-Source": "github",
      },
    });
  } catch {
    return Response.json(contributionSnapshot, {
      headers: {
        "Cache-Control": "public, max-age=60, s-maxage=60",
        "X-Contributions-Source": "bundled",
      },
    });
  }
}
