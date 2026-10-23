## Lumen 4.3 highlights

Lumen 4.3 adds Tailwind CSS v4 as an optional complement to the web component library.
Existing applications can keep their standalone CSS setup and component APIs unchanged.

### Semantic utilities

The umbrella, Astro, React, and Elements packages expose `tailwind.css`. Import it after Tailwind
and the matching Lumen stylesheet, with `layers.css` first. The bridge maps all 17 semantic color
roles to utilities such as `bg-surface`, `text-ink`, `border-line`, and `bg-brand/10`.
Inline theme aliases resolve at each element, so nested Lumen themes stay synchronized.
The bridge does not import Tailwind, Preflight, or component CSS and adds no runtime dependency.

`lumen init --framework astro|react|elements --tailwind` includes the bridge in its setup output.
The [Tailwind guide](https://lumen.santi020k.com/docs/web/tailwind) covers framework installation,
responsive customization, local themes, public styling hooks, source detection, and optional
Preflight. The documentation site consumes the same bridge.

### Adoption and compatibility

Only applications using Tailwind v4 should import `tailwind.css`; it requires Tailwind's CSS
processing. Keep the four imports together in a single global stylesheet. Remove duplicate
component stylesheet imports from JavaScript if they load before the layer prelude.
Applications with existing semantic Tailwind aliases can adopt the bridge instead of maintaining
the same mappings. Review intentional custom mappings before replacing them.

No component migration or data migration is required. Tailwind v3 consumers should retain their
existing setup or migrate Tailwind before adopting this v4 bridge. Native adapters do not use it.

### Package versions

The umbrella, Astro, React, Elements, and MCP packages are prepared at 4.3.0. Core remains at 4.1.0;
React Native and React Hook Form remain at 4.0.1; tokens, brand icons, and Compose remain at 4.0.0.
Swift uses the repository's release tag without a native API change. Hosted MCP, plugin directory,
and store delivery remain separate from local package preparation.

### Verification and recovery

Compiler tests load each adapter's exported styles and cover semantic colors, opacity, responsive
utilities, a setup without Preflight, and the standalone path. Browser checks cover responsive
component overrides, root and nested themes, keyboard focus, code tabs, and accessibility at phone
and desktop widths. Package checks verify the distributable contents.

To roll back adoption, restore the prior package versions and lockfile, remove the optional bridge
import, and restore any application-owned color aliases that were replaced. Existing standalone
Lumen consumers require no rollback change. Published corrections use a new version; do not replace
a published tag. Release publication must run through the repository's GitHub workflow.
