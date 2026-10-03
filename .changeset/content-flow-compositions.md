---
"@santi020k/lumen": major
"@santi020k/lumen-astro": major
"@santi020k/lumen-react": major
"@santi020k/lumen-elements": major
"@santi020k/lumen-mcp": minor
---

Refine v4 reading rhythm and responsive page gutters, allow interactive Card content to overflow,
and wrap long actions in wrapping Stacks. Move media clipping into AspectRatio when upgrading.
Container gutters now grow from 16px to 32px; override --ui-container-gutter to preserve fixed
product gutters. Prose and Typography trim their outer child margins and separate headings from
preceding paragraphs. Add four installable content-flow recipes for all web adapters and return
complete framework examples through MCP recipe discovery.

Elements Stack now honors align, justify, and wrap attributes, including boolean-presence wrap,
so installed compositions wrap long actions consistently across the web adapters.
Include CLI starter templates in the published umbrella package and verify all twelve new
compositions install from a packed consumer, rather than only from the repository checkout.
