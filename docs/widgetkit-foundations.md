# WidgetKit foundations

`LumenWidgetUI` is the small WidgetKit-safe presentation product in the repository-root Swift
package. It exists separately from `LumenUI` so a widget extension does not acquire the complete
application component catalog or its resources.

The contract threshold was met by an August 2026 audit of maintained Between Contractions widgets:

- the iOS status widget and quick-start widget both adapt semantic accent colors through
  `widgetRenderingMode`, use compact label/value hierarchy, and retain native container ownership;
- the macOS status and quick-start widgets use the same rendering-mode, compact-stat, badge, and
  Dynamic Type patterns.

The shared layer therefore owns only generated semantic colors, spacing, radii, text, SF Symbol,
badge, and compact-stat treatments. The application continues to own timelines, App Intents, deep
links, container backgrounds, family-specific layout, privacy, and domain state.

Automated tests cover full-color, accented, vibrant, increased-contrast, and accessibility text
decisions. Physical widget-gallery and device testing remains recorded in
[`native-device-validation.md`](native-device-validation.md), never inferred from unit tests.
