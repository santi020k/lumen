---
"@santi020k/lumen-core": patch
"@santi020k/lumen-astro": patch
"@santi020k/lumen-react": minor
"@santi020k/lumen-elements": minor
"@santi020k/lumen": patch
---

Offer opt-in manual code-copy recovery consistently across the web adapters. React Code and
CodeTabs accept recoveryLabel; Elements accepts recovery-label and inherits it from code tabs.
Recovery preserves exact source in a labelled read-only field, selects on focus without taking
focus, survives transient feedback, and clears after successful retry or a tab change. Source
updates invalidate pending recovery in React and Elements. Astro recovery now has a visible
label and shared layout, including narrow screens and print output.

Give Elements block Code a block formatting context so pointer interaction and framing work in
WebKit. Astro's copy runtime leaves React- and Elements-owned controls to their own adapters,
avoiding duplicate clipboard operations on mixed-framework pages.
