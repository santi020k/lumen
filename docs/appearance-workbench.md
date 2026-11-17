# Appearance workbench

The [theme playground](https://lumen.santi020k.com/docs/theme-playground) previews a form,
records table, representative primitives, and an opposite-scheme form together. Choose system
sans, serif, or monospace typography and preset or flat elevation. Existing radius, spacing,
color, and border controls remain available. Density is scoped to the preview.

Use the field-state control to compare default, invalid, disabled, and read-only presentation.
Focus a preview control for a reminder of the semantic styling roles. Consult
[the styling contract](styling-contract.md) for each component's verified stable parts.

Copy workbench link preserves appearance controls in the URL fragment, including selected
preset, color mode, and scheme. These are public design values; never enter secret values.
CSS, JSON, and Figma exports retain the existing export workflow. Density uses the
`data-ui-density` boundary described in [appearance presets](appearance-presets.md).

In React, pass `fontFamily` and `elevation` to `useThemeBuilder`. Astro and Elements read
`data-ui-theme-font-family` and `data-ui-theme-elevation` controls inside ThemeBuilder.
Unknown choices preserve the preset values; custom remote font URLs are not accepted.
