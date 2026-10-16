import { mkdir, readFile, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";

const INPUT_URL = new URL("../data/github-contributions.json", import.meta.url);
const OUTPUT_URL = new URL("../.github/readme-stats.svg", import.meta.url);

function xmlEscape(value) {
  return String(value).replace(
    /[&<>"']/g,
    (char) =>
      ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&apos;",
      })[char],
  );
}

export function calculateStats(snapshot) {
  if (!snapshot || !Array.isArray(snapshot.days) || !snapshot.days.length)
    throw new Error("GitHub katkı verisi eksik.");
  if (
    typeof snapshot.account !== "string" ||
    !/^[a-z\d](?:[a-z\d-]{0,37}[a-z\d])?$/i.test(snapshot.account)
  )
    throw new Error("Geçersiz GitHub kullanıcı adı.");
  const days = snapshot.days.slice(-365);
  for (let index = 0; index < days.length; index += 1) {
    const day = days[index];
    if (
      !/^\d{4}-\d{2}-\d{2}$/.test(day.date) ||
      !Number.isSafeInteger(day.count) ||
      day.count < 0 ||
      (index > 0 && days[index - 1].date >= day.date)
    )
      throw new Error("Katkı verisindeki tarih veya sayı geçersiz.");
  }
  const total = days.reduce((sum, day) => sum + day.count, 0);
  const activeDays = days.filter((day) => day.count > 0).length;
  const recent30 = days.slice(-30).reduce((sum, day) => sum + day.count, 0);
  const last84 = days.slice(-84);
  const weekly = Array.from({ length: 12 }, (_, index) =>
    last84
      .slice(index * 7, (index + 1) * 7)
      .reduce((sum, day) => sum + day.count, 0),
  );
  return { account: snapshot.account, total, activeDays, recent30, weekly };
}

export function renderStatsSvg(stats) {
  const { account, total, activeDays, recent30, weekly } = stats;
  const maxWeekly = Math.max(1, ...weekly);

  const bars = weekly
    .map((count, index) => {
      const height =
        count > 0 ? Math.max(3, Math.round((count / maxWeekly) * 34)) : 0;
      const x = 594 + index * 13;
      const y = 70 - height;

      return height
        ? `<rect x="${x}" y="${y}" width="8" height="${height}" rx="2" fill="#c9d1d9" />`
        : "";
    })
    .join("");

  const format = (value) => new Intl.NumberFormat("tr-TR").format(value);
  const accessibleDescription = `${format(total)} katkı, ${activeDays} aktif gün, son 30 günde ${format(recent30)} katkı.`;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="760" height="92" viewBox="0 0 760 92" role="img" aria-labelledby="title desc">
  <title id="title">${xmlEscape(account)} / github istatistikleri</title>
  <desc id="desc">${xmlEscape(accessibleDescription)} Son 12 haftalık katkı grafiği.</desc>

  <g font-family="-apple-system,BlinkMacSystemFont,Segoe UI,Arial,sans-serif">
    <text x="0" y="16" font-size="10" fill="#8b949e">son 365 gün</text>
    <text x="0" y="54" font-size="32" font-weight="700" fill="#e6edf3">${format(total)}</text>
    <text x="0" y="74" font-size="11" fill="#8b949e">toplam katkı</text>

    <line x1="182" y1="10" x2="182" y2="74" stroke="#30363d" />

    <text x="206" y="16" font-size="10" fill="#8b949e">son 365 gün</text>
    <text x="206" y="54" font-size="32" font-weight="700" fill="#e6edf3">${format(activeDays)}</text>
    <text x="206" y="74" font-size="11" fill="#8b949e">aktif gün</text>

    <line x1="388" y1="10" x2="388" y2="74" stroke="#30363d" />

    <text x="412" y="16" font-size="10" fill="#8b949e">son 30 gün</text>
    <text x="412" y="54" font-size="32" font-weight="700" fill="#e6edf3">${format(recent30)}</text>
    <text x="412" y="74" font-size="11" fill="#8b949e">katkı</text>

    <line x1="570" y1="10" x2="570" y2="74" stroke="#30363d" />

    <text x="594" y="16" font-size="10" fill="#8b949e">son 12 hafta</text>
    <line x1="594" y1="70.5" x2="754" y2="70.5" stroke="#30363d" />
    ${bars}
  </g>
</svg>
`;
}
export async function updateReadmeStats({
  input = INPUT_URL,
  output = OUTPUT_URL,
} = {}) {
  const snapshot = JSON.parse(await readFile(input, "utf8"));
  const svg = renderStatsSvg(calculateStats(snapshot));
  const previous = await readFile(output, "utf8").catch(() => null);
  if (previous === svg) return { changed: false };
  await mkdir(new URL("./", output), { recursive: true });
  await writeFile(output, svg, "utf8");
  return { changed: true };
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  updateReadmeStats()
    .then(({ changed }) =>
      console.log(
        changed
          ? "README istatistikleri güncellendi."
          : "README istatistiklerinde değişiklik yok.",
      ),
    )
    .catch((error) => {
      console.error(error.message);
      process.exitCode = 1;
    });
}
