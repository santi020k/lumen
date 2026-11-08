# Lu artwork

Lu’s approved 2.5D concept and animation poses were created with the built-in image-generation
tool on November 7, 2026. The ivory lantern, cyan trim and feet, and amber flame follow
[Lumen’s brand guidance](../../../docs/brand-guidelines.md#lu-mascot).

`lu-sprites.webp` is the canonical transparent atlas used by every consumer. It contains
eight columns and three rows of 320 × 352 cells. Idle and thinking each occupy six cells;
celebration occupies eight. Unused cells stay transparent. `lu-still.webp` is idle frame zero.

Frame timing and layout live in `../src/lu-manifest.json`, which is emitted with the player
and exported as `@santi020k/lumen/lu/manifest.json`. Update the manifest, artwork, tests, and
guide together if the animation contract changes. Preserve a shared scale and foot anchor
within each row, including the jump’s vertical displacement.

The player and stylesheet are opt-in. Keep mascot artwork out of the default component CSS,
token document, and component registry. Lu is brand artwork, not a multi-framework UI primitive.
