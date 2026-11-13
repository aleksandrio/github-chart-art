import { fonts } from './fonts.js';

export const ROWS = 7;

/** Draw `text` with one font. Returns 7 strings of `#` (commit) and `.` (empty). */
export function render(text, { font = 'wide', letterSpacing = 1, wordSpacing = 3 } = {}) {
  const glyphs = fonts[font];
  if (!glyphs) throw new Error(`Unknown font "${font}". Use one of: ${Object.keys(fonts).join(', ')}.`);

  const words = text.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) throw new Error('The text is empty.');

  const missing = [...new Set([...words.join('')].filter((ch) => !glyphs.has(ch)))];
  if (missing.length > 0) {
    throw new Error(`The "${font}" font has no glyph for: ${missing.join(' ')}`);
  }

  const rows = [];
  for (let r = 0; r < ROWS; r++) {
    rows.push(
      words
        .map((word) => [...word].map((ch) => glyphs.get(ch)[r]).join('.'.repeat(letterSpacing)))
        .join('.'.repeat(wordSpacing)),
    );
  }
  return rows;
}

const WORD_SPACINGS = [3, 2];

/**
 * Pick the most readable variant that fits into `columns`.
 * With `font: 'auto'` the wide font is tried first, then the narrow one.
 */
export function fit(text, { columns, font = 'auto', letterSpacing = 1, wordSpacing } = {}) {
  const fontNames = font === 'auto' ? ['wide', 'narrow'] : [font];
  const wordSpacings = wordSpacing === undefined ? WORD_SPACINGS : [wordSpacing];

  let smallest = Infinity;
  for (const name of fontNames) {
    for (const spacing of wordSpacings) {
      const rows = render(text, { font: name, letterSpacing, wordSpacing: spacing });
      const width = rows[0].length;
      if (width <= columns) return { rows, width, font: name, letterSpacing, wordSpacing: spacing };
      smallest = Math.min(smallest, width);
    }
  }

  throw new Error(
    `"${text}" needs at least ${smallest} columns, but only ${columns} are available. ` +
      'Shorten the text or widen the date range.',
  );
}
