# Lumen v1 Components and Features

Lumen already has a large component catalog. Version 1 should therefore be a stability and
production-readiness release, not a race to add every component found in larger libraries.

This document identifies the remaining component gaps and the cross-cutting features that should be
complete before `1.0.0`. Astro remains the reference implementation, with React and Web Components
shipping the same public behavior contracts.

## v1 Principles

- Prefer a small, dependable public API over a larger catalog of shallow wrappers.
- Add a component only when native HTML or an existing Lumen component cannot express the pattern
  clearly and accessibly.
- Treat keyboard behavior, focus management, form participation, localization, and reduced motion
  as part of the component contract.
- Require equivalent states and events across Astro, React, and Web Components, even when their
  framework-native APIs differ.
- Keep complex product patterns such as schedulers and editors composable. Lumen should own their
  accessible shell and behavior contracts without becoming an application framework.

## Must-Have Components

These are the component gaps that should block v1.

### Form

`Form` should provide a consistent validation and submission boundary around the existing `Field`,
`Label`, and input components.

Required behavior:

- Native form submission, reset, disabled controls, and browser autofill continue to work.
- Client and server errors can be attached to a field without replacing native validity.
- Invalid controls receive stable `aria-invalid` and `aria-describedby` relationships.
- Submission supports pending, success, and failure states without double submission.
- Astro emits documented DOM events, React exposes controlled callbacks, and Elements participates
  in native forms.

### PasswordField

`PasswordField` should compose `Input` and `Button` into the common password visibility pattern.

Required behavior:

- The visibility toggle has a localized accessible name and preserves input focus.
- Visibility returns to hidden after form reset or successful submission.
- Password-manager and autofill attributes pass through unchanged.
- The component supports requirements, errors, hints, and disabled and read-only states.

### CheckboxGroup

`CheckboxGroup` should provide an accessible group contract for related `Checkbox` controls.

Required behavior:

- A visible label or accessible name describes the group.
- Shared help and error text is announced once at the group level.
- Required, disabled, invalid, horizontal, and vertical states are supported.
- Submitted values remain ordinary repeated form values.

### ListBox

`ListBox` should expose the selectable collection behavior currently embedded in components such as
`Select`, `Combobox`, and `Autocomplete`.

Required behavior:

- Single and multiple selection, disabled options, sections, empty state, and typeahead.
- Arrow-key navigation, Home, End, Space, Enter, and selection-follows-focus behavior are explicit
  and tested.
- Controlled and uncontrolled selection are available where the framework supports them.
- Async loading and virtualization can be layered on without changing the base contract.
- `Select`, `Combobox`, and `Autocomplete` reuse the shared behavior instead of maintaining
  divergent listbox implementations.

### Container, Stack, and Grid

These three layout primitives should cover the most common responsive composition needs without
creating a parallel styling language.

Required behavior:

- `Container` provides named content widths and token-based inline gutters.
- `Stack` provides vertical or horizontal flow, wrapping, alignment, and token-based gaps.
- `Grid` provides responsive minimum column sizing, explicit column counts, and token-based gaps.
- All three accept semantic element selection, preserve native attributes, and work without the
  Astro runtime.
- Responsive props compile to a small documented set of classes or custom properties rather than
  per-instance generated CSS.

Do not add `Box` for v1. A native element with Lumen tokens and public classes already covers the
unopinionated wrapper case.

### VisuallyHidden

`VisuallyHidden` should be a tiny accessibility utility available in each framework.

Required behavior:

- Content remains available to assistive technology while being visually hidden.
- Consumers can reveal the content when it receives focus.
- Documentation distinguishes it from `hidden`, `aria-hidden`, and `display: none`.

## Existing Components That Need v1-Level Features

Adding the components above is not enough. The following existing surfaces need deeper contracts
before the catalog can be considered stable.

### Overlays and menus

Applies to `Dialog`, `AlertDialog`, `Popover`, `DropdownMenu`, `ContextMenu`, `HoverCard`,
`Tooltip`, `Select`, `Combobox`, `DatePicker`, `Sheet`, and `Drawer`.

