import { addDays, calendar, formatDay } from './calendar.js';
import { ROWS, fit } from './layout.js';

export { calendar } from './calendar.js';
export { commit } from './commit.js';
export { fonts } from './fonts.js';
export { fit, render } from './layout.js';

const CASES = {
  preserve: (text) => text,
  upper: (text) => text.toUpperCase(),
  lower: (text) => text.toLowerCase(),
};

/**
 * Lay `text` out on the contribution graph and return the days that need a commit.
 *
 * Options: `case` (preserve | upper | lower), `font` (auto | wide | narrow),
 * `align` (left | center | right), `today`, `from`, `to`, `weeks`,
 * `letterSpacing`, `wordSpacing`.
 */
export function plan(text, options = {}) {
  const { case: textCase = 'preserve', align = 'center' } = options;
  if (!CASES[textCase]) throw new Error(`Unknown case "${textCase}". Use preserve, upper or lower.`);

  const space = calendar(options);
  const art = fit(CASES[textCase](text), { ...options, columns: space.columns });

  const free = space.columns - art.width;
  const offsets = { left: 0, center: Math.floor(free / 2), right: free };
  if (!(align in offsets)) throw new Error(`Unknown align "${align}". Use left, center or right.`);
  const offset = offsets[align];

  const dates = [];
  for (let col = 0; col < art.width; col++) {
    for (let row = 0; row < ROWS; row++) {
      if (art.rows[row][col] === '#') dates.push(formatDay(addDays(space.start, (offset + col) * 7 + row)));
    }
  }

  return {
    ...art,
    columns: space.columns,
    offset,
    start: formatDay(space.start),
    dates,
  };
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

/** A text picture of the graph for the terminal, with month and weekday labels. */
export function preview(planned, { on = '█', off = '·' } = {}) {
  const header = Array(planned.columns + 3).fill(' ');
  let lastMonth = -1;
  for (let col = 0; col < planned.columns; col++) {
    const month = new Date(addDays(Date.parse(planned.start), col * 7)).getUTCMonth();
    if (month !== lastMonth) [...MONTHS[month]].forEach((ch, i) => (header[col + i] = ch));
    lastMonth = month;
  }

  const lines = [`    ${header.join('').trimEnd()}`];
  for (let row = 0; row < ROWS; row++) {
    const cells = '.'.repeat(planned.offset) + planned.rows[row];
    const line = cells.padEnd(planned.columns, '.').replaceAll('#', on).replaceAll('.', off);
    lines.push(`${DAYS[row]} ${line}`);
  }
  return lines.join('\n');
}
