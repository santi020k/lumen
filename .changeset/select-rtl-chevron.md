---
"@santi020k/lumen": patch
"@santi020k/lumen-astro": patch
"@santi020k/lumen-elements": patch
"@santi020k/lumen-react": patch
---

Mirror the Select and NativeSelect chevron in right-to-left layouts so it stays inside the
inline-end padding instead of overlapping the selected value. The position follows the nearest
`dir="rtl"` or `dir="ltr"` ancestor, including nested LTR regions, and does not depend on `:dir()`,
which some consumer CSS pipelines compile into language selectors.
The generated critical stylesheets retain these inherited direction rules.
