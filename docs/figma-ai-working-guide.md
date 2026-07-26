# Lumen Figma Library — AI Working Guide

This is the operational guide for AI agents maintaining the Lumen Figma library. It records the
first-release baseline, the code sources of truth, safe editing conventions, audit procedures,
publishing workflow, and tool limitations discovered while preparing the library.

Use this guide for code-to-Figma library maintenance. For implementing a Figma design in code, use
[figma-design-to-code.md](figma-design-to-code.md) instead.

## File identity

- File: [Lumen UI Library](https://www.figma.com/design/luQW2pTQ3jGGxSFPAAsfa9)
- File key: `luQW2pTQ3jGGxSFPAAsfa9`
- Team/project: `Lumen`
- Published first-release entry: `Components published`
- Named release-candidate snapshot: `Lumen UI Library v0.1.0 — Release Candidate 1`

Treat the file key and Figma node IDs as opaque identifiers. Copy them exactly; never derive or
guess them.

## Required Figma workflow

Before any Figma Plugin API write:

1. Load the `figma-use` skill.
2. Load `figma-generate-library` when changing variables, styles, components, variants, or library
   structure.
3. Inspect the target nodes before editing.
4. Make the smallest coherent mutation.
5. Query the changed nodes again and visually inspect representative instances.

Do not create a new Figma file. Maintain the existing file above.

## Sources of truth

Use sources in this order:

| Concern                                     | Source of truth                                                                             |
| ------------------------------------------- | ------------------------------------------------------------------------------------------- |
| Public component catalog                    | [`registry/lumen.registry.json`](../registry/lumen.registry.json)                           |
| Figma component coverage and semantic roles | [`registry/figma-design-map.json`](../registry/figma-design-map.json)                       |
| Lumen product theme values                  | [`apps/docs/src/styles/global.css`](../apps/docs/src/styles/global.css)                      |
| Reusable package fallback theme             | [`packages/lumen/styles.css`](../packages/lumen/styles.css)                                 |
| Astro component appearance and behavior     | [`packages/astro`](../packages/astro)                                                       |
| Shared component contracts and metadata     | [`packages/core`](../packages/core)                                                         |
| santi020k theme values                      | `../website/src/styles/partials/tokens.css`                                                 |
| Figma integration and Code Connect          | [figma.md](figma.md), [`figma.config.json`](../figma.config.json), and [`figma/`](../figma) |
| Brand voice and visual guidance             | [brand-guidelines.md](brand-guidelines.md)                                                  |

Never assume the parent website tokens are unchanged because they matched during an earlier
release. Read the parent file again whenever syncing the `santi020k` modes. If the parent project
has intentionally changed, report the drift before rewriting a released Figma theme.

The Lumen Figma `Light` and `Dark` modes follow the product overrides in the docs app. The package
stylesheet is a reusable fallback and must not overwrite those product modes. Before changing color
variables, compare the registry contract, the resolved deployed theme, and Figma. Do not update the
contract and its source together merely to make a mismatch disappear.

## Release baseline

The published release is clean at the following baseline:

- 123 public component assets.
- 36 hidden icon-support components named `__IconAsset/*`.
- 159 top-level local component/component-set assets in total.
- 120 public assets with component properties.
- Three intentional property-free public assets: `ColorPicker`, `Slider`, and `GradientDivider`.
- 53 variables across three collections.
- 38 text styles.
- 8 effect styles.
- 59 nodes with prototype reactions and 63 reactions in total.
- No duplicate public asset names.
- No missing public component descriptions.
- No unused non-variant component properties.
- No visible detached solid paints.
- No variables missing descriptions or `WEB` code syntax.

After publication, the library panel reported `No changes`. The 123 public assets are the current
canonical component count; do not inflate that number with the 36 hidden icon components.

## Page organization

Keep the library ordered as follows:

1. `Cover`
2. `Getting Started`
3. `Foundations`
4. `Glass Components`
5. `Icons`
6. Page divider
7. `Components`
7. `Form Controls`
8. `Content Primitives`
9. `Navigation Primitives`
10. `Data Display`
11. `Overlays and Menus`
12. `Selection and Dates`
13. `Messaging and Layout`
14. `Rich Content and Tools`
15. Page divider
16. `Utilities`

New public components belong on the matching category page, inside the existing page frame and
layout system. Do not leave new components loose outside the page frame. Keep headings, explanatory
copy, specimen spacing, and component rows consistent with nearby sections.

Use:

- `Cover` for release identity and high-level status.
- `Getting Started` for consumption instructions and theme guidance.
- `Foundations` for color, radius, effect, typography, and theme specimens.
- `Icons` for the public icon specimen and icon guidance.
- Category pages for canonical component assets and their nearby specimens.
- `Utilities` for cross-cutting and helper primitives.

## Variables and themes

### Collections

`Color`

- 46 semantic and supporting color variables.
- Modes: `Light`, `Dark`, `santi020k Light`, and `santi020k Dark`.
- Every variable must have a useful description.
- Every variable must expose `WEB` syntax such as `var(--brand)`.
- Use suitable scopes such as text fill, shape fill, stroke, or effect color; do not leave variables
  on an unrestricted all-scopes setting without a reason.

`Radius`

- Four variables: `sm`, `md`, `lg`, and `full`.
- Mode: `Value`.
- `radius/full` must remain represented in the Foundations specimens.

`Effects`

- Three semantic shadow variables.
- Modes: `Light` and `Dark`.

### Theme ownership

- `Light` and `Dark` are the Lumen theme and must match `packages/lumen/styles.css`.
- `santi020k Light` and `santi020k Dark` must be checked against the parent website tokens.
- Do not alias Lumen Light to a santi020k mode or leave it on an older palette.
- Show all four color modes in Foundations with comparable preview cards.
- Test actual component instances in all four modes, not only color swatches.

The core Lumen semantic names are:

`canvas`, `surface`, `surface-muted`, `surface-strong`, `line`, `ink`, `ink-soft`, `ink-muted`,
`brand`, `brand-solid`, `brand-soft`, `accent`, `success`, `warning`, and `danger`.

The library also has the supporting `color/on-danger` variable:

- CSS equivalent: `--ui-on-danger`.
- Light modes use a dark foreground.
- Dark modes alias the canvas foreground.
- Use it for text and icons on solid danger surfaces.
- It is currently bound to destructive buttons and floating badges.

Do not hard-code a white foreground on danger fills. The light danger color does not provide
adequate contrast with white.

## Typography

- Runtime CSS default: `"Montserrat", "Avenir Next", "Segoe UI", sans-serif`.
- Current published Figma family: `Inter`.
- Code-only family: `Cascadia Mono`.
- Cascadia Mono is intentionally limited to the small amount of code-style text.
- The file contains 38 text styles.
- Figma expects the Inter style names `Semi Bold` and `Extra Bold`, not `SemiBold` or `ExtraBold`.

The runtime default and current Figma styles intentionally remain documented as separate states.
Do not silently rewrite Figma typography while syncing color tokens. Migrate the text styles only
as an explicit design-library change, then update styles, specimens, and this guide together.

## Effects and visual bindings

- The file contains 8 effect styles.
- Component fills, strokes, radii, and effects should bind to local variables or styles.
- Hidden accessibility labels may still be bound to semantic colors; hidden does not mean detached.
- QR codes should use `ink` for the modules and `canvas` for the background.
- Code-window traffic lights use `danger`, `warning`, and `success`.
- Skeleton and Spinner accessibility text uses a semantic ink token.
- Icon strokes nested inside destructive components must use `color/on-danger`, not a detached
  solid paint.

When auditing paints, distinguish intentionally non-solid content such as gradients and images from
detached solid colors. The release baseline had zero visible detached solid paints.

## Public components and hidden support assets

A canonical public asset is:

- A `COMPONENT_SET`, or
- A `COMPONENT` whose parent is not a `COMPONENT_SET`,
- Excluding names beginning with `__`.

The 36 `__IconAsset/*` components are private instance-swap dependencies. They make icon properties
work without adding 36 separate icons to the public component count. Keep them hidden and exclude
them from catalog coverage reports.

Do not count individual variants inside a component set as separate public assets.

## Component API conventions

- Mirror meaningful code props with Figma variant, text, boolean, or instance-swap properties.
- Use code-facing names and values. Example: `Variant=Destructive, Size=Sm` maps to
  `<Button variant="destructive" size="sm" />`.
- Bind every non-variant component property to at least one real descendant property.
- Remove dead properties that cannot affect the component.
- Keep component descriptions concise and include the relevant code component or prop vocabulary.
- Prefer component sets for state, size, orientation, and visual-variant axes.
- Use instance swaps for replaceable controls or icons.
- Use booleans for optional, show/hide, loading, and disabled content.
- Use text properties for editable labels, placeholders, titles, descriptions, and helper text.

Figma refuses to publish components with unused properties. During the first release, the following
were corrected:

- `Mentions`: bound `Placeholder`; removed the unused `Trigger` text property.
- `BackToTop`: bound `Text` in both state variants.
- `SkipLink`: bound `Text` in both state variants.
- `LanguageToggle`: bound `Label` in both state variants.

Do not recreate those dead bindings.

## Intentional property-free assets

`ColorPicker`, `Slider`, and `GradientDivider` intentionally have no properties in the release.
Their current artwork does not contain a meaningful editable text or swap target, and the available
Plugin API does not provide a general slot property. Do not add decorative or fake properties only
to make the property count non-zero.

## Prototyping and interactions

Interactive primitives should contain representative prototype behavior when the state transition
can be expressed safely in the library:

- Toggles and switches change state.
- Disclosures expand and collapse.
- Tabs switch the active tab.
- Selection controls change selected state.
- Menus and overlays open or reveal a representative panel.
- Theme controls demonstrate their mode/state behavior.
- Reveal-oriented utilities show the intended transition.

The release baseline contains 63 reactions on 59 nodes. This is not a
requirement that every component be interactive; static display primitives should remain static.

After editing reactions, test them in Present mode and confirm there are no links to temporary QA
pages or deleted nodes.

## Visual QA

For any theme or shared component change:

1. Create a temporary QA page or frame.
2. Place actual component instances, not reconstructed lookalikes.
3. Render the same grid in all four Color modes.
4. Compare backgrounds, borders, primary text, muted text, brand actions, status colors, and danger
   surfaces.
5. Inspect focus, disabled, hover, selected, and open states where available.
6. Check text and icons on solid danger fills.
7. Delete the temporary QA page after the audit.

The release QA page was named `__Release QA` and was removed. A page with that name in the final
file is stale test material and should not be published.

## Reusable Plugin API audit

Run a structural audit before publication. The following pattern correctly counts public and hidden
assets and detects unused component properties:

```js
const startPage = figma.currentPage;
const seen = new Set();
const assets = [];

for (const page of figma.root.children) {
  await figma.setCurrentPageAsync(page);

  for (const node of page.findAllWithCriteria({
    types: ["COMPONENT", "COMPONENT_SET"],
  })) {
    if (node.type === "COMPONENT" && node.parent?.type === "COMPONENT_SET")
      continue;
    if (seen.has(node.id)) continue;

    seen.add(node.id);
    const definitions = node.componentPropertyDefinitions || {};
    const usedKeys = new Set();

    for (const descendant of node.findAll()) {
      for (const key of Object.values(
        descendant.componentPropertyReferences || {},
      )) {
        usedKeys.add(key);
      }
    }

    const unused = Object.entries(definitions)
      .filter(([, value]) => value.type !== "VARIANT")
      .map(([key]) => key)
      .filter((key) => !usedKeys.has(key));

    assets.push({
      id: node.id,
      name: node.name,
      hidden: node.name.startsWith("__"),
      description: node.description || "",
      unused,
    });
  }
}

await figma.setCurrentPageAsync(startPage);

return {
  total: assets.length,
  public: assets.filter((asset) => !asset.hidden).length,
  hidden: assets.filter((asset) => asset.hidden).length,
  missingDescriptions: assets
    .filter((asset) => !asset.hidden && !asset.description)
    .map((asset) => asset.name),
  unusedProperties: assets
    .filter((asset) => asset.unused.length)
    .map((asset) => ({ name: asset.name, keys: asset.unused })),
};
```

Expected release result:

```json
{
  "total": 159,
  "public": 123,
  "hidden": 36,
  "missingDescriptions": [],
  "unusedProperties": []
}
```

Also audit:

- Variable count and collection modes.
- Missing variable descriptions.
- Missing `codeSyntax.WEB`.
- Text-style and effect-style counts.
- Duplicate public names.
- Detached visible solid paints.
- Reaction node and reaction counts.
- Temporary pages and legacy specimens.

## Plugin API limitations and gotchas

- Use `await figma.setCurrentPageAsync(page)` to change pages.
- `loadAllPagesAsync` is not supported.
- `figma.getLocalComponentsAsync()` is not available in this environment.
- `figma.saveVersionHistoryAsync()` is not available.
- `PageNode.backgrounds` cannot be bound to variables. Figma throws
  `page backgrounds cannot be bound to variables`. Set every library page background to the exact
  resolved `color/surface-muted` Light RGB value instead, and re-sync it whenever that token
  changes. The first-release Light value is `#F3F4F6`; `#F5F5F5` is a stale canvas value.
- Version-history snapshots and library publication must be completed through the Figma UI.
- `figma.getNodeByIdAsync(id)` is file-wide. Calling it once for every page can produce duplicate
  audit output unless results are deduplicated.
- Preserve the starting page and restore it after a multi-page audit.
- Do not reuse stale accessibility element indexes when automating Figma in a browser. Query the
  current UI state after each action.
- Publication can take time. Wait for the progress counter to finish, then reopen the dialog and
  confirm it reports `Unchanged`.

## Publishing workflow

Before publishing:

1. Confirm the public catalog is 123/123 against the registry.
2. Confirm no invalid assets, unused properties, missing descriptions, or duplicate names.
3. Confirm all intended variables, styles, and assets are selected.
4. Run four-mode visual QA.
5. Run the repository validations below.
6. Add concise release notes.

Figma UI paths:

- Version history: file-name menu → `Show version history` → `Add to version history`.
- Library publication: file-name menu → `Publish library…`.

If the publish dialog shows `Invalid assets`, expand it and fix every listed item. Do not publish by
excluding a canonical component to bypass validation.

After publishing:

1. Wait until the publishing progress completes.
2. Reopen `Publish library…`.
3. Confirm the dialog reports all intended items as `Unchanged`.
4. Check version history for the publication entry.
5. Remove temporary QA material.

## Code Connect

The local Code Connect setup uses the HTML parser, language `html`, and label `Lumen Astro`.

The initial templates are:

| Component | Figma node | Template                                            |
| --------- | ---------- | --------------------------------------------------- |
| Button    | `6:69`     | [`figma/Button.figma.ts`](../figma/Button.figma.ts) |
| Input     | `14:21`    | [`figma/Input.figma.ts`](../figma/Input.figma.ts)   |
| Field     | `14:22`    | [`figma/Field.figma.ts`](../figma/Field.figma.ts)   |
| Card      | `14:27`    | [`figma/Card.figma.ts`](../figma/Card.figma.ts)     |
| Tabs      | `355:43`   | [`figma/Tabs.figma.ts`](../figma/Tabs.figma.ts)     |
| Dialog    | `45:12`    | [`figma/Dialog.figma.ts`](../figma/Dialog.figma.ts) |

Validate locally:

```bash
pnpm exec figma connect parse --config figma.config.json
pnpm exec tsc -p figma/tsconfig.json
```

The templates parse and typecheck at the first-release baseline. Live Code Connect publication is
account-gated: Figma requires an Organization or Enterprise plan and a Dev or Full seat. A
published component library alone does not remove that requirement.

Do not treat this plan limitation as a broken template. Preserve the local mappings so they can be
published immediately after the account is eligible.

## Repository validation

From the repository root:

```bash
pnpm exec figma connect parse --config figma.config.json
pnpm exec tsc -p figma/tsconfig.json
pnpm run check:registry
pnpm --filter @santi020k/lumen test
pnpm --filter @santi020k/lumen typecheck
```

For a broad component or token release, also run:

```bash
pnpm run validate
```

If components, tokens, or `llms.txt` change, regenerate the MCP snapshot:

```bash
pnpm --filter @santi020k/lumen-mcp run generate
```

Documentation-only changes do not need a changeset. User-visible package changes normally do.

## Change checklist

- [ ] Read `git status --short` and preserve unrelated work.
- [ ] Read the current code component and token sources.
- [ ] Compare the Figma asset to nearby canonical components.
- [ ] Keep the asset inside the correct page frame.
- [ ] Use semantic variables and published styles.
- [ ] Add only meaningful component properties.
- [ ] Bind every non-variant property.
- [ ] Add representative interactions when behavior benefits from a prototype.
- [ ] Test representative instances in all four Color modes.
- [ ] Check accessibility contrast, focus, and disabled states.
- [ ] Run the structural Figma audit.
- [ ] Run repository validation.
- [ ] Publish only when the dialog has no invalid assets.
- [ ] Confirm the post-publication dialog reports `Unchanged`.
- [ ] Update this guide if the workflow or release baseline changes.
