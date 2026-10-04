---
"@santi020k/lumen": patch
"@santi020k/lumen-react": patch
"@santi020k/lumen-elements": patch
---

Reduce published web artifact sizes within the existing v4 budgets. React compacts its component build
without renaming identifiers, Web Components use native private methods for internal behavior, and
the shared stylesheet retains the same rules with concise section comments. Public APIs stay unchanged.
