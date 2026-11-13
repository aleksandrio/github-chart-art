import { execFileSync } from 'node:child_process';
import { appendFileSync } from 'node:fs';
import { join } from 'node:path';

/**
 * Create the commits of a plan on the current branch of `repo`. Nothing is pushed.
 *
 * `perCell` commits are made for every lit day: more commits give a darker cell,
 * which helps when the account already has activity on those days.
 */
export function commit(planned, { repo, file = 'chart-art.txt', perCell = 1, message = 'chart art' } = {}) {
  if (!repo) throw new Error('Pass the path of a git repository as `repo`.');
  if (!Number.isInteger(perCell) || perCell < 1) throw new Error('`perCell` must be a whole number, 1 or more.');

  const git = (args, env = {}) =>
    execFileSync('git', args, { cwd: repo, env: { ...process.env, ...env }, stdio: ['ignore', 'pipe', 'pipe'] });

  git(['rev-parse', '--is-inside-work-tree']);

  let count = 0;
  for (const date of [...planned.dates].sort()) {
    for (let i = 0; i < perCell; i++) {
      // Noon UTC stays on the same calendar day in every time zone GitHub may use.
      const stamp = `${date}T12:${String(Math.floor(i / 60) % 60).padStart(2, '0')}:${String(i % 60).padStart(2, '0')}Z`;
      appendFileSync(join(repo, file), `${date} ${i + 1}\n`);
      git(['add', '--', file]);
      git(['commit', '--quiet', '--no-verify', '-m', `${message}: ${date}`], {
        GIT_AUTHOR_DATE: stamp,
        GIT_COMMITTER_DATE: stamp,
      });
      count++;
    }
  }
  return count;
}
