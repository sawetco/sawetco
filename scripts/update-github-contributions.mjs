import { readFile, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";

const OUTPUT_URL = new URL(
  "../data/github-contributions.json",
  import.meta.url,
);
const GITHUB_API_URL = "https://api.github.com/graphql";
const DEFAULT_ACCOUNT = "sawetco";
const TIME_ZONE = "Europe/Istanbul";

const CONTRIBUTION_LEVELS = {
  NONE: 0,
  FIRST_QUARTILE: 1,
  SECOND_QUARTILE: 2,
  THIRD_QUARTILE: 3,
  FOURTH_QUARTILE: 4,
};

const QUERY = `
  query ContributionCalendar($login: String!, $from: DateTime!, $to: DateTime!) {
    user(login: $login) {
      contributionsCollection(from: $from, to: $to) {
        contributionCalendar {
          weeks {
            contributionDays {
              date
              contributionCount
              contributionLevel
            }
          }
        }
      }
    }
  }
`;

export function getDateInTimeZone(date = new Date(), timeZone = TIME_ZONE) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);
  const values = Object.fromEntries(
    parts.map((part) => [part.type, part.value]),
  );

  return `${values.year}-${values.month}-${values.day}`;
}

export function addDays(dateString, amount) {
  const date = new Date(`${dateString}T12:00:00.000Z`);
  date.setUTCDate(date.getUTCDate() + amount);
  return date.toISOString().slice(0, 10);
}

export function normalizeCalendar(calendar, endDate) {
  const startDate = addDays(endDate, -364);
  const contributionByDate = new Map();

  for (const week of calendar.weeks) {
    for (const day of week.contributionDays) {
      const level = CONTRIBUTION_LEVELS[day.contributionLevel];

      if (level === undefined) {
        throw new Error(
          `Bilinmeyen GitHub katkı seviyesi: ${day.contributionLevel}`,
        );
      }

      contributionByDate.set(day.date, {
        count: day.contributionCount,
        level,
      });
    }
  }

  const days = Array.from({ length: 365 }, (_, index) => {
    const date = addDays(startDate, index);
    return {
      date,
      ...(contributionByDate.get(date) ?? { count: 0, level: 0 }),
    };
  });

  return {
    startDate,
    endDate,
    days,
    total: days.reduce((sum, day) => sum + day.count, 0),
  };
}

async function fetchCalendar({ account, token, startDate, endDate }) {
  const response = await fetch(GITHUB_API_URL, {
    method: "POST",
    headers: {
      Accept: "application/vnd.github+json",
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      "User-Agent": "sawet-portfolio-contribution-updater",
    },
    body: JSON.stringify({
      query: QUERY,
      variables: {
        login: account,
        from: `${startDate}T00:00:00+03:00`,
        to: `${endDate}T23:59:59+03:00`,
      },
    }),
  });

  if (!response.ok) {
    throw new Error(`GitHub GraphQL isteği başarısız: ${response.status}`);
  }

  const payload = await response.json();

  if (payload.errors?.length) {
    throw new Error(`GitHub GraphQL hatası: ${payload.errors[0].message}`);
  }

  const calendar =
    payload.data?.user?.contributionsCollection?.contributionCalendar;

  if (!calendar) {
    throw new Error(
      `GitHub kullanıcısı veya katkı takvimi bulunamadı: ${account}`,
    );
  }

  return calendar;
}

export async function updateContributions({
  account = process.env.GITHUB_USERNAME || DEFAULT_ACCOUNT,
  token = process.env.GITHUB_TOKEN,
  now = new Date(),
} = {}) {
  if (!token) {
    throw new Error("GITHUB_TOKEN ortam değişkeni gerekli.");
  }

  const endDate = getDateInTimeZone(now);
  const startDate = addDays(endDate, -364);
  const calendar = await fetchCalendar({ account, token, startDate, endDate });
  const normalized = normalizeCalendar(calendar, endDate);
  const snapshot = {
    account,
    startDate: normalized.startDate,
    endDate: normalized.endDate,
    capturedAt: endDate,
    total: normalized.total,
    days: normalized.days,
  };
  const nextContent = `${JSON.stringify(snapshot, null, 2)}\n`;
  const currentContent = await readFile(OUTPUT_URL, "utf8").catch(() => "");

  if (currentContent === nextContent) {
    return { changed: false, snapshot };
  }

  await writeFile(OUTPUT_URL, nextContent, "utf8");
  return { changed: true, snapshot };
}

const isDirectRun = process.argv[1] === fileURLToPath(import.meta.url);

if (isDirectRun) {
  updateContributions()
    .then(({ changed, snapshot }) => {
      const status = changed ? "güncellendi" : "zaten güncel";
      console.log(
        `GitHub katkıları ${status}: ${snapshot.startDate}–${snapshot.endDate}, ${snapshot.total} katkı.`,
      );
    })
    .catch((error) => {
      console.error(error instanceof Error ? error.message : error);
      process.exitCode = 1;
    });
}
