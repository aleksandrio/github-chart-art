const DAY = 24 * 60 * 60 * 1000;

/** 'YYYY-MM-DD' or Date -> UTC midnight in ms. A Date is read in local time. */
export function toDay(value) {
  if (value instanceof Date) {
    return Date.UTC(value.getFullYear(), value.getMonth(), value.getDate());
  }
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(value));
  if (!match) throw new Error(`Expected a date as YYYY-MM-DD, got "${value}".`);
  return Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
}

export function formatDay(ms) {
  return new Date(ms).toISOString().slice(0, 10);
}

export function addDays(ms, days) {
  return ms + days * DAY;
}

const weekday = (ms) => new Date(ms).getUTCDay();
const sundayOnOrBefore = (ms) => addDays(ms, -weekday(ms));
const sundayOnOrAfter = (ms) => addDays(ms, (7 - weekday(ms)) % 7);

/**
 * The space the text can use: whole weeks (columns) of the contribution graph.
 *
 * The graph starts on the Sunday of the week that holds "one year ago" and ends
 * on the current week. The current week is left out, because its days are still
 * in the future. `from` / `to` narrow the range, `weeks` keeps the most recent N.
 */
export function calendar({ today = new Date(), from, to, weeks } = {}) {
  const now = toDay(today);
  const nowDate = new Date(now);
  const yearAgo = Date.UTC(nowDate.getUTCFullYear() - 1, nowDate.getUTCMonth(), nowDate.getUTCDate());

  let start = sundayOnOrBefore(yearAgo);
  let end = sundayOnOrBefore(now); // exclusive: the Sunday of the current week

  if (from !== undefined) start = Math.max(start, sundayOnOrAfter(toDay(from)));
  if (to !== undefined) end = Math.min(end, sundayOnOrBefore(addDays(toDay(to), 1)));

  let columns = Math.max(0, Math.round((end - start) / (7 * DAY)));
  if (weeks !== undefined && weeks < columns) {
    start = addDays(start, (columns - weeks) * 7);
    columns = weeks;
  }
  if (columns === 0) throw new Error('The date range holds no whole week of the contribution graph.');

  return { start, columns };
}
