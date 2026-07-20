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

function isContributionLevel(value: number): value is ContributionLevel {
  return Number.isInteger(value) && value >= 0 && value <= 4;
}

const days: readonly ContributionDay[] = snapshot.days.map((day) => {
  if (!isContributionLevel(day.level)) {
    throw new Error(`Geçersiz GitHub katkı seviyesi: ${day.level}`);
  }

  return { ...day, level: day.level };
});

if (days.length !== 365) {
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

export const contributions = contributionSnapshot.days;
