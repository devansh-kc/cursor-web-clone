export function formatDistanceToNow(timeStamp: number): string {
  const timeStampDate = new Date(timeStamp);
  const diff =
    Date.now() -
    (timeStampDate instanceof Date ? timeStampDate.getTime() : timeStampDate);
  const absSeconds = Math.floor(Math.abs(diff) / 1000);
  const suffix = diff >= 0 ? "ago" : "from now";

  if (absSeconds < 60) return `less than a minute ${suffix}`;

  const units = [
    { label: "year", seconds: 31536000 },
    { label: "month", seconds: 2592000 },
    { label: "day", seconds: 86400 },
    { label: "hour", seconds: 3600 },
    { label: "minute", seconds: 60 },
  ];

  for (const { label, seconds } of units) {
    const value = Math.floor(absSeconds / seconds);
    if (value >= 1) return `${value} ${label}${value > 1 ? "s" : ""} ${suffix}`;
  }

  return `less than a minute ${suffix}`;
}
