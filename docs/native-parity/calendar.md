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

## Compose grid measurement follow-up

The combined Android phone consumer exposed overlapping weekdays/dates at the left edge. Its
horizontal scroll container measured weighted rows with unbounded width; a minimum width alone
could not distribute the seven weights. The grid now measures the finite viewport through
`BoxWithConstraints` and assigns `max(viewportWidth, 308dp)` to its scrolling content. Every weekday
and date row fills that width. This preserves at least seven 44dp date targets and contained
horizontal scrolling when the viewport is narrower than 308dp. No public API or date model changes.

`CalendarGridLayoutTest` checks actual unclipped weekday/date bounds, nonoverlapping columns, aligned
centers, minimum date width and user selection at 268/350/390dp in both themes. The original public
consumer screenshot is retained in `/private/tmp/lumen-parity-first.png`. Focused Calendar model
validation, instrumentation compilation and lint pass. After the owned emulator recovered, the actual
Calendar bounds/date-selection regression and three Column regressions passed (4 tests, 10.032s),
with logs at `/private/tmp/lumen-calendar-column-ui.log`. The actual combined phone consumer rebuild
and install passed; light/dark screenshots at 390dp show seven readable columns instead of the
overlapping strip. A real public-consumer tap also updates `Selected: 2026-03-11`. Both themes were
visually inspected. Evidence is `/private/tmp/lumen-calendar-grid-consumer-{light,dark,selected}.png`;
the verified light PNG is copied to `apps/playground-android/build/screenshots/phone/calendar.png`
for parent-controlled canonical syncing. Physical-device and release qualification remain separate.
