import snapshot from "@/data/github-contributions.json";

export type ContributionLevel = 0 | 1 | 2 | 3 | 4;

export interface ContributionDay {
  date: string;
  count: number;
  level: ContributionLevel;
}

export interface ContributionSnapshot {
  account: string;
  startDate: string;
  endDate: string;
  capturedAt: string;
  total: number;
  days: readonly ContributionDay[];
}

const TIME_ZONE = "Europe/Istanbul";
const CONTRIBUTION_WINDOW_DAYS = 365;
const MAX_TIME_ZONE_DAY_LENGTH_MS = 30 * 60 * 60 * 1000;
const TIME_ZONE_SEARCH_STEP_MS = 6 * 60 * 60 * 1000;

function isContributionLevel(value: number): value is ContributionLevel {
  return Number.isInteger(value) && value >= 0 && value <= 4;
}

export function addDays(dateString: string, amount: number) {
  const date = new Date(`${dateString}T12:00:00.000Z`);
  date.setUTCDate(date.getUTCDate() + amount);
  return date.toISOString().slice(0, 10);
}

export function getDateInTimeZone(
  date = new Date(),
  timeZone = TIME_ZONE,
): string {
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

export function getMillisecondsUntilNextDateInTimeZone(
  date = new Date(),
  timeZone = TIME_ZONE,
) {
  const currentDate = getDateInTimeZone(date, timeZone);
  const startTime = date.getTime();
  let lowerBound = startTime;
  let upperBound = startTime + MAX_TIME_ZONE_DAY_LENGTH_MS;

  while (getDateInTimeZone(new Date(upperBound), timeZone) === currentDate) {
    upperBound += TIME_ZONE_SEARCH_STEP_MS;
  }

  while (upperBound - lowerBound > 1000) {
    const midpoint = Math.floor((lowerBound + upperBound) / 2);

    if (getDateInTimeZone(new Date(midpoint), timeZone) === currentDate) {
      lowerBound = midpoint;
    } else {
      upperBound = midpoint;
    }
  }

  return Math.max(1000, upperBound - startTime + 1000);
}

const days: readonly ContributionDay[] = snapshot.days.map((day) => {
  if (!isContributionLevel(day.level)) {
    throw new Error(`Geçersiz GitHub katkı seviyesi: ${day.level}`);
  }

  return { ...day, level: day.level };
});

if (days.length !== CONTRIBUTION_WINDOW_DAYS) {
  throw new Error(`GitHub katkı snapshot'ı 365 gün içermeli: ${days.length}`);
}

export const contributionSnapshot: ContributionSnapshot = {
  account: snapshot.account,
  startDate: snapshot.startDate,
  endDate: snapshot.endDate,
  capturedAt: snapshot.capturedAt,
  total: snapshot.total,
  days,
};

export function getContributionWindow(endDate: string) {
  const effectiveEndDate =
    endDate < contributionSnapshot.endDate
      ? contributionSnapshot.endDate
      : endDate;
  const startDate = addDays(effectiveEndDate, -(CONTRIBUTION_WINDOW_DAYS - 1));
  const contributionByDate = new Map(
    contributionSnapshot.days.map((day) => [day.date, day]),
  );
  const windowDays = Array.from(
    { length: CONTRIBUTION_WINDOW_DAYS },
    (_, index) => {
      const date = addDays(startDate, index);
      return (
        contributionByDate.get(date) ?? {
          date,
          count: 0,
          level: 0 as ContributionLevel,
        }
      );
    },
  );

  return {
    days: windowDays,
    total: windowDays.reduce((sum, day) => sum + day.count, 0),
  };
}

export const contributions = contributionSnapshot.days;
