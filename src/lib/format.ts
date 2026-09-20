const months = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

function parse(value: string): { year: string; month?: string } {
  const [year = "", monthNumber] = value.split("-");
  const month =
    monthNumber === undefined ? undefined : months[Number(monthNumber) - 1];
  if (!/^\d{4}$/.test(year) || (monthNumber !== undefined && !month)) {
    throw new Error(`Expected YYYY or YYYY-MM, got "${value}"`);
  }
  return { year, month };
}

/** "2026-09" -> "Sep 2026". "2025" -> "2025". */
export function formatDate(value: string): string {
  const { year, month } = parse(value);
  return month ? `${month} ${year}` : year;
}

/** ("2026-01", "2026-07") -> "Jan – Jul 2026". ("2022-09", "2024-12") -> "Sep 2022 – Dec 2024". A null end is "Present". */
export function formatRange(start: string, end: string | null): string {
  const from = parse(start);
  if (end === null) return `${formatDate(start)} – Present`;
  const to = parse(end);
  if (from.year === to.year && from.month && to.month) {
    return `${from.month} – ${to.month} ${to.year}`;
  }
  return `${formatDate(start)} – ${formatDate(end)}`;
}
