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
- `ANIMATION_SEQUENCE` controls which rules run and in what order. Reorder its entries, delete an entry, or add one that provides a unique `id` and `createOrder` function.
- Each `createOrder` function must return all 880 one-based `{ column, row }` coordinates exactly once. The runtime validates this and reports an error if a new rule misses or repeats a cell.
- `PLAYBACK.dotCountMin`, `dotCountMax`, `dotBlinkMs`, and `dotBlinkCount` control the random Dots phase.

The reference assets remain independent: `Background.svg` is the fixed layer, `Cell.svg` is reused for all 880 Cells, and the three `Dot-*.svg` files are selected randomly during each Dots phase.
