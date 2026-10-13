## Lumen 4.1 highlights

Lumen 4.1 improves loading feedback, form accessibility, and pages that combine web adapters.
Existing v4 applications can keep their integration setup and update the packages they use.
Applications upgrading from v3 should first follow the
[v3 → v4 migration guide](https://lumen.santi020k.com/docs/migrations/v3-to-v4).

### Loading feedback

Skeleton now accepts `shape` (`rectangle`, `text`, `circle`), `width`, `height`, and `animation`
(`shimmer`, `pulse`, `none`). Numeric dimensions are pixels; supported CSS lengths, percentages,
and `calc()` or `var()` expressions are accepted. Reduced motion stops shimmer and pulse.
Skeleton and Spinner are decorative unless named; explicit ARIA overrides take precedence.
Give a group of placeholders one named status region rather than announcing every placeholder.
Progress normalizes non-finite values to finite ARIA values, and Elements Skeleton and Progress
render as blocks. Review layouts that depended on their previous inline display.

### Forms and floating calendars

- ListBox exposes one accessible control while retaining native select submission and validation.
  External labels name the visible list, required single selection stays invalid until a choice is
  made, and invalid submission focuses the list. React focus and blur callbacks fire once when
  entering or leaving the visible list; the event target remains the native select.
- DatePicker calendars escape clipping in short or scrolling dialogs through shared floating
  placement when the Popover API is available. Triggers mirror consumer validation ARIA attributes.
  React reopens on the selected month; Astro preserves an open calendar when only ARIA feedback changes.
- React InputOTP paste reports the sanitized code once through its change callbacks and respects
  a consumer `onPaste` handler that calls `preventDefault()`. Controlled values and React Hook Form
  controllers receive the pasted code without duplicate notifications.
- Select and NativeSelect chevrons follow inherited RTL direction, including nested LTR regions.

### Mixed web adapters

React DatePicker, Calendar, and InputOTP mark their roots with `data-ui-owner="react"`.
Astro and Elements enhancers skip these roots, preserving React state, IDs, and label associations
before and after hydration. Keep each adapter's normal setup; do not remove this ownership marker
or manually enhance a React-owned root.

### Versions and verification

Use the individual versions in the
[release manifest](https://github.com/santi020k/lumen/blob/main/registry/release-manifest.json).
The v4.1 release uses 4.1.0 for the main web packages and MCP, 4.0.1 for React Native and
React Hook Form, and 4.0.0 for tokens, brand icons, and Compose. Swift uses tag `v4.1.0`.
Store apps and hosted agent tools follow their own publication schedules.

After updating, load the matching styles, commit the lock file, and verify the application’s loading
layout, required ListBox submission, keyboard focus, date calendars inside dialogs, and OTP paste.
For rollback, restore the application's prior source and dependency pins and rebuild; no data
migration is required by these library changes.

Read the package histories for the complete adapter-specific changes:
[Astro](https://github.com/santi020k/lumen/blob/main/packages/astro/CHANGELOG.md),
[React](https://github.com/santi020k/lumen/blob/main/packages/react/CHANGELOG.md),
[Elements](https://github.com/santi020k/lumen/blob/main/packages/elements/CHANGELOG.md),
[Core](https://github.com/santi020k/lumen/blob/main/packages/core/CHANGELOG.md),
[React Hook Form](https://github.com/santi020k/lumen/blob/main/packages/react-hook-form/CHANGELOG.md),
and [React Native](https://github.com/santi020k/lumen/blob/main/packages/react-native/CHANGELOG.md).
