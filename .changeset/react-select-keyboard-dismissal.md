---
"@santi020k/lumen-react": patch
"@santi020k/lumen-mcp": patch
---

Align Select and `useSelect` keyboard and dismissal behavior with the Astro reference. Space opens
the listbox and selects the focused option unless it continues an active typeahead query, moving
focus outside the field closes the listbox, and Select passes its `aria-label` or
`aria-labelledby` to the listbox. Opening with Space, Enter, the arrow keys, Home, End, or
typeahead now focuses the option after the listbox renders, so the selected option receives focus
in browsers that cannot focus hidden content.

Refresh the MCP Select example to include the listbox's accessible name.
