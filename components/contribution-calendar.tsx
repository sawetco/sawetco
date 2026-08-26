"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  type ContributionDay,
  type ContributionLevel,
  contributionSnapshot,
  getContributionWindow,
  getDateInTimeZone,
  getMillisecondsUntilNextDateInTimeZone,
} from "@/lib/portfolio-data";

const turkishDateFormatter = new Intl.DateTimeFormat("tr-TR", {
  day: "numeric",
  month: "long",
  year: "numeric",
  timeZone: "UTC",
});

const monthFormatter = new Intl.DateTimeFormat("tr-TR", {
  month: "short",
  timeZone: "UTC",
});

function getMonthLabels(contributions: readonly ContributionDay[]) {
  const rawMonthLabels = contributions.flatMap((day, index) => {
    const previousMonth =
      index > 0 ? contributions[index - 1].date.slice(0, 7) : null;
    const currentMonth = day.date.slice(0, 7);

    if (previousMonth === currentMonth) {
      return [];
    }

    const rawLabel = monthFormatter
      .format(new Date(`${day.date}T00:00:00.000Z`))
      .replace(".", "");
    const label =
      rawLabel.charAt(0).toLocaleUpperCase("tr-TR") + rawLabel.slice(1);

    return [{ label, column: Math.floor(index / 7) + 1 }];
  });

  return rawMonthLabels.filter((month, index) => {
    const nextMonth = rawMonthLabels[index + 1];

    return !nextMonth || nextMonth.column - month.column >= 3;
  });
}

function contributionLabel(date: string, count: number) {
  const formattedDate = turkishDateFormatter.format(
    new Date(`${date}T00:00:00.000Z`),
  );

  return count === 0
    ? `${formattedDate}: katkı yok`
    : `${formattedDate}: ${count} katkı`;
}

const contributionLevelClassName =
  "rounded-[2px] border border-black/5 bg-[var(--contribution-0)] data-[level=1]:bg-[var(--contribution-1)] data-[level=2]:bg-[var(--contribution-2)] data-[level=3]:bg-[var(--contribution-3)] data-[level=4]:bg-[var(--contribution-4)]";

function LegendCell({ level }: { level: ContributionLevel }) {
  return (
    <span
      className={`${contributionLevelClassName} size-2.5 shrink-0`}
      data-level={level}
      aria-hidden="true"
    />
  );
}

export function ContributionCalendar() {
  // Sunucu ve ilk istemci render'ı aynı snapshot tarihini kullanır.
  // Hydration sonrasında İstanbul tarihine geçer ve yalnızca gün değişiminde yeniden senkronize olur.
  const [endDate, setEndDate] = useState(contributionSnapshot.endDate);

  useEffect(() => {
    let timeoutId: number | undefined;

    const syncAndSchedule = () => {
      const currentDate = getDateInTimeZone();

      setEndDate((previousDate) =>
        currentDate > previousDate ? currentDate : previousDate,
      );

      if (timeoutId !== undefined) {
        window.clearTimeout(timeoutId);
      }

      timeoutId = window.setTimeout(
        syncAndSchedule,
        getMillisecondsUntilNextDateInTimeZone(),
      );
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        syncAndSchedule();
      }
    };

    syncAndSchedule();
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      if (timeoutId !== undefined) {
        window.clearTimeout(timeoutId);
      }
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, []);

  const { days: contributions, total } = useMemo(
    () => getContributionWindow(endDate),
    [endDate],
  );
  const monthLabels = useMemo(
    () => getMonthLabels(contributions),
    [contributions],
  );

  return (
    <figure
      className="mx-auto mt-14 w-full min-w-0 select-none sm:mt-20"
      aria-label={`${contributionSnapshot.account} GitHub katkıları, son 365 gün`}
    >
      <div className="w-full">
        <div className="w-full">
          <div
            className="grid h-5 grid-cols-[repeat(53,minmax(0,1fr))] gap-x-0.5 text-xs text-muted-foreground sm:gap-x-[3px]"
            aria-hidden="true"
          >
            {monthLabels.map(({ label, column }, index) => (
              <span
                className={`${index % 2 === 0 ? "" : "hidden min-[360px]:block"} whitespace-nowrap`}
                key={`${label}-${column}`}
                style={{ gridColumn: column }}
              >
                {label}
              </span>
            ))}
          </div>
          <div className="grid w-full grid-flow-col grid-cols-[repeat(53,minmax(0,1fr))] grid-rows-7 gap-0.5 sm:gap-[3px]">
            {contributions.map((day) => {
              const label = contributionLabel(day.date, day.count);

              return (
                <Tooltip key={day.date}>
                  <TooltipTrigger
                    render={
                      <span
                        className={`${contributionLevelClassName} block aspect-square w-full`}
                        data-level={day.level}
                        role="img"
                        aria-label={label}
                      />
                    }
                  />
                  <TooltipContent>{label}</TooltipContent>
                </Tooltip>
              );
            })}
          </div>

          <figcaption className="mt-2.5 flex items-center justify-between gap-4 text-xs text-muted-foreground">
            <div>
              <strong className="font-medium text-foreground">{total}</strong>{" "}
              katkı
            </div>
            <div
              className="flex items-center gap-1 whitespace-nowrap"
              role="img"
              aria-label="Katkı yoğunluğu: azdan çoğa"
            >
              <span>Az</span>
              {([0, 1, 2, 3, 4] as const).map((level) => (
                <LegendCell key={level} level={level} />
              ))}
              <span>Çok</span>
            </div>
          </figcaption>
        </div>
      </div>
    </figure>
  );
}
