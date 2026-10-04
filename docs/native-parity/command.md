# Native Command

`LumenCommand` is a grouped, searchable native command surface. It follows the Astro reference's
case-insensitive substring filtering and adds native highlight navigation and activation controls.
Hosts control `open`, `query` and `activeId` using callbacks on React Native / Compose and bindings
on SwiftUI. `onSelect` receives the full original command; execution, routing, global launch
shortcuts, query resets and closing after activation belong to the host. Each playground composes
the surface with Lumen's existing native sheet and demonstrates actual host preview/reset actions.

`LumenCommandGroup` supplies stable `id`, `label` and `items`. `LumenCommandItem` supplies stable
`id`, `label`, optional `detail` / `shortcut`, search `keywords` and `disabled`. Group IDs must be
unique, and command IDs must be globally unique across groups. Blank or duplicate IDs fail closed
before filtering. Literal query matching uses title, detail, keywords and displayed shortcut;
empty queries show all commands. Empty groups are omitted while catalog order is preserved.
Shortcut text is a hint and does not register an application accelerator.

Previous/next navigation wraps through visible enabled commands; helpers also expose first/last
boundaries. Stale, unknown, hidden and disabled active IDs cannot execute. The component preserves
host highlight/query state instead of guessing a replacement; query changes can reset highlight
in the host, as the examples do. Commands expose native button semantics, disabled and highlighted
states, descriptive accessible names and at least 44-unit touch targets. Results scroll within
a 240-unit viewport. Search autofocus defaults on when the unlocked surface opens; set `autoFocus`
to false when the host manages focus. SwiftUI scrolls the highlighted command into view.

React Native handles delivered Up/Down/Home/End key presses on search, submission activates the
current visible highlight, and Escape closes. Native key delivery varies by platform; visible
navigation/run buttons provide the equivalent touch and assistive-technology path. SwiftUI supplies
Up/Down/Escape shortcuts and search submission. Compose handles Up/Down/Home/End/Enter on search
and Escape within the command surface; ordinary command/close buttons retain native keyboard
activation. React Native and Compose show the current highlight in a status label; labels and
count/active formatting are host-localizable. Hardware keyboard and screen-reader behavior need
platform qualification beyond the focused tests.

Disabled/read-only states prevent query, highlight and activation changes while retaining content.
Loading/error/invalid states hide stale search and command actions. The close action remains
available during read-only/status states; SwiftUI ancestor `.disabled` can also disable that button,
so modal hosts retain their native sheet dismissal path. A closed surface renders no commands.
An empty result shows localized `emptyLabel`, retains search/close, and disables navigation/run.

All three `CommandParityExample` fragments contain grouped commands, keyword filtering, a disabled
command, host-controlled highlights, real preview/reset effects and empty/read-only/loading/error
toggles. Model tests cover filtering, navigation, disabled/stale IDs, identity ambiguity and long
literal queries; React Native tests cover controlled callbacks, keyboard events, status/closed
surfaces and blocked direct handlers. Compose emulator instrumentation verifies search autofocus,
filtered keyboard navigation/activation, native close-button keyboard focus and activation,
and read-only/loading/invalid action guards. The two Android UI tests pass in hardware-keyboard
input mode; the two Android model tests, exact playground fragment compilation and Android lint
also pass. Swift compilation and two model tests pass; React Native has seven focused tests plus
strict package/playground type checks and zero-warning focused lint. Apple/React Native rendered
interaction, modal focus restoration, VoiceOver, TalkBack and physical-device proof remain
integration work.
