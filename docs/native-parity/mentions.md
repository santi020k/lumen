# Mentions native parity

The native Mentions adapters provide controlled text, a UTF-16 selection, locally filtered host options,
and explicit suggestion insertion. Astro `Mentions.astro` and its progressive enhancement runtime are
the reference. The native adapters use real multiline native text inputs; they do not fetch options,
resolve usernames, persist text, or implement rich text editing.

## Public contracts

React Native exports `LumenMentions`, `LumenMentionsProps`, `LumenMentionsLabels`,
`LumenMentionsValue`, `LumenMentionsSelection`, `LumenMentionOption`, `LumenMentionQuery`,
`isLumenMentionsSelectionValid`, `resolveLumenMentionQuery`, `filterLumenMentionOptions`, and
`insertLumenMention`.

Swift iOS/visionOS exposes `LumenMentions(_:value:options:trigger:disabled:readOnly:status:labels:)`,
with a `Binding<LumenMentionsValue>`, `LumenMentionsStatus` (`ready`, `loading`, `error`),
`LumenMentionsLabels`, the four corresponding value/selection/option/query model types, and
`LumenMentionEngine.isSelectionValid`, `.query`, `.options`, and `.inserting`.
The view uses UIKit; models are available on every package platform.

Compose exposes `LumenMentions(label, value, onValueChange, options, modifier, trigger, disabled,
readOnly, status, labels)`, `LumenMentionsStatus` (`Ready`, `Loading`, `Error`),
`LumenMentionsLabels`, the four corresponding models, and the same four top-level engine functions
as React Native.

A value is atomic text plus `{ start, end }`. Offsets count UTF-16 code units, are ordered and
nonnegative, cannot exceed the text length, and cannot split a surrogate pair. Invalid host selections
produce the supplied invalid label, suppress suggestions, and remain unchanged in the host.
Native inputs retain a usable local selection for rendering; that fallback is never emitted as a repair.
Only collapsed selections can open suggestions. An external valid value resynchronizes text and caret
when native composition permits it. Hosts may reject callbacks and retain their controlled value.

Options have a nonempty stable `id`, visible accessible `label`, ASCII username `value`, and an optional
`disabled` flag. Usernames contain 1–128 ASCII letters, digits or underscores. The first valid option
with an ID wins; malformed options are omitted. Disabled matching options remain visible but cannot
insert. Labels and body text may contain Unicode. Matching is case-insensitive prefix matching against
the username, preserving option order. No remote search occurs inside the component.

## Reference differences

The default trigger is `@`. Native triggers contain 1–8 printable ASCII punctuation characters;
letters, digits, underscores and non-ASCII triggers are rejected. Queries use Astro's ASCII `\w`
contract. A trigger must occur at the start or after ASCII whitespace or one of `([{\"',;:!?`.
This deliberate boundary avoids suggesting mentions inside email addresses, unlike Astro's trailing
regular expression. Native matching uses bounded linear scans, not regular expressions.

Insertion replaces the trigger and query before the caret with the trigger, exact host username and
one space, preserving the entire suffix. An already present suffix space remains present. It advances
the UTF-16 caret after the inserted space. The token, option identity, disabled state and native input
snapshot are revalidated at activation; stale or invalid proposals do not insert.

The native input supplies ordinary caret navigation, selection and copy behavior. When suggestions
are active, supported hardware key events use Up/Down to cycle enabled options, Home/End to select
an endpoint, Enter to insert, and Escape to dismiss. Native touch and screen-reader activation use
44-point/dp suggestion controls. Swift and Compose do not reproduce a DOM listbox; they expose native
button suggestions and a labeled native text input.

## Composition and controlled input

Swift checks `UITextView.markedTextRange` before replacing host text or selection and again before
inserting against the current native buffer. Compose retains `TextFieldValue.composition` and defers
external replacement while marked input exists. Suggestions and insertion are suppressed while
composing. Native text and caret changes emit atomic host proposals; hosts decide whether to accept
a final composition update or a concurrently supplied external value.

React Native's public `TextInput` events do not expose a reliable portable marked-text range. Its
`isComposing` prop is an explicit host hint: set it while an integrating platform/keyboard reports
composition. It preserves the current native text and omits programmatic selection while true.
Text changes wait for the corresponding native selection event before emitting an atomic proposal.
Keyboard events carrying `isComposing` or the IME key code 229 also cannot trigger insertion.
Without the hint, RN cannot promise detection of every IME. Touch/Enter insertion first requests native
blur, waits for `onEndEditing`, validates the latest native text and range against the current host
value, and then emits the insertion. RN Web lacks `onEndEditing`, so its validated final blur text
provides that commit signal. Its native pointer event prevents suggestion activation from prematurely
blurring the text input. It refocuses only after host acceptance. Supported key event
delivery depends on the platform; no DOM composition APIs are assumed.

Disabled and read-only input never emits text or insertion changes. Loading/error status suppresses
suggestions and insertion while leaving otherwise editable text usable. All labels, including status,
invalid range, empty results, read-only and suggestion heading, are supplied through labels; option
names belong to the host. Token colors and single-column layout support light/dark and narrow screens.

## Verification

Three actual `MentionsParityExample` fragments provide synthetic options, Unicode body text,
English/Spanish labels, disabled/read-only/loading/error/invalid/restore controls. RN additionally
exposes its composition hint. No fragment needs arguments.

Focused parser tests cover email boundaries, ASCII/custom triggers, middle-text insertion, emoji
UTF-16 offsets, selected/negative/reversed/out-of-bounds ranges, malformed/duplicate/disabled options,
stale tokens, and a million-character linear scan. RN interaction tests cover delayed native commit,
accepted refocus, options removed before commit, composition/disabled/read-only guards and invalid
selection preservation. Swift model tests and the iOS UIKit library build pass; the actual Swift
fragment typechecks with warnings as errors. RN owned lint, package types, playground types and focused
tests pass. Compose model tests, lint and exact fragment/instrumentation compilation pass.

Three actual Android emulator tests pass: hardware keys skip disabled options and preserve rejected
host insertions, suffix-preserving insertion/invalid-range retention and native
`InputConnection.setComposingText` preservation across an external host update. The final run reports `OK (3 tests)` in 6.201 seconds. RN Web rendered verification passes at 390 and 1280 pixels in light/dark: touch and keyboard insertion,
invalid/restore, English/Spanish and zero page overflow. Eight owned screenshots are stored in
`/private/tmp/lumen-mentions-rendered`, with `results.json` recording each viewport/theme.
Broader native rendered phone/tablet and hardware/physical-device keyboard qualification remains part of
the parent integration gate; a simulator or emulator does not qualify physical devices. iOS IME
interaction and RN IME variants remain explicit qualification boundaries.
