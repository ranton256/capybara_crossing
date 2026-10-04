# Capybara Crossing

The second project in a spec-driven development course, after Dock Bot. You will
build a small retro arcade game in plain JavaScript — guide a pixel-art capybara
across a jungle road to a mud spa — working from a written specification rather
than from instructions.

This branch is your starting point. It contains the spec and the artwork. There
is no code yet; writing it is the exercise.

## What's here

```
Capybara Crossing.md    the specification: read this first
assets/sprites/         a 128x128 sprite atlas plus a frame map and palette
```

## What you'll do

1. **Set up your tools.** Install and configure Claude Code and OpenSpec
   yourself. That setup is deliberately not committed here — doing it is part of
   the exercise.
2. **Read the spec properly**, including the two sections that are easy to skim
   past:
   - **Fixed Parameters** near the top gives you the board size, canvas size,
     spawn cell, starting lives, lane speeds, and timing values. These are
     given. Do not redesign them.
   - **Optional features** at the end is a list of things *not* to build. Leave
     the countdown timer, difficulty scaling, audio, and high scores alone
     unless you are explicitly asked for them.
3. **Plan before you code.** Turn the spec into a sequence of small changes, and
   write the plan down before implementing any of it.
4. **Build the game**, keeping it to three files with no dependencies:
   `index.html`, `style.css`, and `game.js`.

## Two things about the assets

**`manifest.json` is a reference for you, not for the game.** It maps every
sprite name to its rectangle in the atlas. Copy the rectangles you need into
your code as constants. Do not fetch it at runtime: the game has to run when
`index.html` is opened straight off disk, and browsers block `fetch`,
`XMLHttpRequest`, and `<script type="module">` over `file://`. Load the atlas
PNG through an `<img>` element, which does work.

**The tiles have their edges baked in.** `tile_start` carries its grass band in
the top row only, and `tile_path` has road shoulders in its top and bottom rows.
Use one road row per lane. All vehicle art faces left, so mirror it when drawing
a lane that travels right.

## Getting the game to run

Once you have written `index.html`, open it directly — double-click it, or:

```bash
open index.html        # macOS
xdg-open index.html    # Linux
start index.html       # Windows (cmd)
```

No server, no build step, no `npm install` required to play.

## Other branches

`trial-zero` and `trial-run` are two complete reference implementations built
from this same spec. **They are full solutions.** Read them after you have
built your own, not before — comparing your approach to theirs is worth far
more than copying either.

## License and third-party files

This repository is MIT licensed — see [LICENSE](LICENSE). The spec, the game
code, the assets, and the tooling here are original work.

`.claude/skills/openspec-*/` and `.claude/commands/opsx/` are **not** original:
they are installed by the [OpenSpec](https://github.com/Fission-AI/openspec)
CLI and are MIT licensed, Copyright (c) 2024 OpenSpec Contributors. They are
kept in the repository so the change workflow that built this branch can be
read and re-run.
