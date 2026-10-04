# Native Schedule

`LumenSchedule` presents an all-day band and a wall-clock time grid with separate day columns.
`selectedDay` is the host-controlled first visible civil day; a binding on SwiftUI and a callback
on React Native / Compose control range navigation. `dayCount` defaults to seven, accepts 1–7,
and supports a single-day view. `startHour` / `endHour` default to 8 / 18 and accept an ascending
integer interval within 0–24. A range extending outside civil years 1–9999 fails closed.

The model reuses `LumenAgendaEvent`, `LumenCalendarDay` and Agenda's clipping and identity
validation. All-day intervals are inclusive. Timed intervals have exclusive ends, including
midnight on the final day, and are clipped to each day and the requested hour window.
These are civil wall-clock minutes, not elapsed minutes: hosts convert instants using their
explicit timezone and decide how repeated or missing DST times should be represented.
No timezone conversion, booking rules, persistence or conflict policy runs inside Schedule.

Timed blocks occupy separate lanes within connected overlap groups. A nonoverlapping group
regains full width. Layout uses one display unit per minute and a minimum block height of 48;
very short events near the lower window edge shift upward enough to remain fully reachable.
Lane collision checks use those displayed rectangles, so adjacent short events cannot mask
each other's hit areas. Accessible names preserve the original clipped time. Each lane has
at least 100 units of column width; dense days and week ranges scroll horizontally rather
than shrinking actions. The vertical time grid scrolls within a 480-unit viewport.

Activating a block calls `onEventPress` with the original event and its visible civil day.
Optional `onEventMove` exposes previous/next-day buttons for the selected visible event;
the callback receives the original event and requested target civil day. The host owns
rescheduling and duration policy. This maps the web reference's host change request into
accessible native controls. Pointer drag rescheduling is not implemented. A selection that
leaves the visible layout cannot emit stale move requests. No event callback means disabled
presentation blocks. Loading/error/invalid states hide stale controls. Disabled/read-only
states block callbacks while retaining the grid; per-event disabled state blocks only that event.

Hosts can localize headings, day/time formatting, navigation, move, all-day and status labels.
Defaults use ISO day keys and 24-hour numeric times. Event accessible names include day, time,
title and detail. Native buttons retain phone-sized touch targets and focus semantics.
An empty visible window shows its localized empty message and retains range navigation.

All three phone playgrounds have `ScheduleParityExample` with controlled day/week views,
overlapping meetings, a short event, all-day and overnight work, host rescheduling, selection
feedback and empty/read-only/loading/error toggles. Model tests cover lane reuse, touch rectangle
collisions, hour clipping, overnight semantics, validation and year limits. React Native tests
cover controlled callbacks, blocked actions and stale selection. Compose instrumentation tests
verify distinct rendered overlap bounds, host activation/move requests, read-only controls and
empty/loading/invalid transitions on the Android emulator. Screenshot inspection and other
platform interaction, VoiceOver, TalkBack and physical-device verification remain integration work.
