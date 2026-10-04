# Native Calendar

`LumenCalendar` presents a controlled six-week Gregorian grid with adjacent month days,
selected and today indicators, event dots and bounded month navigation. React Native and
Compose use `visibleMonth` / `onVisibleMonthChange` and `selectedDay` /
`onSelectedDayChange`; SwiftUI uses bindings. Navigation never rewrites selection.
Disabled, read-only, loading, error and empty states cannot emit edits. Status states
retain host state and hide stale controls. Bounds are inclusive; inverted bounds fail closed.

`LumenCalendarDay` is a civil day (year 1–9999), with padded `YYYY-MM-DD` keys.
Integer ordinal arithmetic handles leap years, DST dates and month-end clamping without
midnight timestamps. Out-of-range operations return null/nil. Kotlin construction rejects
invalid fields; Swift initialization is failable; React Native validates model input.
`firstWeekday` uses Sunday=0 through Saturday=6, default Monday. Grid boundary cells
outside supported years are blank. This API uses the Gregorian calendar explicitly.

`LumenCalendarEvent` has stable `id`, `label`, inclusive `startDay` / `endDay`, optional
`detail` and `disabled`. Missing end defaults to start; inverted intervals and empty IDs
produce no indicators. Calendar reports all overlapping event labels in each day's accessible
name. Agenda and Schedule may reuse the same model; event activation belongs to their hosts.

Hosts own locale, display timezone and instant-to-civil conversion. Supply localized
`weekdayLabels` in Sunday-first order plus `formatDay`, `formatMonth`, navigation, today
and status labels. Default formatting is ISO numeric and no timezone is guessed. Hosts
must normalize timestamps in their explicit display zone before constructing day values.

Each phone playground has `CalendarParityExample` with controlled selection, bounded
navigation, an event indicator and read-only/loading/error toggles. Model tests cover invalid
leap dates, adversarial keys, month rollover, DST-date arithmetic, inclusive bounds and year
limits. Device rendering and screen-reader verification remain integration work.