- Consistent open, default-open, and change-event semantics.
- Escape, outside interaction, trigger removal, and nested-overlay behavior.
- Initial focus, focus containment where modal, and reliable focus restoration.
- Background inertness and scroll locking for modal surfaces.
- Viewport collision handling, available-size CSS properties, and origin-aware animation hooks.
- Checkable menu items, radio items, submenus, separators, disabled items, and typeahead.
- Touch, pointer, keyboard, and screen-reader interaction coverage.

### Forms and fields

Applies to every input-like component.

- Consistent `value`, `defaultValue`, `checked`, `defaultChecked`, `name`, `required`, `disabled`,
  `readOnly`, `invalid`, and change semantics.
- Native form submission and reset across all three frameworks.
- Stable label, description, hint, and error relationships.
- Input method editor composition and mobile keyboard behavior.
- Locale-aware parsing for numbers, dates, times, and color values where relevant.
- A documented rule for when Lumen uses a native control and when it progressively enhances one.

`Slider` should gain an accessible two-thumb range mode before creating a separate `RangeSlider`
component.

### Collections and data

Applies to `DataTable`, `Table`, `Tree`, `TreeGrid`, `VirtualList`, `Transfer`, and the new
`ListBox`.

- Shared collection keys, selection state, disabled items, empty state, and loading state.
- Keyboard selection and focus behavior that remains usable with virtualization.
- Sort state and selected values can be controlled externally.
- Async pagination and incremental loading do not require replacing the component.
- Drag-and-drop is optional, keyboard-accessible, and announced when enabled.
- Large collections have documented performance targets and examples.

### Date and time

Applies to `Calendar`, `DatePicker`, `DateRangePicker`, `TimeField`, `Schedule`, and `Agenda`.

- No hardcoded English labels or fixed English date formatting.
- Configurable locale, time zone, first day of week, hour cycle, and calendar labels.
- Correct right-to-left layout and keyboard navigation.
- Unavailable dates, min/max values, validation, and daylight-saving transitions are tested.
- Date values have one documented serialization contract across frameworks.

### Feedback and asynchronous state

Applies to `Toast`, `Sonner`, `Alert`, `Progress`, `Spinner`, `Skeleton`, `Empty`, and `Callout`.

- Polite and assertive announcement rules are documented and tested.
- Toast timing pauses on focus, hover, and page visibility changes.
- Async actions expose pending, success, failure, retry, and cancellation patterns.
- Reduced motion does not delay access to final state.
- Loading indicators do not create duplicate or noisy screen-reader announcements.

### Composition and framework-native ergonomics

- React components forward refs, support controlled and uncontrolled use, and remain tree-shakable.
- Astro components preserve native attributes and work before enhancement.
- Custom elements expose typed properties and composed custom events, and form controls use
  form-associated custom element behavior where needed.
- Consumers can change the rendered semantic element when safe without losing Lumen behavior.
- Slots, children, parts, data attributes, and CSS custom properties are documented as either public
  or internal.

## Cross-Cutting v1 Features

### Stable public contracts

- Remove the deprecated `surface="glass"` alias.
- Remove the deprecated `ui:datatable-selection-change` event alias in favor of
  `ui:data-table-selection-change`.
- Publish one naming convention for props, attributes, events, slots, parts, and state data
  attributes.
- Freeze the public token names and document the token deprecation policy.
- Add a migration guide from the latest `0.x` release to v1.
- Document semantic-versioning expectations for CSS, markup, behavior, and TypeScript types.

### Accessibility release gate

- Automated semantic and axe checks for every component and documented state.
- Keyboard interaction tests for every interactive component.
- Manual smoke tests with at least one screen reader on macOS and one on Windows.
- Forced-colors, 200% and 400% zoom, reduced motion, and high-contrast theme checks.
- No inaccessible state hidden behind pointer-only interaction.
- Accessibility regressions block the release just like type or unit-test failures.

### Internationalization and direction

- Introduce one locale and direction configuration contract shared by all packages.
- Replace internal user-facing strings with configurable, localized messages.
- Use logical CSS properties throughout components that must mirror.
- Add right-to-left visual and interaction scenarios to the regression suite.
- Document which formatting is handled by Lumen and which is owned by the application.

