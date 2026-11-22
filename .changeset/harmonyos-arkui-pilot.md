---
'@santi020k/lumen-mcp': minor
'@santi020k/lumen': patch
---

Add the HarmonyOS ArkUI pilot adapter to the native catalog. The MCP server accepts a `harmonyos`
native platform that covers Theme, Text, Surface, Button, TextField, and Card, reports it in
`nativeCoverage`, and labels its implementations with `Pilot` maturity and the `arkts` language. The
packaged native registry lists the `arkUI` adapter. The ArkUI package isn't published yet.
