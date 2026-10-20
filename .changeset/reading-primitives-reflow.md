---
'@santi020k/lumen-core': minor
'@santi020k/lumen-astro': patch
'@santi020k/lumen-react': patch
'@santi020k/lumen-elements': patch
'@santi020k/lumen': patch
'@santi020k/lumen-mcp': patch
---

Keep Anchor highlighting aligned with native fragment navigation after text resizing. All web
adapters now share `getLumenActiveAnchorIndex`, which honors root scroll padding and heading scroll
margins as well as the configured activation offset, with one CSS pixel of rounding tolerance.
React and Elements no longer select the last heading merely because the page cannot scroll.
Handle mixed CSS percentage/length padding, one-pixel document overflow, and malformed fragment
escapes consistently. `decodeLumenAnchorFragment` preserves literal percent signs in heading IDs.

Allow Pill labels to wrap inside narrow containers while keeping their count affix together.
Cap the corner radius so multiple lines remain inside the border.
Increase inactive Anchor text contrast and let Pill counts inherit the label color so small text
remains readable in light and dark themes, including linked pill hover states.
Existing component props and markup remain supported; no consumer wrapper is required for plain
text labels. Regenerate the shared critical styles and MCP usage data with these contracts.
