# Native Agenda

`LumenAgenda` groups events under civil-day headings. The host controls `selectedDay`,
the first visible day, using a callback on React Native / Compose and a binding on SwiftUI.
`dayCount` defaults to seven and accepts 1–31. Previous/next actions request a complete
adjacent range without mutating the event dataset. A range crossing years 1–9999 fails closed.
All visible days remain present; days with no events show the localized empty label and
retain navigation so the host can leave an empty range.

`LumenAgendaEvent` wraps `LumenCalendarEvent` and adds `startMinute` / `endMinute`.
Both omitted means all-day, using Calendar's inclusive civil-day endpoints. Both supplied
means timed: start is 0–1439 and end is 0–1440, with an exclusive end. Same-day timed events
must end after their start; an end of midnight on a later day excludes that final day.
Multi-day events are clipped per visible day to 00:00–24:00. All-day events precede timed
ones; timed events sort by clipped start, with stable ID ordering for ties. Event actions
receive the original event plus the activated civil day. Hosts own edit, detail, persistence,
and timezone/instant conversion; Agenda performs no guessed timezone conversion.

Empty or blank IDs, duplicate IDs, reversed intervals, invalid minute fields, partial timed
metadata and invalid ranges hide stale controls and show `invalidLabel`. Loading and error
also hide stale controls. Disabled/read-only state blocks range and event callbacks while
retaining content; event-level disabled state blocks only that event. SwiftUI uses `.disabled`
and Compose uses `enabled`. Omit `onEventPress` for static event rows.

All headings, day/time formatting, navigation, all-day, empty, invalid and loading labels are
host-localizable. Defaults use ISO civil days and numeric 24-hour minutes. Event accessible
names include civil day, time, title and detail; actionable rows and navigation have native
button semantics and phone-sized touch targets. Content expands vertically for narrow phones.

Each playground has `AgendaParityExample` with controlled three-day navigation, timed,
all-day and overnight events, host action feedback and empty/read-only/loading/error toggles.
Model tests cover clipping, exclusive midnight, chronology, identity, invalid input and year
limits. React Native interaction tests cover controlled callbacks and blocked actions.
Rendered phone, VoiceOver and TalkBack verification remains integration work.
