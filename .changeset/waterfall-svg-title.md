---
'@santi020k/lumen-react': patch
---

React `WaterfallChart` and `Histogram` bars render their `label: value` SVG tooltip during server rendering
instead of an empty `<title>`, without React's title-children warning.
