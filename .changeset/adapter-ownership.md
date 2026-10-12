---
"@santi020k/lumen-react": patch
"@santi020k/lumen-elements": patch
"@santi020k/lumen-mcp": patch
---

React DatePicker, Calendar (including `useCalendar` roots), and InputOTP now render
`data-ui-owner="react"`, and the document-wide Elements enhancers skip owned roots. On pages that
register Elements before or after a React island mounts, the React DatePicker keeps its trigger id
and label association, Calendar selections reach React state, and InputOTP segments stay rendered by
React. Standards-based `data-ui-*` markup and `lumen-*` elements are enhanced as before.
