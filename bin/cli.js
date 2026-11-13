#!/usr/bin/env node
import { parseArgs } from 'node:util';

import { commit, plan, preview } from '../src/index.js';

const HELP = `Write text on your GitHub contribution graph.

Usage:
  chart-art preview "<text>" [options]
  chart-art commit  "<text>" --repo <dir> [options]

Options:
  --case <preserve|upper|lower>   Letter case of the text (default: preserve)
  --font <auto|wide|narrow>       auto picks the widest font that fits (default)
  --align <left|center|right>     Where the text sits in the free space (default: center)
  --from <YYYY-MM-DD>             Use the graph only from this day
  --to <YYYY-MM-DD>               Use the graph only up to this day
  --weeks <n>                     Use only the most recent n weeks
  --today <YYYY-MM-DD>            Pretend today is this day

Only for commit:
  --repo <dir>                    Git repository to create the commits in
  --per-cell <n>                  Commits per lit day; more is darker (default: 1)
  --file <name>                   File the commits write to (default: chart-art.txt)
`;

function main() {
  const { values, positionals } = parseArgs({
    allowPositionals: true,
    options: {
      case: { type: 'string' },
      font: { type: 'string' },
      align: { type: 'string' },
      from: { type: 'string' },
      to: { type: 'string' },
      weeks: { type: 'string' },
      today: { type: 'string' },
      repo: { type: 'string' },
      'per-cell': { type: 'string' },
      file: { type: 'string' },
      help: { type: 'boolean', short: 'h' },
    },
  });

  const [command, ...words] = positionals;
  if (values.help || !command) return console.log(HELP);
  if (command !== 'preview' && command !== 'commit') throw new Error(`Unknown command "${command}". See --help.`);

  const planned = plan(words.join(' '), {
    case: values.case,
    font: values.font,
    align: values.align,
    from: values.from,
    to: values.to,
    today: values.today,
    weeks: values.weeks === undefined ? undefined : Number(values.weeks),
  });

  console.log(preview(planned));
  console.log(
    `\n${planned.font} font, ${planned.width} of ${planned.columns} weeks, ${planned.dates.length} days, ` +
      `${planned.dates[0] && [...planned.dates].sort()[0]} to ${[...planned.dates].sort().at(-1)}`,
  );

  if (command === 'commit') {
    const count = commit(planned, {
      repo: values.repo,
      file: values.file,
      perCell: values['per-cell'] === undefined ? 1 : Number(values['per-cell']),
    });
    console.log(`\nCreated ${count} commits in ${values.repo}. Push them to the default branch to see the graph change.`);
  }
}

try {
  main();
} catch (error) {
  console.error(`chart-art: ${error.message}`);
  process.exitCode = 1;
}
