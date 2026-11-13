import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { test } from 'node:test';

import { calendar, commit, fit, fonts, plan, preview, render } from '../src/index.js';

test('every glyph is 7 rows of equal width, drawn with # and .', () => {
  for (const [fontName, glyphs] of Object.entries(fonts)) {
    for (const [ch, rows] of glyphs) {
      assert.equal(rows.length, 7, `${fontName} "${ch}" row count`);
      for (const row of rows) {
        assert.equal(row.length, rows[0].length, `${fontName} "${ch}" row width`);
        assert.match(row, /^[#.]+$/, `${fontName} "${ch}" characters`);
      }
    }
  }
});

test('both fonts cover upper case, lower case and digits', () => {
  const required = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  for (const [fontName, glyphs] of Object.entries(fonts)) {
    for (const ch of required) assert.ok(glyphs.has(ch), `${fontName} "${ch}"`);
  }
});

test('render joins letters with one empty column', () => {
  assert.deepEqual(render('WB', { font: 'narrow' }), [
    '#...#.##.',
    '#...#.#.#',
    '#...#.#.#',
    '#.#.#.##.',
    '#.#.#.#.#',
    '##.##.#.#',
    '#...#.##.',
  ]);
});

test('fit prefers the wide font and falls back to narrow with tighter word gaps', () => {
  assert.equal(fit('WB', { columns: 52 }).font, 'wide');

  const moon = fit('WB TO THE MOON', { columns: 51 });
  assert.equal(moon.font, 'narrow');
  assert.equal(moon.wordSpacing, 2);
  assert.equal(moon.width, 51);
});

test('fit says how many columns are missing', () => {
  assert.throws(() => fit('WB TO THE MOON', { columns: 40 }), /needs at least 51 columns, but only 40/);
});

test('unknown characters are named', () => {
  assert.throws(() => render('a€b'), /no glyph for: €/);
});

test('calendar covers whole weeks from one year ago to last Saturday', () => {
  const space = calendar({ today: '2026-11-13' });
  assert.equal(new Date(space.start).toISOString().slice(0, 10), '2025-11-09');
  assert.equal(space.columns, 52);
});

test('calendar honours from, to and weeks', () => {
  const ranged = calendar({ today: '2026-11-13', from: '2026-06-03', to: '2026-08-22' });
  assert.equal(new Date(ranged.start).toISOString().slice(0, 10), '2026-06-07');
  assert.equal(ranged.columns, 11);

  const recent = calendar({ today: '2026-11-13', weeks: 10 });
  assert.equal(new Date(recent.start).toISOString().slice(0, 10), '2026-08-30');
  assert.equal(recent.columns, 10);
});

test('plan maps lit cells to dates, column by week and row by weekday', () => {
  const planned = plan('wb', { today: '2026-11-13', from: '2026-06-07', case: 'upper', font: 'narrow', align: 'left' });
  assert.equal(planned.dates.length, 32);
  assert.equal(planned.dates[0], '2026-06-07');
  assert.ok(planned.dates.includes('2026-07-19'), 'top-left of B, six weeks in');
  assert.ok(!planned.dates.includes('2026-06-15'), 'gap inside W');
});

test('plan aligns the text inside the free space', () => {
  const options = { today: '2026-11-13', font: 'narrow' };
  assert.equal(plan('WB', { ...options, align: 'left' }).offset, 0);
  assert.equal(plan('WB', { ...options, align: 'center' }).offset, 21);
  assert.equal(plan('WB', { ...options, align: 'right' }).offset, 43);
});

test('preview draws the whole range with labels', () => {
  const lines = preview(plan('Hi', { today: '2026-11-13', weeks: 12 })).split('\n');
  assert.equal(lines.length, 8);
  assert.match(lines[0], /Sep/);
  assert.equal(lines[1].length, 'Sun '.length + 12);
});

test('commit writes one dated commit per lit day', () => {
  const repo = mkdtempSync(join(tmpdir(), 'chart-art-'));
  const git = (...args) => execFileSync('git', args, { cwd: repo, encoding: 'utf8' });
  git('init', '--quiet');
  git('config', 'user.email', 'test@example.com');
  git('config', 'user.name', 'Test');

  const planned = plan('i', { today: '2026-11-13', align: 'left' });
  assert.equal(commit(planned, { repo, perCell: 2 }), 12);

  const days = git('log', '--format=%ad', '--date=format:%Y-%m-%d').trim().split('\n');
  assert.equal(days.length, 12);
  assert.deepEqual([...new Set(days)].sort(), [...planned.dates].sort());
});
