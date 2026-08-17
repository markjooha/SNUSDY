# Moving Poster

Run `index.html` from a local static server (rather than opening it directly) so the asset paths behave consistently:

```sh
cd 1_moving-poster
python3 -m http.server 8080
```

Then open `http://localhost:8080`.

## Editing the animation cycle

All animation controls are at the top of `script.js`.

- `PLAYBACK.cellIntervalMs` controls the delay between individual cells. It is set to `150`, so each Cell appears at a 0.15-second interval. Including the 4-second Dots sequence, one scene lasts roughly 136 seconds.
- `ANIMATION_SEQUENCE` contains all 15 rules. It is shuffled once at the beginning of every cycle, then every entry plays exactly once before the next reshuffle. Add a scene with a unique `id` and `createOrder` function to this list.
- Each `createOrder` function must return all 880 one-based `{ column, row }` coordinates exactly once. The runtime validates this and reports an error if a new rule misses or repeats a cell.
- `PLAYBACK.dotCountMin`, `dotCountMax`, `dotBlinkMs`, and `dotBlinkCount` control the random Dots phase.

Each cycle contains 15 scenes: diagonal, horizontal, vertical, centre ripple, four-corner growth, spiral, zigzag, diamond, X expansion, horizontal and vertical curtains, checkerboard, random cluster growth, sine wave, and quadrant cycle. All 15 are newly randomised each cycle; no scene repeats or is skipped within a cycle.

## Previewing one rule

The normal URL plays a complete 15-scene cycle. Add `?scene=<id>` to repeat one scene while reviewing it, for example `index.html?scene=spiral`. Add `&interval=<milliseconds>` to accelerate only that preview; for example, `index.html?scene=spiral&interval=20` uses 20ms per Cell. The default URL remains 150ms per Cell. Valid IDs are the values in `ANIMATION_SEQUENCE`, including `centre-ripple`, `four-corners`, `spiral`, `zigzag`, `diamond`, `x-expansion`, `horizontal-curtain`, `vertical-curtain`, `checkerboard`, `cluster-growth`, `sine-wave`, and `quadrant-cycle`.

The reference assets remain independent: `Background.svg` is the fixed layer, `Cell.svg` is reused for all 880 Cells, and the three `Dot-*.svg` files are selected randomly during each Dots phase.
