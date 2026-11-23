# Lumen 4.2 selection policy preparation

Integrated locally for the upcoming 4.2 release; the published 4.1 release is unchanged.

Web product guidance defaults to Select and searchable Combobox choices. NativeSelect stays
supported for intentional platform pickers. The portable skill, plugin package, AI usage guide,
and MCP rules share this guidance. Native framework adapters and browser fallbacks are unchanged.

The companion ESLint libraries branch adds an opt-in lumenCustomSelects() policy. Adopt that
helper in personal projects after its release; existing projects can keep equivalent local guards
until then. Neither repository is published by this preparation task. See the
[improvement reconciliation](lumen-4.2-improvement-audit.md) for remaining scope and release work.
