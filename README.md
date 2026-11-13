# github-chart-art

Write text on your GitHub contribution graph. The library works out how many weeks of the graph are free, picks a font that fits your text into them, and creates one back-dated commit for every cell that should light up.

```
    Nov Dec Jan Feb Mar  Apr May  Jun Jul Aug  Sep Oct Nov
Sun █···█·██···███·███··███·█·█·███··█···█·███·███·█··█·
Mon █···█·█·█···█··█·█···█··█·█·█····██·██·█·█·█·█·██·█·
Tue █···█·█·█···█··█·█···█··█·█·█····█·█·█·█·█·█·█·██·█·
Wed █·█·█·██····█··█·█···█··███·██···█·█·█·█·█·█·█·█·██·
Thu █·█·█·█·█···█··█·█···█··█·█·█····█···█·█·█·█·█·█·██·
Fri ██·██·█·█···█··█·█···█··█·█·█····█···█·█·█·█·█·█··█·
Sat █···█·██····█··███···█··█·█·███··█···█·███·███·█··█·
```

No dependencies. Needs Node 20 or newer and `git`.

## Quick start

```sh
git clone https://github.com/aleksandrio/github-chart-art.git
cd github-chart-art

# 1. See what it will look like. Nothing is written.
node bin/cli.js preview "WB to the Moon" --case upper

# 2. Create the commits in an empty repository of yours.
mkdir ../my-art && git -C ../my-art init
node bin/cli.js commit "WB to the Moon" --case upper --repo ../my-art

# 3. Push that repository to GitHub yourself.
```

## Options

| Option                    | What it does                                                                 |
| ------------------------- | ---------------------------------------------------------------------------- |
| `--case preserve`         | Keep the text as typed (default). `upper` and `lower` convert it             |
| `--font auto`             | Try the wide font, then the narrow one (default). Or force `wide` / `narrow` |
| `--align center`          | Where the text sits in the free space: `left`, `center` (default), `right`   |
| `--from 2026-06-01`       | Use the graph only from this day                                             |
| `--to 2026-09-30`         | Use the graph only up to this day                                            |
| `--weeks 20`              | Use only the most recent 20 weeks                                            |
| `--today 2026-11-13`      | Pretend today is this day                                                    |
| `--repo <dir>`            | `commit` only: the git repository to write to                                |
| `--per-cell 5`            | `commit` only: commits per lit day. More commits give a darker cell          |
| `--file chart-art.txt`    | `commit` only: the file the commits append to                                |

Both fonts have upper case, lower case, digits and `. , ! ? : ' - + / ♥`. Letters are 7 cells tall, one per weekday. The wide font is 5 cells wide per letter, the narrow one mostly 3.

## How the space is worked out

The graph on a profile shows 53 columns: it starts on the Sunday of the week that holds "one year ago" and ends on the current week. The library uses every whole week except the current one, because its days are still in the future. That gives 52 columns. `--from`, `--to` and `--weeks` shrink this range.

If the text does not fit, the command fails and says how many columns it needs.

## As a library

```js
import { commit, plan, preview } from 'github-chart-art';

const planned = plan('Hello', { case: 'preserve', weeks: 30, align: 'right' });
console.log(preview(planned));
console.log(planned.dates); // ['2026-04-19', ...] the days that get a commit

commit(planned, { repo: '/path/to/repo', perCell: 3 });
```

`plan` only computes. `commit` creates commits on the current branch of `repo` and never pushes.

## What GitHub needs before the art shows up

- The commits must be on the **default branch** of the repository.
- The commit **email** must belong to your GitHub account. Check `git config user.email` in the target repository.
- For a private repository, turn on **Private contributions** in "Contribution settings" above the graph. Without it only you see them.
- The graph updates with a delay of a few minutes. After a force push or a deleted repository, old cells can stay for a while.
- Existing activity on the same days blends into the picture. Use `--per-cell` to make the text darker than the background.
- The graph moves one column to the left every week, so the text slowly walks off the left edge. `--align right` keeps it visible longest.

To remove the art, delete the repository that holds the commits.

## Tests

```sh
npm test
```

## License

MIT
