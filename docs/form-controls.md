# Web form control contracts

Astro, React, and Elements share form behavior while retaining each framework's event model.
Applications own submitted data, validation policy, persistence, and requests. Native adapters use
platform bindings and validation flows rather than HTML form association.

## Visual sizing

Input, NativeSelect, Select, PhoneInput and Segmented use `visualSize` in Astro/React and
`visual-size` in Elements wherever visual sizing is supported. The shared
`LumenControlVisualSize` type accepts `default`, `sm` and `lg`. Native input and select `size`
remains numeric. PhoneInput forwards native character width through `inputProps.size` in
Astro/React. Button/action, icon, container and native-platform sizing retain their own contracts.

## Value ownership and resets

React controlled `value` or `checked` remains application-owned. Uncontrolled controls use their
configured defaults. An accepted native reset restores uncontrolled defaults, closes transient
selection drafts, and does not report a user change. Canceling the reset preserves current values
and open drafts. Keep the controlled owner in sync through the documented callback; do not change
control modes during an edit.

Astro controls use native form values, with progressive enhancement preserving the native reset.
Elements scalar controls expose current `value` and `checked` properties separately from their
configured `defaultValue` and `defaultChecked`. Setting `checked` changes the current selection
without rewriting its reset default. A host `value` attribute deliberately configures its value;
use the current-value property for edits that should preserve the reset baseline.

Moving an Elements scalar control preserves its current native value and configured reset baseline.
Reconnection rebinds event forwarding and validity synchronization once. Disconnecting removes those
listeners. Applications should listen on the public host rather than the generated child.

## Submission, disabled state, and validity

Native controls submit through `name`. Where documented, `form` associates a control with an
external form; its reset follows that owner. Disabled controls and controls inside a disabled
fieldset are excluded from submission. Read-only controls retain their submitted value.

Elements scalar controls use ElementInternals when available, with a native light-DOM fallback.
Both paths submit a single value once, omit unchecked checkboxes, and preserve native validity.
A multiple NativeSelect submits every selected enabled option under its name. Reset restores the
original selected options. Attribute updates must not reactivate a control disabled by its fieldset.
`checkValidity`, `reportValidity`, and `setCustomValidity` retain native semantics; the application
supplies safe validation text and visible field feedback.

## Events and accessible controls

Astro and Elements expose their documented DOM input/change events. Scalar Elements events bubble
from the public host once. React keeps native `onChange` alongside component-specific typed
callbacks where documented; an interaction invokes each corresponding callback once. Reset and
programmatic property assignment do not synthesize user-change callbacks.

Elements Select uses `ui-select-field` for its frame; `ui-select` styles its native input and
visible trigger.

Use a visible label associated with the focusable input or trigger. Elements hosts and generated
native inputs can have distinct IDs; follow the package's documented association contract. Keep
required, disabled, read-only, and error descriptions consistent with visible copy.

## ListBox accessibility and validation

Enhanced Astro and Elements ListBox and React ListBox expose one accessible control: the visible
list. The native select retains submission and validity but leaves the tab order and accessibility
tree. Labels targeting or wrapping the select name the list; explicit `aria-labelledby` and
`aria-label` take precedence. Label clicks and native select focus move focus to the visible list.
Descriptions, required state, and consumer validation ARIA attributes reach that list.

An unselected required single ListBox remains invalid until an option is chosen. Native validation
marks and focuses the visible list when it is the first invalid control. Consumer `aria-invalid`
takes precedence over Lumen-generated validity feedback. An accepted reset clears generated
invalid feedback; a canceled reset preserves it and the current selection.

React ListBox `onFocus` and `onBlur` fire once when focus enters or leaves the visible list.
Their event target remains the `HTMLSelectElement`, including its form name, so existing form
integrations retain their native event contract. `LumenListBoxController` validates once on blur.

## DatePicker feedback and placement

The visible trigger mirrors `aria-invalid`, `aria-describedby`, and `aria-errormessage` from the
input. Astro and Elements also track later native input attribute changes. Generated native
validation feedback clears after valid values, relevant constraint changes, or accepted resets;
explicit application errors remain application-owned. Astro keeps an open calendar and focused
day when only input ARIA feedback changes. React reopens on the currently selected month.

Calendars use shared floating placement and enter the top layer when the Popover API is available,
avoiding clipping inside scrolling dialogs. Older browsers retain fixed placement. Verify scroll,
resize, Escape, and dialog dismissal in the application's supported browsers.

## React InputOTP paste

`InputOTP` paste reports the sanitized code once to consumer `onChange` and `onValueChange`
callbacks, including controlled values and React Hook Form controllers. `useInputOTP` also
notifies `onValueChange` once per input. A consumer `onPaste` handler can call `preventDefault()`
to cancel Lumen's paste handling. Uncontrolled InputOTP retains typed digits without requiring
an `onValueChange` callback.

## Mixed web adapters

React DatePicker, Calendar (including `useCalendar` roots), and InputOTP render
`data-ui-owner="react"`. Astro and Elements enhancers skip those roots, preserving React IDs,
label associations, and state across hydration. Retain the marker when composing custom roots;
use each adapter's documented initialization rather than enhancing the same control twice.

## Verification coverage

The web package suites cover controlled/uncontrolled values, canceled and accepted resets, pending
reset cleanup, date validity, phone values, Combobox state, and callback counts. In particular:

- React: `date-controls.test.ts`, `phone-input.test.ts`, `combobox.test.ts`,
  `image-comparison.test.ts`, `segmented.test.ts`, `select-form-contract.test.ts`, and
  `state-updates.test.ts`.
- Elements: `dates.test.ts`, `phone-input.test.ts`, `file-upload.test.ts`,
  `image-comparison.test.ts`, `index.test.ts`, and `scalar-form-lifecycle.test.ts`.
- Astro: package runtime tests exercise native controls and their shared Core controllers.
- Browser conformance: `tests/frameworks/framework-conformance.spec.ts` checks real form association,
  callback counts, resets, relocated controls, disabled fieldset containers, and multiple-select submission.

Use `pnpm run test` for the package suites and `pnpm run test:framework-conformance` for browser
coverage. jsdom alone cannot verify ElementInternals submission and browser reset callbacks.

React consumers can compose more complex flows with the optional [form workflow hooks](powerful-forms.md).
