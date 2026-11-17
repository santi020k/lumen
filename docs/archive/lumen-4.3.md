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

### Reading, motion, and maintenance fixes

Anchor highlighting follows native fragment positions, including root scroll padding, heading
scroll margins, text resizing, short documents, and malformed fragment escapes. Pill labels wrap
within narrow containers, their counts stay together, and linked foregrounds retain contrast.
React reveal components use the latest visibility entry in each observer batch. Configured
visibility thresholds retain their existing behavior; the viewport-entry proposal is deferred.
React Native date fields use the supported Android selection callback, so canceling a picker
does not commit the original value. The existing datetimepicker peer range remains supported.
Compose updates Google's libphonenumber to 9.0.42 for current phone-number metadata.
The responsive documentation navigation stays directly beneath the header while scrolling.

MCP rejects whitespace-padded record keys instead of silently merging distinct entries. Social
images use content-versioned URLs, and the maintained ESLint configuration owns Astro parsing.
Compatible dependency updates preserve the Expo SDK 57 React and native dependency family,
including its renderer and types. Updating that family requires a coordinated SDK upgrade.

### Adoption and compatibility

Only applications using Tailwind v4 should import `tailwind.css`; it requires Tailwind's CSS
processing. Keep the four imports together in a single global stylesheet. Remove duplicate
component stylesheet imports from JavaScript if they load before the layer prelude.
Applications with existing semantic Tailwind aliases can adopt the bridge instead of maintaining
the same mappings. Review intentional custom mappings before replacing them.

No component migration or data migration is required. MCP clients must send canonical record keys
without surrounding whitespace; trim and detect duplicates before constructing catalog maps. Tailwind v3 consumers should retain their
existing setup or migrate Tailwind before adopting this v4 bridge. Native adapters do not use it.

### Package versions

The umbrella, Astro, React, Elements, Core, and MCP packages are prepared at 4.3.0;
React Native is prepared at 4.0.2 with the Android date selection fix. Compose and Wear are
prepared at 4.0.1 with the phone-metadata update. React Hook Form remains at 4.0.1;
tokens and brand icons remain at 4.0.0.
Swift uses the repository's release tag without a native API change. Hosted MCP, plugin directory,
and store delivery remain separate from local package preparation.

### Release dependency security

Release qualification updates Vite to 8.3.5, Next.js to 16.4.2, the MCP server/client SDK to 2.3.1,
and the MCP Express adapter to 2.0.2. These address the security findings in the previous lockfile.
The publication audit also updates Zod to 4.6.7 after the
[collection advisory](https://github.com/advisories/GHSA-mrhx-c7xc-m3w5) was revised to include
4.6.5. The patched release rejects oversized constrained collections before parsing their elements.
Expo and browser diagnostics still require Zod 3.25.76, so a version-locked backport preserves
their APIs while rejecting oversized bounded arrays and sets before element validation. The patch
also covers its embedded v4 entry points. Hash and behavior checks verify every installed patched
instance; unrelated versions and advisories remain subject to the production audit.
Next.js 16.4.2 is the latest patched release eligible under the repository's 24-hour dependency-age
policy at preparation time; no age exception or audit suppression is added. Lumen already creates
an MCP server and transport for each HTTP request, matching the updated SDK lifecycle requirements.

### Verification and recovery

The consolidated changes include the completed v4.2.1 web fixes and the unshipped tooling, social
image, and MCP fixes from the former v4.0 branch. Previously published branches are accounted for
through their squash-merged releases; historical release approvals are not reused.

Compiler tests load each adapter's exported styles and cover semantic colors, opacity, responsive
utilities, a setup without Preflight, and the standalone path. Browser checks cover responsive
component overrides, root and nested themes, keyboard focus, code tabs, and accessibility at phone
and desktop widths. Package checks verify the distributable contents.

To roll back adoption, restore the prior package versions and lockfile, remove the optional bridge
import, and restore any application-owned color aliases that were replaced. Existing standalone
Lumen consumers require no rollback change. Published corrections use a new version; do not replace
a published tag. Release publication must run through the repository's GitHub workflow.
