## Lumen 4.2 highlights

Lumen 4.2 preserves application-owned SwiftUI appearance preferences and aligns AI guidance for
web selection controls. It keeps existing v4 component contracts compatible.

### SwiftUI appearance ownership

With `enforceColorScheme: false`, `lumenTheme` now leaves the host appearance preference untouched.
A caller's `.preferredColorScheme(.dark)` or `.preferredColorScheme(.light)` works before or after
the Lumen modifier. Without a caller preference, the host appearance is inherited. This also works
with `applyTint: false`; the supplied Lumen palette still determines Lumen semantic colors.
Explicit `enforceColorScheme: true` retains its existing behavior.
Switching enforcement on and off also preserves child view state, including an edited application
draft; changing appearance policy does not recreate the content subtree.

No initializer migration is required. If an application compensated for the previous appearance
override, remove that workaround only after checking its own windows, scenes, and previews.

### Web selection guidance

The portable Lumen skill, generated plugin, AI guide, and MCP rules default to `Select` for web
product option lists and `Combobox` for searchable choices. `NativeSelect` remains supported when
the product explicitly requires the browser or platform picker. Native fallbacks remain intact.
This changes agent guidance; it does not rewrite existing application controls.

### Elements DatePicker layout

The DatePicker host uses the positioned field shell, matching Astro. Its authored native input,
control, trigger, and popover keep their documented child classes; the visible trigger supplies
input chrome without a second border or fixed-height wrapper. ARIA feedback belongs on the native
input and is mirrored to that trigger.

### Package versions

The umbrella, Elements, and MCP packages use 4.2.0, and Swift consumers use repository tag `v4.2.0`.
Astro, React, and Core remain at 4.1.0. React Native and React Hook Form remain at 4.0.1;
tokens, brand icons, and Compose remain at 4.0.0. Install only the packages your application uses;
do not upgrade unrelated native artifacts to an invented 4.2 version.

The plugin package's MCP pin is synchronized to 4.2.0. Directory publication, hosted MCP deployment,
and store apps have separate delivery steps; a local snapshot does not prove their deployed version.

### Verification and rollback

Hosted macOS regression tests exercise both caller modifier orders, inherited light/dark host
appearance, explicit preference precedence, tint on/off, and an edited child draft across repeated
enforcement changes. These tests do not claim fresh iOS or
physical-device qualification. Verify the application's own appearance choices after upgrading.

For rollback, restore the application's prior Swift package revision and npm lock file, then rebuild.
These changes require no persisted-data migration. Published corrections use a new version; never
replace the published tag. See the
[v4.1 highlights](https://github.com/santi020k/lumen/blob/main/docs/lumen-4.1.md) for the preceding
loading and form improvements, and the
[v4.2 scope audit](https://github.com/santi020k/lumen/blob/main/docs/lumen-4.2-improvement-audit.md)
for work retained in the backlog.
