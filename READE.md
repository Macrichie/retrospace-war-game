# Space Invaders

A browser-based arcade game built with vanilla HTML, CSS, JavaScript, and Canvas. Includes progressive levels, destructible shields, UFO bonuses, sound effects, and a high score saved in browser storage.

## Play

Open `public/index.html` in a modern browser. No installation or build step is required.

| Control | Action |
| --- | --- |
| Left / Right or A / D | Move |
| Space or Up | Fire |
| P | Pause / resume |
| Enter | Start, restart, or resume |

Touch controls are also supported on the game canvas.

## Files

- `public/index.html`: game screen and menus.
- `public/style.css`: layout and visual styling.
- `public/script.js`: gameplay, rendering, audio, and controls.
- `generate_game.py`: optional Claude Agent SDK script that generates the game files.
- `vercel.json`: static deployment settings; serves only `public/` and skips installation and building.

## Deploy

On Vercel, use the repository root as the project's Root Directory. The included `vercel.json` configures a static site. Push these changes and redeploy.

## Optional generation script

Requires Python 3.14+, `uv`, and configured Claude Agent SDK authentication. The script loads environment settings from `.env` and can overwrite the game files in `public/`.

```sh
uv sync
uv run generate_game.py
```
