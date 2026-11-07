---
"@santi020k/lumen-core": patch
"@santi020k/lumen-astro": patch
"@santi020k/lumen": patch
"@santi020k/lumen-react": minor
"@santi020k/lumen-elements": minor
---

Support opt-in manual CopyButton recovery in React and Elements, matching Astro. Failed clipboard
requests retain the complete value in a labelled read-only field, without moving focus. Successful
retries clear recovery, and changed inputs or disconnected controls cannot restore stale results.

Hide manual clipboard recovery fields in print output across the web adapters.
