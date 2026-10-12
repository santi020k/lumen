# Lumen 4.2 selection policy preparation

Prepared for 4.2; do not publish or merge into the in-progress 4.1 release.

Web product guidance defaults to Select and searchable Combobox choices. NativeSelect stays
supported for intentional platform pickers. The portable skill, plugin package, AI usage guide,
and MCP rules share this guidance. Native framework adapters and browser fallbacks are unchanged.

The companion ESLint libraries branch adds an opt-in lumenCustomSelects() policy. Adopt that
helper in personal projects after its release; existing projects can keep equivalent local guards
until then. Neither repository is published by this preparation task.
