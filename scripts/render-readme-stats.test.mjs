import assert from "node:assert/strict";
import { test } from "node:test";
import { calculateStats, renderStatsSvg } from "./render-readme-stats.mjs";

function fixture(counts) {
  const start = Date.UTC(2026, 0, 1);
  return { account: "sawetco", days: counts.map((count, index) => ({
    date: new Date(start + index * 86_400_000).toISOString().slice(0, 10),
    count,
  })) };
}

test("katkı metrikleri doğru hesaplanır", () => {
  const counts = Array.from({ length: 365 }, () => 0);
  counts[0] = 12;
  counts[335] = 5;
  counts[364] = 7;
  const stats = calculateStats(fixture(counts));
  assert.equal(stats.total, 24);
  assert.equal(stats.activeDays, 3);
  assert.equal(stats.recent30, 12);
  assert.equal(stats.weekly.reduce((sum, item) => sum + item, 0), 12);
  assert.match(renderStatsSvg(stats), /<svg /);
  assert.match(renderStatsSvg(stats), /24 katkı/);
});

test("geçersiz veriler reddedilir", () => {
  assert.throws(() => calculateStats(fixture([-1])), /geçersiz/);
  assert.throws(() => calculateStats({ account: "sawetco", days: [] }), /eksik/);
  assert.throws(() => calculateStats({ account: "<script>", days: fixture([1]).days }), /Geçersiz/);
});

test("boş günler güvenle çizilir", () => {
  const stats = calculateStats(fixture(Array.from({ length: 365 }, () => 0)));
  assert.equal(stats.total, 0);
  assert.equal(stats.activeDays, 0);
  assert.match(renderStatsSvg(stats), /github \/ istatistikler/);
});
