# Native Transfer

`LumenTransfer` presents available and selected item panels with staged checkbox selection
and bidirectional move actions, matching the Astro reference. The complete value is controlled:
React Native / Compose use `value` / `onValueChange` and SwiftUI uses a binding.
`LumenTransferValue.selectedIds` describes target membership; `checkedIds` stages items for
the next move. Check changes never change membership. Move changes update both arrays
atomically and clear only the checks for items that actually moved.

`LumenTransferItem` has stable `id`, `label`, optional `detail` and `disabled`. Items keep
host-provided catalog order in each panel. Moving to target appends moved IDs in source order;
moving back removes only eligible selected IDs. All host IDs missing from the visible catalog
remain in both state arrays, including across an empty dataset or catalog refresh. Disabled
items retain their membership and any staged check; they cannot be checked or moved by the
component. Unknown IDs cannot be activated or moved. Duplicate or blank catalog/value IDs
fail closed and hide stale controls rather than guessing identity or normalizing host state.

Read-only and disabled states retain the panels and block callbacks. SwiftUI uses `.disabled`
and Compose uses `enabled`. Loading/error/invalid states show a localized message and hide
stale controls. Empty panels show `emptyLabel`, and moves without eligible checked items are
disabled. The host owns the item catalog, persisted membership, authorization and change effects.
The reference contains no filtering behavior; this implementation exposes selection and moves.

Source/target titles, move labels, empty/loading/invalid messages, item text and count formatting
are host-localizable. SwiftUI also accepts checked/unchecked spoken labels; React Native and
Compose use native checkbox state semantics. Item names include title and detail, with ID fallback
for an empty title. Panels stack on phones; long lists scroll within a 240-unit panel viewport.
Checkbox rows and move buttons retain at least 44-unit touch targets.

All three `TransferParityExample` playground fragments provide controlled checks/membership,
a disabled host-owned target item, an unknown target ID and empty/read-only/loading/error toggles.
Tests cover source/target partitioning, forward/backward moves, immutable inputs, unknown and
disabled preservation, staged checks, identity ambiguity, empty input and long IDs. React Native
interaction tests cover controlled emissions, blocked direct handlers and status controls.
Compose instrumentation tests on the Android emulator additionally verify checked semantics,
forward/backward host moves, unknown and disabled preservation, read-only controls and
loading/invalid transitions. Screenshot inspection, other-platform interaction, VoiceOver,
TalkBack and physical-device qualification remain integration work.