### Progressive enhancement and SSR

- Interactive Astro components render useful, submit-capable HTML before JavaScript loads.
- Generated IDs are deterministic enough for server rendering, streaming, and repeated instances.
- Runtime controllers remain idempotent across Astro view transitions and partial page updates.
- Document the Content Security Policy requirements of the Astro runtime.
- No component requires hydration merely to display its initial state.

### Package and browser support

- Publish supported Node, Astro, React, TypeScript, and browser version ranges.
- Verify exports, styles, type declarations, and tree shaking from clean consumer projects.
- Keep per-controller, shared CSS, React, and Elements bundle budgets as release gates.
- Document ESM, SSR, edge-runtime, and package-manager support.
- Publish a support window for the current and previous minor releases after v1.

### Documentation, Figma, registry, and MCP parity

Every public component must have:

- A real example for default, disabled, loading, empty, error, success, destructive, and dark-theme
  states where applicable.
- Typed API documentation, keyboard behavior, accessibility notes, events, and form behavior.
- Astro, React, and Elements examples that use the same scenario.
- A Figma component or an explicit note that the item is behavior-only.
- Registry metadata and an MCP snapshot entry generated from the same source of truth.

Generated parity checks should fail when a public component is missing from any required surface.

### Release operations

- A release-candidate cycle tested by at least two real consumer applications.
- Reproducible package provenance, changelogs, and publish dry runs.
- A vulnerability-reporting path, issue templates, and a documented support policy.
- An upgrade test that installs v1 over the latest `0.x` release in a representative consumer.
- A rollback procedure for broken package publication or documentation deployment.

## Recommended Sequencing

### 1. Freeze the contract

Inventory every public export, prop, attribute, event, class, token, and CSS custom property. Decide
which contracts are stable, experimental, deprecated, or internal before adding more surface area.

### 2. Build the missing foundations

Implement `Form`, `PasswordField`, `CheckboxGroup`, `ListBox`, `Container`, `Stack`, `Grid`, and
`VisuallyHidden` in Astro first. Move reusable types and behavior into `packages/core`, then add
React and Elements parity.

### 3. Harden behavior families

Consolidate overlays, fields, collections, and date/time components around shared contracts. This
should remove duplicated behavior and make conformance testing more meaningful.

### 4. Complete release gates

Finish accessibility, localization, right-to-left, SSR, browser, package, documentation, Figma,
registry, and MCP checks. Run the release candidate in real products and resolve migration issues.

## Explicitly Not Required for v1

The following may be useful later, but should not delay v1 unless a real consumer demonstrates a
blocking need:

- `AvatarGroup`
- `BottomNavigation`
- `AppBar`
- `GridList`
- `Masonry`
- `ImageList`
- `RangeCalendar`
- Advanced color primitives such as `ColorArea`, `ColorSlider`, `ColorSwatchPicker`, and
  `ColorWheel`
- A general animation framework
- A general drag-and-drop framework
- Framework-specific components that cannot share a meaningful Lumen contract

## v1 Exit Criteria

Lumen is ready for `1.0.0` when:

- The must-have components above ship across Astro, React, and Web Components.
- No deprecated API planned for v1 remains in a public package.
- Every interactive component passes its keyboard, focus, form, and cross-framework conformance
  tests.
- Localization and right-to-left behavior are verified for all components with internal text,
  dates, times, numbers, or directional navigation.
- The supported package and browser matrix passes in clean consumer projects.
- Documentation, Figma, registry, and MCP metadata agree with the shipped catalog.
- The full repository validation command passes with zero ESLint warnings and zero TypeScript
  diagnostics.
- At least two consumer applications complete a release-candidate upgrade without a private patch.

## Benchmark References

The scope above uses established libraries as a gap-checking tool, not as a requirement to copy
their catalogs:

- [Radix Primitives components](https://www.radix-ui.com/primitives/docs/components)
- [Material UI components](https://mui.com/material-ui/all-components/)
- [React Aria component examples](https://react-spectrum.adobe.com/react-aria-starter/)
- [React Spectrum testing guidance](https://react-spectrum.adobe.com/testing)

