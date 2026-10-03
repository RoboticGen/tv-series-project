const dateFormatter = new Intl.DateTimeFormat("en", { month: "short", day: "numeric", year: "numeric" });

// "Mar 4, 2026". Accepts strings too: dates cross the server/client boundary as either.
export function formatDate(date: Date | string) {
  return dateFormatter.format(new Date(date));
}

const relativeTime = new Intl.RelativeTimeFormat("en", { numeric: "auto" });

export function timeAgo(date: Date) {
  const seconds = Math.round((date.getTime() - Date.now()) / 1000);
  const units: [Intl.RelativeTimeFormatUnit, number][] = [
    ["year", 31_536_000],
    ["month", 2_592_000],
    ["week", 604_800],
    ["day", 86_400],
    ["hour", 3_600],
    ["minute", 60],
  ];
  for (const [unit, size] of units) {
    if (Math.abs(seconds) >= size) return relativeTime.format(Math.round(seconds / size), unit);
  }
  return "just now";
}
