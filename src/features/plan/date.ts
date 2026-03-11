export function pad2(n: number) {
  return String(n).padStart(2, '0');
}

export function toYmd(d: Date) {
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}

export function parseYmd(ymd: string) {
  const [y, m, d] = ymd.split('-').map((x) => Number(x));
  return new Date(y, (m ?? 1) - 1, d ?? 1);
}

export function addDays(d: Date, days: number) {
  const x = new Date(d);
  x.setDate(x.getDate() + days);
  return x;
}

export function startOfDay(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

export function daysBetweenInclusive(from: Date, to: Date) {
  const a = startOfDay(from).getTime();
  const b = startOfDay(to).getTime();
  const diff = Math.floor((b - a) / (24 * 3600 * 1000));
  return diff >= 0 ? diff + 1 : 0;
}


