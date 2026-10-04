# Native Tooltip

Astro attaches contextual help to a named anchor, describes that anchor, shows on
hover/focus and permits Escape dismissal. Native adapters preserve the distinction
between the anchor's accessible name and its localized explanation.

React Native exposes `LumenTooltip(label, text, visible, onVisibleChange)` through
props. The host owns visibility; focus, hover, long press and tap propose showing
help, while blur, pointer exit, anchor tap, the accessibility dismiss action,
accessibility Escape and Android Back propose hiding it. Text remains beside the
anchor and wraps at the available width. The help body does not take focus or
intercept taps, so dismissal keeps the user's focus on their existing control.
`dismissLabel` localizes the accessibility action. Optional children customize the
Lumen button's visible label without replacing its accessible name.

SwiftUI exposes `LumenTooltip(label, text, isPresented: Binding<Bool>)`. Its Lumen
anchor opens native contextual-help presentation on tap, long press or pointer
hover. SwiftUI owns popover placement, outside dismissal and focus restoration;
compact iOS presentation uses the operating system's adaptive popover behavior.
An explicit localized `dismissLabel` button provides touch and keyboard dismissal.
Disabled or blank-content RN/Swift controls suppress presentation; missing names
do not render an unnamed anchor. All anchors use existing Lumen touch targets and focus states.

Compose reuses its existing `LumenTooltip` without a second implementation.
`rememberLumenTooltipState(isPersistent)` returns `LumenTooltipState`: `show()` is
suspending, `dismiss()` closes it and `isVisible` exposes current state. Material
provides native pointer/focus/long-press behavior and positioning. Applications own
the accessible name, enabled state and touch target of the supplied anchor. Disabling
the tooltip dismisses its native state. Its existing nonblank-text requirement remains.
The native popup is focusable, so Back dismisses help before navigating away.
The Compose example uses an accessible Lumen button with explicit show/dismiss.

The three `TooltipParityExample` fragments demonstrate host control and disabling.
RN behavior tests cover trigger/dismiss callbacks, description/name separation,
Back-handler cleanup and disabled/blank-content guards. Swift tests cover presentation
guards and controlled API compilation. The dedicated Compose UI regression exercises
existing show/dismiss, Android Back and disabled behavior. Phone screenshots and physical-device
keyboard/assistive-technology verification remain release evidence requirements.
